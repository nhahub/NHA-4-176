namespace FoodAdsAI.Infrastructure.Services;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "FoodAdsAI";
    public string Audience { get; set; } = "FoodAdsAI";
    public string Secret { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 30;
}
