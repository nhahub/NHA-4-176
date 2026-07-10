# API Contracts

## Authentication

### `POST /api/auth/register`

Creates a new user account.

### `POST /api/auth/login`

Authenticates a user and returns access and refresh tokens.

### `POST /api/auth/refresh`

Rotates the refresh token and issues a new access token.

### `POST /api/auth/logout`

Revokes the active refresh token.

## Generation

### `POST /api/generation/image`

Generates one or more images from a prompt and a selected model.

Request shape:

```json
{
  "prompt": "a gourmet burger on a dark wooden board",
  "model": "lora",
  "count": 1,
  "aspectRatio": "1:1"
}
```

### `POST /api/generation/campaign`

Generates a full restaurant campaign, including copy and image prompt guidance.

### `POST /api/generation/caption`

Generates a caption, CTA, hashtags, and social post variants.

### `POST /api/generation/enhance-prompt`

Enhances a short user prompt for better image generation.

### `POST /api/generation/video-script`

Generates a short-form promotional video script.

## History

### `GET /api/history`

Returns the authenticated user’s generation history.

### `DELETE /api/history/{id}`

Deletes a history record or marks it inactive.

## Favorites

### `GET /api/favorites`

Lists saved favorite outputs.

### `POST /api/favorites`

Saves a generated asset or campaign.

### `DELETE /api/favorites/{id}`

Removes a favorite.

## Restaurants

### `GET /api/restaurants`

Lists restaurants owned by the user.

### `POST /api/restaurants`

Creates a restaurant profile.

### `PUT /api/restaurants/{id}`

Updates a restaurant profile.

## Analytics

### `GET /api/analytics/dashboard`

Returns summary cards and charts for the dashboard.

### `GET /api/analytics/usage`

Returns usage breakdowns for generations, costs, and limits.

## Python AI Service

Recommended internal endpoints:

- `POST /v1/prompt/enhance`
- `POST /v1/images/generate`
- `POST /v1/campaigns/generate`
- `GET /health`

