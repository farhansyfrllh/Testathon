using Microsoft.EntityFrameworkCore;
using TalentBridgeApi.Data;
using TalentBridgeApi.DTOs;

namespace TalentBridgeApi.Services;

public class QuizService
{
    private readonly AppDbContext _db;

    public QuizService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(QuizResultDto? result, string? error)> SubmitQuizAsync(
        Guid moduleId, Guid userId, QuizSubmitRequest request)
    {
        // Load module with questions and options
        var module = await _db.Modules
            .Include(m => m.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(m => m.Id == moduleId);

        if (module == null)
            return (null, "Module not found.");

        int correctCount = 0;
        int totalCount = module.Questions.Count;

        foreach (var answer in request.Answers)
        {
            if (!Guid.TryParse(answer.QuestionId, out var qId)) continue;
            var question = module.Questions.FirstOrDefault(q => q.Id == qId);
            if (question == null) continue;

            bool isCorrect = question.QuestionType switch
            {
                "mcq"          => ValidateMcq(question, answer),
                "true_false"   => ValidateMcq(question, answer),
                "multi_select" => ValidateMultiSelect(question, answer),
                "drag_drop"    => ValidateDragDrop(question, answer),
                _              => false
            };

            if (isCorrect) correctCount++;
        }

        double score = totalCount > 0 ? Math.Round((double)correctCount / totalCount * 100, 2) : 0;
        bool passed = score >= 70;
        
        // Streak/Combo Multiplier (Perfect Score = 2x XP)
        int xpGained = (int)(score / 10) * 10;
        if (correctCount == totalCount && totalCount > 0)
        {
            xpGained *= 2; // Perfect combo multiplier
        }

        // Save progress
        var progress = new TalentBridgeApi.Models.UserProgress
        {
            UserId      = userId,
            CourseId    = module.CourseId,
            ModuleId    = moduleId,
            Score       = score,
            CompletedAt = DateTime.UtcNow
        };
        _db.UserProgresses.Add(progress);

        // Update grade cumulatively (only goes up)
        var user = await _db.Users.FindAsync(userId);
        if (user != null)
        {
            var allScores = await _db.UserProgresses
                .Where(p => p.UserId == userId)
                .Select(p => p.Score)
                .ToListAsync();
            allScores.Add(score); // include current

            double avgScore = allScores.Average();
            string newGrade = CalculateGrade(avgScore);

            // Grade only goes up
            if (GradeRank(newGrade) > GradeRank(user.Grade))
                user.Grade = newGrade;
        }

        await _db.SaveChangesAsync();

        return (new QuizResultDto(score, user?.Grade ?? "Unranked", xpGained, passed, correctCount, totalCount), null);
    }

    private static bool ValidateMcq(TalentBridgeApi.Models.Question question, AnswerDto answer)
    {
        if (answer.SelectedOptionIds == null || answer.SelectedOptionIds.Count != 1)
            return false;
        var selectedId = answer.SelectedOptionIds[0];
        return question.Options.Any(o => o.Id.ToString() == selectedId && o.IsCorrect);
    }

    private static bool ValidateMultiSelect(TalentBridgeApi.Models.Question question, AnswerDto answer)
    {
        if (answer.SelectedOptionIds == null) return false;
        var correctIds  = question.Options.Where(o => o.IsCorrect).Select(o => o.Id.ToString()).ToHashSet();
        var selectedIds = answer.SelectedOptionIds.ToHashSet();
        return correctIds.SetEquals(selectedIds);
    }

    private static bool ValidateDragDrop(TalentBridgeApi.Models.Question question, AnswerDto answer)
    {
        // drag_drop: each option has a Position (slot index), IsCorrect=true options must be placed at correct slots
        // DragDropMapping: { slotIndex: optionId }
        if (answer.DragDropMapping == null || answer.DragDropMapping.Count == 0)
        {
            // Fallback: treat SelectedOptionIds[0] as the single correct answer id
            if (answer.SelectedOptionIds?.Count == 1)
                return question.Options.Any(o => o.Id.ToString() == answer.SelectedOptionIds[0] && o.IsCorrect);
            return false;
        }

        int correctMappings = 0;
        int totalRequired   = question.Options.Count(o => o.IsCorrect);

        foreach (var (slotKey, optionId) in answer.DragDropMapping)
        {
            if (!int.TryParse(slotKey, out int slotPos)) continue;
            var option = question.Options.FirstOrDefault(o => o.Id.ToString() == optionId);
            if (option != null && option.IsCorrect && option.Position == slotPos)
                correctMappings++;
        }

        return totalRequired > 0 && correctMappings == totalRequired;
    }

    private static string CalculateGrade(double score) => score switch
    {
        >= 80 => "Gold",
        >= 60 => "Silver",
        >= 40 => "Bronze",
        _     => "Unranked"
    };

    private static int GradeRank(string grade) => grade switch
    {
        "Gold"   => 3,
        "Silver" => 2,
        "Bronze" => 1,
        _        => 0
    };
}
