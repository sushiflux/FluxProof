namespace FluxProof.Application.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Username { get; }
    IReadOnlyList<string> Roles { get; }
    string? IpAddress { get; }
    bool IsAuthenticated { get; }
}
