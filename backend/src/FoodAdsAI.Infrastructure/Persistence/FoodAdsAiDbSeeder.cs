using FoodAdsAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace FoodAdsAI.Infrastructure.Persistence;

public static class FoodAdsAiDbSeeder
{
    private const string AdminEmail = "admin@foodads.ai";
    private const string OwnerEmail = "owner@foodads.ai";
    private const string AdminPassword = "Admin123!";
    private const string OwnerPassword = "Owner123!";

    public static async Task SeedAsync(FoodAdsAiDbContext db, CancellationToken cancellationToken = default)
    {
        var passwordHasher = new PasswordHasher<UserAccount>();
        var rolesChanged = false;

        if (!await db.Roles.AnyAsync(cancellationToken))
        {
            db.Roles.AddRange(
                new Role
                {
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    Description = "Full platform access"
                },
                new Role
                {
                    Name = "RestaurantOwner",
                    NormalizedName = "RESTAURANTOWNER",
                    Description = "Manages restaurant campaigns"
                });
            rolesChanged = true;
        }

        if (rolesChanged)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        var admin = await db.Users.FirstOrDefaultAsync(x => x.NormalizedEmail == AdminEmail.ToUpperInvariant(), cancellationToken);
        if (admin is null)
        {
            admin = new UserAccount
            {
                Email = AdminEmail,
                NormalizedEmail = AdminEmail.ToUpperInvariant(),
                DisplayName = "Admin",
                IsEmailVerified = true
            };
            admin.PasswordHash = passwordHasher.HashPassword(admin, AdminPassword);
            db.Users.Add(admin);
        }
        else
        {
            admin.Email = AdminEmail;
            admin.DisplayName = "Admin";
            admin.IsEmailVerified = true;
            admin.PasswordHash = passwordHasher.HashPassword(admin, AdminPassword);
        }

        var owner = await db.Users.FirstOrDefaultAsync(x => x.NormalizedEmail == OwnerEmail.ToUpperInvariant(), cancellationToken);
        if (owner is null)
        {
            owner = new UserAccount
            {
                Email = OwnerEmail,
                NormalizedEmail = OwnerEmail.ToUpperInvariant(),
                DisplayName = "Restaurant Owner",
                IsEmailVerified = true
            };
            owner.PasswordHash = passwordHasher.HashPassword(owner, OwnerPassword);
            db.Users.Add(owner);
        }
        else
        {
            owner.Email = OwnerEmail;
            owner.DisplayName = "Restaurant Owner";
            owner.IsEmailVerified = true;
            owner.PasswordHash = passwordHasher.HashPassword(owner, OwnerPassword);
        }

        if (!await db.Restaurants.AnyAsync(cancellationToken))
        {
            db.Restaurants.AddRange(
                new Restaurant
                {
                    Name = "Saffron Flame",
                    CuisineType = "Mediterranean",
                    BrandTone = "premium",
                    WebsiteUrl = "https://saffronflame.example"
                },
                new Restaurant
                {
                    Name = "The Burger Loft",
                    CuisineType = "American",
                    BrandTone = "bold",
                    WebsiteUrl = "https://burgerloft.example"
                });
        }

        var adminRole = await db.Roles.FirstAsync(x => x.NormalizedName == "ADMIN", cancellationToken);
        var ownerRole = await db.Roles.FirstAsync(x => x.NormalizedName == "RESTAURANTOWNER", cancellationToken);

        if (!await db.UserRoles.AnyAsync(x => x.UserId == admin.Id && x.RoleId == adminRole.Id, cancellationToken))
        {
            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id });
        }

        if (!await db.UserRoles.AnyAsync(x => x.UserId == owner.Id && x.RoleId == ownerRole.Id, cancellationToken))
        {
            db.UserRoles.Add(new UserRole { UserId = owner.Id, RoleId = ownerRole.Id });
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
