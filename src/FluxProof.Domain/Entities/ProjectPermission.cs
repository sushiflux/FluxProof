using FluxProof.Domain.Enums;

namespace FluxProof.Domain.Entities;

public class ProjectPermission
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public PermissionType Permission { get; set; }
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    public Guid GrantedByUserId { get; set; }
}
