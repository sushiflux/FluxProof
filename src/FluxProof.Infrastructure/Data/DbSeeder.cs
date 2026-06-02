using FluxProof.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using BCrypt.Net;

namespace FluxProof.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(FluxProofDbContext context, IHostEnvironment env)
    {
        await context.Database.MigrateAsync();

        // Seed roles
        var adminRole = await EnsureRole(context, "Admin", "Administrator – only Admin Panel", isDevOnly: false);
        var userRole = await EnsureRole(context, "User", "Standard user – only User Panel", isDevOnly: false);

        // Seed admin user
        await EnsureUser(context, "admin", "admin", "admin@fluxproof.local", adminRole);

        // DEV-only: Developer role and dev user
        if (env.IsDevelopment())
        {
            var devRole = await EnsureRole(context, "Developer", "Developer – full access, panel switch", isDevOnly: true);
            await EnsureUser(context, "dev", "dev", "dev@fluxproof.local", devRole);
        }

        // Default app settings
        await EnsureSettings(context);

        await context.SaveChangesAsync();
    }

    private static async Task<Role> EnsureRole(FluxProofDbContext ctx, string name, string description, bool isDevOnly)
    {
        var role = await ctx.Roles.FirstOrDefaultAsync(r => r.Name == name);
        if (role is null)
        {
            role = new Role { Name = name, Description = description, IsDevOnly = isDevOnly };
            ctx.Roles.Add(role);
            await ctx.SaveChangesAsync();
        }
        return role;
    }

    private static async Task EnsureUser(FluxProofDbContext ctx, string username, string password, string email, Role role)
    {
        var user = await ctx.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
        {
            user = new User
            {
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Email = email,
                IsActive = true
            };
            ctx.Users.Add(user);
            await ctx.SaveChangesAsync();
        }

        if (!user.UserRoles.Any(ur => ur.RoleId == role.Id))
        {
            ctx.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            await ctx.SaveChangesAsync();
        }
    }

    private static async Task EnsureSettings(FluxProofDbContext ctx)
    {
        var defaults = new Dictionary<string, (string? Value, string Category)>
        {
            ["app.name"] = ("FluxProof", "General"),
            ["app.company"] = (null, "General"),
            ["ldap.enabled"] = ("false", "LDAP"),
            ["ldap.server"] = (null, "LDAP"),
            ["ldap.port"] = ("389", "LDAP"),
            ["ldap.ssl"] = ("false", "LDAP"),
            ["ldap.baseDn"] = (null, "LDAP"),
            ["ldap.bindUser"] = (null, "LDAP"),
            ["ldap.bindPassword"] = (null, "LDAP"),
            ["ldap.userFilter"] = (null, "LDAP"),
            ["ldap.groupFilter"] = (null, "LDAP"),
        };

        foreach (var (key, (value, category)) in defaults)
        {
            if (!await ctx.AppSettings.AnyAsync(s => s.Key == key))
            {
                ctx.AppSettings.Add(new AppSetting { Key = key, Value = value, Category = category });
            }
        }
    }
}
