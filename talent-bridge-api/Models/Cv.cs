namespace TalentBridgeApi.Models;

public class Cv
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? ExtractedText { get; set; }
    public double MatchScore { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public User User { get; set; } = null!;
}
