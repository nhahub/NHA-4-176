using FoodAdsAI.Domain.Entities;

namespace FoodAdsAI.Application.Abstractions;

public interface IAuthRepository
{
    Task<UserAccount?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<UserAccount?> FindByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken cancellationToken = default);
    Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Role?> FindRoleByNormalizedNameAsync(string normalizedName, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<string>> GetRoleNamesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddUserAsync(UserAccount user, CancellationToken cancellationToken = default);
    Task AddUserRoleAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
