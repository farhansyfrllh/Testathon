using Microsoft.EntityFrameworkCore;
using TalentBridgeApi.Models;

namespace TalentBridgeApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Cv> CVs => Set<Cv>();
    public DbSet<TalentSkill> TalentSkills => Set<TalentSkill>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseModule> Modules => Set<CourseModule>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<UserProgress> UserProgresses => Set<UserProgress>();
    public DbSet<Job> Jobs => Set<Job>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("Talent");
            e.Property(u => u.Grade).HasDefaultValue("Unranked");
        });

        modelBuilder.Entity<Cv>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasOne(c => c.User)
             .WithMany(u => u.CVs)
             .HasForeignKey(c => c.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TalentSkill>(e =>
        {
            e.HasKey(ts => ts.Id);
            e.HasOne(ts => ts.User)
             .WithMany(u => u.Skills)
             .HasForeignKey(ts => ts.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Course>(e =>
        {
            e.HasKey(c => c.Id);
        });

        modelBuilder.Entity<CourseModule>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasOne(m => m.Course)
             .WithMany(c => c.Modules)
             .HasForeignKey(m => m.CourseId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Question>(e =>
        {
            e.HasKey(q => q.Id);
            e.HasOne(q => q.Module)
             .WithMany(m => m.Questions)
             .HasForeignKey(q => q.ModuleId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuestionOption>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasOne(o => o.Question)
             .WithMany(q => q.Options)
             .HasForeignKey(o => o.QuestionId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserProgress>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.User)
             .WithMany(u => u.Progress)
             .HasForeignKey(p => p.UserId)
             .OnDelete(DeleteBehavior.NoAction);
            e.HasOne(p => p.Course)
             .WithMany()
             .HasForeignKey(p => p.CourseId)
             .OnDelete(DeleteBehavior.NoAction);
            e.HasOne(p => p.Module)
             .WithMany()
             .HasForeignKey(p => p.ModuleId)
             .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Job>(e =>
        {
            e.HasKey(j => j.Id);
        });
    }
}
