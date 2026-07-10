using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FoodAdsAI.Infrastructure.Persistence;

public sealed class FoodAdsAiDbContextFactory : IDesignTimeDbContextFactory<FoodAdsAiDbContext>
{
    public FoodAdsAiDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__FoodAdsAI")
            ?? "Host=localhost;Port=5432;Database=foodadsai;Username=foodadsai;Password=foodadsai";

        var options = new DbContextOptionsBuilder<FoodAdsAiDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new FoodAdsAiDbContext(options);
    }
}

