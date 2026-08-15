using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentBridgeApi.DTOs;
using TalentBridgeApi.Services;

namespace TalentBridgeApi.Controllers;

[ApiController]
[Route("api/cv")]
public class CvController : ControllerBase
{
    private readonly CvService _cvService;

    public CvController(CvService cvService)
    {
        _cvService = cvService;
    }

    /// <summary>Upload a CV file (PDF / PNG / JPG) for AI analysis and grading</summary>
    /// <remarks>
    /// Requires JWT Bearer authentication.
    /// File must be PDF, PNG, or JPG and no larger than 10 MB.
    /// The file is forwarded to the Flask AI service for OCR + skill matching.
    /// The user's Grade is updated automatically based on the match score.
    /// </remarks>
    [HttpPost("upload")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        // Resolve the caller's user ID from the JWT claims
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { success = false, error = "Invalid or missing user identity in token." });

        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, error = "No file was provided." });

        var (result, error) = await _cvService.UploadAsync(file, userId);

        if (error != null)
            return BadRequest(new { success = false, error });

        return Ok(new
        {
            success = true,
            data = result,
            message = "CV uploaded and analysed successfully."
        });
    }

    /// <summary>Get the latest CV analysis result for a user</summary>
    /// <param name="userId">Target user's GUID</param>
    [HttpGet("{userId}/result")]
    [Authorize]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(typeof(object), 404)]
    public async Task<IActionResult> GetResult(Guid userId)
    {
        // Only the owner or an Admin may see the result
        var callerIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var callerRole = User.FindFirstValue(ClaimTypes.Role);

        if (!Guid.TryParse(callerIdClaim, out var callerId))
            return Unauthorized(new { success = false, error = "Invalid token." });

        if (callerId != userId && callerRole != "Admin")
            return StatusCode(403, new { success = false, error = "You are not authorised to view this result." });

        var (result, error) = await _cvService.GetResultAsync(userId);

        if (error != null)
            return NotFound(new { success = false, error });

        return Ok(new
        {
            success = true,
            data = result,
            message = "Operation successful."
        });
    }
}
