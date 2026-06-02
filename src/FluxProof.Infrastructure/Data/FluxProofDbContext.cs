using FluxProof.Domain.Entities;
using FluxProof.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FluxProof.Infrastructure.Data;

public class FluxProofDbContext(DbContextOptions<FluxProofDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectPermission> ProjectPermissions => Set<ProjectPermission>();
    public DbSet<Revision> Revisions => Set<Revision>();
    public DbSet<RevisionItem> RevisionItems => Set<RevisionItem>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserRole>(e =>
        {
            e.HasKey(ur => new { ur.UserId, ur.RoleId });
            e.HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
            e.HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId);
        });

        modelBuilder.Entity<ProjectPermission>(e =>
        {
            e.HasKey(pp => new { pp.ProjectId, pp.UserId });
            e.HasOne(pp => pp.Project).WithMany(p => p.Permissions).HasForeignKey(pp => pp.ProjectId);
            e.HasOne(pp => pp.User).WithMany(u => u.ProjectPermissions).HasForeignKey(pp => pp.UserId);
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.HasOne(p => p.CreatedBy).WithMany().HasForeignKey(p => p.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Revision>(e =>
        {
            e.HasOne(r => r.Project).WithMany(p => p.Revisions).HasForeignKey(r => r.ProjectId);
            e.HasOne(r => r.CreatedBy).WithMany().HasForeignKey(r => r.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            e.Ignore(r => r.VersionString);
        });

        modelBuilder.Entity<RevisionItem>(e =>
        {
            e.HasOne(ri => ri.Revision).WithMany(r => r.Items).HasForeignKey(ri => ri.RevisionId);
        });

        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.HasOne(al => al.User).WithMany(u => u.ActivityLogs).HasForeignKey(al => al.UserId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AppSetting>(e =>
        {
            e.HasKey(s => s.Key);
        });

        modelBuilder.Entity<UserPreference>(e =>
        {
            e.HasKey(p => new { p.UserId, p.Key });
            e.HasOne(p => p.User).WithMany(u => u.Preferences).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
        });

        modelBuilder.Entity<Role>(e =>
        {
            e.HasIndex(r => r.Name).IsUnique();
        });
    }
}
