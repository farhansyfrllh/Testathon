namespace TalentBridgeApi.Models;

public class Course
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string RequiredSkillsJson { get; set; } = "[]"; // JSON array string
    public ICollection<CourseModule> Modules { get; set; } = new List<CourseModule>();
}
