namespace TalentBridgeApi.Models;

public class CourseModule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public int OrderIndex { get; set; }
    public string ModuleType { get; set; } = string.Empty; // mcq, multi_select, drag_drop
    public string Title { get; set; } = string.Empty;
    public Course Course { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}
