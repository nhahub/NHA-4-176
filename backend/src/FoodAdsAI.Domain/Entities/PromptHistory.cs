namespace FoodAdsAI.Domain.Entities;

public sealed class PromptHistory : BaseEntity
{
    public Guid? UserId { get; set; }
    public Guid? RestaurantId { get; set; }
    public string OriginalPrompt { get; set; } = string.Empty;
    public string EnhancedPrompt { get; set; } = string.Empty;
    public string NegativePrompt { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
}
