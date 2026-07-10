# Database

FoodAds AI now uses a PostgreSQL-backed EF Core persistence layer.

## Implemented

- `FoodAdsAiDbContext` in [backend/src/FoodAdsAI.Infrastructure/Persistence/FoodAdsAiDbContext.cs](E:/marc/projects/Food Image Generation/backend/src/FoodAdsAI.Infrastructure/Persistence/FoodAdsAiDbContext.cs)
- EF repository adapter in [backend/src/FoodAdsAI.Infrastructure/Persistence/EfRepositoryStore.cs](E:/marc/projects/Food Image Generation/backend/src/FoodAdsAI.Infrastructure/Persistence/EfRepositoryStore.cs)
- Seed data in [backend/src/FoodAdsAI.Infrastructure/Persistence/FoodAdsAiDbSeeder.cs](E:/marc/projects/Food Image Generation/backend/src/FoodAdsAI.Infrastructure/Persistence/FoodAdsAiDbSeeder.cs)
- Initial code-first migration in [backend/src/FoodAdsAI.Infrastructure/Persistence/Migrations/20260708143902_InitialCreate.cs](E:/marc/projects/Food Image Generation/backend/src/FoodAdsAI.Infrastructure/Persistence/Migrations/20260708143902_InitialCreate.cs)

## Tables

- users
- roles
- user_roles
- restaurants
- campaigns
- generated_images
- prompt_history
- favorites
- subscriptions
- api_usage
- notifications

## Behaviors

- Soft delete on user-facing entities
- Audit fields for created, updated, and deleted timestamps
- Foreign keys for user-owned records
- Seeded demo users, roles, restaurants, and a subscription
- PostgreSQL provider via Npgsql
