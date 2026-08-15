namespace TalentBridgeApi.DTOs;

public record JobDto(
    string Id,
    string Title,
    string Location,
    string RequiredSkillsJson,
    string MinGrade,
    string? Description,
    string? Company,
    double MatchScore
);

/// <summary>Job detail with full skill gap analysis for a specific user.</summary>
public record JobDetailDto(
    string Id,
    string Title,
    string Location,
    string RequiredSkillsJson,
    string MinGrade,
    string? Description,
    string? Company,
    double MatchScore,
    List<string> MatchedSkills,
    List<string> MissingSkills,
    bool UserMeetsGrade
);

/// <summary>One step in a personalised learning path.</summary>
public record LearningPathStepDto(
    int Step,
    string CourseId,
    string CourseTitle,
    string CourseCategory,
    List<string> SkillsGained,    // skills this course teaches the user
    List<string> MissingSkills,   // user's gap for this course
    double GapScore,
    string? ReasonForOrder        // human-readable explanation
);

public record LearningPathDto(
    string TargetJobId,
    string TargetJobTitle,
    string CurrentGrade,
    bool AlreadyEligible,
    List<string> AllMissingSkills,
    List<LearningPathStepDto> Steps
);
