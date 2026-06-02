using FluxProof.Application.Interfaces;
using FluxProof.Domain.Entities;
using FluxProof.Domain.Enums;
using FluxProof.Infrastructure.Data;

namespace FluxProof.Infrastructure.Services;

public class ActivityLogService(FluxProofDbContext db) : IActivityLogService
{
    public async Task LogAsync(ActivityAction action, Guid? userId, string? username,
        string? entityType = null, string? entityId = null, string? details = null, string? ipAddress = null)
    {
        db.ActivityLogs.Add(new ActivityLog
        {
            UserId = userId,
            Username = username,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
