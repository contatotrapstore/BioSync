import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Capacitor } from '@capacitor/core';
import { Http as CapacitorHttp, type HttpOptions, type HttpResponse } from '@capacitor-community/http';
import storage from '@cap/storage';
import errorHandler from '@services/errorHandler';
import type {
  User,
  Payment,
  CreatePaymentData,
  PaymentResponse,
  PaymentStatusResponse,
  UpdateUserData,
  UpdateProfileData,
  Game,
  AuthResponse
} from '@/types';

/**
 * API Service - Cliente HTTP com autenticação
 *
 * - Base URL: Backend Express.js no Render
 * - Interceptors: Adiciona token JWT automaticamente
 * - Refresh: Renova token automaticamente quando expira
 * - Error Handling: Trata erros 401/403
 */

const envBaseUrl = import.meta.env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL;
const API_BASE_URL = (envBaseUrl && typeof envBaseUrl === 'string'
  ? envBaseUrl
  : 'https://biosync-jlfh.onrender.com/api/v1')
  .replace(/\/$/, '');

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const defaultAdapter = api.defaults.adapter;

// ============================================================================
// ADAPTER (Capacitor native HTTP para evitar CORS)
// ============================================================================

const isNative = Capacitor.isNativePlatform?.() ?? false;

const toPlainParams = (rawParams: unknown): Record<string, string | string[]> => {
  if (!rawParams) {
    return {};
  }

  if (rawParams instanceof URLSearchParams) {
    return Object.fromEntries(rawParams.entries());
  }

  if (typeof rawParams === 'string') {
    return Object.fromEntries(new URLSearchParams(rawParams).entries());
  }

  if (typeof rawParams === 'object') {
    const entries = Object.entries(rawParams as Record<string, any>);
    const normalized: Record<string, string | string[]> = {};

    entries.forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        normalized[key] = value.map((item) => (item === undefined || item === null) ? '' : String(item));
        return;
      }

      normalized[key] = String(value);
    });

    return normalized;
  }

  return {};
};

if (isNative) {
  api.defaults.adapter = async (config) => {
    const method = (config.method || 'get').toUpperCase();

    const baseURL = config.baseURL ?? API_BASE_URL;
    const rawUrl = config.url ?? '';
    const normalizedUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `${baseURL.replace(/\/$/, '')}/${rawUrl.replace(/^\//, '')}`;

    const headers: Record<string, string> = {};
    if (config.headers) {
      Object.entries(config.headers as Record<string, any>).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
      });
    }

    let payload = config.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        // keep as string
      }
    }

    const params = toPlainParams(config.params);

    const options: HttpOptions = {
      url: normalizedUrl,
      method: method as HttpOptions['method'],
      headers,
      data: payload,
      params: Object.keys(params).length > 0 ? params : {},
      connectTimeout: typeof config.timeout === 'number' ? config.timeout : undefined
    };

    let response: HttpResponse;

    try {
      response = await CapacitorHttp.request(options);
    } catch (error: any) {
      if (typeof defaultAdapter === 'function') {
        try {
          return await defaultAdapter(config);
        } catch (fallbackError: any) {
          const axiosError = new AxiosError(
            fallbackError?.message || error?.message || 'Erro ao executar requisição nativa',
            fallbackError?.code,
            config,
            null,
            fallbackError?.response ?? error?.response ?? {
              data: fallbackError?.response?.data ?? error?.data,
              status: fallbackError?.response?.status ?? error?.status,
              statusText: fallbackError?.response?.statusText ?? error?.statusText ?? '',
              headers: fallbackError?.response?.headers ?? error?.headers ?? {},
              config,
              request: options
            }
          );
          throw axiosError;
        }
      }

      // Normalizar erro para axios
      const axiosError = new AxiosError(
        error?.message || 'Erro ao executar requisição nativa',
        error?.status,
        config,
        null,
        {
          data: error?.data,
          status: error?.status,
          statusText: error?.statusText || '',
          headers: error?.headers || {},
          config,
          request: options
        } as AxiosResponse
      );
      throw axiosError;
    }

    const axiosResponse: AxiosResponse = {
      data: response.data,
      status: response.status ?? 200,
      statusText: typeof (response as any).statusText === 'string' ? (response as any).statusText : '',
      headers: response.headers || {},
      config,
      request: options
    };

    return axiosResponse;
  };
}

// ============================================================================
// REQUEST INTERCEPTOR - Adiciona token JWT
// ============================================================================

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.getToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error('[API] Error adding auth token to request:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR - Trata erros e refresh token
// ============================================================================

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (response?.data && typeof response.data === 'object') {
      const { data, success, message } = response.data as Record<string, any>;

      if (success === false) {
        const error = new Error(message || 'Operação não concluída');
        return Promise.reject(error);
      }

      if (data !== undefined) {
        response.data = data;
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Log error com errorHandler
    errorHandler.handleError(error, {
      component: 'API',
      action: originalRequest?.url || 'unknown',
      extra: {
        method: originalRequest?.method,
        status: error.response?.status
      }
    });

    // Se erro 401 e não é retry, tentar refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Já está refreshing, adicionar à fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Tentar refresh
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data;

        // Salvar novos tokens
        await storage.setToken(newToken);
        await storage.setRefreshToken(newRefreshToken);

        // Atualizar header do request original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        processQueue(null, newToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Limpar tokens e redirecionar para login
        await storage.clearAuthTokens();
        await storage.removeUserData();

        // Emitir evento para logout
        window.dispatchEvent(new CustomEvent('auth:logout'));

        return Promise.reject(refreshError);
      }
    }

    // Se erro 403, logout imediato
    if (error.response?.status === 403) {
      await storage.clearAuthTokens();
      await storage.removeUserData();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// RETRY WRAPPER
// ============================================================================

/**
 * Wrapper para requisições críticas com retry automático
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3
): Promise<T> => {
  return errorHandler.retryWithBackoff(fn, retries);
};

// ============================================================================
// HELPERS
// ============================================================================

const toNumber = (value: unknown, fallback: number = 0): number => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
};

const normalizeGame = (rawGame: any): Game => {
  if (!rawGame || typeof rawGame !== 'object') {
    throw new Error('Resposta de jogo inválida.');
  }

  const title = rawGame.title || rawGame.name || rawGame.slug || 'Jogo sem título';
  const thumbnail = rawGame.thumbnail || rawGame.cover_image_local || rawGame.cover_image || '';
  const downloadUrl = rawGame.download_url || rawGame.zipUrl || rawGame.downloadUrl || '';
  const duration = rawGame.duration ?? rawGame.duration_minutes ?? null;
  const fileSize = rawGame.file_size ?? rawGame.zipSize ?? rawGame.file_size_bytes ?? null;
  const tags = toArray<string>(rawGame.tags);
  const supportedPlatforms = toArray<string>(rawGame.supported_platforms || rawGame.supportedPlatforms || ['pc', 'mobile']);

  return {
    id: rawGame.id,
    title,
    name: rawGame.name,
    description: rawGame.description ?? '',
    category: rawGame.category ?? rawGame.genre ?? undefined,
    difficulty: rawGame.difficulty ?? rawGame.level ?? undefined,
    duration: duration !== null ? toNumber(duration) : undefined,
    thumbnail,
    cover_image: rawGame.cover_image ?? undefined,
    cover_image_local: rawGame.cover_image_local ?? undefined,
    folder_path: rawGame.folder_path ?? undefined,
    tags,
    zipUrl: downloadUrl ?? '',
    download_url: downloadUrl || undefined,
    zipSize: fileSize !== null ? toNumber(fileSize) : undefined,
    file_size: fileSize !== null ? toNumber(fileSize) : undefined,
    checksum: rawGame.checksum || rawGame.file_checksum || undefined,
    hasAccess: rawGame.hasAccess ?? rawGame.has_access ?? undefined,
    accessType: rawGame.accessType ?? rawGame.access_type ?? undefined,
    accessExpiresAt: rawGame.accessExpiresAt ?? rawGame.access_expires_at ?? undefined,
    isActive: rawGame.isActive ?? rawGame.is_active ?? undefined,
    createdAt: rawGame.createdAt ?? rawGame.created_at ?? undefined,
    updatedAt: rawGame.updatedAt ?? rawGame.updated_at ?? undefined,
    supportedPlatforms
  };
};

const normalizeGamesResponse = (payload: any) => {
  if (Array.isArray(payload)) {
    return {
      games: payload.map(normalizeGame)
    };
  }

  const games = toArray(payload?.games).map(normalizeGame);

  return {
    ...payload,
    games
  };
};

const normalizeUser = (
  rawUser: any,
  options: { subscription?: any; hasActiveSubscription?: boolean } = {}
): User => {
  if (!rawUser || typeof rawUser !== 'object') {
    throw new Error('Resposta de usuário inválida.');
  }

  const createdAt = rawUser.createdAt ?? rawUser.created_at ?? new Date().toISOString();
  const updatedAt = rawUser.updatedAt ?? rawUser.updated_at ?? createdAt;
  const isPsychologist = Boolean(rawUser.isPsychologist ?? rawUser.is_psychologist);
  const role: User['role'] = isPsychologist ? 'psychologist' : 'patient';

  const subscription = options.subscription ?? rawUser.subscription ?? null;
  const subscriptionExpiresAt = rawUser.subscriptionExpiresAt
    ?? rawUser.subscription_expires_at
    ?? subscription?.nextDueDate
    ?? subscription?.next_due_date
    ?? undefined;

  const hasActiveSubscription = options.hasActiveSubscription
    ?? rawUser.hasActiveSubscription
    ?? rawUser.has_active_subscription
    ?? Boolean(subscription);

  const name = rawUser.name
    ?? rawUser.full_name
    ?? rawUser.fullName
    ?? rawUser.username
    ?? rawUser.email
    ?? 'Usuário';

  return {
    id: rawUser.id,
    name,
    email: rawUser.email ?? '',
    role,
    phone: rawUser.phone ?? rawUser.phone_number ?? undefined,
    hasActiveSubscription: Boolean(hasActiveSubscription),
    subscriptionExpiresAt,
    createdAt,
    updatedAt,
    username: rawUser.username ?? undefined,
    isAdmin: rawUser.isAdmin ?? rawUser.is_admin ?? undefined
  };
};

// ============================================================================
// API METHODS
// ============================================================================

export const apiService = {
  // --------------------------------------------------------------------------
  // AUTH
  // --------------------------------------------------------------------------

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    const payload = response.data as AuthResponse & { subscription?: any } & { user: any };

    const subscription = payload?.subscription ?? null;
    const normalizedUser = normalizeUser(payload.user, {
      subscription,
      hasActiveSubscription: payload.hasActiveSubscription
    });

    return {
      token: payload.token,
      refreshToken: payload.refreshToken,
      hasActiveSubscription: Boolean(payload.hasActiveSubscription ?? subscription),
      subscription,
      user: normalizedUser
    };
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    const payload = response.data as AuthResponse & { subscription?: any } & { user: any };

    const subscription = payload?.subscription ?? null;
    const normalizedUser = normalizeUser(payload.user, {
      subscription,
      hasActiveSubscription: payload.hasActiveSubscription
    });

    return {
      token: payload.token,
      refreshToken: payload.refreshToken,
      hasActiveSubscription: Boolean(payload.hasActiveSubscription ?? subscription),
      subscription,
      user: normalizedUser
    };
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[API] Logout error:', error);
    } finally {
      await storage.clearAuthTokens();
      await storage.removeUserData();
    }
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  async validateToken() {
    const response = await api.get('/auth/validate');
    const payload = response.data as { user: any };

    if (payload?.user) {
      return {
        ...payload,
        user: normalizeUser(payload.user)
      };
    }

    return response.data;
  },

  // --------------------------------------------------------------------------
  // USER
  // --------------------------------------------------------------------------

  async getProfile() {
    return withRetry(async () => {
      const response = await api.get('/users/profile');
      const payload = response.data as { user?: any; subscription?: any; hasActiveSubscription?: boolean };

      const rawUser = payload?.user ?? payload;
      const normalizedUser = normalizeUser(rawUser, {
        subscription: payload?.subscription,
        hasActiveSubscription: payload?.hasActiveSubscription
      });

      return {
        ...payload,
        user: normalizedUser
      };
    });
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put<User>('/users/profile', data);
    return normalizeUser(response.data);
  },

  async checkSubscription() {
    return withRetry(async () => {
      const response = await api.get('/users/subscription');
      return response.data;
    });
  },

  // --------------------------------------------------------------------------
  // GAMES
  // --------------------------------------------------------------------------

  async getGames() {
    return withRetry(async () => {
      // Filter games by mobile platform
      const response = await api.get('/games/user/games', {
        params: { platform: 'mobile' }
      });
      return normalizeGamesResponse(response.data);
    });
  },

  async getGame(gameId: string): Promise<Game> {
    return withRetry(async () => {
      const response = await api.get(`/games/${gameId}`);
      const payload = response.data;
      const rawGame = payload?.game ?? payload;
      const game = normalizeGame(rawGame);
      return game;
    });
  },

  async getGameDownloadUrl(gameId: string) {
    return withRetry(async () => {
      const response = await api.get(`/games/${gameId}/download`);
      return response.data;
    });
  },

  // --------------------------------------------------------------------------
  // PAYMENTS (Asaas)
  // --------------------------------------------------------------------------

  async createPayment(data: CreatePaymentData): Promise<PaymentResponse> {
    const response = await api.post<PaymentResponse>('/payments/create', data);
    return response.data;
  },

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const response = await api.get<PaymentStatusResponse>(`/payments/${paymentId}/status`);
    return response.data;
  },

  async getPayments(): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/payments');
    return response.data;
  },

  // --------------------------------------------------------------------------
  // ADMIN (only for psychologist role)
  // --------------------------------------------------------------------------

  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
  },

  async getUserById(userId: string): Promise<User> {
    const response = await api.get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    const response = await api.put<User>(`/admin/users/${userId}`, data);
    return response.data;
  },

  async deleteUser(userId: string) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  async getStatistics() {
    const response = await api.get('/admin/statistics');
    return response.data;
  }
};

export default apiService;
