using FluxProof.Application.DTOs;
using FluxProof.Infrastructure.Services;
using FluxProof.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FluxProof.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin,Developer")]
public class AdminController(AdminService adminService) : ControllerBase
{
    // Users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() => Ok(await adminService.GetUsersAsync());

    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await adminService.GetUserAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var user = await adminService.CreateUserAsync(request);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }

    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await adminService.UpdateUserAsync(id, request);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var success = await adminService.DeleteUserAsync(id);
        return success ? NoContent() : NotFound();
    }

    [HttpPost("users/{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
    {
        var success = await adminService.ResetPasswordAsync(id, request.NewPassword);
        return success ? Ok() : NotFound();
    }

    // Roles
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles() => Ok(await adminService.GetRolesAsync());

    [HttpPost("roles")]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        var role = await adminService.CreateRoleAsync(request);
        return CreatedAtAction(nameof(GetRoles), role);
    }

    [HttpDelete("roles/{id:guid}")]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        var success = await adminService.DeleteRoleAsync(id);
        return success ? NoContent() : NotFound();
    }

    // Activity Log
    [HttpGet("activity-log")]
    public async Task<IActionResult> GetActivityLog(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? username = null,
        [FromQuery] ActivityAction? action = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
        => Ok(await adminService.GetActivityLogsAsync(page, pageSize, username, action, from, to));

    // Settings
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings([FromQuery] string? category = null)
        => Ok(await adminService.GetSettingsAsync(category));

    [HttpPut("settings/{key}")]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingRequest request)
    {
        await adminService.UpdateSettingAsync(key, request);
        return Ok();
    }
}

public record ResetPasswordRequest(string NewPassword);
