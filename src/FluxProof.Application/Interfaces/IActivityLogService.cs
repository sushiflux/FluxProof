using FluxProof.Domain.Enums;

namespace FluxProof.Application.Interfaces;

public interface IActivityLogService
{
    Task LogAsync(ActivityAction action, Guid? userId, string? username, string? entityType = null,
        string? entityId = null, string? details = null, string? ipAddress = null);
}
