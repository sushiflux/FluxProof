using FluxProof.Domain.Enums;

namespace FluxProof.Domain.Entities;

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProjectCategory Category { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedByUserId { get; set; }
    public User CreatedBy { get; set; } = null!;

    public ICollection<Revision> Revisions { get; set; } = [];
    public ICollection<ProjectPermission> Permissions { get; set; } = [];
}
