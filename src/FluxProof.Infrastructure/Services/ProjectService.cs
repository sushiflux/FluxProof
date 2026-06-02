using FluxProof.Application.DTOs;
using FluxProof.Application.Interfaces;
using FluxProof.Domain.Entities;
using FluxProof.Domain.Enums;
using FluxProof.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FluxProof.Infrastructure.Services;

public class ProjectService(FluxProofDbContext db, IActivityLogService activityLog, ICurrentUserService currentUser)
{
    public async Task<IReadOnlyList<ProjectDto>> GetProjectsForUserAsync()
    {
        var userId = currentUser.UserId!.Value;
        var isAdmin = currentUser.Roles.Contains("Admin") || currentUser.Roles.Contains("Developer");

        IQueryable<Project> query = db.Projects
            .Include(p => p.CreatedBy)
            .Include(p => p.Revisions.OrderByDescending(r => r.CreatedAt).Take(1))
            .Include(p => p.Permissions);

        if (!isAdmin)
        {
            query = query.Where(p => p.Permissions.Any(pp => pp.UserId == userId));
        }

        var projects = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

        return projects.Select(p => MapProject(p, userId, isAdmin)).ToList();
    }

    public async Task<ProjectDto?> GetProjectAsync(Guid id)
    {
        var userId = currentUser.UserId!.Value;
        var isAdmin = currentUser.Roles.Contains("Admin") || currentUser.Roles.Contains("Developer");

        var project = await db.Projects
            .Include(p => p.CreatedBy)
            .Include(p => p.Revisions.OrderByDescending(r => r.CreatedAt).Take(1))
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null) return null;
        if (!isAdmin && !project.Permissions.Any(pp => pp.UserId == userId)) return null;

        return MapProject(project, userId, isAdmin);
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request)
    {
        var userId = currentUser.UserId!.Value;
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            Category = request.Category,
            CreatedByUserId = userId
        };
        db.Projects.Add(project);

        // Creator gets Editor permission automatically
        db.ProjectPermissions.Add(new ProjectPermission
        {
            ProjectId = project.Id,
            UserId = userId,
            Permission = PermissionType.Editor,
            GrantedByUserId = userId
        });

        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.ProjectCreated, userId, currentUser.Username,
            "Project", project.Id.ToString(), project.Name);

        var created = await db.Projects
            .Include(p => p.CreatedBy)
            .Include(p => p.Permissions)
            .FirstAsync(p => p.Id == project.Id);

        return MapProject(created, userId, false);
    }

    public async Task<IReadOnlyList<ProjectPermissionDto>> GetPermissionsAsync(Guid projectId)
    {
        return await db.ProjectPermissions
            .Include(pp => pp.User)
            .Where(pp => pp.ProjectId == projectId)
            .Select(pp => new ProjectPermissionDto(pp.UserId, pp.User.Username, pp.Permission, pp.GrantedAt))
            .ToListAsync();
    }

    public async Task SetPermissionAsync(Guid projectId, SetPermissionRequest request)
    {
        var userId = currentUser.UserId!.Value;
        var existing = await db.ProjectPermissions
            .FirstOrDefaultAsync(pp => pp.ProjectId == projectId && pp.UserId == request.UserId);

        if (existing is null)
        {
            db.ProjectPermissions.Add(new ProjectPermission
            {
                ProjectId = projectId,
                UserId = request.UserId,
                Permission = request.Permission,
                GrantedByUserId = userId
            });
        }
        else
        {
            existing.Permission = request.Permission;
        }

        await db.SaveChangesAsync();
        await activityLog.LogAsync(ActivityAction.PermissionChanged, userId, currentUser.Username,
            "Project", projectId.ToString(), $"User {request.UserId} → {request.Permission}");
    }

    public async Task RemovePermissionAsync(Guid projectId, Guid targetUserId)
    {
        var perm = await db.ProjectPermissions.FindAsync(projectId, targetUserId);
        if (perm is not null)
        {
            db.ProjectPermissions.Remove(perm);
            await db.SaveChangesAsync();
        }
    }

    public async Task<bool> DeleteProjectAsync(Guid projectId)
    {
        var project = await db.Projects.FindAsync(projectId);
        if (project is null) return false;

        // Manuell kaskadieren (Restrict-Constraints umgehen)
        var revisionIds = await db.Revisions
            .Where(r => r.ProjectId == projectId)
            .Select(r => r.Id)
            .ToListAsync();

        await db.RevisionItems.Where(i => revisionIds.Contains(i.RevisionId)).ExecuteDeleteAsync();
        await db.Revisions.Where(r => r.ProjectId == projectId).ExecuteDeleteAsync();
        await db.ProjectPermissions.Where(p => p.ProjectId == projectId).ExecuteDeleteAsync();

        db.Projects.Remove(project);
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.ProjectUpdated, currentUser.UserId, currentUser.Username,
            "Project", projectId.ToString(), $"DEV-Delete: {project.Name}");

        return true;
    }

    private static ProjectDto MapProject(Project p, Guid userId, bool isAdmin)
    {
        var latest = p.Revisions.MaxBy(r => r.CreatedAt);
        var perm = p.Permissions.FirstOrDefault(pp => pp.UserId == userId);

        return new ProjectDto(
            p.Id, p.Name, p.Description, p.Category, p.Category.ToString(),
            p.CreatedAt, p.CreatedBy?.Username ?? "",
            latest is null ? null : new LatestRevisionDto(latest.VersionString, latest.CreatedAt),
            isAdmin ? PermissionType.Editor : perm?.Permission);
    }
}
