using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TalentBridgeApi.Data;
using TalentBridgeApi.DTOs;

namespace TalentBridgeApi.Services;

public class JobService
{
    private readonly AppDbContext _db;

    public JobService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<JobDto>> GetAllJobsAsync()
    {
        var jobs = await _db.Jobs.ToListAsync();
        return jobs.Select(j => new JobDto(
            j.Id.ToString(), j.Title, j.Location,
            j.RequiredSkillsJson, j.MinGrade,
            j.Description, j.Company, 0
        )).ToList();
    }

    public async Task<JobDetailDto?> GetJobDetailAsync(Guid jobId, Guid userId)
    {
        var job = await _db.Jobs.FindAsync(jobId);
        if (job == null) return null;

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return null;

        var userSkills = await _db.TalentSkills
            .Where(ts => ts.UserId == userId)
            .Select(ts => ts.SkillName.ToLower())
            .ToListAsync();
        var userSkillSet = new HashSet<string>(userSkills);

        List<string> requiredSkills;
        try { requiredSkills = JsonSerializer.Deserialize<List<string>>(job.RequiredSkillsJson) ?? new(); }
        catch { requiredSkills = new(); }

        var matchedSkills = requiredSkills.Where(s => userSkillSet.Contains(s.ToLower())).ToList();
        var missingSkills = requiredSkills.Where(s => !userSkillSet.Contains(s.ToLower())).ToList();

        double matchScore = requiredSkills.Count > 0
            ? Math.Round((double)matchedSkills.Count / requiredSkills.Count * 100, 2)
            : 0;

        bool userMeetsGrade = GradeRank(user.Grade) >= GradeRank(job.MinGrade);

        return new JobDetailDto(
            job.Id.ToString(), job.Title, job.Location,
            job.RequiredSkillsJson, job.MinGrade,
            job.Description, job.Company, matchScore,
            matchedSkills, missingSkills, userMeetsGrade
        );
    }

    public async Task<LearningPathDto?> GetLearningPathAsync(Guid jobId, Guid userId)
    {
        var job = await _db.Jobs.FindAsync(jobId);
        if (job == null) return null;

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return null;

        var userSkills = await _db.TalentSkills
            .Where(ts => ts.UserId == userId)
            .Select(ts => ts.SkillName.ToLower())
            .ToListAsync();
        var userSkillSet = new HashSet<string>(userSkills);

        List<string> jobRequiredSkills;
        try { jobRequiredSkills = JsonSerializer.Deserialize<List<string>>(job.RequiredSkillsJson) ?? new(); }
        catch { jobRequiredSkills = new(); }

        var allMissingJobSkills = jobRequiredSkills
            .Where(s => !userSkillSet.Contains(s.ToLower()))
            .ToList();

        bool alreadyEligible = GradeRank(user.Grade) >= GradeRank(job.MinGrade)
                                && allMissingJobSkills.Count == 0;

        // Get all courses and find which ones cover the missing skills
        var courses = await _db.Courses.ToListAsync();
        var steps = new List<LearningPathStepDto>();

        // Simulate progressive skill acquisition as user completes courses
        var acquiredSkillSet = new HashSet<string>(userSkillSet);
        int stepNumber = 1;

        // Sort courses by relevance: how many missing skills they cover
        var coursesWithCoverage = courses.Select(course =>
        {
            List<string> courseSkills;
            try { courseSkills = JsonSerializer.Deserialize<List<string>>(course.RequiredSkillsJson) ?? new(); }
            catch { courseSkills = new(); }

            // Skills from this course that are still missing for the job
            var skillsGained = courseSkills
                .Where(s => allMissingJobSkills.Any(ms => ms.ToLower() == s.ToLower())
                         && !acquiredSkillSet.Contains(s.ToLower()))
                .ToList();

            // Gap for this course relative to current user skills
            var courseMissing = courseSkills
                .Where(s => !acquiredSkillSet.Contains(s.ToLower()))
                .ToList();

            double gapScore = courseSkills.Count > 0
                ? Math.Round((double)courseMissing.Count / courseSkills.Count * 100, 2)
                : 0;

            return (course, skillsGained, courseMissing, gapScore);
        })
        .Where(x => x.skillsGained.Count > 0)         // only include courses that help
        .OrderByDescending(x => x.skillsGained.Count)  // most helpful first
        .ToList();

        foreach (var (course, skillsGained, courseMissing, gapScore) in coursesWithCoverage)
        {
            string reason = skillsGained.Count == 1
                ? $"Covers '{skillsGained[0]}' needed for {job.Title}"
                : $"Covers {skillsGained.Count} skills needed for {job.Title}";

            steps.Add(new LearningPathStepDto(
                stepNumber++,
                course.Id.ToString(),
                course.Title,
                course.Category,
                skillsGained,
                courseMissing,
                gapScore,
                reason
            ));

            // Simulate skill acquisition after completing this course
            foreach (var s in skillsGained) acquiredSkillSet.Add(s.ToLower());
        }

        return new LearningPathDto(
            job.Id.ToString(),
            job.Title,
            user.Grade,
            alreadyEligible,
            allMissingJobSkills,
            steps
        );
    }

    public async Task<List<JobDto>> GetMatchedJobsAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return new();

        var userSkills = await _db.TalentSkills
            .Where(ts => ts.UserId == userId)
            .Select(ts => ts.SkillName.ToLower())
            .ToListAsync();

        var userSkillSet = new HashSet<string>(userSkills);
        int userGradeRank = GradeRank(user.Grade);

        var jobs = await _db.Jobs.ToListAsync();
        var matched = new List<JobDto>();

        foreach (var job in jobs)
        {
            // Filter by grade
            if (GradeRank(job.MinGrade) > userGradeRank) continue;

            // Calculate skill match score
            List<string> requiredSkills;
            try { requiredSkills = JsonSerializer.Deserialize<List<string>>(job.RequiredSkillsJson) ?? new(); }
            catch { requiredSkills = new(); }

            double matchScore = 0;
            if (requiredSkills.Count > 0)
            {
                int overlap = requiredSkills.Count(s => userSkillSet.Contains(s.ToLower()));
                matchScore = Math.Round((double)overlap / requiredSkills.Count * 100, 2);
            }

            matched.Add(new JobDto(
                job.Id.ToString(), job.Title, job.Location,
                job.RequiredSkillsJson, job.MinGrade,
                job.Description, job.Company, matchScore
            ));
        }

        return matched.OrderByDescending(j => j.MatchScore).ToList();
    }

    private static int GradeRank(string grade) => grade switch
    {
        "Gold" => 3,
        "Silver" => 2,
        "Bronze" => 1,
        _ => 0
    };
}
