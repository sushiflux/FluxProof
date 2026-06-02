using FluxProof.Application.DTOs;
using FluxProof.Application.Interfaces;
using FluxProof.Domain.Entities;
using FluxProof.Domain.Enums;
using FluxProof.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace FluxProof.Infrastructure.Services;

public class RevisionService(FluxProofDbContext db, IActivityLogService activityLog,
    ICurrentUserService currentUser, IHostEnvironment env)
{
    public async Task<IReadOnlyList<RevisionDto>> GetRevisionsAsync(Guid projectId)
    {
        var revisions = await db.Revisions
            .Include(r => r.CreatedBy)
            .Include(r => r.Items.OrderBy(i => i.SortOrder))
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.VersionMajor)
            .ThenByDescending(r => r.VersionMinor)
            .ThenByDescending(r => r.VersionPatch)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync();

        return revisions.Select(r => MapRevision(r, env)).ToList();
    }

    public async Task<RevisionDto> CreateRevisionAsync(Guid projectId, CreateRevisionRequest request)
    {
        var userId = currentUser.UserId!.Value;

        var lastRevision = await db.Revisions
            .Where(r => r.ProjectId == projectId && !r.IsReplaced)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        var (major, minor, patch) = CalculateNextVersion(lastRevision, request.Items);

        var revision = new Revision
        {
            ProjectId = projectId,
            VersionMajor = major,
            VersionMinor = minor,
            VersionPatch = patch,
            CreatedByUserId = userId,
            Notes = request.Notes
        };

        db.Revisions.Add(revision);
        await db.SaveChangesAsync();

        var items = request.Items.Select((item, idx) => new RevisionItem
        {
            RevisionId = revision.Id,
            BadgeType = item.BadgeType,
            Text = item.Text,
            SortOrder = idx
        }).ToList();

        db.RevisionItems.AddRange(items);
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.RevisionCreated, userId, currentUser.Username,
            "Revision", revision.Id.ToString(), $"{major}.{minor}.{patch} for project {projectId}");

        var created = await db.Revisions
            .Include(r => r.CreatedBy)
            .Include(r => r.Items.OrderBy(i => i.SortOrder))
            .FirstAsync(r => r.Id == revision.Id);

        return MapRevision(created, env);
    }

    public async Task<RevisionDto?> ReplaceRevisionAsync(Guid projectId, Guid revisionId, CreateRevisionRequest request)
    {
        var userId = currentUser.UserId!.Value;

        var oldRevision = await db.Revisions
            .FirstOrDefaultAsync(r => r.Id == revisionId && r.ProjectId == projectId && !r.IsReplaced);

        if (oldRevision is null) return null;

        // Create new revision keeping same version numbers
        var newRevision = new Revision
        {
            ProjectId = projectId,
            VersionMajor = oldRevision.VersionMajor,
            VersionMinor = oldRevision.VersionMinor,
            VersionPatch = oldRevision.VersionPatch,
            CreatedByUserId = userId,
            Notes = request.Notes
        };

        db.Revisions.Add(newRevision);
        await db.SaveChangesAsync();

        oldRevision.IsReplaced = true;
        oldRevision.ReplacedByRevisionId = newRevision.Id;

        var items = request.Items.Select((item, idx) => new RevisionItem
        {
            RevisionId = newRevision.Id,
            BadgeType = item.BadgeType,
            Text = item.Text,
            SortOrder = idx
        }).ToList();

        db.RevisionItems.AddRange(items);
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.RevisionReplaced, userId, currentUser.Username,
            "Revision", revisionId.ToString(), $"Replaced by {newRevision.Id}");

        var created = await db.Revisions
            .Include(r => r.CreatedBy)
            .Include(r => r.Items.OrderBy(i => i.SortOrder))
            .FirstAsync(r => r.Id == newRevision.Id);

        return MapRevision(created, env);
    }

    public async Task<bool> MarkItemDeletedAsync(Guid projectId, Guid revisionId, Guid itemId)
    {
        var userId = currentUser.UserId!.Value;

        var item = await db.RevisionItems
            .Include(i => i.Revision)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.RevisionId == revisionId
                && i.Revision.ProjectId == projectId && !i.IsDeleted);

        if (item is null) return false;

        item.IsDeleted = true;
        item.DeletedAt = DateTime.UtcNow;
        item.DeletedByUserId = userId;

        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.RevisionItemMarkedDeleted, userId, currentUser.Username,
            "RevisionItem", itemId.ToString());

        return true;
    }

    public async Task<bool> DeleteRevisionAsync(Guid projectId, Guid revisionId)
    {
        var revision = await db.Revisions
            .FirstOrDefaultAsync(r => r.Id == revisionId && r.ProjectId == projectId);
        if (revision is null) return false;

        await db.RevisionItems.Where(i => i.RevisionId == revisionId).ExecuteDeleteAsync();

        // Wenn eine andere Revision auf diese verweist (IsReplaced), Referenz auflösen
        await db.Revisions
            .Where(r => r.ReplacedByRevisionId == revisionId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.IsReplaced, false)
                .SetProperty(r => r.ReplacedByRevisionId, (Guid?)null));

        db.Revisions.Remove(revision);
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.RevisionReplaced, currentUser.UserId, currentUser.Username,
            "Revision", revisionId.ToString(), $"DEV-Delete: {revision.VersionString}");

        return true;
    }

    private static (int Major, int Minor, int Patch) CalculateNextVersion(Revision? last, IReadOnlyList<RevisionItemRequest> items)
    {
        if (last is null) return (1, 0, 0);

        bool hasUpdate = items.Any(i => i.BadgeType == BadgeType.Update);

        return hasUpdate
            ? (last.VersionMajor + 1, 0, 0)
            : (last.VersionMajor, last.VersionMinor + 1, 0);
    }

    private static RevisionDto MapRevision(Revision r, IHostEnvironment env)
    {
        var version = r.VersionString;

        return new RevisionDto(
            r.Id, r.ProjectId, version, version,
            r.IsReplaced, r.ReplacedByRevisionId,
            r.CreatedAt, r.CreatedBy?.Username ?? "",
            r.Notes,
            r.Items.OrderBy(i => i.SortOrder).Select(i => new RevisionItemDto(
                i.Id, i.BadgeType, i.BadgeType.ToString(), i.Text,
                i.IsDeleted, i.DeletedAt, i.SortOrder)).ToList());
    }
}
