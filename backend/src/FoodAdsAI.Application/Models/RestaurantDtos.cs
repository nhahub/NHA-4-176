namespace FoodAdsAI.Application.Models;

public sealed record RestaurantDto(Guid Id, string Name, string CuisineType, string BrandTone, string? WebsiteUrl, string? LogoUrl);

