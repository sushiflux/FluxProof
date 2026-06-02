namespace FluxProof.Domain.Entities;

public class UserPreference
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
