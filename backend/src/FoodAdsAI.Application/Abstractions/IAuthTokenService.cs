using FoodAdsAI.Domain.Entities;
using FoodAdsAI.Application.Models;

namespace FoodAdsAI.Application.Abstractions;

public interface IAuthTokenService
{
    IssuedTokens CreateTokens(UserAccount user, IReadOnlyCollection<string> roles);
    string HashRefreshToken(string refreshToken);
}
