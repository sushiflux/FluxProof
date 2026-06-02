namespace FluxProof.Domain.Entities;

public class AppSetting
{
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string Category { get; set; } = "General";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedByUserId { get; set; }
}
