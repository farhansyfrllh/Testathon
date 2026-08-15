namespace TalentBridgeApi.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Talent"; // Talent, Admin, Employer
    public string Grade { get; set; } = "Unranked"; // Unranked, Bronze, Silver, Gold
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Cv> CVs { get; set; } = new List<Cv>();
    public ICollection<TalentSkill> Skills { get; set; } = new List<TalentSkill>();
    public ICollection<UserProgress> Progress { get; set; } = new List<UserProgress>();
}
