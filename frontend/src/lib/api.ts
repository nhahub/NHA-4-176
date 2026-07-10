import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from './session';
import type {
  AuthResponse,
  CampaignResponse,
  CampaignListItem,
  CurrentUserResponse,
  CreateRestaurantRequest,
  EnhancePromptResponse,
  FavoriteEntry,
  GenerateImageResponse,
  ImageModel,
  ImageGenerationDevice,
  LoginRequest,
  LogoutRequest,
  PromptHistoryEntry,
  RefreshTokenRequest,
  RegisterRequest,
  Restaurant,
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
});

let refreshPromise: Promise<AuthResponse> | null = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const shouldRefresh = error.response?.status === 401 && original && !original._retry && !original.url?.includes('/api/auth/');

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= foodAdsApi.refresh({ refreshToken }).finally(() => {
      refreshPromise = null;
    });

    const session = await refreshPromise;
    setSession(session);
    original.headers.Authorization = `Bearer ${session.accessToken}`;
    return api(original);
  },
);

async function unwrap<T>(promise: Promise<{ data: T }>) {
  const response = await promise;
  return response.data;
}

export const foodAdsApi = {
  login(request: LoginRequest) {
    return unwrap(api.post<AuthResponse>('/api/auth/login', request));
  },

  register(request: RegisterRequest) {
    return unwrap(api.post<AuthResponse>('/api/auth/register', request));
  },

  refresh(request: RefreshTokenRequest) {
    return unwrap(api.post<AuthResponse>('/api/auth/refresh', request));
  },

  logout(request: LogoutRequest) {
    return unwrap(api.post<void>('/api/auth/logout', request));
  },

  me() {
    return unwrap(api.get<CurrentUserResponse>('/api/auth/me'));
  },

  enhancePrompt(prompt: string, restaurantName?: string, cuisineType?: string, tone = 'premium') {
    return unwrap(
      api.post<EnhancePromptResponse>('/api/generation/enhance-prompt', {
        prompt,
        restaurantName,
        cuisineType,
        tone,
      }),
    );
  },

  generateImage(
    prompt: string,
    model: ImageModel = 'lora',
    restaurantName?: string,
    cuisineType?: string,
    metadata?: Record<string, string | undefined>,
    device?: ImageGenerationDevice,
  ) {
    return unwrap(
      api.post<GenerateImageResponse>('/api/generation/image', {
        prompt,
        model,
        count: 1,
        width: 512,
        height: 512,
        guidanceScale: 9,
        steps: 20,
        seed: 42,
        metadata: {
          tone: 'premium',
          restaurantName,
          cuisineType,
          ...metadata,
        },
        device,
      }),
    );
  },

  generateCampaign(
    prompt: string,
    restaurantName?: string,
    cuisineType?: string,
    image?: { fileName?: string; contentType?: string; base64Data?: string },
  ) {
    return unwrap(
      api.post<CampaignResponse>('/api/generation/campaign', {
        prompt,
        restaurantName,
        cuisineType,
        tone: 'premium',
        imageFileName: image?.fileName,
        imageContentType: image?.contentType,
        imageBase64Data: image?.base64Data,
      }),
    );
  },

  listCampaigns() {
    return unwrap(api.get<CampaignListItem[]>('/api/generation/campaigns'));
  },

  listRestaurants() {
    return unwrap(api.get<Restaurant[]>('/api/restaurants'));
  },

  createRestaurant(request: CreateRestaurantRequest) {
    return unwrap(api.post<Restaurant>('/api/restaurants', request));
  },

  listHistory() {
    return unwrap(api.get<PromptHistoryEntry[]>('/api/history'));
  },

  listFavorites() {
    return unwrap(api.get<FavoriteEntry[]>('/api/favorites'));
  },

  favoriteCampaign(campaignId: string) {
    return unwrap(api.post('/api/favorites/campaign/' + campaignId, {}));
  },

  removeFavorite(favoriteId: string) {
    return unwrap(api.delete(`/api/favorites/${favoriteId}`));
  },
};
