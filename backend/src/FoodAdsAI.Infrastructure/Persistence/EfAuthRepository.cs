using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodAdsAI.Infrastructure.Persistence;

public sealed class EfAuthRepository : IAuthRepository
{
    private readonly FoodAdsAiDbContext _db;

    public EfAuthRepository(FoodAdsAiDbContext db) => _db = db;

    public Task<UserAccount?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default)
        => _db.Users.FirstOrDefaultAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task<UserAccount?> FindByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken cancellationToken = default)
        => _db.Users.FirstOrDefaultAsync(user => user.RefreshTokenHash == refreshTokenHash, cancellationToken);

    public Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken cancellationToken = default)
        => _db.Users.FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

    public Task<Role?> FindRoleByNormalizedNameAsync(string normalizedName, CancellationToken cancellationToken = default)
        => _db.Roles.FirstOrDefaultAsync(role => role.NormalizedName == normalizedName, cancellationToken);

    public async Task<IReadOnlyCollection<string>> GetRoleNamesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await (
                from userRole in _db.UserRoles
                join role in _db.Roles on userRole.RoleId equals role.Id
                where userRole.UserId == userId
                orderby role.Name
                select role.Name)
            .ToArrayAsync(cancellationToken);
    }

    public async Task AddUserAsync(UserAccount user, CancellationToken cancellationToken = default)
    {
        await _db.Users.AddAsync(user, cancellationToken);
    }

    public async Task AddUserRoleAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default)
    {
        await _db.UserRoles.AddAsync(new UserRole
        {
            UserId = userId,
            RoleId = roleId
        }, cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _db.SaveChangesAsync(cancellationToken);
}
