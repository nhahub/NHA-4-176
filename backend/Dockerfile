FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Copy solution and project files first for layer-cached restore
COPY FoodAdsAI.sln .
COPY src/FoodAdsAI.Api/FoodAdsAI.Api.csproj src/FoodAdsAI.Api/
COPY src/FoodAdsAI.Application/FoodAdsAI.Application.csproj src/FoodAdsAI.Application/
COPY src/FoodAdsAI.Domain/FoodAdsAI.Domain.csproj src/FoodAdsAI.Domain/
COPY src/FoodAdsAI.Infrastructure/FoodAdsAI.Infrastructure.csproj src/FoodAdsAI.Infrastructure/

# Restore as a distinct layer so it is only re-run when .csproj files change
RUN dotnet restore --locked-mode 2>/dev/null || dotnet restore

# Copy all source files
COPY src/ src/

# Publish (restore already done above, but publish will verify packages are present)
WORKDIR /source/src/FoodAdsAI.Api
RUN dotnet publish -c Release -o /app

# Final lightweight runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "FoodAdsAI.Api.dll"]
