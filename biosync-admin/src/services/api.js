import axios from 'axios';

const { VITE_API_URL } = import.meta.env;

if (!VITE_API_URL) {
  throw new Error('VITE_API_URL is not defined. Please configure it in your environment.');
}

// Ensure API_BASE_URL includes /api/v1 prefix
const API_BASE_URL = VITE_API_URL.endsWith('/api/v1')
  ? VITE_API_URL
  : `${VITE_API_URL}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Use full URL for refresh token to avoid interceptor loop
          const baseUrl = VITE_API_URL.endsWith('/api/v1') ? VITE_API_URL : `${VITE_API_URL}/api/v1`;
          const response = await axios.post(`${baseUrl}/auth/refresh-token`, {
            refreshToken
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const mapUserSubscription = (subscription) => {
  if (!subscription) return null;
  const plan = subscription.plan || subscription.plan_details;

  return {
    id: subscription.id,
    planId: subscription.plan_id || plan?.id || null,
    planName: plan?.name || 'Unassigned',
    endDate: subscription.end_date,
    isActive: subscription.is_active ?? true
  };
};

const mapUser = (user) => {
  if (!user) return null;

  const activeSubscription = Array.isArray(user.subscriptions)
    ? user.subscriptions.find((subscription) => subscription.is_active)
    : user.subscription || null;

  const isAdmin = user.is_admin ?? user.isAdmin ?? false;

  return {
    id: user.id,
    username: user.username,
    email: user.email || '',
    fullName: user.full_name || user.fullName || '',
    isAdmin,
    is_admin: isAdmin,
    isActive: user.is_active ?? user.isActive ?? true,
    lastLogin: user.last_login,
    createdAt: user.created_at,
    subscription: mapUserSubscription(activeSubscription)
  };
};

const mapGame = (game) => {
  if (!game) return null;

  return {
    id: game.id,
    name: game.name || '',
    slug: game.slug || '',
    description: game.description || '',
    category: game.category || '',
    folderPath: game.folder_path || game.folderPath || '',
    coverImage: game.cover_image || '',
    isActive: game.is_active ?? true,
    order: game.order ?? 0,
    supportedPlatforms: game.supported_platforms || game.supportedPlatforms || ['pc', 'mobile'],
    version: game.version || '1.0.0',
    downloadUrl: game.download_url || game.downloadUrl || null,
    fileSize: game.file_size || game.fileSize || null
  };
};

const mapPlan = (plan) => {
  if (!plan) return null;

  const games = Array.isArray(plan.games)
    ? plan.games
        .map((pg) => (pg.game ? mapGame(pg.game) : mapGame(pg)))
        .filter(Boolean)
    : [];

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description || '',
    price: Number(plan.price) || 0,
    durationDays: plan.duration_days ?? plan.durationDays ?? 30,
    isActive: plan.is_active ?? true,
    features: plan.features || [],
    games
  };
};

const mapSubscription = (subscription) => {
  if (!subscription) return null;

  return {
    id: subscription.id,
    userId: subscription.user_id,
    plan: mapPlan(subscription.plan),
    isActive: subscription.is_active ?? true,
    startDate: subscription.start_date,
    endDate: subscription.end_date
  };
};

export const authAPI = {
  login: async (credentials) => {
    // Suporta login com email ou username
    // Se o campo 'email' não contém @, assume que é um username
    const payload = credentials.email?.includes('@')
      ? { email: credentials.email, password: credentials.password }
      : { username: credentials.email, password: credentials.password };

    const response = await api.post('/auth/login', payload);
    const data = response.data?.data || {};
    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: mapUser(data.user)
    };
  },
  logout: () => api.post('/auth/logout'),
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return mapUser(response.data?.data?.user || response.data?.user);
  }
};

export const usersAPI = {
  getAll: async (params) => {
    const response = await api.get('/users', { params });
    const payload = response.data?.data || {};
    const users = Array.isArray(payload.users)
      ? payload.users.map(mapUser).filter(Boolean)
      : [];

    return {
      users,
      pagination: payload.pagination || {
        total: users.length,
        page: 1,
        limit: users.length,
        totalPages: 1
      }
    };
  },
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return mapUser(response.data?.data?.user);
  },
  create: async (data) => {
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      isAdmin: data.isAdmin
    };

    const response = await api.post('/users', payload);
    return mapUser(response.data?.data?.user);
  },
  update: async (id, data) => {
    const payload = {
      email: data.email,
      fullName: data.fullName,
      isAdmin: data.isAdmin,
      isActive: data.isActive
    };

    if (data.password) {
      payload.password = data.password;
    }

    const response = await api.put(`/users/${id}`, payload);
    return mapUser(response.data?.data?.user);
  },
  delete: (id) => api.delete(`/users/${id}`)
};

export const gamesAPI = {
  getAll: async (params) => {
    const response = await api.get('/games', { params });
    const payload = response.data?.data || {};

    return {
      games: Array.isArray(payload.games)
        ? payload.games.map(mapGame).filter(Boolean)
        : [],
      count: payload.count || 0
    };
  },
  getById: async (id) => {
    const response = await api.get(`/games/${id}`);
    return mapGame(response.data?.data?.game);
  },
  create: async (data) => {
    // Note: For FormData uploads from GameForm, data is already FormData
    // For JSON API calls, construct the payload object
    if (data instanceof FormData) {
      const response = await api.post('/games', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return mapGame(response.data?.data?.game);
    }

    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      folderPath: data.folderPath,
      category: data.category,
      coverImage: data.coverImage,
      order: data.order,
      supportedPlatforms: data.supportedPlatforms || ['pc', 'mobile'],
      version: data.version,
      downloadUrl: data.downloadUrl,
      fileSize: data.fileSize
    };

    const response = await api.post('/games', payload);
    return mapGame(response.data?.data?.game);
  },
  update: async (id, data) => {
    // Note: For FormData uploads from GameForm, data is already FormData
    if (data instanceof FormData) {
      const response = await api.put(`/games/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return mapGame(response.data?.data?.game);
    }

    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      folderPath: data.folderPath,
      category: data.category,
      coverImage: data.coverImage,
      isActive: data.isActive,
      order: data.order,
      supportedPlatforms: data.supportedPlatforms,
      version: data.version,
      downloadUrl: data.downloadUrl,
      fileSize: data.fileSize
    };

    const response = await api.put(`/games/${id}`, payload);
    return mapGame(response.data?.data?.game);
  },
  delete: (id) => api.delete(`/games/${id}`),
  getCategories: async () => {
    const response = await api.get('/games/categories');
    return response.data?.data?.categories || [];
  }
};

export const subscriptionsAPI = {
  getAllPlans: async (params) => {
    const response = await api.get('/subscriptions/plans', { params });
    const payload = response.data?.data || {};
    return {
      plans: Array.isArray(payload.plans)
        ? payload.plans.map(mapPlan).filter(Boolean)
        : [],
      count: payload.count || 0
    };
  },
  getPlanById: async (id) => {
    const response = await api.get(`/subscriptions/plans/${id}`);
    return mapPlan(response.data?.data?.plan);
  },
  createPlan: async (data) => {
    const payload = {
      name: data.name,
      description: data.description,
      price: data.price,
      durationDays: data.durationDays,
      gameIds: data.gameIds,
      features: data.features
    };

    const response = await api.post('/subscriptions/plans', payload);
    return mapPlan(response.data?.data?.plan);
  },
  updatePlan: async (id, data) => {
    const payload = {
      name: data.name,
      description: data.description,
      price: data.price,
      durationDays: data.durationDays,
      gameIds: data.gameIds,
      features: data.features,
      isActive: data.isActive
    };

    const response = await api.put(`/subscriptions/plans/${id}`, payload);
    return mapPlan(response.data?.data?.plan);
  },
  deletePlan: (id) => api.delete(`/subscriptions/plans/${id}`),
  assignSubscription: async ({ userId, planId, durationDays }) => {
    const payload = {
      userId,
      planId,
      durationDays
    };

    const response = await api.post('/subscriptions/assign', payload);
    return mapSubscription(response.data?.data?.subscription);
  },
  getAll: async (params) => {
    const response = await api.get('/subscriptions', { params });
    const payload = response.data?.data || {};

    return {
      subscriptions: Array.isArray(payload.subscriptions)
        ? payload.subscriptions.map(mapSubscription).filter(Boolean)
        : [],
      pagination: payload.pagination || {
        total: 0,
        page: 1,
        limit: 0,
        totalPages: 0
      }
    };
  },
  getUserSubscription: async (userId) => {
    const response = await api.get(`/subscriptions/user/${userId}`);
    return mapSubscription(response.data?.data?.subscription);
  }
};

export default api;


