using FluxProof.Application.DTOs;
using FluxProof.Application.Interfaces;
using FluxProof.Domain.Entities;
using FluxProof.Domain.Enums;
using FluxProof.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FluxProof.Infrastructure.Services;

public class AdminService(FluxProofDbContext db, IActivityLogService activityLog, ICurrentUserService currentUser)
{
    public async Task<IReadOnlyList<AdminUserDto>> GetUsersAsync()
    {
        var users = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .OrderBy(u => u.Username)
            .ToListAsync();

        return users.Select(MapUser).ToList();
    }

    public async Task<AdminUserDto?> GetUserAsync(Guid id)
    {
        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        return user is null ? null : MapUser(user);
    }

    public async Task<AdminUserDto> CreateUserAsync(CreateUserRequest request)
    {
        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Email = request.Email,
            IsActive = true
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        foreach (var roleId in request.RoleIds)
        {
            db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleId });
        }
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.UserCreated, currentUser.UserId, currentUser.Username,
            "User", user.Id.ToString(), user.Username);

        return MapUser(await db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstAsync(u => u.Id == user.Id));
    }

    public async Task<AdminUserDto?> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return null;

        user.Email = request.Email;
        user.IsActive = request.IsActive;

        var existing = user.UserRoles.Select(ur => ur.RoleId).ToHashSet();
        var desired = request.RoleIds.ToHashSet();

        foreach (var roleId in desired.Except(existing))
            db.UserRoles.Add(new UserRole { UserId = id, RoleId = roleId });

        foreach (var roleId in existing.Except(desired))
        {
            var ur = user.UserRoles.First(ur => ur.RoleId == roleId);
            db.UserRoles.Remove(ur);
        }

        await db.SaveChangesAsync();
        await activityLog.LogAsync(ActivityAction.UserUpdated, currentUser.UserId, currentUser.Username,
            "User", id.ToString(), user.Username);

        return MapUser(await db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstAsync(u => u.Id == id));
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return false;

        var username = user.Username;
        db.Users.Remove(user);
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.UserDeleted, currentUser.UserId, currentUser.Username,
            "User", id.ToString(), username);

        return true;
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return false;
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash)) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResetPasswordAsync(Guid targetUserId, string newPassword)
    {
        var user = await db.Users.FindAsync(targetUserId);
        if (user is null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.UserUpdated, currentUser.UserId, currentUser.Username,
            "User", targetUserId.ToString(), $"Password reset for {user.Username}");

        return true;
    }

    public async Task<IReadOnlyList<RoleDto>> GetRolesAsync()
    {
        var roles = await db.Roles
            .Include(r => r.UserRoles)
            .OrderBy(r => r.Name)
            .ToListAsync();

        return roles.Select(r => new RoleDto(r.Id, r.Name, r.Description, r.IsDevOnly, r.UserRoles.Count)).ToList();
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request)
    {
        var role = new Role { Name = request.Name, Description = request.Description };
        db.Roles.Add(role);
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.RoleCreated, currentUser.UserId, currentUser.Username,
            "Role", role.Id.ToString(), role.Name);

        return new RoleDto(role.Id, role.Name, role.Description, false, 0);
    }

    public async Task<bool> DeleteRoleAsync(Guid id)
    {
        var role = await db.Roles.FindAsync(id);
        if (role is null) return false;

        db.Roles.Remove(role);
        await db.SaveChangesAsync();

        await activityLog.LogAsync(ActivityAction.RoleDeleted, currentUser.UserId, currentUser.Username,
            "Role", id.ToString(), role.Name);

        return true;
    }

    public async Task<PagedResult<ActivityLogDto>> GetActivityLogsAsync(int page, int pageSize,
        string? username = null, ActivityAction? action = null, DateTime? from = null, DateTime? to = null)
    {
        var query = db.ActivityLogs.AsQueryable();

        if (!string.IsNullOrEmpty(username))
            query = query.Where(l => l.Username != null && l.Username.Contains(username));
        if (action.HasValue)
            query = query.Where(l => l.Action == action.Value);
        if (from.HasValue)
            query = query.Where(l => l.Timestamp >= from.Value);
        if (to.HasValue)
            query = query.Where(l => l.Timestamp <= to.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ActivityLogDto>(
            items.Select(l => new ActivityLogDto(
                l.Id, l.Username, l.Action, l.Action.ToString(),
                l.EntityType, l.EntityId, l.Details, l.Timestamp, l.IpAddress)).ToList(),
            total, page, pageSize);
    }

    public async Task<IReadOnlyList<AppSettingDto>> GetSettingsAsync(string? category = null)
    {
        var query = db.AppSettings.AsQueryable();
        if (category is not null)
            query = query.Where(s => s.Category == category);

        return await query
            .OrderBy(s => s.Category).ThenBy(s => s.Key)
            .Select(s => new AppSettingDto(s.Key, s.Value, s.Category))
            .ToListAsync();
    }

    public async Task UpdateSettingAsync(string key, UpdateSettingRequest request)
    {
        var setting = await db.AppSettings.FindAsync(key);
        if (setting is not null)
        {
            setting.Value = request.Value;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedByUserId = currentUser.UserId;
            await db.SaveChangesAsync();

            await activityLog.LogAsync(ActivityAction.SettingsChanged, currentUser.UserId, currentUser.Username,
                "Setting", key, request.Value);
        }
    }

    private static AdminUserDto MapUser(User u) => new(
        u.Id, u.Username, u.Email, u.IsActive, u.CreatedAt,
        u.UserRoles.Select(ur => new RoleDto(ur.Role.Id, ur.Role.Name, ur.Role.Description, ur.Role.IsDevOnly, 0)).ToList());
}
