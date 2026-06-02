using FluxProof.Domain.Enums;

namespace FluxProof.Application.DTOs;

public record CreateUserRequest(string Username, string Password, string Email, IReadOnlyList<Guid> RoleIds);

public record UpdateUserRequest(string Email, bool IsActive, IReadOnlyList<Guid> RoleIds);

public record AdminUserDto(
    Guid Id,
    string Username,
    string Email,
    bool IsActive,
    DateTime CreatedAt,
    IReadOnlyList<RoleDto> Roles);

public record RoleDto(Guid Id, string Name, string? Description, bool IsDevOnly, int UserCount);

public record CreateRoleRequest(string Name, string? Description);

public record ActivityLogDto(
    Guid Id,
    string? Username,
    ActivityAction Action,
    string ActionName,
    string? EntityType,
    string? EntityId,
    string? Details,
    DateTime Timestamp,
    string? IpAddress);

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);

public record AppSettingDto(string Key, string? Value, string Category);

public record UpdateSettingRequest(string? Value);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
