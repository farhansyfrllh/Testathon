namespace TalentBridgeApi.DTOs;

public record CourseDto(
    string Id,
    string Title,
    string Category,
    string RequiredSkillsJson,
    List<ModuleDto> Modules
);

public record ModuleDto(
    string Id,
    string CourseId,
    int OrderIndex,
    string ModuleType,
    string Title,
    List<QuestionDto>? Questions
);

public record QuestionDto(
    string Id,
    string ModuleId,
    string QuestionText,
    string QuestionType,
    List<OptionDto> Options
);

public record OptionDto(
    string Id,
    string OptionText,
    int Position
    // Note: IsCorrect NOT exposed to frontend for security
);

public record RecommendedCourseDto(
    string Id,
    string Title,
    string Category,
    string RequiredSkillsJson,
    double GapScore,
    List<string> MissingSkills
);

/// <summary>Progress summary for a single course module.</summary>
public record ModuleProgressDto(
    string ModuleId,
    string ModuleTitle,
    string ModuleType,
    int OrderIndex,
    bool Completed,
    double Score,
    DateTime? CompletedAt
);

/// <summary>Progress summary for a full course.</summary>
public record CourseProgressDto(
    string CourseId,
    string CourseTitle,
    string CourseCategory,
    int TotalModules,
    int CompletedModules,
    double CompletionPercent,
    double AverageScore,
    List<ModuleProgressDto> Modules
);
