# Backend Plan

ASP.NET Core backend foundation for FoodAds AI, currently targeting .NET 8 in this workspace so it builds cleanly with the installed SDK.

## Intended solution layout

```text
backend/
  FoodAdsAI.sln
  src/
    FoodAdsAI.Api/
    FoodAdsAI.Application/
    FoodAdsAI.Domain/
    FoodAdsAI.Infrastructure/
  tests/
    FoodAdsAI.UnitTests/
    FoodAdsAI.IntegrationTests/
```

## Responsibilities

- Authentication and identity
- JWT and refresh token management
- PostgreSQL and EF Core persistence
- Soft delete, audit fields, and seed data
- Restaurant and campaign persistence
- Favorites and authenticated generation history
- API orchestration to the Python AI service

## Development login

Seeded users are refreshed on startup:

- `owner@foodads.ai` / `Owner123!`
- `admin@foodads.ai` / `Admin123!`
