using FluxProof.Domain.Enums;

namespace FluxProof.Application.DTOs;

public record CreateRevisionRequest(
    IReadOnlyList<RevisionItemRequest> Items,
    string? Notes);

public record RevisionItemRequest(BadgeType BadgeType, string Text);

public record RevisionDto(
    Guid Id,
    Guid ProjectId,
    string Version,
    string VersionDev,
    bool IsReplaced,
    Guid? ReplacedByRevisionId,
    DateTime CreatedAt,
    string CreatedBy,
    string? Notes,
    IReadOnlyList<RevisionItemDto> Items);

public record RevisionItemDto(
    Guid Id,
    BadgeType BadgeType,
    string BadgeName,
    string Text,
    bool IsDeleted,
    DateTime? DeletedAt,
    int SortOrder);
