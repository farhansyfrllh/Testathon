namespace TalentBridgeApi.Models;

public class Job
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty; // Batam atau Singapore
    public string RequiredSkillsJson { get; set; } = "[]"; // JSON array string
    public string MinGrade { get; set; } = "Unranked";
    public string? Description { get; set; }
    public string? Company { get; set; }
}
