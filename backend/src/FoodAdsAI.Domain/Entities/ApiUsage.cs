namespace FoodAdsAI.Domain.Entities;

public sealed class ApiUsage : BaseEntity
{
    public Guid UserId { get; set; }
    public string Operation { get; set; } = string.Empty;
    public int UnitsUsed { get; set; }
    public decimal EstimatedCost { get; set; }
}

