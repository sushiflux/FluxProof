namespace FluxProof.Application.DTOs;

public record LoginRequest(string Username, string Password);

public record LoginResponse(
    string Token,
    string Username,
    Guid UserId,
    IReadOnlyList<string> Roles);

public record UserInfoDto(
    Guid Id,
    string Username,
    string Email,
    bool IsActive,
    IReadOnlyList<string> Roles,
    DateTime CreatedAt,
    IReadOnlyDictionary<string, string?> Preferences);

public record SavePreferenceRequest(string? Value);
