namespace TalentBridgeApi.Models;

public class QuestionOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuestionId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Position { get; set; } // digunakan untuk drag_drop mapping
    public Question Question { get; set; } = null!;
}
