using System.Collections.Concurrent;
using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Domain.Entities;

namespace FoodAdsAI.Infrastructure.Persistence;

public sealed class InMemoryRepositoryStore : IRepositoryStore
{
    private readonly ConcurrentDictionary<Guid, Restaurant> _restaurants = new();
    private readonly ConcurrentDictionary<Guid, Campaign> _campaigns = new();
    private readonly ConcurrentDictionary<Guid, GeneratedImage> _generatedImages = new();
    private readonly ConcurrentDictionary<Guid, PromptHistory> _promptHistory = new();
    private readonly ConcurrentDictionary<Guid, Favorite> _favorites = new();

    public IReadOnlyCollection<Restaurant> Restaurants => _restaurants.Values.ToArray();
    public IReadOnlyCollection<Campaign> Campaigns => _campaigns.Values.ToArray();
    public IReadOnlyCollection<GeneratedImage> GeneratedImages => _generatedImages.Values.ToArray();
    public IReadOnlyCollection<PromptHistory> PromptHistory => _promptHistory.Values.ToArray();
    public IReadOnlyCollection<Favorite> Favorites => _favorites.Values.ToArray();

    public void AddRestaurant(Restaurant restaurant) => _restaurants[restaurant.Id] = restaurant;
    public void UpsertRestaurant(Restaurant restaurant) => _restaurants[restaurant.Id] = restaurant;
    public void AddCampaign(Campaign campaign) => _campaigns[campaign.Id] = campaign;
    public void AddGeneratedImage(GeneratedImage image) => _generatedImages[image.Id] = image;
    public void AddPromptHistory(PromptHistory history) => _promptHistory[history.Id] = history;
    public void RemovePromptHistory(Guid id) => _promptHistory.TryRemove(id, out _);
    public void AddFavorite(Favorite favorite) => _favorites[favorite.Id] = favorite;
    public void RemoveFavorite(Guid id) => _favorites.TryRemove(id, out _);
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(0);
    public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default)
        => action(cancellationToken);
}
