using FluxProof.Domain.Enums;

namespace FluxProof.Domain.Entities;

public class ActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string? Username { get; set; }

    public ActivityAction Action { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Details { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
}
