namespace TalentBridgeApi.Models;

public class Question
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ModuleId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty; // mcq, multi_select, drag_drop
    public CourseModule Module { get; set; } = null!;
    public ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();
}
