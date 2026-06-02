using FluxProof.Domain.Enums;

namespace FluxProof.Domain.Entities;

public class RevisionItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RevisionId { get; set; }
    public Revision Revision { get; set; } = null!;

    public BadgeType BadgeType { get; set; }
    public string Text { get; set; } = string.Empty;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }

    public int SortOrder { get; set; }
}
