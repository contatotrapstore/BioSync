import storage from '@cap/storage';
import { apiService } from './api';
import type { User, AuthResponse, RegisterData } from '@/types';

/**
 * Auth Service - Gerencia autenticação e sessão do usuário
 *
 * - Login/Register: Autenticação com backend
 * - Session: Mantém sessão ativa com tokens
 * - Validation: Valida token ao iniciar app
 * - Logout: Limpa sessão e dados
 */

// Alias para compatibilidade
export type { User, RegisterData };
export type LoginResponse = AuthResponse;

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const authService = {
  // --------------------------------------------------------------------------
  // LOGIN
  // --------------------------------------------------------------------------

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('[Auth] Attempting login for:', email);

      const response = await apiService.login(email, password);

      // Salvar tokens
      await storage.setToken(response.token);
      await storage.setRefreshToken(response.refreshToken);

      // Salvar dados do usuário
      await storage.setUserData(response.user);

      console.log('[Auth] Login successful for:', response.user.name);

      return response;
    } catch (error: any) {
      console.error('[Auth] Login error:', error);

      if (error.response?.status === 401) {
        throw new Error('Email ou senha incorretos');
      } else if (error.response?.status === 403) {
        throw new Error('Conta bloqueada. Entre em contato com o suporte.');
      } else if (!error.response) {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }

      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  },

  // --------------------------------------------------------------------------
  // REGISTER
  // --------------------------------------------------------------------------

  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      console.log('[Auth] Attempting registration for:', data.email);

      const response = await apiService.register(data);

      // Salvar tokens
      await storage.setToken(response.token);
      await storage.setRefreshToken(response.refreshToken);

      // Salvar dados do usuário
      await storage.setUserData(response.user);

      console.log('[Auth] Registration successful for:', response.user.name);

      return response;
    } catch (error: any) {
      console.error('[Auth] Registration error:', error);

      if (error.response?.status === 409) {
        throw new Error('Email já cadastrado');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Dados inválidos');
      } else if (!error.response) {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }

      throw new Error('Erro ao criar conta. Tente novamente.');
    }
  },

  // --------------------------------------------------------------------------
  // LOGOUT
  // --------------------------------------------------------------------------

  async logout(): Promise<void> {
    try {
      console.log('[Auth] Logging out...');

      // Chamar API de logout (opcional, mesmo se falhar vamos limpar local)
      await apiService.logout().catch(() => {
        // Ignorar erro de logout no backend
      });

      // Limpar storage local
      await storage.clearAll();

      console.log('[Auth] Logout successful');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Mesmo com erro, limpar storage
      await storage.clearAll().catch(() => {});
    }
  },

  // --------------------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------------------

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await storage.getToken();

      if (!token) {
        console.log('[Auth] No token found');
        return false;
      }

      // Tentar validar token com backend
      try {
        await apiService.validateToken();
        console.log('[Auth] Token is valid');
        return true;
      } catch (error: any) {
        console.error('[Auth] Token validation failed:', error);

        // Se token inválido, limpar storage
        if (error.response?.status === 401 || error.response?.status === 403) {
          await storage.clearAuthTokens();
          await storage.removeUserData();
        }

        return false;
      }
    } catch (error) {
      console.error('[Auth] Authentication check error:', error);
      return false;
    }
  },

  // --------------------------------------------------------------------------
  // USER DATA
  // --------------------------------------------------------------------------

  async getCurrentUser(): Promise<User | null> {
    try {
      // Tentar pegar do storage primeiro
      let user = await storage.getUserData();

      if (!user) {
        // Se não tem no storage, buscar do backend
        const response = await apiService.getProfile();
        user = response.user;

        // Salvar no storage se user não for null
        if (user) {
          await storage.setUserData(user);
        }
      }

      return user;
    } catch (error) {
      console.error('[Auth] Error getting current user:', error);
      return null;
    }
  },

  async updateUserData(user: User): Promise<void> {
    try {
      await storage.setUserData(user);
    } catch (error) {
      console.error('[Auth] Error updating user data:', error);
      throw error;
    }
  },

  async refreshUserData(): Promise<User | null> {
    try {
      const response = await apiService.getProfile();
      const user = response.user;

      // Atualizar storage
      await storage.setUserData(user);

      return user;
    } catch (error) {
      console.error('[Auth] Error refreshing user data:', error);
      return null;
    }
  },

  // --------------------------------------------------------------------------
  // SUBSCRIPTION CHECK
  // --------------------------------------------------------------------------

  async hasActiveSubscription(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();

      if (!user) {
        return false;
      }

      // Verificar assinatura no backend
      const response = await apiService.checkSubscription();

      return response.hasActiveSubscription;
    } catch (error) {
      console.error('[Auth] Error checking subscription:', error);
      return false;
    }
  },

  async getSubscriptionExpiryDate(): Promise<Date | null> {
    try {
      const user = await this.getCurrentUser();

      if (!user || !user.subscriptionExpiresAt) {
        return null;
      }

      return new Date(user.subscriptionExpiresAt);
    } catch (error) {
      console.error('[Auth] Error getting subscription expiry:', error);
      return null;
    }
  },

  async getDaysUntilExpiry(): Promise<number | null> {
    try {
      const expiryDate = await this.getSubscriptionExpiryDate();

      if (!expiryDate) {
        return null;
      }

      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error('[Auth] Error calculating days until expiry:', error);
      return null;
    }
  },

  // --------------------------------------------------------------------------
  // TOKEN MANAGEMENT
  // --------------------------------------------------------------------------

  async getAuthToken(): Promise<string | null> {
    try {
      return await storage.getToken();
    } catch (error) {
      console.error('[Auth] Error getting auth token:', error);
      return null;
    }
  },

  async refreshAuthToken(): Promise<boolean> {
    try {
      const refreshToken = await storage.getRefreshToken();

      if (!refreshToken) {
        return false;
      }

      const response = await apiService.refreshToken(refreshToken);

      // Salvar novos tokens
      await storage.setToken(response.token);
      await storage.setRefreshToken(response.refreshToken);

      return true;
    } catch (error) {
      console.error('[Auth] Error refreshing token:', error);
      return false;
    }
  }
};

export default authService;
