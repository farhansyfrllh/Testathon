namespace TalentBridgeApi.Models;

public class UserProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public Guid ModuleId { get; set; }
    public double Score { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public User User { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public CourseModule Module { get; set; } = null!;
}
