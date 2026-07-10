namespace FoodAdsAI.Application.Models;

public sealed record EnhancePromptRequest(string Prompt, string? RestaurantName, string? CuisineType, string Tone);

public sealed record EnhancePromptResponse(string EnhancedPrompt, string NegativePrompt, string Source);

public sealed record GenerateImageRequest(
    string Prompt,
    string Model,
    int Count,
    int Width,
    int Height,
    float GuidanceScale,
    int Steps,
    int? Seed,
    string? NegativePrompt,
    Dictionary<string, object>? Metadata,
    string? Device);

public sealed record GeneratedImageDto(string FileName, string ContentType, string Base64Data);

public sealed record GenerateImageResponse(
    Guid GenerationId,
    string Model,
    string EnhancedPrompt,
    string NegativePrompt,
    IReadOnlyCollection<GeneratedImageDto> Images);

public sealed record CampaignRequest(
    string Prompt,
    string? RestaurantName,
    string? CuisineType,
    string Tone,
    string? ImageFileName = null,
    string? ImageContentType = null,
    string? ImageBase64Data = null);

public sealed record CampaignResponse(
    string Headline,
    string Caption,
    string Cta,
    IReadOnlyCollection<string> Hashtags,
    string GoogleAdsCopy,
    string FacebookPost,
    string InstagramPost,
    string TiktokCaption,
    string ReelScript,
    string EmailSubject,
    string EmailBody,
    string SmsMessage,
    string PushNotification,
    string MenuDescription,
    string SeoDescription,
    string PromotionalOffer,
    IReadOnlyCollection<string> ContentCalendar);

public sealed record CampaignListItem(
    Guid Id,
    string Prompt,
    string Headline,
    string Caption,
    string CallToAction,
    string ImageModel,
    string? ImageFileName,
    string? ImageContentType,
    string? ImageBase64Data,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
