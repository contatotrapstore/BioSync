import { Http } from '@capacitor-community/http';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { PluginListenerHandle } from '@capacitor/core';
import SHA256 from 'crypto-js/sha256';

/**
 * Download Manager - Gerencia downloads de jogos com progress tracking
 *
 * - Download HTTP com progress
 * - Pause/Resume (via chunks)
 * - Validação de checksum SHA256
 * - Storage em Directory.Data
 */

export interface DownloadProgress {
  gameId: string;
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  status: 'downloading' | 'paused' | 'completed' | 'error';
  error?: string;
}

export interface DownloadOptions {
  gameId: string;
  url: string;
  expectedSize?: number;
  expectedChecksum?: string;
  onProgress?: (progress: DownloadProgress) => void;
}

class DownloadManager {
  private activeDownloads: Map<string, boolean> = new Map();
  private progressListeners: Map<string, PluginListenerHandle> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1s

  /**
   * Retry com exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Não fazer retry em certos erros (pause, cancel, etc)
        if (error.message?.includes('pausado') || error.message?.includes('cancelado')) {
          throw error;
        }

        if (attempt < retries) {
          const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.warn(`[DownloadManager] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Download failed after retries');
  }

  /**
   * Download de arquivo com progress tracking
   */
  async downloadGame(options: DownloadOptions): Promise<string> {
    const { gameId, url, expectedSize, onProgress } = options;

    if (this.activeDownloads.get(gameId)) {
      throw new Error(`Download já em andamento para ${gameId}`);
    }

    this.activeDownloads.set(gameId, true);

    console.log(`[DownloadManager] Starting download: ${gameId} from ${url}`);

    const ensureDirectory = async () => {
      await Filesystem.mkdir({
        path: 'games',
        directory: Directory.Data,
        recursive: true
      }).catch(() => {});
    };

    const filePath = `games/${gameId}.zip`;

    const performDownload = async (): Promise<string> => {
      await ensureDirectory();

      const listener = await Http.addListener('progress', (status) => {
        if (status.type !== 'DOWNLOAD') return;
        if (!status.url || status.url !== url) return;

        const totalBytes = status.contentLength || expectedSize || 0;
        const downloadedBytes = status.bytes;
        const percentage = totalBytes > 0
          ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
          : 0;

        onProgress?.({
          gameId,
          totalBytes,
          downloadedBytes,
          percentage,
          status: 'downloading'
        });
      });

      this.progressListeners.set(gameId, listener);

      try {
        await Http.downloadFile({
          url,
          method: 'GET',
          filePath,
          fileDirectory: Directory.Data as any,
          progress: true
        });

        const totalBytes = expectedSize || 0;

        onProgress?.({
          gameId,
          totalBytes,
          downloadedBytes: totalBytes,
          percentage: 100,
          status: 'completed'
        });

        return filePath;
      } finally {
        const progressListener = this.progressListeners.get(gameId);
        if (progressListener) {
          progressListener.remove().catch(() => {});
          this.progressListeners.delete(gameId);
        }
      }
    };

    try {
      const downloadedPath = await this.retryWithBackoff(() => performDownload());

      if (options.expectedChecksum) {
        console.log(`[DownloadManager] Validating checksum...`);
        const isValid = await this.validateChecksum(downloadedPath, options.expectedChecksum);

        if (!isValid) {
          await Filesystem.deleteFile({
            path: downloadedPath,
            directory: Directory.Data
          }).catch(() => {});

          throw new Error('Checksum inválido - arquivo corrompido. Download será refeito.');
        }
      }

      console.log(`[DownloadManager] Download completed: ${gameId}`);
      return downloadedPath;
    } catch (error: any) {
      console.error(`[DownloadManager] Download error for ${gameId}:`, error);

      onProgress?.({
        gameId,
        totalBytes: expectedSize || 0,
        downloadedBytes: 0,
        percentage: 0,
        status: 'error',
        error: error?.message || 'Erro desconhecido ao baixar'
      });

      throw error;
    } finally {
      this.activeDownloads.delete(gameId);
    }
  }

  /**
   * Pausar download em andamento
   */
  async pauseDownload(gameId: string): Promise<void> {
    throw new Error('Pausar download não é suportado na versão atual.');
  }

  /**
   * Retomar download pausado (por enquanto, reinicia do zero)
   * TODO: Implementar pause/resume real com Range headers
   */
  async resumeDownload(gameId: string, options: DownloadOptions): Promise<string> {
    throw new Error('Retomar download não é suportado na versão atual.');
  }

  /**
   * Cancelar download
   */
  async cancelDownload(gameId: string): Promise<void> {
    throw new Error('Cancelar download não é suportado na versão atual.');
  }

  /**
   * Verificar se download está ativo
   */
  isDownloading(gameId: string): boolean {
    return this.activeDownloads.get(gameId) || false;
  }

  /**
   * Verificar se download está pausado
   */
  isPaused(gameId: string): boolean {
    void gameId;
    return false;
  }

  /**
   * Validar checksum SHA256
   */
  async validateChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
    try {
      console.log(`[DownloadManager] Validating checksum for: ${filePath}`);

      // Ler arquivo do filesystem
      const file = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Data
      });

      // Converter base64 para binary
      const binaryString = atob(file.data as string);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Calcular SHA256
      const wordArray = this.uint8ArrayToWordArray(bytes);
      const hash = SHA256(wordArray).toString();

      const isValid = hash === expectedChecksum;

      if (isValid) {
        console.log(`[DownloadManager] ✓ Checksum válido: ${hash}`);
      } else {
        console.error(`[DownloadManager] ✗ Checksum inválido!`);
        console.error(`  Esperado: ${expectedChecksum}`);
        console.error(`  Calculado: ${hash}`);
      }

      return isValid;
    } catch (error) {
      console.error('[DownloadManager] Error validating checksum:', error);
      return false;
    }
  }

  /**
   * Helper: Converter Uint8Array para WordArray (CryptoJS)
   */
  private uint8ArrayToWordArray(u8arr: Uint8Array): any {
    const len = u8arr.length;
    const words: number[] = [];

    for (let i = 0; i < len; i++) {
      words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
    }

    return {
      sigBytes: len,
      words: words
    };
  }
}

// Singleton
export const downloadManager = new DownloadManager();
export default downloadManager;
