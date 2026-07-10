using System.Net.Http.Json;
using System.Text.Json;
using System.Text;
using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Application.Models;

namespace FoodAdsAI.Infrastructure.Services;

public sealed class PythonAiClient : IPythonAiClient
{
    private readonly HttpClient _httpClient;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = SnakeCaseNamingPolicy.Instance,
        DictionaryKeyPolicy = SnakeCaseNamingPolicy.Instance,
        PropertyNameCaseInsensitive = true
    };

    public PythonAiClient(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<EnhancePromptResponse> EnhancePromptAsync(EnhancePromptRequest request, CancellationToken cancellationToken)
    {
        var response = await _httpClient.PostAsJsonAsync("/v1/prompt/enhance", request, JsonOptions, cancellationToken);
        return await ReadResponseAsync<EnhancePromptResponse>(response, cancellationToken);
    }

    public async Task<GenerateImageResponse> GenerateImagesAsync(GenerateImageRequest request, CancellationToken cancellationToken)
    {
        var response = await _httpClient.PostAsJsonAsync("/v1/images/generate", request, JsonOptions, cancellationToken);
        return await ReadResponseAsync<GenerateImageResponse>(response, cancellationToken);
    }

    public async Task<CampaignResponse> GenerateCampaignAsync(CampaignRequest request, CancellationToken cancellationToken)
    {
        var response = await _httpClient.PostAsJsonAsync("/v1/campaigns/generate", request, JsonOptions, cancellationToken);
        return await ReadResponseAsync<CampaignResponse>(response, cancellationToken);
    }

    private static async Task<T> ReadResponseAsync<T>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException(
                $"Python AI service returned {(int)response.StatusCode} {response.ReasonPhrase}: {body}",
                null,
                response.StatusCode);
        }

        return (await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken))!;
    }

    private sealed class SnakeCaseNamingPolicy : JsonNamingPolicy
    {
        public static readonly SnakeCaseNamingPolicy Instance = new();

        public override string ConvertName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return name;
            }

            var builder = new StringBuilder(name.Length + 8);
            for (var index = 0; index < name.Length; index++)
            {
                var current = name[index];
                if (current == '_')
                {
                    builder.Append('_');
                    continue;
                }

                var isBoundary = index > 0 && char.IsUpper(current) &&
                    (char.IsLower(name[index - 1]) || char.IsDigit(name[index - 1]) || (index + 1 < name.Length && char.IsLower(name[index + 1])));

                if (isBoundary && builder.Length > 0 && builder[^1] != '_')
                {
                    builder.Append('_');
                }

                builder.Append(char.ToLowerInvariant(current));
            }

            return builder.ToString();
        }
    }
}
