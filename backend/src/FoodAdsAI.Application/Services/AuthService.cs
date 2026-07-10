using FoodAdsAI.Application.Abstractions;
using FoodAdsAI.Application.Models;
using FoodAdsAI.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace FoodAdsAI.Application.Services;

public sealed class AuthService
{
    private const string DefaultRoleNormalizedName = "RESTAURANTOWNER";

    private readonly IAuthRepository _repository;
    private readonly IAuthTokenService _tokenService;
    private readonly IPasswordHasher<UserAccount> _passwordHasher;

    public AuthService(
        IAuthRepository repository,
        IAuthTokenService tokenService,
        IPasswordHasher<UserAccount> passwordHasher)
    {
        _repository = repository;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        var password = ValidatePassword(request.Password);
        var displayName = ValidateDisplayName(request.DisplayName, request.Email);

        if (await _repository.FindByEmailAsync(email, cancellationToken) is not null)
        {
            throw new InvalidOperationException("A user with that email already exists.");
        }

        var user = new UserAccount
        {
            Email = request.Email.Trim(),
            NormalizedEmail = email,
            DisplayName = displayName,
            IsEmailVerified = true
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, password);

        await _repository.AddUserAsync(user, cancellationToken);

        var defaultRole = await _repository.FindRoleByNormalizedNameAsync(DefaultRoleNormalizedName, cancellationToken);
        if (defaultRole is not null)
        {
            await _repository.AddUserRoleAsync(user.Id, defaultRole.Id, cancellationToken);
        }

        await _repository.SaveChangesAsync(cancellationToken);
        return await IssueSessionAsync(user, cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        var password = ValidatePassword(request.Password);

        var user = await _repository.FindByEmailAsync(email, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (verification is PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (verification is PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, password);
        }

        return await IssueSessionAsync(user, cancellationToken);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var refreshToken = ValidateRefreshToken(request.RefreshToken);
        var refreshTokenHash = _tokenService.HashRefreshToken(refreshToken);

        var user = await _repository.FindByRefreshTokenHashAsync(refreshTokenHash, cancellationToken)
            ?? throw new UnauthorizedAccessException("Refresh token is invalid or expired.");

        if (user.RefreshTokenExpiresAt is null || user.RefreshTokenExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new UnauthorizedAccessException("Refresh token is invalid or expired.");
        }

        return await IssueSessionAsync(user, cancellationToken);
    }

    public async Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default)
    {
        var refreshToken = ValidateRefreshToken(request.RefreshToken);
        var refreshTokenHash = _tokenService.HashRefreshToken(refreshToken);

        var user = await _repository.FindByRefreshTokenHashAsync(refreshTokenHash, cancellationToken);
        if (user is null)
        {
            return;
        }

        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _repository.FindByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var roles = await _repository.GetRoleNamesAsync(userId, cancellationToken);
        return new CurrentUserResponse(user.Id, user.Email, user.DisplayName, roles);
    }

    private async Task<AuthResponse> IssueSessionAsync(UserAccount user, CancellationToken cancellationToken)
    {
        var roles = await _repository.GetRoleNamesAsync(user.Id, cancellationToken);
        var tokens = _tokenService.CreateTokens(user, roles);

        user.RefreshTokenHash = _tokenService.HashRefreshToken(tokens.RefreshToken);
        user.RefreshTokenExpiresAt = tokens.RefreshTokenExpiresAt;

        await _repository.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            roles,
            tokens.AccessToken,
            tokens.AccessTokenExpiresAt,
            tokens.RefreshToken,
            tokens.RefreshTokenExpiresAt);
    }

    private static string NormalizeEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(email));
        }

        return email.Trim().ToUpperInvariant();
    }

    private static string ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required.", nameof(password));
        }

        return password;
    }

    private static string ValidateDisplayName(string displayName, string email)
    {
        var trimmed = displayName?.Trim();
        if (!string.IsNullOrWhiteSpace(trimmed))
        {
            return trimmed;
        }

        var emailPrefix = email.Split('@', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(emailPrefix))
        {
            return emailPrefix;
        }

        throw new ArgumentException("Display name is required.", nameof(displayName));
    }

    private static string ValidateRefreshToken(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new ArgumentException("Refresh token is required.", nameof(refreshToken));
        }

        return refreshToken;
    }
}
