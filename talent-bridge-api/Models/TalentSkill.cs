namespace TalentBridgeApi.Models;

public class TalentSkill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public double ProficiencyScore { get; set; }
    public User User { get; set; } = null!;
}
