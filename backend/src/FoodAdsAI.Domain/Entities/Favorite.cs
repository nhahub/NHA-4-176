namespace FoodAdsAI.Domain.Entities;

public sealed class Favorite : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? CampaignId { get; set; }
    public Guid? GeneratedImageId { get; set; }
}

