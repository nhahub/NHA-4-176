namespace FoodAdsAI.Domain.Entities;

public sealed class Subscription : BaseEntity
{
    public Guid UserId { get; set; }
    public string PlanName { get; set; } = "Starter";
    public string Status { get; set; } = "active";
    public DateOnly CurrentPeriodStart { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly CurrentPeriodEnd { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1));
}

