using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Application.Models;
using FoodAdsAI.Domain.Entities;

namespace FoodAdsAI.Application.Services;

public sealed class GenerationService
{
    private readonly IRepositoryStore _store;
    private readonly IPythonAiClient _aiClient;

    public GenerationService(IRepositoryStore store, IPythonAiClient aiClient)
    {
        _store = store;
        _aiClient = aiClient;
    }

    public Task<EnhancePromptResponse> EnhancePromptAsync(EnhancePromptRequest request, Guid? userId, CancellationToken cancellationToken)
        => EnhanceAndPersistAsync(request, userId, cancellationToken);

    public async Task<GenerateImageResponse> GenerateImagesAsync(GenerateImageRequest request, Guid? userId, CancellationToken cancellationToken)
    {
        var response = await _aiClient.GenerateImagesAsync(request, cancellationToken);

        await _store.ExecuteInTransactionAsync(_ =>
        {
            _store.AddPromptHistory(new PromptHistory
            {
                UserId = userId,
                OriginalPrompt = request.Prompt,
                EnhancedPrompt = response.EnhancedPrompt,
                NegativePrompt = response.NegativePrompt,
                Model = response.Model
            });

            foreach (var image in response.Images)
            {
                _store.AddGeneratedImage(new GeneratedImage
                {
                    CampaignId = null,
                    Prompt = response.EnhancedPrompt,
                    Model = response.Model,
                    FileName = image.FileName,
                    ContentType = image.ContentType,
                    Base64Data = image.Base64Data
                });
            }

            return Task.CompletedTask;
        }, cancellationToken);

        return response;
    }

    public async Task<CampaignResponse> GenerateCampaignAsync(CampaignRequest request, Guid? userId, CancellationToken cancellationToken)
    {
        var response = await _aiClient.GenerateCampaignAsync(request, cancellationToken);

        await _store.ExecuteInTransactionAsync(_ =>
        {
            _store.AddCampaign(new Campaign
            {
                RestaurantId = null,
                Prompt = request.Prompt,
                Headline = response.Headline,
                Caption = response.Caption,
                CallToAction = response.Cta,
                ImageModel = "campaign",
                ImageFileName = request.ImageFileName,
                ImageContentType = request.ImageContentType,
                ImageBase64Data = request.ImageBase64Data,
            });

            _store.AddPromptHistory(new PromptHistory
            {
                UserId = userId,
                RestaurantId = null,
                OriginalPrompt = request.Prompt,
                EnhancedPrompt = request.Prompt,
                NegativePrompt = string.Empty,
                Model = "campaign"
            });

            return Task.CompletedTask;
        }, cancellationToken);

        return response;
    }

    public IReadOnlyCollection<CampaignListItem> GetCampaignHistory()
        => _store.Campaigns
            .OrderByDescending(x => x.CreatedAt)
            .Select(x =>
            {
                return new CampaignListItem(
                    x.Id,
                    x.Prompt,
                    x.Headline,
                    x.Caption,
                    x.CallToAction,
                    x.ImageModel,
                    x.ImageFileName,
                    x.ImageContentType,
                    x.ImageBase64Data,
                    x.CreatedAt,
                    x.UpdatedAt);
            })
            .ToArray();

    private async Task<EnhancePromptResponse> EnhanceAndPersistAsync(EnhancePromptRequest request, Guid? userId, CancellationToken cancellationToken)
    {
        var response = await _aiClient.EnhancePromptAsync(request, cancellationToken);

        await _store.ExecuteInTransactionAsync(_ =>
        {
            _store.AddPromptHistory(new PromptHistory
            {
                UserId = userId,
                OriginalPrompt = request.Prompt,
                EnhancedPrompt = response.EnhancedPrompt,
                NegativePrompt = response.NegativePrompt,
                Model = response.Source
            });

            return Task.CompletedTask;
        }, cancellationToken);

        return response;
    }
}
