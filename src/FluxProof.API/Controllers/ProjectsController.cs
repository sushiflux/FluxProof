using FluxProof.Application.DTOs;
using FluxProof.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace FluxProof.API.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize(Roles = "User,Developer,Admin")]
public class ProjectsController(
    ProjectService projectService,
    RevisionService revisionService,
    IHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProjects()
        => Ok(await projectService.GetProjectsForUserAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        var project = await projectService.GetProjectAsync(id);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Developer")]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
    {
        var project = await projectService.CreateProjectAsync(request);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    [HttpGet("{id:guid}/permissions")]
    [Authorize(Roles = "Admin,Developer")]
    public async Task<IActionResult> GetPermissions(Guid id)
        => Ok(await projectService.GetPermissionsAsync(id));

    [HttpPost("{id:guid}/permissions")]
    [Authorize(Roles = "Admin,Developer")]
    public async Task<IActionResult> SetPermission(Guid id, [FromBody] SetPermissionRequest request)
    {
        await projectService.SetPermissionAsync(id, request);
        return Ok();
    }

    [HttpDelete("{id:guid}/permissions/{userId:guid}")]
    [Authorize(Roles = "Admin,Developer")]
    public async Task<IActionResult> RemovePermission(Guid id, Guid userId)
    {
        await projectService.RemovePermissionAsync(id, userId);
        return NoContent();
    }

    [HttpGet("{id:guid}/revisions")]
    public async Task<IActionResult> GetRevisions(Guid id)
        => Ok(await revisionService.GetRevisionsAsync(id));

    [HttpPost("{id:guid}/revisions")]
    [Authorize(Roles = "User,Developer,Admin")]
    public async Task<IActionResult> CreateRevision(Guid id, [FromBody] CreateRevisionRequest request)
    {
        var revision = await revisionService.CreateRevisionAsync(id, request);
        return CreatedAtAction(nameof(GetRevisions), new { id }, revision);
    }

    [HttpPost("{id:guid}/revisions/{revisionId:guid}/replace")]
    [Authorize(Roles = "User,Developer,Admin")]
    public async Task<IActionResult> ReplaceRevision(Guid id, Guid revisionId, [FromBody] CreateRevisionRequest request)
    {
        var revision = await revisionService.ReplaceRevisionAsync(id, revisionId, request);
        return revision is null ? NotFound() : Ok(revision);
    }

    [HttpPatch("{id:guid}/revisions/{revisionId:guid}/items/{itemId:guid}/mark-deleted")]
    [Authorize(Roles = "User,Developer,Admin")]
    public async Task<IActionResult> MarkItemDeleted(Guid id, Guid revisionId, Guid itemId)
    {
        var success = await revisionService.MarkItemDeletedAsync(id, revisionId, itemId);
        return success ? Ok() : NotFound();
    }

    // ── DEV-only: physisches Löschen ─────────────────────────────────────

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Developer")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        if (!env.IsDevelopment()) return NotFound();
        var success = await projectService.DeleteProjectAsync(id);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}/revisions/{revisionId:guid}")]
    [Authorize(Roles = "Admin,Developer")]
    public async Task<IActionResult> DeleteRevision(Guid id, Guid revisionId)
    {
        if (!env.IsDevelopment()) return NotFound();
        var success = await revisionService.DeleteRevisionAsync(id, revisionId);
        return success ? NoContent() : NotFound();
    }
}
