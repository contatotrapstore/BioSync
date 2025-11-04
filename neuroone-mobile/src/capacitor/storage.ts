import { Preferences } from '@capacitor/preferences';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import type { UserStorageData } from '@/types';

/**
 * Storage Service - Gerencia armazenamento local seguro
 *
 * - Tokens: Armazenados com criptografia via SecureStorage
 * - Preferences: Dados não sensíveis via Capacitor Preferences
 */

const isMissingSecureItem = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  const message = typeof error === 'string'
    ? error
    : (error as { message?: string })?.message || String(error);

  return message.toLowerCase().includes('item with given key does not exist');
};

// ============================================================================
// TOKEN STORAGE (Secure)
// ============================================================================

export const storage = {
  // --------------------------------------------------------------------------
  // AUTH TOKENS (Encrypted)
  // --------------------------------------------------------------------------

  async setToken(token: string): Promise<void> {
    try {
      await SecureStoragePlugin.set({
        key: 'auth_token',
        value: token
      });
    } catch (error) {
      console.error('[Storage] Error setting token:', error);
      throw error;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key: 'auth_token' });
      return value || null;
    } catch (error) {
      if (!isMissingSecureItem(error)) {
        console.error('[Storage] Error getting token:', error);
      }
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key: 'auth_token' });
    } catch (error) {
      console.error('[Storage] Error removing token:', error);
      throw error;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStoragePlugin.set({
        key: 'refresh_token',
        value: token
      });
    } catch (error) {
      console.error('[Storage] Error setting refresh token:', error);
      throw error;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key: 'refresh_token' });
      return value || null;
    } catch (error) {
      if (!isMissingSecureItem(error)) {
        console.error('[Storage] Error getting refresh token:', error);
      }
      return null;
    }
  },

  async removeRefreshToken(): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key: 'refresh_token' });
    } catch (error) {
      console.error('[Storage] Error removing refresh token:', error);
      throw error;
    }
  },

  async clearAuthTokens(): Promise<void> {
    try {
      await this.removeToken();
      await this.removeRefreshToken();
    } catch (error) {
      console.error('[Storage] Error clearing auth tokens:', error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // USER DATA (Secure)
  // --------------------------------------------------------------------------

  async setUserData(userData: UserStorageData): Promise<void> {
    try {
      await SecureStoragePlugin.set({
        key: 'user_data',
        value: JSON.stringify(userData)
      });
    } catch (error) {
      console.error('[Storage] Error setting user data:', error);
      throw error;
    }
  },

  async getUserData(): Promise<UserStorageData | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key: 'user_data' });
      return value ? JSON.parse(value) as UserStorageData : null;
    } catch (error) {
      if (!isMissingSecureItem(error)) {
        console.error('[Storage] Error getting user data:', error);
      }
      return null;
    }
  },

  async removeUserData(): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key: 'user_data' });
    } catch (error) {
      console.error('[Storage] Error removing user data:', error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // PREFERENCES (Non-sensitive data)
  // --------------------------------------------------------------------------

  async setPreference(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error(`[Storage] Error setting preference ${key}:`, error);
      throw error;
    }
  },

  async getPreference(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error(`[Storage] Error getting preference ${key}:`, error);
      return null;
    }
  },

  async removePreference(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`[Storage] Error removing preference ${key}:`, error);
      throw error;
    }
  },

  // Aliases genéricos para compatibilidade
  setItem: async function (key: string, value: string): Promise<void> {
    return this.setPreference(key, value);
  },

  getItem: async function (key: string): Promise<string | null> {
    return this.getPreference(key);
  },

  removeItem: async function (key: string): Promise<void> {
    return this.removePreference(key);
  },

  async clearAllPreferences(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('[Storage] Error clearing all preferences:', error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // GAME DOWNLOADS METADATA
  // --------------------------------------------------------------------------

  async setDownloadedGames(gameIds: string[]): Promise<void> {
    try {
      await Preferences.set({
        key: 'downloaded_games',
        value: JSON.stringify(gameIds)
      });
    } catch (error) {
      console.error('[Storage] Error setting downloaded games:', error);
      throw error;
    }
  },

  async getDownloadedGames(): Promise<string[]> {
    try {
      const { value } = await Preferences.get({ key: 'downloaded_games' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('[Storage] Error getting downloaded games:', error);
      return [];
    }
  },

  async addDownloadedGame(gameId: string): Promise<void> {
    try {
      const games = await this.getDownloadedGames();
      if (!games.includes(gameId)) {
        games.push(gameId);
        await this.setDownloadedGames(games);
      }
    } catch (error) {
      console.error('[Storage] Error adding downloaded game:', error);
      throw error;
    }
  },

  async removeDownloadedGame(gameId: string): Promise<void> {
    try {
      const games = await this.getDownloadedGames();
      const filtered = games.filter(id => id !== gameId);
      await this.setDownloadedGames(filtered);
    } catch (error) {
      console.error('[Storage] Error removing downloaded game:', error);
      throw error;
    }
  },

  async isGameDownloaded(gameId: string): Promise<boolean> {
    try {
      const games = await this.getDownloadedGames();
      return games.includes(gameId);
    } catch (error) {
      console.error('[Storage] Error checking if game is downloaded:', error);
      return false;
    }
  },

  // --------------------------------------------------------------------------
  // COMPLETE CLEANUP
  // --------------------------------------------------------------------------

  async clearAll(): Promise<void> {
    try {
      await this.clearAuthTokens();
      await this.removeUserData();
      await this.clearAllPreferences();
      console.log('[Storage] All storage cleared successfully');
    } catch (error) {
      console.error('[Storage] Error clearing all storage:', error);
      throw error;
    }
  }
};

export default storage;
