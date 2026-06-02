using FluxProof.Application.DTOs;
using FluxProof.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FluxProof.API.Controllers;

[ApiController]
[Route("api/user/preferences")]
[Authorize]
public class UserPreferencesController(UserPreferenceService prefsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await prefsService.GetAllAsync());

    [HttpPut("{key}")]
    public async Task<IActionResult> Save(string key, [FromBody] SavePreferenceRequest request)
    {
        await prefsService.SaveAsync(key, request.Value);
        return Ok();
    }

    [HttpPut]
    public async Task<IActionResult> SaveMany([FromBody] Dictionary<string, string?> prefs)
    {
        await prefsService.SaveManyAsync(prefs);
        return Ok();
    }
}
