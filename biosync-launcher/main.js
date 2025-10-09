const electronModule = require('electron');

if (typeof electronModule === 'string' || !process.versions?.electron) {
  // Relaunch Electron if the environment forced Node mode
  const { spawn } = require('child_process');
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const child = spawn(electronModule, process.argv.slice(1), {
    stdio: 'inherit',
    env
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
  return;
}

const { app, BrowserWindow, ipcMain, Menu, dialog, globalShortcut } = electronModule;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Store = require('electron-store');
const extract = require('extract-zip');
const axios = require('axios');

let store;
let mainWindow;
let isDev;
let isPlayingGame = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'build/icon.png'),
    autoHideMenuBar: true,
    frame: true,
    show: false // Não mostrar até estar pronto
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
        if (process.env.OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!isDev) {
      mainWindow.maximize();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[main] Failed to load ${validatedURL}: ${errorCode} ${errorDescription}`);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[renderer] ${message} (${sourceId}:${line})`);
  });

  // Remove menu completely
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Refresh Library',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('refresh-library');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About biosync',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  if (isDev) {
    template[1].submenu.push(
      { type: 'separator' },
      { role: 'toggleDevTools' }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function registerIpcHandlers() {
  // IPC Handlers
  ipcMain.handle('store-get', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('store-set', (event, key, value) => {
    if (value === null || value === undefined) {
      store.delete(key);
    } else {
      store.set(key, value);
    }
    return true;
  });

  ipcMain.handle('store-delete', (event, key) => {
    store.delete(key);
    return true;
  });

  ipcMain.handle('store-clear', () => {
    store.clear();
    return true;
  });

  ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
  });

  ipcMain.handle('get-games-path', () => {
    // Usar userData que sempre tem permissão de escrita
    const gamesPath = path.join(app.getPath('userData'), 'Jogos');
    return gamesPath;
  });

  ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
  });

  ipcMain.handle('check-game-exists', async (event, folderPath) => {
    try {
      const gamesPath = path.join(app.getPath('userData'), 'Jogos');
      const gamePath = path.join(gamesPath, folderPath, 'index.html');
      const exists = fs.existsSync(gamePath);

      return {
        exists,
        path: gamePath,
        gamesPath
      };
    } catch (error) {
      console.error('[check-game] Error checking game files:', error);
      return {
        exists: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('download-and-extract-game', async (event, payload) => {
    const { gameSlug, folderPath, apiUrl } = payload;

    if (!gameSlug || !folderPath || !apiUrl) {
      return {
        success: false,
        message: 'Parâmetros incompletos para download'
      };
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    const gamesPath = path.join(app.getPath('userData'), 'Jogos');
    const tempDir = path.join(app.getPath('temp'), 'biosync-downloads');
    const zipPath = path.join(tempDir, `${gameSlug}.zip`);
    const extractPath = path.join(gamesPath, folderPath);

    try {
      // Criar diretórios necessários
      await fs.promises.mkdir(tempDir, { recursive: true });
      await fs.promises.mkdir(gamesPath, { recursive: true });

      // Remover arquivos antigos se existirem
      if (fs.existsSync(zipPath)) {
        await fs.promises.unlink(zipPath);
      }

      // Download do ZIP usando axios
      const downloadUrl = `${apiUrl}/downloads/games/${gameSlug}`;
      console.log(`[download] Downloading game from: ${downloadUrl}`);

      event.sender.send('game-install-progress', {
        gameSlug,
        status: 'downloading',
        message: 'Baixando jogo...'
      });

      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;

          event.sender.send('game-install-progress', {
            gameSlug,
            status: 'downloading',
            progress: percentCompleted,
            transferred: progressEvent.loaded,
            total: progressEvent.total || 0
          });
        }
      });

      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const downloadedPath = zipPath;
      console.log(`[download] Game downloaded to: ${downloadedPath}`);

      // Extrair ZIP
      event.sender.send('game-install-progress', {
        gameSlug,
        status: 'extracting',
        message: 'Extraindo arquivos...'
      });

      console.log(`[extract] Extracting to: ${extractPath}`);
      await extract(downloadedPath, { dir: extractPath });

      // Verificar se index.html foi extraído
      const indexPath = path.join(extractPath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        throw new Error('Arquivo index.html não encontrado após extração');
      }

      // Limpar arquivo ZIP temporário
      await fs.promises.unlink(downloadedPath).catch(() => {});

      event.sender.send('game-install-progress', {
        gameSlug,
        status: 'completed',
        message: 'Instalação concluída!'
      });

      return {
        success: true,
        extractPath,
        indexPath
      };
    } catch (error) {
      console.error('[download-extract] Error:', error);

      // Limpar em caso de erro
      try {
        if (fs.existsSync(zipPath)) {
          await fs.promises.unlink(zipPath);
        }
        if (fs.existsSync(extractPath)) {
          await fs.promises.rm(extractPath, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        console.error('[cleanup] Error:', cleanupError);
      }

      event.sender.send('game-install-progress', {
        gameSlug,
        status: 'error',
        message: error.message
      });

      return {
        success: false,
        message: error.message || 'Erro ao baixar e instalar jogo'
      };
    }
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Game state management for global shortcuts
  ipcMain.on('game-started', () => {
    console.log('[main] Game started, registering ESC shortcut');
    isPlayingGame = true;

    // Registrar atalho global para ESC
    try {
      globalShortcut.register('Escape', () => {
        console.log('[main] ESC pressed globally, sending exit-game signal');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('force-exit-game');
        }
      });

      // Atalho alternativo: Ctrl+Q
      globalShortcut.register('CommandOrControl+Q', () => {
        console.log('[main] Ctrl+Q pressed, sending exit-game signal');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('force-exit-game');
        }
      });
    } catch (error) {
      console.error('[main] Failed to register shortcuts:', error);
    }
  });

  ipcMain.on('game-stopped', () => {
    console.log('[main] Game stopped, unregistering shortcuts');
    isPlayingGame = false;

    // Desregistrar atalhos
    globalShortcut.unregister('Escape');
    globalShortcut.unregister('CommandOrControl+Q');
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize store after app is ready
  store = new Store();

  // Check if running in development mode
  // Usa app.isPackaged como fonte principal de verdade
  isDev = !app.isPackaged;
  console.log(`[launcher] isDev: ${isDev} | NODE_ENV: ${process.env.NODE_ENV} | isPackaged: ${app.isPackaged}`);

  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Allow navigation to localhost in dev mode
    if (isDev && parsedUrl.hostname === 'localhost') {
      return;
    }

    // Allow navigation to game files
    if (parsedUrl.protocol === 'file:') {
      return;
    }

    // Block all other navigation
    event.preventDefault();
  });

  contents.setWindowOpenHandler(({ url }) => {
    // Block opening new windows
    return { action: 'deny' };
  });
});
