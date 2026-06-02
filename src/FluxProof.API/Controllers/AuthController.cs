using FluxProof.Application.DTOs;
using FluxProof.Application.Interfaces;
using FluxProof.Infrastructure.Services;
using FluxProof.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FluxProof.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService, ICurrentUserService currentUser, IActivityLogService activityLog) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString());
        if (result is null)
            return Unauthorized(new { message = "Ungültiger Benutzername oder Passwort" });

        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await activityLog.LogAsync(ActivityAction.UserLogout, currentUser.UserId, currentUser.Username,
            ipAddress: currentUser.IpAddress);
        return Ok();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var info = await authService.GetUserInfoAsync(currentUser.UserId!.Value);
        if (info is null) return NotFound();
        return Ok(info);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request,
        [FromServices] AdminService adminService)
    {
        var success = await adminService.ChangePasswordAsync(currentUser.UserId!.Value, request);
        if (!success) return BadRequest(new { message = "Aktuelles Passwort ist falsch" });
        return Ok();
    }
}
