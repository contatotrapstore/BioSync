export const getToken = () => localStorage.getItem('token');

export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setAuthData = (token, refreshToken, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
};

// Aliases for compatibility
export const setAuthToken = setAuthData;
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Alias for compatibility
export const clearAuth = clearAuthData;

export const isAuthenticated = () => {
  return !!getToken();
};

export const isAdmin = () => {
  const user = getUser();
  return user?.isAdmin === true;
};
