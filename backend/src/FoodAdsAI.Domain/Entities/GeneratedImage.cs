namespace FoodAdsAI.Domain.Entities;

public sealed class GeneratedImage : BaseEntity
{
    public Guid? CampaignId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string Model { get; set; } = "lora";
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "image/png";
    public string Base64Data { get; set; } = string.Empty;
}
