export type ImageModel = 'base' | 'lora' | 'custom';
export type CustomModelProvider = 'hugging_face' | 'openai';
export type ImageGenerationDevice = 'cpu' | 'cuda';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface CurrentUserResponse {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
}

export interface EnhancePromptResponse {
  enhancedPrompt: string;
  negativePrompt: string;
  source: string;
}

export interface GeneratedImage {
  fileName: string;
  contentType: string;
  base64Data: string;
}

export interface GenerateImageResponse {
  generationId: string;
  model: string;
  enhancedPrompt: string;
  negativePrompt: string;
  images: GeneratedImage[];
}

export interface CampaignResponse {
  headline: string;
  caption: string;
  cta: string;
  hashtags: string[];
  googleAdsCopy: string;
  facebookPost: string;
  instagramPost: string;
  tiktokCaption: string;
  reelScript: string;
  emailSubject: string;
  emailBody: string;
  smsMessage: string;
  pushNotification: string;
  menuDescription: string;
  seoDescription: string;
  promotionalOffer: string;
  contentCalendar: string[];
}

export interface CampaignListItem {
  id: string;
  prompt: string;
  headline: string;
  caption: string;
  callToAction: string;
  imageModel: string;
  imageFileName?: string | null;
  imageContentType?: string | null;
  imageBase64Data?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisineType: string;
  brandTone: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
}

export interface CreateRestaurantRequest {
  name: string;
  cuisineType: string;
  brandTone: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
}

export interface PromptHistoryEntry {
  id: string;
  userId?: string | null;
  restaurantId?: string | null;
  originalPrompt: string;
  enhancedPrompt: string;
  negativePrompt: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteEntry {
  id: string;
  userId: string;
  campaignId?: string | null;
  generatedImageId?: string | null;
  createdAt: string;
}
