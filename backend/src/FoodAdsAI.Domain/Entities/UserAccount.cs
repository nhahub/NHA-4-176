namespace FoodAdsAI.Domain.Entities;

public sealed class UserAccount : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public string? RefreshTokenHash { get; set; }
    public DateTimeOffset? RefreshTokenExpiresAt { get; set; }
}

