namespace FoodAdsAI.Application.Models;

public sealed record RegisterRequest(string Email, string Password, string DisplayName);

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshTokenRequest(string RefreshToken);

public sealed record LogoutRequest(string RefreshToken);

public sealed record IssuedTokens(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);

public sealed record AuthResponse(
    Guid UserId,
    string Email,
    string DisplayName,
    IReadOnlyCollection<string> Roles,
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);

public sealed record CurrentUserResponse(
    Guid UserId,
    string Email,
    string DisplayName,
    IReadOnlyCollection<string> Roles);
