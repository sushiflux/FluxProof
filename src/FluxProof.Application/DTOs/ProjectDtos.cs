using FluxProof.Domain.Enums;

namespace FluxProof.Application.DTOs;

public record CreateProjectRequest(string Name, string? Description, ProjectCategory Category);

public record UpdateProjectRequest(string Name, string? Description);

public record ProjectDto(
    Guid Id,
    string Name,
    string? Description,
    ProjectCategory Category,
    string CategoryName,
    DateTime CreatedAt,
    string CreatedBy,
    LatestRevisionDto? LatestRevision,
    PermissionType? UserPermission);

public record LatestRevisionDto(string Version, DateTime CreatedAt);

public record ProjectPermissionDto(
    Guid UserId,
    string Username,
    PermissionType Permission,
    DateTime GrantedAt);

public record SetPermissionRequest(Guid UserId, PermissionType Permission);
