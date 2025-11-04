import { useState, useCallback } from 'react';
import { contentUpdater, InstallProgress } from '@services/contentUpdater';
import { Game } from '@/types';

/**
 * Hook customizado para gerenciar downloads de jogos
 */

export interface DownloadState {
  isDownloading: boolean;
  progress: InstallProgress | null;
  error: string | null;
}

export function useDownload() {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: null,
    error: null
  });

  const downloadGame = useCallback(async (game: Game): Promise<boolean> => {
    setDownloadState({
      isDownloading: true,
      progress: {
        gameId: game.id,
        phase: 'downloading',
        downloadProgress: 0,
        extractProgress: 0,
        totalProgress: 0
      },
      error: null
    });

    try {
      await contentUpdater.downloadAndInstallGame(game, (progress) => {
        setDownloadState({
          isDownloading: progress.phase !== 'completed' && progress.phase !== 'error',
          progress,
          error: progress.error || null
        });
      });

      return true;
    } catch (error: any) {
      setDownloadState({
        isDownloading: false,
        progress: null,
        error: error.message || 'Erro ao baixar jogo'
      });

      return false;
    }
  }, []);

  const resetDownload = useCallback(() => {
    setDownloadState({
      isDownloading: false,
      progress: null,
      error: null
    });
  }, []);

  return {
    downloadState,
    downloadGame,
    resetDownload
  };
}

export default useDownload;
