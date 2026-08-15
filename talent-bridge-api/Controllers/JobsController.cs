using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentBridgeApi.Services;

namespace TalentBridgeApi.Controllers;

[ApiController]
[Route("api/jobs")]
[Authorize]
public class JobsController : ControllerBase
{
    private readonly JobService _jobService;

    public JobsController(JobService jobService)
    {
        _jobService = jobService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var jobs = await _jobService.GetAllJobsAsync();
        return Ok(new { success = true, data = jobs, message = "Operation successful." });
    }

    [HttpGet("matched/{userId:guid}")]
    public async Task<IActionResult> GetMatched(Guid userId)
    {
        var jobs = await _jobService.GetMatchedJobsAsync(userId);
        return Ok(new { success = true, data = jobs, message = "Operation successful." });
    }

    /// <summary>Get full detail + skill gap analysis for a specific job</summary>
    [HttpGet("{jobId:guid}/detail/{userId:guid}")]
    public async Task<IActionResult> GetDetail(Guid jobId, Guid userId)
    {
        var detail = await _jobService.GetJobDetailAsync(jobId, userId);
        if (detail == null)
            return NotFound(new { success = false, error = "Job not found." });
        return Ok(new { success = true, data = detail, message = "Operation successful." });
    }

    /// <summary>Get personalised learning path for a target job</summary>
    [HttpGet("{jobId:guid}/learning-path/{userId:guid}")]
    public async Task<IActionResult> GetLearningPath(Guid jobId, Guid userId)
    {
        var path = await _jobService.GetLearningPathAsync(jobId, userId);
        if (path == null)
            return NotFound(new { success = false, error = "Job not found." });
        return Ok(new { success = true, data = path, message = "Operation successful." });
    }
}
