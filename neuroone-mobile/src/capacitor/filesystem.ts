import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import JSZip from 'jszip';

/**
 * Filesystem Service - Gerencia arquivos de jogos no dispositivo
 *
 * - Downloads: Baixa e descompacta ZIPs de jogos
 * - Storage: Armazena jogos em Directory.Data
 * - Access: Fornece URIs para carregar jogos no WebView
 */

interface JSZipFileEntry {
  dir: boolean;
  async(type: 'base64' | 'string' | 'arraybuffer'): Promise<any>;
}

export const filesystem = {
  // --------------------------------------------------------------------------
  // DIRECTORY HELPERS
  // --------------------------------------------------------------------------

  async ensureGamesDirectory(): Promise<void> {
    try {
      // Criar diretório principal de jogos
      await Filesystem.mkdir({
        path: 'games',
        directory: Directory.Data,
        recursive: true
      });
    } catch (error: any) {
      // Ignorar erro se diretório já existe
      if (!error.message?.includes('exists')) {
        console.error('[Filesystem] Error creating games directory:', error);
        throw error;
      }
    }
  },

  async ensureGameDirectory(gameId: string): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: `games/${gameId}`,
        directory: Directory.Data,
        recursive: true
      });
    } catch (error: any) {
      if (!error.message?.includes('exists')) {
        console.error(`[Filesystem] Error creating directory for game ${gameId}:`, error);
        throw error;
      }
    }
  },

  // --------------------------------------------------------------------------
  // DOWNLOAD & EXTRACT
  // --------------------------------------------------------------------------

  async downloadAndExtractGame(
    gameId: string,
    zipUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      console.log(`[Filesystem] Starting download for game ${gameId}`);

      // 1. Garantir que diretório existe
      await this.ensureGamesDirectory();
      await this.ensureGameDirectory(gameId);

      // 2. Baixar ZIP
      onProgress?.(0);
      const response = await fetch(zipUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const totalSize = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('ReadableStream not supported');
      }

      // Ler chunks e atualizar progresso
      const chunks: Uint8Array[] = [];
      let receivedSize = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedSize += value.length;

        // Progresso de download (0-70%)
        const downloadProgress = totalSize > 0 ? (receivedSize / totalSize) * 70 : 0;
        onProgress?.(Math.round(downloadProgress));
      }

      // 3. Combinar chunks em um único Uint8Array
      const zipBlob = new Uint8Array(receivedSize);
      let position = 0;
      for (const chunk of chunks) {
        zipBlob.set(chunk, position);
        position += chunk.length;
      }

      onProgress?.(70);

      // 4. Descompactar ZIP usando JSZip
      console.log(`[Filesystem] Extracting game ${gameId}`);
      const zip = await JSZip.loadAsync(zipBlob);

      const files = Object.keys(zip.files);
      const totalFiles = files.length;
      let processedFiles = 0;

      // 5. Salvar cada arquivo
      for (const filename of files) {
        const file = zip.files[filename] as JSZipFileEntry;

        if (file.dir) {
          // Criar diretório
          await Filesystem.mkdir({
            path: `games/${gameId}/${filename}`,
            directory: Directory.Data,
            recursive: true
          }).catch(() => {
            // Ignorar se já existe
          });
        } else {
          // Extrair arquivo
          const content = await file.async('base64');

          // Salvar arquivo
          await Filesystem.writeFile({
            path: `games/${gameId}/${filename}`,
            data: content,
            directory: Directory.Data,
            recursive: true
          });
        }

        processedFiles++;
        // Progresso de extração (70-100%)
        const extractProgress = 70 + Math.round((processedFiles / totalFiles) * 30);
        onProgress?.(extractProgress);
      }

      onProgress?.(100);
      console.log(`[Filesystem] Game ${gameId} downloaded and extracted successfully`);
    } catch (error) {
      console.error(`[Filesystem] Error downloading/extracting game ${gameId}:`, error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // FILE ACCESS
  // --------------------------------------------------------------------------

  async getGameUri(gameId: string, filePath: string = 'index.html'): Promise<string> {
    try {
      const result = await Filesystem.getUri({
        path: `games/${gameId}/${filePath}`,
        directory: Directory.Data
      });

      return result.uri;
    } catch (error) {
      console.error(`[Filesystem] Error getting URI for ${gameId}/${filePath}:`, error);
      throw error;
    }
  },

  async readGameFile(gameId: string, filePath: string): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path: `games/${gameId}/${filePath}`,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });

      return result.data as string;
    } catch (error) {
      console.error(`[Filesystem] Error reading ${gameId}/${filePath}:`, error);
      throw error;
    }
  },

  async gameExists(gameId: string): Promise<boolean> {
    try {
      await Filesystem.stat({
        path: `games/${gameId}`,
        directory: Directory.Data
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  // --------------------------------------------------------------------------
  // DELETION
  // --------------------------------------------------------------------------

  async deleteGame(gameId: string): Promise<void> {
    try {
      await Filesystem.rmdir({
        path: `games/${gameId}`,
        directory: Directory.Data,
        recursive: true
      });
      console.log(`[Filesystem] Game ${gameId} deleted successfully`);
    } catch (error) {
      console.error(`[Filesystem] Error deleting game ${gameId}:`, error);
      throw error;
    }
  },

  async deleteAllGames(): Promise<void> {
    try {
      await Filesystem.rmdir({
        path: 'games',
        directory: Directory.Data,
        recursive: true
      });

      // Recriar diretório vazio
      await this.ensureGamesDirectory();

      console.log('[Filesystem] All games deleted successfully');
    } catch (error) {
      console.error('[Filesystem] Error deleting all games:', error);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // STORAGE INFO
  // --------------------------------------------------------------------------

  async getGameSize(gameId: string): Promise<number> {
    try {
      const stat = await Filesystem.stat({
        path: `games/${gameId}`,
        directory: Directory.Data
      });

      return stat.size;
    } catch (error) {
      console.error(`[Filesystem] Error getting size for game ${gameId}:`, error);
      return 0;
    }
  },

  async getTotalGamesSize(): Promise<number> {
    try {
      const stat = await Filesystem.stat({
        path: 'games',
        directory: Directory.Data
      });

      return stat.size;
    } catch (error) {
      console.error('[Filesystem] Error getting total games size:', error);
      return 0;
    }
  },

  async listDownloadedGames(): Promise<string[]> {
    try {
      const result = await Filesystem.readdir({
        path: 'games',
        directory: Directory.Data
      });

      return result.files.map((file: any) => file.name);
    } catch (error) {
      console.error('[Filesystem] Error listing games:', error);
      return [];
    }
  }
};

export default filesystem;
