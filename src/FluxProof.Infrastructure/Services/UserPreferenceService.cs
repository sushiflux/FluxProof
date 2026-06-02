using FluxProof.Application.Interfaces;
using FluxProof.Domain.Entities;
using FluxProof.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FluxProof.Infrastructure.Services;

public class UserPreferenceService(FluxProofDbContext db, ICurrentUserService currentUser)
{
    public async Task<IDictionary<string, string?>> GetAllAsync()
    {
        var userId = currentUser.UserId!.Value;
        var prefs = await db.UserPreferences
            .Where(p => p.UserId == userId)
            .ToListAsync();
        return prefs.ToDictionary(p => p.Key, p => p.Value);
    }

    public async Task SaveAsync(string key, string? value)
    {
        var userId = currentUser.UserId!.Value;
        var existing = await db.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Key == key);

        if (existing is null)
        {
            db.UserPreferences.Add(new UserPreference
            {
                UserId = userId,
                Key = key,
                Value = value
            });
        }
        else
        {
            existing.Value = value;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
    }

    public async Task SaveManyAsync(IDictionary<string, string?> prefs)
    {
        foreach (var (key, value) in prefs)
            await SaveAsync(key, value);
    }
}
