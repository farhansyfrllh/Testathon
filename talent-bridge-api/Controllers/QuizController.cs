using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentBridgeApi.DTOs;
using TalentBridgeApi.Services;

namespace TalentBridgeApi.Controllers;

[ApiController]
[Route("api/quiz")]
[Authorize]
public class QuizController : ControllerBase
{
    private readonly QuizService _quizService;

    public QuizController(QuizService quizService)
    {
        _quizService = quizService;
    }

    [HttpPost("{moduleId:guid}/submit")]
    public async Task<IActionResult> Submit(Guid moduleId, [FromBody] QuizSubmitRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid token." });

        if (request.Answers == null || request.Answers.Count == 0)
            return BadRequest(new { error = "No answers provided." });

        var (result, error) = await _quizService.SubmitQuizAsync(moduleId, userId, request);
        if (error != null)
            return BadRequest(new { success = false, error });

        return Ok(new { success = true, data = result, message = "Quiz submitted successfully." });
    }
}
