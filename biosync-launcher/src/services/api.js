import axios from 'axios';
import { getStoredToken, getStoredSettings } from './storage';

const createApiClient = async () => {
  const settings = await getStoredSettings();
  const baseURL = settings.apiUrl;

  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config) => {
      const token = await getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;

        if (status === 401) {
          // Unauthorized - redirect to login
          window.location.href = '/login';
        }

        return Promise.reject({
          status,
          message: data.message || 'An error occurred',
          data
        });
      } else if (error.request) {
        // Request made but no response
        return Promise.reject({
          message: 'Network error - please check your connection',
          offline: true
        });
      } else {
        // Something else happened
        return Promise.reject({
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );

  return client;
};

// Create a singleton instance
let apiInstance = null;

const getApi = async () => {
  if (!apiInstance) {
    apiInstance = await createApiClient();
  }
  return apiInstance;
};

// Export wrapper functions
const api = {
  get: async (url, config) => {
    const client = await getApi();
    return client.get(url, config);
  },
  post: async (url, data, config) => {
    const client = await getApi();
    return client.post(url, data, config);
  },
  put: async (url, data, config) => {
    const client = await getApi();
    return client.put(url, data, config);
  },
  delete: async (url, config) => {
    const client = await getApi();
    return client.delete(url, config);
  },
  patch: async (url, data, config) => {
    const client = await getApi();
    return client.patch(url, data, config);
  }
};

export default api;
