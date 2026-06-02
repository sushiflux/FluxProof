using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluxProof.Application.DTOs;
using FluxProof.Application.Interfaces;
using FluxProof.Domain.Enums;
using FluxProof.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FluxProof.Infrastructure.Services;

public class AuthService(FluxProofDbContext db, IConfiguration config, IActivityLogService activityLog)
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            await activityLog.LogAsync(ActivityAction.UserLoginFailed, null, request.Username,
                details: "Invalid credentials", ipAddress: ipAddress);
            return null;
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var token = GenerateToken(user.Id, user.Username, roles);

        await activityLog.LogAsync(ActivityAction.UserLogin, user.Id, user.Username, ipAddress: ipAddress);

        return new LoginResponse(token, user.Username, user.Id, roles);
    }

    public async Task<UserInfoDto?> GetUserInfoAsync(Guid userId)
    {
        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.Preferences)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null) return null;

        var prefs = user.Preferences.ToDictionary(p => p.Key, p => p.Value);

        return new UserInfoDto(
            user.Id,
            user.Username,
            user.Email,
            user.IsActive,
            user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            user.CreatedAt,
            prefs);
    }

    private string GenerateToken(Guid userId, string username, IList<string> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, username),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
