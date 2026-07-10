namespace FoodAdsAI.Domain.Entities;

public sealed class Restaurant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string CuisineType { get; set; } = string.Empty;
    public string BrandTone { get; set; } = "premium";
    public string? WebsiteUrl { get; set; }
    public string? LogoUrl { get; set; }
}

