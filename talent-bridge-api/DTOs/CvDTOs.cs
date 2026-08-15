namespace TalentBridgeApi.DTOs;

// ── Skill item returned by Flask and stored in TalentSkills ──────────────────
public record SkillResult(string Name, double Score);

// ── Response for POST /api/cv/upload ─────────────────────────────────────────
public record CvUploadResponse(
    string CvId,
    double MatchScore,
    string Grade,
    IEnumerable<SkillResult> Skills,
    string Method   // "ai" or "rule_based"
);

// ── Response for GET /api/cv/{userId}/result ──────────────────────────────────
public record CvResultResponse(
    string CvId,
    string FilePath,
    double MatchScore,
    string Grade,
    DateTime UploadedAt,
    IEnumerable<SkillResult> Skills
);

// ── Internal: Flask /ocr-and-match response shape ────────────────────────────
public class FlaskOcrMatchResponse
{
    public List<FlaskSkill> ExtractedSkills { get; set; } = new();
    public double OverallMatchScore { get; set; }
    public string Method { get; set; } = "rule_based";
    public string? ExtractedText { get; set; }
}

public class FlaskSkill
{
    public string Name { get; set; } = string.Empty;
    public double Confidence { get; set; }
}
