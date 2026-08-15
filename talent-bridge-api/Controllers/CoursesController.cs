using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentBridgeApi.Services;

namespace TalentBridgeApi.Controllers;

[ApiController]
[Route("api/courses")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly CourseService _courseService;

    public CoursesController(CourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var courses = await _courseService.GetAllCoursesAsync();
        return Ok(new { success = true, data = courses, message = "Operation successful." });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var course = await _courseService.GetCourseByIdAsync(id);
        if (course == null)
            return NotFound(new { success = false, error = "Course not found." });
        return Ok(new { success = true, data = course, message = "Operation successful." });
    }

    [HttpGet("{id:guid}/modules")]
    public async Task<IActionResult> GetModules(Guid id)
    {
        var modules = await _courseService.GetCourseModulesAsync(id);
        return Ok(new { success = true, data = modules, message = "Operation successful." });
    }

    [HttpGet("recommended/{userId:guid}")]
    public async Task<IActionResult> GetRecommended(Guid userId)
    {
        var courses = await _courseService.GetRecommendedCoursesAsync(userId);
        return Ok(new { success = true, data = courses, message = "Operation successful." });
    }

    /// <summary>Get course completion progress for a user across all courses</summary>
    [HttpGet("progress/{userId:guid}")]
    public async Task<IActionResult> GetProgress(Guid userId)
    {
        var progress = await _courseService.GetCourseProgressAsync(userId);
        return Ok(new { success = true, data = progress, message = "Operation successful." });
    }
}
