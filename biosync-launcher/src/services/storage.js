// Wrapper for electron-store operations with localStorage fallback

export const setStoredToken = async (token) => {
  if (window.electronAPI) {
    await window.electronAPI.store.set('auth_token', token);
  } else {
    localStorage.setItem('auth_token', token);
  }
};

export const getStoredToken = async () => {
  if (window.electronAPI) {
    return await window.electronAPI.store.get('auth_token');
  }
  return localStorage.getItem('auth_token');
};

export const removeToken = async () => {
  if (window.electronAPI) {
    await window.electronAPI.store.delete('auth_token');
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const setStoredUser = async (user) => {
  if (window.electronAPI) {
    await window.electronAPI.store.set('user', user);
  } else {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getStoredUser = async () => {
  if (window.electronAPI) {
    return await window.electronAPI.store.get('user');
  }
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setStoredSettings = async (settings) => {
  if (window.electronAPI) {
    await window.electronAPI.store.set('settings', settings);
  } else {
    localStorage.setItem('settings', JSON.stringify(settings));
  }
};

export const getStoredSettings = async () => {
  // Use production URL by default
  const defaultSettings = {
    apiUrl: 'https://biosync-jlfh.onrender.com/api/v1'
  };

  if (window.electronAPI) {
    return await window.electronAPI.store.get('settings') || defaultSettings;
  }
  const settings = localStorage.getItem('settings');
  return settings ? JSON.parse(settings) : defaultSettings;
};

export const clearAllStorage = async () => {
  if (window.electronAPI) {
    await window.electronAPI.store.clear();
  } else {
    localStorage.clear();
  }
};

export const getGamesPath = async () => {
  if (window.electronAPI) {
    return await window.electronAPI.paths.getGamesPath();
  }
  return null;
};
