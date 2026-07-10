using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Application.Models;
using FoodAdsAI.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FoodAdsAI.Infrastructure.Services;

public sealed class JwtTokenService : IAuthTokenService
{
    private readonly JwtOptions _options;
    private readonly SigningCredentials _signingCredentials;
    private readonly JwtSecurityTokenHandler _tokenHandler = new();

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;

        if (string.IsNullOrWhiteSpace(_options.Secret) || _options.Secret.Length < 32)
        {
            throw new InvalidOperationException("Jwt:Secret must be configured with at least 32 characters.");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    public IssuedTokens CreateTokens(UserAccount user, IReadOnlyCollection<string> roles)
    {
        var now = DateTimeOffset.UtcNow;
        var accessTokenExpiresAt = now.AddMinutes(Math.Max(5, _options.AccessTokenMinutes));
        var refreshTokenExpiresAt = now.AddDays(Math.Max(1, _options.RefreshTokenDays));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new("display_name", user.DisplayName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        foreach (var role in roles.Where(role => !string.IsNullOrWhiteSpace(role)).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: accessTokenExpiresAt.UtcDateTime,
            signingCredentials: _signingCredentials);

        return new IssuedTokens(
            _tokenHandler.WriteToken(token),
            accessTokenExpiresAt,
            GenerateRefreshToken(),
            refreshTokenExpiresAt);
    }

    public string HashRefreshToken(string refreshToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToBase64String(hash);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
