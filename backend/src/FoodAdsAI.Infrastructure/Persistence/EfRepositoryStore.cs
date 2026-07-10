using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodAdsAI.Infrastructure.Persistence;

public sealed class EfRepositoryStore : IRepositoryStore
{
    private readonly FoodAdsAiDbContext _db;

    public EfRepositoryStore(FoodAdsAiDbContext db) => _db = db;

    public IReadOnlyCollection<Restaurant> Restaurants => _db.Restaurants.AsNoTracking().OrderBy(x => x.Name).ToArray();
    public IReadOnlyCollection<Campaign> Campaigns => _db.Campaigns.AsNoTracking().OrderByDescending(x => x.CreatedAt).ToArray();
    public IReadOnlyCollection<GeneratedImage> GeneratedImages => _db.GeneratedImages.AsNoTracking().OrderByDescending(x => x.CreatedAt).ToArray();
    public IReadOnlyCollection<PromptHistory> PromptHistory => _db.PromptHistory.AsNoTracking().OrderByDescending(x => x.CreatedAt).ToArray();
    public IReadOnlyCollection<Favorite> Favorites => _db.Favorites.AsNoTracking().OrderByDescending(x => x.CreatedAt).ToArray();

    public void AddRestaurant(Restaurant restaurant) => _db.Restaurants.Add(restaurant);

    public void UpsertRestaurant(Restaurant restaurant) => _db.Restaurants.Update(restaurant);

    public void AddCampaign(Campaign campaign) => _db.Campaigns.Add(campaign);

    public void AddGeneratedImage(GeneratedImage image) => _db.GeneratedImages.Add(image);

    public void AddPromptHistory(PromptHistory history) => _db.PromptHistory.Add(history);

    public void RemovePromptHistory(Guid id)
    {
        var entity = _db.PromptHistory.FirstOrDefault(x => x.Id == id);
        if (entity is not null)
        {
            _db.PromptHistory.Remove(entity);
        }
    }

    public void AddFavorite(Favorite favorite) => _db.Favorites.Add(favorite);

    public void RemoveFavorite(Guid id)
    {
        var entity = _db.Favorites.FirstOrDefault(x => x.Id == id);
        if (entity is not null)
        {
            _db.Favorites.Remove(entity);
        }
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _db.SaveChangesAsync(cancellationToken);

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        await action(cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
