import api from './api';

/**
 * Content Updater Service
 * Gerencia atualizações de jogos e conteúdo do launcher
 */

const STORAGE_KEY_CONTENT_VERSION = 'contentVersion';
const STORAGE_KEY_INSTALLED_GAMES = 'installedGames';

// Logger condicional (apenas em desenvolvimento)
const log = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const logError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

const logWarn = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
};

class ContentUpdater {
  constructor() {
    this.checkInterval = null;
    this.downloadProgressUnsubscribe = null;
  }

  /**
   * Verifica se há novos jogos ou atualizações disponíveis
   */
  async checkForUpdates() {
    try {
      const lastSyncVersion = await this.getLastSyncVersion();

      const response = await api.get('/games/updates', {
        params: { lastSyncVersion }
      });

      const { hasUpdates, contentVersion, newGames, games } = response.data.data;

      if (hasUpdates) {
        log(`[ContentUpdater] ${newGames} novos jogos disponíveis`);

        return {
          hasUpdates: true,
          newGamesCount: newGames,
          games: games,
          contentVersion
        };
      }

      log('[ContentUpdater] Nenhuma atualização disponível');
      return {
        hasUpdates: false,
        newGamesCount: 0,
        games: []
      };
    } catch (error) {
      logError('[ContentUpdater] Erro ao verificar atualizações:', error);
      throw error;
    }
  }

  /**
   * Baixa e instala novos jogos
   */
  async downloadNewGames(games) {
    const results = [];

    if (window.electronAPI?.downloads?.onProgress) {
      this.downloadProgressUnsubscribe = window.electronAPI.downloads.onProgress((progress) => {
        if (typeof progress?.percent === 'number' && progress.url) {
          const percentage = (progress.percent * 100).toFixed(1);
          log(`[ContentUpdater] Progresso download (${progress.url}): ${percentage}%`);
        }
      });
    }

    for (const game of games) {
      try {
        log(`[ContentUpdater] Baixando ${game.title}...`);

        const downloadResult = await this.downloadGame(game);

        results.push({
          gameId: game.id,
          title: game.title,
          success: true,
          filePath: downloadResult.filePath
        });

        // Registrar game como instalado
        await this.markGameAsInstalled(game.id, downloadResult.filePath, game.version);
      } catch (error) {
        logError(`[ContentUpdater] Erro ao baixar ${game.title}:`, error);
        results.push({
          gameId: game.id,
          title: game.title,
          success: false,
          error: error.message
        });
      }
    }

    if (typeof this.downloadProgressUnsubscribe === 'function') {
      this.downloadProgressUnsubscribe();
      this.downloadProgressUnsubscribe = null;
    }

    return results;
  }

  /**
   * Executa download real de um jogo via canal IPC
   */
  async downloadGame(game) {
    if (!window.electronAPI?.downloads?.downloadGame) {
      throw new Error('API de download não disponível no contexto atual');
    }

    const downloadUrl = game.download_url || game.downloadUrl;

    if (!downloadUrl) {
      throw new Error('URL de download não encontrada para o jogo');
    }

    const inferredFileName = this.resolveFileName(game, downloadUrl);
    const checksum = game.checksum || game.sha256 || null;

    const result = await window.electronAPI.downloads.downloadGame({
      url: downloadUrl,
      fileName: inferredFileName,
      checksum
    });

    if (!result?.success) {
      throw new Error(result?.message || 'Falha ao baixar jogo');
    }

    if (result.checksumValid === false) {
      throw new Error('Download concluído, porém o checksum é inválido');
    }

    return result;
  }

  resolveFileName(game, downloadUrl) {
    if (game.file_name) return game.file_name;
    if (game.fileName) return game.fileName;

    try {
      const url = new URL(downloadUrl);
      const pathname = url.pathname || '';
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        return segments[segments.length - 1];
      }
    } catch (error) {
      logWarn('[ContentUpdater] Não foi possível inferir nome do arquivo via URL:', error);
    }

    if (game.slug) return `${game.slug}.zip`;
    if (game.title) {
      return `${game.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
    }

    return `${game.id || 'game'}-${Date.now()}.zip`;
  }

  /**
   * Atualiza a versão local do conteúdo
   */
  async updateContentVersion(version) {
    if (window.electronAPI) {
      await window.electronAPI.store.set(STORAGE_KEY_CONTENT_VERSION, version);
    } else {
      localStorage.setItem(STORAGE_KEY_CONTENT_VERSION, version.toString());
    }
  }

  /**
   * Obtém a última versão sincronizada
   */
  async getLastSyncVersion() {
    if (window.electronAPI) {
      return await window.electronAPI.store.get(STORAGE_KEY_CONTENT_VERSION);
    } else {
      return localStorage.getItem(STORAGE_KEY_CONTENT_VERSION);
    }
  }

  /**
   * Marca um jogo como instalado
   */
  async markGameAsInstalled(gameId, filePath, version) {
    let installedGames = await this.getInstalledGames();

    const normalized = installedGames.map((entry) =>
      typeof entry === 'string'
        ? { id: entry }
        : entry
    );

    const exists = normalized.find((entry) => entry.id === gameId);

    if (exists) {
      exists.version = version || exists.version || null;
      exists.filePath = filePath || exists.filePath || null;
      exists.installedAt = exists.installedAt || new Date().toISOString();
    } else {
      normalized.push({
        id: gameId,
        installedAt: new Date().toISOString(),
        version: version || null,
        filePath: filePath || null
      });
    }

    if (window.electronAPI) {
      await window.electronAPI.store.set(STORAGE_KEY_INSTALLED_GAMES, normalized);
    } else {
      localStorage.setItem(STORAGE_KEY_INSTALLED_GAMES, JSON.stringify(normalized));
    }
  }

  /**
   * Obtém lista de jogos instalados
   */
  async getInstalledGames() {
    let games;

    if (window.electronAPI) {
      games = await window.electronAPI.store.get(STORAGE_KEY_INSTALLED_GAMES);
    } else {
      const raw = localStorage.getItem(STORAGE_KEY_INSTALLED_GAMES);
      games = raw ? JSON.parse(raw) : [];
    }

    if (!Array.isArray(games)) {
      return [];
    }

    return games.map((entry) => (
      typeof entry === 'string'
        ? { id: entry }
        : entry
    ));
  }

  /**
   * Inicia verificação periódica de atualizações
   */
  startPeriodicCheck(intervalMinutes = 30) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // NÃO verificar imediatamente - só após o intervalo
    // Isso evita download automático ao iniciar o launcher

    // Verificar periodicamente
    this.checkInterval = setInterval(() => {
      this.checkForUpdates().catch(err => {
        logError('[ContentUpdater] Erro na verificação periódica:', err);
      });
    }, intervalMinutes * 60 * 1000);

    log(`[ContentUpdater] Verificação periódica iniciada (${intervalMinutes} min)`);
  }

  /**
   * Para verificação periódica
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      log('[ContentUpdater] Verificação periódica parada');
    }
  }

  /**
   * Força atualização obrigatória
   */
  async forceUpdate() {
    try {
      const updates = await this.checkForUpdates();

      if (updates.hasUpdates && updates.newGamesCount > 0) {
        log('[ContentUpdater] Iniciando atualização obrigatória...');

        const results = await this.downloadNewGames(updates.games);

        // Atualizar versão local
        await this.updateContentVersion(updates.contentVersion);

        return {
          success: true,
          results
        };
      }

      return {
        success: true,
        message: 'Nenhuma atualização necessária'
      };
    } catch (error) {
      logError('[ContentUpdater] Erro na atualização forçada:', error);
      throw error;
    }
  }

  /**
   * Verifica e baixa jogos novos automaticamente
   * Usado ao iniciar o launcher pela primeira vez ou quando há novos jogos
   */
  async checkAndDownloadNewGames(options = {}) {
    const { showProgress = true, autoDownload = true } = options;

    try {
      log('[ContentUpdater] Verificando novos jogos...');

      const updates = await this.checkForUpdates();

      if (!updates.hasUpdates || updates.newGamesCount === 0) {
        log('[ContentUpdater] Nenhum jogo novo encontrado');
        return {
          hasNewGames: false,
          downloadedCount: 0,
          games: []
        };
      }

      log(`[ContentUpdater] ${updates.newGamesCount} jogos novos encontrados`);

      if (!autoDownload) {
        return {
          hasNewGames: true,
          downloadedCount: 0,
          games: updates.games,
          requiresUserAction: true
        };
      }

      // Download automático
      log('[ContentUpdater] Iniciando download automático de jogos novos...');
      const results = await this.downloadNewGames(updates.games);

      // Atualizar versão do conteúdo
      await this.updateContentVersion(updates.contentVersion);

      const successCount = results.filter(r => r.success).length;
      log(`[ContentUpdater] Download concluído: ${successCount}/${results.length} jogos`);

      return {
        hasNewGames: true,
        downloadedCount: successCount,
        failedCount: results.length - successCount,
        games: updates.games,
        results
      };
    } catch (error) {
      logError('[ContentUpdater] Erro ao verificar/baixar novos jogos:', error);
      throw error;
    }
  }
}

export default new ContentUpdater();
