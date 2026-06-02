namespace FluxProof.Domain.Entities;

public class Revision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int VersionMajor { get; set; }
    public int VersionMinor { get; set; }
    public int VersionPatch { get; set; }

    public string VersionString => $"{VersionMajor}.{VersionMinor}";

    public bool IsReplaced { get; set; } = false;
    public Guid? ReplacedByRevisionId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedByUserId { get; set; }
    public User CreatedBy { get; set; } = null!;

    public string? Notes { get; set; }

    public ICollection<RevisionItem> Items { get; set; } = [];
}
