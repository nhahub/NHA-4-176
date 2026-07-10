namespace FoodAdsAI.Domain.Entities;

public sealed class Campaign : BaseEntity
{
    public Guid? RestaurantId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string Headline { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string CallToAction { get; set; } = string.Empty;
    public string ImageModel { get; set; } = "lora";
    public string? ImageFileName { get; set; }
    public string? ImageContentType { get; set; }
    public string? ImageBase64Data { get; set; }
}
