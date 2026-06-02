using System.Security.Claims;
using FluxProof.Application.Interfaces;

namespace FluxProof.API.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var val = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return val is null ? null : Guid.Parse(val);
        }
    }

    public string? Username => User?.FindFirstValue(ClaimTypes.Name);

    public IReadOnlyList<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? [];

    public string? IpAddress => httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
