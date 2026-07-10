using FoodAdsAI.Application.Models;

namespace FoodAdsAI.Application.Abstractions;

public interface IPythonAiClient
{
    Task<EnhancePromptResponse> EnhancePromptAsync(EnhancePromptRequest request, CancellationToken cancellationToken);
    Task<GenerateImageResponse> GenerateImagesAsync(GenerateImageRequest request, CancellationToken cancellationToken);
    Task<CampaignResponse> GenerateCampaignAsync(CampaignRequest request, CancellationToken cancellationToken);
}

