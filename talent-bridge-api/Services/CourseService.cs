using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TalentBridgeApi.Data;
using TalentBridgeApi.DTOs;

namespace TalentBridgeApi.Services;

public class CourseService
{
    private readonly AppDbContext _db;

    public CourseService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CourseDto>> GetAllCoursesAsync()
    {
        var courses = await _db.Courses
            .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
            .ToListAsync();

        return courses.Select(MapCourseToDto).ToList();
    }

    public async Task<CourseDto?> GetCourseByIdAsync(Guid id)
    {
        var course = await _db.Courses
            .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
                .ThenInclude(m => m.Questions)
                    .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(c => c.Id == id);

        return course == null ? null : MapCourseWithQuestionsToDto(course);
    }

    public async Task<List<ModuleDto>> GetCourseModulesAsync(Guid courseId)
    {
        var modules = await _db.Modules
            .Include(m => m.Questions)
                .ThenInclude(q => q.Options)
            .Where(m => m.CourseId == courseId)
            .OrderBy(m => m.OrderIndex)
            .ToListAsync();

        return modules.Select(m => new ModuleDto(
            m.Id.ToString(),
            m.CourseId.ToString(),
            m.OrderIndex,
            m.ModuleType,
            m.Title,
            m.Questions.OrderBy(x => Guid.NewGuid()).Take(5).Select(q => new QuestionDto(
                q.Id.ToString(),
                q.ModuleId.ToString(),
                q.QuestionText,
                q.QuestionType,
                q.Options.OrderBy(o => Guid.NewGuid()).Select(o => new OptionDto(o.Id.ToString(), o.OptionText, o.Position)).ToList()
            )).ToList()
        )).ToList();
    }

    public async Task<List<CourseProgressDto>> GetCourseProgressAsync(Guid userId)
    {
        var courses = await _db.Courses
            .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
            .ToListAsync();

        var completedModules = await _db.UserProgresses
            .Where(up => up.UserId == userId)
            .ToListAsync();

        var progressByModule = completedModules
            .GroupBy(up => up.ModuleId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.CompletedAt).First());

        return courses.Select(course =>
        {
            var moduleProgressList = course.Modules.Select(m =>
            {
                var hasProgress = progressByModule.TryGetValue(m.Id, out var prog);
                return new ModuleProgressDto(
                    m.Id.ToString(),
                    m.Title,
                    m.ModuleType,
                    m.OrderIndex,
                    hasProgress,
                    hasProgress ? Math.Round(prog!.Score, 1) : 0,
                    hasProgress ? prog!.CompletedAt : null
                );
            }).ToList();

            int total = moduleProgressList.Count;
            int completed = moduleProgressList.Count(x => x.Completed);
            double completionPct = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0;
            double avgScore = completed > 0
                ? Math.Round(moduleProgressList.Where(x => x.Completed).Average(x => x.Score), 1)
                : 0;

            return new CourseProgressDto(
                course.Id.ToString(),
                course.Title,
                course.Category,
                total,
                completed,
                completionPct,
                avgScore,
                moduleProgressList
            );
        }).ToList();
    }

    public async Task<List<RecommendedCourseDto>> GetRecommendedCoursesAsync(Guid userId)
    {
        var userSkills = await _db.TalentSkills
            .Where(ts => ts.UserId == userId)
            .Select(ts => ts.SkillName.ToLower())
            .ToListAsync();

        var userSkillSet = new HashSet<string>(userSkills);

        var courses = await _db.Courses.ToListAsync();
        var result = new List<RecommendedCourseDto>();

        foreach (var course in courses)
        {
            List<string> requiredSkills;
            try
            {
                requiredSkills = JsonSerializer.Deserialize<List<string>>(course.RequiredSkillsJson) ?? new();
            }
            catch
            {
                requiredSkills = new();
            }

            var missingSkills = requiredSkills
                .Where(s => !userSkillSet.Contains(s.ToLower()))
                .ToList();

            double gapScore = requiredSkills.Count > 0
                ? (double)missingSkills.Count / requiredSkills.Count * 100
                : 0;

            result.Add(new RecommendedCourseDto(
                course.Id.ToString(),
                course.Title,
                course.Category,
                course.RequiredSkillsJson,
                Math.Round(gapScore, 2),
                missingSkills
            ));
        }

        return result.OrderByDescending(r => r.GapScore).ToList();
    }

    private static CourseDto MapCourseToDto(TalentBridgeApi.Models.Course c) =>
        new(c.Id.ToString(), c.Title, c.Category, c.RequiredSkillsJson,
            c.Modules.Select(m => new ModuleDto(
                m.Id.ToString(), m.CourseId.ToString(), m.OrderIndex, m.ModuleType, m.Title, null
            )).ToList());

    private static CourseDto MapCourseWithQuestionsToDto(TalentBridgeApi.Models.Course c) =>
        new(c.Id.ToString(), c.Title, c.Category, c.RequiredSkillsJson,
            c.Modules.Select(m => new ModuleDto(
                m.Id.ToString(), m.CourseId.ToString(), m.OrderIndex, m.ModuleType, m.Title,
                m.Questions.Select(q => new QuestionDto(
                    q.Id.ToString(), q.ModuleId.ToString(), q.QuestionText, q.QuestionType,
                    q.Options.Select(o => new OptionDto(o.Id.ToString(), o.OptionText, o.Position)).ToList()
                )).ToList()
            )).ToList());
}
