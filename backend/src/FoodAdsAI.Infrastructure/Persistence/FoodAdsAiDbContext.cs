using FoodAdsAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodAdsAI.Infrastructure.Persistence;

public sealed class FoodAdsAiDbContext : DbContext
{
    public FoodAdsAiDbContext(DbContextOptions<FoodAdsAiDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<GeneratedImage> GeneratedImages => Set<GeneratedImage>();
    public DbSet<PromptHistory> PromptHistory => Set<PromptHistory>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<ApiUsage> ApiUsage => Set<ApiUsage>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureRoles(modelBuilder);
        ConfigureRestaurants(modelBuilder);
        ConfigureCampaigns(modelBuilder);
        ConfigureGeneratedImages(modelBuilder);
        ConfigurePromptHistory(modelBuilder);
        ConfigureFavorites(modelBuilder);
        ConfigureSubscriptions(modelBuilder);
        ConfigureApiUsage(modelBuilder);
        ConfigureNotifications(modelBuilder);
    }

    public override int SaveChanges()
    {
        ApplyAuditAndSoftDeleteRules();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditAndSoftDeleteRules();
        return base.SaveChangesAsync(cancellationToken);
    }

    private static void ApplySoftDeleteFilter<TEntity>(ModelBuilder modelBuilder)
        where TEntity : BaseEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(entity => !entity.IsDeleted);
    }

    private void ApplyAuditAndSoftDeleteRules()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAt = now;
                entry.Entity.UpdatedAt = now;
            }
        }
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<UserAccount>();
        entity.ToTable("users");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Email).HasMaxLength(320).IsRequired();
        entity.Property(x => x.NormalizedEmail).HasMaxLength(320).IsRequired();
        entity.Property(x => x.DisplayName).HasMaxLength(120).IsRequired();
        entity.Property(x => x.PasswordHash).HasMaxLength(1024).IsRequired();
        entity.Property(x => x.RefreshTokenHash).HasMaxLength(1024);
        entity.HasIndex(x => x.Email).IsUnique();
        entity.HasIndex(x => x.NormalizedEmail).IsUnique();
        ApplySoftDeleteFilter<UserAccount>(modelBuilder);
    }

    private static void ConfigureRoles(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Role>();
        entity.ToTable("roles");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Name).HasMaxLength(80).IsRequired();
        entity.Property(x => x.NormalizedName).HasMaxLength(80).IsRequired();
        entity.Property(x => x.Description).HasMaxLength(250);
        entity.HasIndex(x => x.NormalizedName).IsUnique();
        ApplySoftDeleteFilter<Role>(modelBuilder);

        modelBuilder.Entity<UserRole>(join =>
        {
            join.ToTable("user_roles");
            join.HasKey(x => new { x.UserId, x.RoleId });
            join.Property(x => x.AssignedAt).HasColumnType("timestamp with time zone");
            join.HasOne<UserAccount>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            join.HasOne<Role>()
                .WithMany()
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureRestaurants(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Restaurant>();
        entity.ToTable("restaurants");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
        entity.Property(x => x.CuisineType).HasMaxLength(120).IsRequired();
        entity.Property(x => x.BrandTone).HasMaxLength(80).IsRequired();
        entity.Property(x => x.WebsiteUrl).HasMaxLength(500);
        entity.Property(x => x.LogoUrl).HasMaxLength(500);
        entity.HasIndex(x => x.Name);
        ApplySoftDeleteFilter<Restaurant>(modelBuilder);

        entity.HasMany<Campaign>()
            .WithOne()
            .HasForeignKey(x => x.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany<PromptHistory>()
            .WithOne()
            .HasForeignKey(x => x.RestaurantId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    private static void ConfigureCampaigns(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Campaign>();
        entity.ToTable("campaigns");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Prompt).HasMaxLength(2000).IsRequired();
        entity.Property(x => x.Headline).HasMaxLength(250).IsRequired();
        entity.Property(x => x.Caption).HasMaxLength(2000).IsRequired();
        entity.Property(x => x.CallToAction).HasMaxLength(250).IsRequired();
        entity.Property(x => x.ImageModel).HasMaxLength(80).IsRequired();
        entity.Property(x => x.ImageFileName).HasMaxLength(300);
        entity.Property(x => x.ImageContentType).HasMaxLength(120);
        entity.Property(x => x.ImageBase64Data).HasColumnType("text");
        entity.HasIndex(x => x.RestaurantId);
        ApplySoftDeleteFilter<Campaign>(modelBuilder);

        entity.HasMany<GeneratedImage>()
            .WithOne()
            .HasForeignKey(x => x.CampaignId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureGeneratedImages(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<GeneratedImage>();
        entity.ToTable("generated_images");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Prompt).HasMaxLength(2000).IsRequired();
        entity.Property(x => x.Model).HasMaxLength(80).IsRequired();
        entity.Property(x => x.FileName).HasMaxLength(300).IsRequired();
        entity.Property(x => x.ContentType).HasMaxLength(120).IsRequired();
        entity.Property(x => x.Base64Data).HasColumnType("text").IsRequired();
        entity.HasIndex(x => x.CampaignId);
        ApplySoftDeleteFilter<GeneratedImage>(modelBuilder);
    }

    private static void ConfigurePromptHistory(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<PromptHistory>();
        entity.ToTable("prompt_history");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.UserId);
        entity.Property(x => x.OriginalPrompt).HasMaxLength(2000).IsRequired();
        entity.Property(x => x.EnhancedPrompt).HasMaxLength(4000).IsRequired();
        entity.Property(x => x.NegativePrompt).HasMaxLength(2000).IsRequired();
        entity.Property(x => x.Model).HasMaxLength(80).IsRequired();
        entity.HasIndex(x => new { x.UserId, x.CreatedAt });
        entity.HasIndex(x => x.RestaurantId);
        ApplySoftDeleteFilter<PromptHistory>(modelBuilder);

        entity.HasOne<UserAccount>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    private static void ConfigureFavorites(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Favorite>();
        entity.ToTable("favorites");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.UserId).IsRequired();
        entity.HasIndex(x => new { x.UserId, x.CampaignId, x.GeneratedImageId });
        entity.HasOne<UserAccount>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        ApplySoftDeleteFilter<Favorite>(modelBuilder);
    }

    private static void ConfigureSubscriptions(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Subscription>();
        entity.ToTable("subscriptions");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.PlanName).HasMaxLength(100).IsRequired();
        entity.Property(x => x.Status).HasMaxLength(40).IsRequired();
        entity.HasIndex(x => x.UserId).IsUnique();
        entity.HasOne<UserAccount>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        ApplySoftDeleteFilter<Subscription>(modelBuilder);
    }

    private static void ConfigureApiUsage(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<ApiUsage>();
        entity.ToTable("api_usage");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Operation).HasMaxLength(120).IsRequired();
        entity.Property(x => x.EstimatedCost).HasPrecision(18, 4);
        entity.HasIndex(x => new { x.UserId, x.Operation, x.CreatedAt });
        entity.HasOne<UserAccount>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        ApplySoftDeleteFilter<ApiUsage>(modelBuilder);
    }

    private static void ConfigureNotifications(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Notification>();
        entity.ToTable("notifications");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
        entity.Property(x => x.Message).HasMaxLength(2000).IsRequired();
        entity.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });
        entity.HasOne<UserAccount>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        ApplySoftDeleteFilter<Notification>(modelBuilder);
    }
}
