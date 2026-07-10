using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Application.Services;
using FoodAdsAI.Infrastructure.Persistence;
using FoodAdsAI.Infrastructure.Services;
using FoodAdsAI.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace FoodAdsAI.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("FoodAdsAI")
            ?? "Host=localhost;Port=5432;Database=foodadsai;Username=foodadsai;Password=foodadsai";

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection("Jwt"))
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.Issuer)
                    && !string.IsNullOrWhiteSpace(options.Audience)
                    && !string.IsNullOrWhiteSpace(options.Secret)
                    && options.Secret.Length >= 32,
                "Jwt options must include issuer, audience, and a secret with at least 32 characters.")
            .ValidateOnStart();

        services.AddDbContext<FoodAdsAiDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IRepositoryStore, EfRepositoryStore>();
        services.AddScoped<IAuthRepository, EfAuthRepository>();
        services.AddScoped<IAuthTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher<UserAccount>, PasswordHasher<UserAccount>>();
        services.AddScoped<AuthService>();
        services.AddScoped<GenerationService>();
        services.AddScoped<RestaurantService>();
        services.AddHttpClient<IPythonAiClient, PythonAiClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["AiService:BaseUrl"] ?? "http://localhost:8000");
            client.Timeout = TimeSpan.FromMinutes(10);
        });

        return services;
    }
}
