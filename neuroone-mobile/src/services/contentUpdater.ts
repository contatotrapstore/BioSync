import { downloadManager, DownloadProgress } from '@cap/downloadManager';
import { filesystem } from '@cap/filesystem';
import { storage } from '@cap/storage';
import { Game } from '@/types';
import { Filesystem, Directory } from '@capacitor/filesystem';
import JSZip from 'jszip';

/**
 * Content Updater - Orquestra download e instalação de jogos
 *
 * - Download de ZIP
 * - Extração de arquivos
 * - Atualização de metadados
 * - Gerenciamento de storage
 */

export interface InstallProgress {
  gameId: string;
  phase: 'downloading' | 'extracting' | 'completed' | 'error';
  downloadProgress: number; // 0-70%
  extractProgress: number; // 70-100%
  totalProgress: number; // 0-100%
  error?: string;
}

export class ContentUpdater {
  /**
   * Verificar se há espaço em disco suficiente
   */
  private async checkDiskSpace(requiredBytes: number): Promise<boolean> {
    try {
      // Capacitor não tem API nativa para checar espaço em disco
      // Mas podemos estimar baseado em tentativa de escrita
      // Por ora, assumir que há espaço e capturar erro se falhar
      // TODO: Implementar estimativa mais precisa ou usar plugin nativo
      const SAFETY_MARGIN = 100 * 1024 * 1024; // 100MB de margem de segurança
      return true; // Simplificado por ora
    } catch (error) {
      console.error('[ContentUpdater] Error checking disk space:', error);
      return true; // Assume que há espaço
    }
  }

  /**
   * Baixar e instalar jogo completo
   */
  async downloadAndInstallGame(
    game: Game,
    onProgress?: (progress: InstallProgress) => void
  ): Promise<void> {
    try {
      console.log(`[ContentUpdater] Starting install for game: ${game.id}`);

      // Verificar se jogo já está instalado
      const alreadyInstalled = await this.isGameInstalled(game.id);
      if (alreadyInstalled) {
        throw new Error('Jogo já está instalado');
      }

      // Verificar espaço em disco
      const requiredSpace = game.file_size ?? game.zipSize ?? 0;
      const hasSpace = await this.checkDiskSpace(requiredSpace * 2); // 2x para ZIP + extracted
      if (!hasSpace) {
        throw new Error('Espaço insuficiente no dispositivo');
      }

      // Fase 1: Download (0-70%)
      const zipPath = await this.downloadGameZip(game, (downloadProg) => {
        const totalProgress = Math.round(downloadProg.percentage * 0.7);
        onProgress?.({
          gameId: game.id,
          phase: 'downloading',
          downloadProgress: downloadProg.percentage,
          extractProgress: 0,
          totalProgress
        });
      });

      console.log(`[ContentUpdater] Download completed: ${zipPath}`);

      // Fase 2: Extração (70-100%)
      await this.extractGameZip(game.id, zipPath, (extractProg) => {
        const totalProgress = 70 + Math.round(extractProg * 0.3);
        onProgress?.({
          gameId: game.id,
          phase: 'extracting',
          downloadProgress: 100,
          extractProgress: extractProg,
          totalProgress
        });
      });

      console.log(`[ContentUpdater] Extraction completed`);

      // Deletar ZIP após extração
      await this.cleanupZip(zipPath);

      // Marcar como instalado
      await storage.addDownloadedGame(game.id);

      onProgress?.({
        gameId: game.id,
        phase: 'completed',
        downloadProgress: 100,
        extractProgress: 100,
        totalProgress: 100
      });

      console.log(`[ContentUpdater] Game ${game.id} installed successfully`);
    } catch (error: any) {
      console.error(`[ContentUpdater] Install error for ${game.id}:`, error);

      onProgress?.({
        gameId: game.id,
        phase: 'error',
        downloadProgress: 0,
        extractProgress: 0,
        totalProgress: 0,
        error: error.message || 'Erro desconhecido'
      });

      throw error;
    }
  }

  /**
   * Download do ZIP do jogo
   */
  private async downloadGameZip(
    game: Game,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<string> {
    // Usar download_url do objeto game retornado pelo backend
    const zipUrl = game.download_url ?? game.zipUrl;

    if (!zipUrl) {
      throw new Error(`Game ${game.id} does not have a download URL`);
    }

    const filePath = await downloadManager.downloadGame({
      gameId: game.id,
      url: zipUrl,
      expectedSize: game.file_size ?? game.zipSize,
      expectedChecksum: game.checksum,
      onProgress
    });

    return filePath;
  }

  /**
   * Extração do ZIP
   */
  private async extractGameZip(
    gameId: string,
    zipPath: string,
    onProgress: (percentage: number) => void
  ): Promise<void> {
    try {
      console.log(`[ContentUpdater] Reading ZIP file: ${zipPath}`);

      // 1. Ler arquivo ZIP do filesystem
      const zipFile = await Filesystem.readFile({
        path: zipPath,
        directory: Directory.Data
      });

      console.log(`[ContentUpdater] Converting base64 to binary`);

      // 2. Converter base64 para Uint8Array
      const base64Data = typeof zipFile.data === 'string' ? zipFile.data : String(zipFile.data);
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`[ContentUpdater] Extracting ZIP with JSZip`);

      // 3. Carregar ZIP com JSZip
      const zip = await JSZip.loadAsync(bytes);

      // 4. Iterar e salvar cada arquivo
      const files = Object.keys(zip.files);
      const totalFiles = files.length;
      let processedFiles = 0;

      console.log(`[ContentUpdater] Extracting ${totalFiles} files`);

      for (const filename of files) {
        const file = zip.files[filename];

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
          // Extrair conteúdo do arquivo
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
        const progress = Math.round((processedFiles / totalFiles) * 100);
        onProgress?.(progress);
      }

      console.log(`[ContentUpdater] Extraction completed for ${gameId}`);
    } catch (error) {
      console.error('[ContentUpdater] Extract error:', error);
      throw error;
    }
  }

  /**
   * Limpar arquivo ZIP após extração
   */
  private async cleanupZip(zipPath: string): Promise<void> {
    try {
      // Deletar arquivo ZIP específico
      await Filesystem.deleteFile({
        path: zipPath,
        directory: Directory.Data
      });
      console.log(`[ContentUpdater] Cleaned up ZIP: ${zipPath}`);
    } catch (error) {
      console.warn(`[ContentUpdater] Could not cleanup ZIP ${zipPath}:`, error);
      // Não é crítico se não conseguir deletar
    }
  }

  /**
   * Verificar se jogo está instalado
   */
  async isGameInstalled(gameId: string): Promise<boolean> {
    return await storage.isGameDownloaded(gameId);
  }

  /**
   * Desinstalar jogo
   */
  async uninstallGame(gameId: string): Promise<void> {
    try {
      console.log(`[ContentUpdater] Uninstalling game: ${gameId}`);

      // Deletar arquivos
      await filesystem.deleteGame(gameId);

      // Remover dos metadados
      await storage.removeDownloadedGame(gameId);

      console.log(`[ContentUpdater] Game ${gameId} uninstalled`);
    } catch (error) {
      console.error(`[ContentUpdater] Uninstall error for ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Obter espaço usado por jogos
   */
  async getStorageInfo(): Promise<{ totalSize: number; gameCount: number }> {
    try {
      const totalSize = await filesystem.getTotalGamesSize();
      const games = await storage.getDownloadedGames();

      return {
        totalSize,
        gameCount: games.length
      };
    } catch (error) {
      console.error('[ContentUpdater] Error getting storage info:', error);
      return { totalSize: 0, gameCount: 0 };
    }
  }

  /**
   * Limpar todos os jogos
   */
  async clearAllGames(): Promise<void> {
    try {
      console.log('[ContentUpdater] Clearing all games');

      await filesystem.deleteAllGames();
      await storage.setDownloadedGames([]);

      console.log('[ContentUpdater] All games cleared');
    } catch (error) {
      console.error('[ContentUpdater] Error clearing games:', error);
      throw error;
    }
  }
}

// Singleton
export const contentUpdater = new ContentUpdater();
export default contentUpdater;
