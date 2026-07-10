using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Application.Models;
using FoodAdsAI.Application.Services;
using FoodAdsAI.Domain.Entities;
using System.Security.Claims;

namespace FoodAdsAI.Api;

public static class Endpoints
{
    public static IEndpointRouteBuilder MapFoodAdsAiEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api");

        var auth = api.MapGroup("/auth");
        auth.MapPost("/register", async (RegisterRequest request, AuthService service, CancellationToken ct) =>
        {
            try
            {
                var response = await service.RegisterAsync(request, ct);
                return Results.Created("/api/auth/me", response);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { message = ex.Message });
            }
        });
        auth.MapPost("/login", async (LoginRequest request, AuthService service, CancellationToken ct) =>
        {
            try
            {
                return Results.Ok(await service.LoginAsync(request, ct));
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        });
        auth.MapPost("/refresh", async (RefreshTokenRequest request, AuthService service, CancellationToken ct) =>
        {
            try
            {
                return Results.Ok(await service.RefreshAsync(request, ct));
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        });
        auth.MapPost("/logout", async (LogoutRequest request, AuthService service, CancellationToken ct) =>
        {
            try
            {
                await service.LogoutAsync(request, ct);
                return Results.NoContent();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });
        auth.MapGet("/me", async (ClaimsPrincipal user, AuthService service, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var currentUser = await service.GetCurrentUserAsync(userId.Value, ct);
            return currentUser is null ? Results.NotFound() : Results.Ok(currentUser);
        }).RequireAuthorization();

        var generation = api.MapGroup("/generation").RequireAuthorization();
        generation.MapPost("/image", async (GenerateImageRequest request, ClaimsPrincipal user, GenerationService service, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(await service.GenerateImagesAsync(request, userId, ct));
        });
        generation.MapPost("/campaign", async (CampaignRequest request, ClaimsPrincipal user, GenerationService service, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(await service.GenerateCampaignAsync(request, userId, ct));
        });
        generation.MapPost("/caption", async (EnhancePromptRequest request, ClaimsPrincipal user, GenerationService service, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(await service.EnhancePromptAsync(request, userId, ct));
        });
        generation.MapPost("/enhance-prompt", async (EnhancePromptRequest request, ClaimsPrincipal user, GenerationService service, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(await service.EnhancePromptAsync(request, userId, ct));
        });
        generation.MapPost("/video-script", () => Results.Ok(new { script = "Create a punchy 15-second restaurant reel script." }));

        generation.MapGet("/campaigns", (GenerationService service) => Results.Ok(service.GetCampaignHistory()));

        var history = api.MapGroup("/history").RequireAuthorization();
        history.MapGet("/", (ClaimsPrincipal user, IRepositoryStore store) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var items = store.PromptHistory
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt);
            return Results.Ok(items);
        });
        history.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, IRepositoryStore store, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var currentUserId = userId.Value;
            var item = store.PromptHistory.FirstOrDefault(x => x.Id == id && x.UserId == currentUserId);
            if (item is null)
            {
                return Results.NotFound();
            }

            store.RemovePromptHistory(item.Id);
            await store.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        var favorites = api.MapGroup("/favorites").RequireAuthorization();
        favorites.MapGet("/", (ClaimsPrincipal user, IRepositoryStore store) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var items = store.Favorites
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt);
            return Results.Ok(items);
        });
        favorites.MapPost("/", async (FavoriteRequest request, ClaimsPrincipal user, IRepositoryStore store, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            if (request.CampaignId is null && request.GeneratedImageId is null)
            {
                return Results.BadRequest(new { message = "A campaign or generated image must be provided." });
            }

            var favorite = new Favorite
            {
                UserId = userId.Value,
                CampaignId = request.CampaignId,
                GeneratedImageId = request.GeneratedImageId
            };
            store.AddFavorite(favorite);
            await store.SaveChangesAsync(ct);
            return Results.Ok(favorite);
        });
        favorites.MapPost("/campaign/{campaignId:guid}", async (Guid campaignId, ClaimsPrincipal user, IRepositoryStore store, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var exists = store.Campaigns.Any(x => x.Id == campaignId);
            if (!exists)
            {
                return Results.NotFound();
            }

            var favorite = new Favorite
            {
                UserId = userId.Value,
                CampaignId = campaignId
            };
            store.AddFavorite(favorite);
            await store.SaveChangesAsync(ct);
            return Results.Ok(favorite);
        });
        favorites.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, IRepositoryStore store, CancellationToken ct) =>
        {
            var userId = GetCurrentUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var currentUserId = userId.Value;
            var favorite = store.Favorites.FirstOrDefault(x => x.Id == id && x.UserId == currentUserId);
            if (favorite is null)
            {
                return Results.NotFound();
            }

            store.RemoveFavorite(favorite.Id);
            await store.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        var restaurants = api.MapGroup("/restaurants").RequireAuthorization();
        restaurants.MapGet("/", (RestaurantService service) => Results.Ok(service.GetAll()));
        restaurants.MapPost("/", async (CreateRestaurantRequest request, RestaurantService service, CancellationToken ct)
            => Results.Ok(await service.CreateAsync(request.Name, request.CuisineType, request.BrandTone, request.WebsiteUrl, request.LogoUrl, ct)));
        restaurants.MapPut("/{id:guid}", async (Guid id, CreateRestaurantRequest request, IRepositoryStore store, CancellationToken ct) =>
        {
            var existing = store.Restaurants.FirstOrDefault(x => x.Id == id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            existing.Name = request.Name;
            existing.CuisineType = request.CuisineType;
            existing.BrandTone = request.BrandTone;
            existing.WebsiteUrl = request.WebsiteUrl;
            existing.LogoUrl = request.LogoUrl;
            store.UpsertRestaurant(existing);
            await store.SaveChangesAsync(ct);
            return Results.Ok(existing);
        });

        return app;
    }

    private static Guid? GetCurrentUserId(ClaimsPrincipal user)
    {
        var identifier = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return Guid.TryParse(identifier, out var userId) ? userId : null;
    }
}

public sealed record FavoriteRequest(Guid? CampaignId, Guid? GeneratedImageId);
public sealed record CreateRestaurantRequest(string Name, string CuisineType, string BrandTone, string? WebsiteUrl, string? LogoUrl);
