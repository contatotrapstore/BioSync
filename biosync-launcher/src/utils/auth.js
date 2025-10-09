import { getStoredToken, removeToken } from '../services/storage';
import api from '../services/api';

export const isAuthenticated = async () => {
  const token = await getStoredToken();

  if (!token) {
    return false;
  }

  // Validate token with backend
  try {
    const response = await api.get('/auth/validate');
    return response.data.success === true;
  } catch (error) {
    // Token is invalid, remove it
    await removeToken();
    return false;
  }
};

export const logout = async () => {
  await removeToken();
  // Clear any other stored data
  if (window.electronAPI) {
    await window.electronAPI.store.delete('user');
  }
};
