# 12 - FASE 6: LAUNCHER PC (DESKTOP)

## Visão Geral

O Launcher NeuroOne é uma aplicação desktop nativa construída com Electron que facilita o acesso à plataforma em Windows, macOS e Linux. Oferece experiência semelhante a aplicativo nativo com atalhos, notificações e integração com sistema operacional.

**Duração estimada**: 2 semanas
**Prioridade**: Normal (opcional - usuários podem acessar via navegador)
**Dependências**: Frontend web completo

---

## Por que um Launcher?

### Vantagens sobre Navegador Web

1. **Experiência Nativa**: Janela dedicada sem barra de endereço
2. **Atalho no Desktop**: Acesso rápido como programa instalado
3. **Notificações**: Notificações nativas do OS
4. **Auto-update**: Atualizações automáticas
5. **Offline**: Cache local robusto
6. **Integração OS**: Menu de contexto, atalhos de teclado personalizados

### Casos de Uso

- Professores em laboratórios de informática
- Direção com computador dedicado
- Escolas sem internet estável (modo offline)

---

## Tecnologias

- **Electron** 28+: Framework principal
- **Electron Builder**: Build e distribuição
- **electron-updater**: Auto-update
- **electron-store**: Persistência local
- **React**: UI (mesmo código do web app)

---

## Estrutura do Projeto

```
neuroone-launcher/
├── package.json
├── electron-builder.yml
├── main/
│   ├── main.js              # Processo principal
│   ├── preload.js           # Preload script (contexto isolado)
│   ├── menu.js              # Menu da aplicação
│   ├── updater.js           # Auto-update
│   └── tray.js              # System tray (opcional)
├── renderer/
│   └── (código React do frontend web)
├── build/
│   ├── icon.icns            # macOS
│   ├── icon.ico             # Windows
│   └── icon.png             # Linux
└── dist/                    # Builds gerados
```

---

## Implementação

### 1. Configuração Inicial

**Instalação**:
```bash
mkdir neuroone-launcher
cd neuroone-launcher
npm init -y

npm install --save-dev electron electron-builder
npm install electron-store electron-updater
```

**package.json**:
```json
{
  "name": "neuroone-launcher",
  "version": "1.0.0",
  "description": "NeuroOne Desktop Launcher",
  "main": "main/main.js",
  "author": "NeuroOne Team",
  "license": "MIT",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux",
    "publish": "electron-builder --publish always"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  },
  "dependencies": {
    "electron-store": "^8.1.0",
    "electron-updater": "^6.1.7"
  }
}
```

---

### 2. Processo Principal (Main Process)

**main/main.js**:
```javascript
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');
const createMenu = require('./menu');

const store = new Store();
let mainWindow;

// Configuração
const isDev = process.env.NODE_ENV === 'development';
const APP_URL = isDev
  ? 'http://localhost:5173'
  : 'https://neuroone.app';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    // Customização visual
    titleBarStyle: 'hidden', // macOS
    frame: true,
    backgroundColor: '#0B0B0B',
    show: false // Mostrar apenas quando pronto
  });

  // Carregar aplicação
  mainWindow.loadURL(APP_URL);

  // Mostrar quando pronto (evita flash branco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Verificar updates
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // DevTools (apenas em desenvolvimento)
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Menu
  createMenu(mainWindow);

  // Salvar posição e tamanho da janela
  const windowBounds = store.get('windowBounds');
  if (windowBounds) {
    mainWindow.setBounds(windowBounds);
  }

  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  // Interceptar links externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Abrir links externos no navegador padrão
    if (url.startsWith('http')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// App lifecycle
app.whenReady().then(() => {
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

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-setting', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-setting', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('clear-cache', async () => {
  await session.defaultSession.clearCache();
  await session.defaultSession.clearStorageData();
  return true;
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update-downloaded');
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});
```

---

### 3. Preload Script (Context Bridge)

**main/preload.js**:
```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expor API segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Versão da aplicação
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Cache
  clearCache: () => ipcRenderer.invoke('clear-cache'),

  // Updates
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Notificações
  showNotification: (title, body) => {
    new Notification(title, { body });
  }
});
```

---

### 4. Menu da Aplicação

**main/menu.js**:
```javascript
const { Menu, app, shell } = require('electron');

module.exports = function createMenu(mainWindow) {
  const isMac = process.platform === 'darwin';

  const template = [
    // App Menu (macOS)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: 'Sobre o NeuroOne' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: 'Ocultar NeuroOne' },
        { role: 'hideOthers', label: 'Ocultar Outros' },
        { role: 'unhide', label: 'Mostrar Todos' },
        { type: 'separator' },
        { role: 'quit', label: 'Sair do NeuroOne' }
      ]
    }] : []),

    // Arquivo
    {
      label: 'Arquivo',
      submenu: [
        isMac ? { role: 'close', label: 'Fechar Janela' } : { role: 'quit', label: 'Sair' }
      ]
    },

    // Editar
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar Tudo' }
      ]
    },

    // Visualizar
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarregar' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Real' },
        { role: 'zoomIn', label: 'Mais Zoom' },
        { role: 'zoomOut', label: 'Menos Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' },
        { type: 'separator' },
        {
          label: 'Limpar Cache',
          click: async () => {
            await mainWindow.webContents.session.clearCache();
            await mainWindow.webContents.session.clearStorageData();
            mainWindow.webContents.reload();
          }
        }
      ]
    },

    // Janela
    {
      label: 'Janela',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'zoom', label: 'Zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front', label: 'Trazer Tudo para Frente' }
        ] : [
          { role: 'close', label: 'Fechar' }
        ])
      ]
    },

    // Ajuda
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Documentação',
          click: async () => {
            await shell.openExternal('https://docs.neuroone.app');
          }
        },
        {
          label: 'Reportar Problema',
          click: async () => {
            await shell.openExternal('https://github.com/neuroone/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'Versão',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre',
              message: `NeuroOne v${app.getVersion()}`,
              detail: 'Plataforma de neurofeedback educacional'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
```

---

### 5. Auto-Update

**main/updater.js**:
```javascript
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

// Configuração
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function setupAutoUpdater(mainWindow) {
  // Verificar updates ao iniciar
  autoUpdater.checkForUpdatesAndNotify();

  // Update disponível
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização Disponível',
      message: `Versão ${info.version} disponível. Deseja baixar agora?`,
      buttons: ['Sim', 'Depois']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  // Download em progresso
  autoUpdater.on('download-progress', (progressObj) => {
    let message = `Download: ${progressObj.percent.toFixed(2)}%`;
    mainWindow.setProgressBar(progressObj.percent / 100);
    mainWindow.webContents.send('update-progress', progressObj);
  });

  // Download completo
  autoUpdater.on('update-downloaded', () => {
    mainWindow.setProgressBar(-1); // Remover barra de progresso

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização Pronta',
      message: 'A atualização foi baixada. Reiniciar agora?',
      buttons: ['Reiniciar', 'Depois']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Erro
  autoUpdater.on('error', (error) => {
    console.error('Erro no auto-update:', error);
  });
}

module.exports = setupAutoUpdater;
```

---

### 6. Electron Builder Configuration

**electron-builder.yml**:
```yaml
appId: com.neuroone.launcher
productName: NeuroOne
copyright: Copyright © 2025 NeuroOne

directories:
  buildResources: build
  output: dist

files:
  - main/**/*
  - renderer/**/*
  - package.json
  - node_modules/**/*

# Windows
win:
  target:
    - target: nsis
      arch:
        - x64
        - ia32
  icon: build/icon.ico
  publisherName: NeuroOne
  verifyUpdateCodeSignature: false

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: NeuroOne

# macOS
mac:
  target:
    - target: dmg
      arch:
        - x64
        - arm64
  category: public.app-category.education
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

dmg:
  title: NeuroOne ${version}
  icon: build/icon.icns
  window:
    width: 540
    height: 380

# Linux
linux:
  target:
    - AppImage
    - deb
    - rpm
  icon: build/icon.png
  category: Education
  desktop:
    Name: NeuroOne
    Comment: Plataforma de neurofeedback educacional
    Categories: Education;Science;

# Publicação
publish:
  provider: github
  owner: neuroone
  repo: launcher
  releaseType: release
```

---

### 7. Integração com Frontend React

**Detectar Electron no Frontend**:

```javascript
// src/lib/platform.js
export const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

export const getElectronAPI = () => {
  if (isElectron()) {
    return window.electronAPI;
  }
  return null;
};
```

**Componente de Notificação de Update**:

```jsx
// src/components/electron/UpdateNotification.jsx
import { useState, useEffect } from 'react';
import { isElectron, getElectronAPI } from '../../lib/platform';

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;

    const api = getElectronAPI();

    api.onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });

    api.onUpdateDownloaded(() => {
      setUpdateDownloaded(true);
    });
  }, []);

  const handleInstall = () => {
    const api = getElectronAPI();
    api.installUpdate();
  };

  if (!updateAvailable) return null;

  return (
    <div className="update-notification">
      {updateDownloaded ? (
        <>
          <p>Atualização pronta! Reiniciar agora?</p>
          <button onClick={handleInstall}>Reiniciar</button>
        </>
      ) : (
        <p>Baixando atualização...</p>
      )}
    </div>
  );
}
```

**Settings com Electron**:

```jsx
// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { isElectron, getElectronAPI } from '../lib/platform';

export default function Settings() {
  const [version, setVersion] = useState('Web');

  useEffect(() => {
    if (isElectron()) {
      const api = getElectronAPI();
      api.getAppVersion().then(setVersion);
    }
  }, []);

  const handleClearCache = async () => {
    if (isElectron()) {
      const api = getElectronAPI();
      await api.clearCache();
      alert('Cache limpo!');
    }
  };

  return (
    <div className="settings">
      <h1>Configurações</h1>

      <div className="setting-item">
        <label>Versão</label>
        <p>{version}</p>
      </div>

      {isElectron() && (
        <div className="setting-item">
          <button onClick={handleClearCache}>Limpar Cache</button>
        </div>
      )}
    </div>
  );
}
```

---

### 8. Ícones e Assets

**Gerando Ícones**:

1. Criar ícone base 1024x1024 (PNG com transparência)
2. Usar ferramenta para gerar formatos:
   - Windows: `.ico` (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
   - macOS: `.icns` (múltiplos tamanhos)
   - Linux: `.png` (512x512)

**Ferramentas**:
- https://www.electronjs.org/docs/latest/tutorial/icon
- https://cloudconvert.com/png-to-ico
- https://github.com/electron/icon-maker

---

### 9. Build e Distribuição

**Build Local**:
```bash
# Windows
npm run build:win

# macOS (requer macOS)
npm run build:mac

# Linux
npm run build:linux

# Todos (requer cada OS)
npm run build
```

**Outputs**:
```
dist/
├── NeuroOne Setup 1.0.0.exe       # Windows installer
├── NeuroOne-1.0.0.dmg             # macOS disk image
├── NeuroOne-1.0.0.AppImage        # Linux AppImage
├── neuroone_1.0.0_amd64.deb       # Debian package
└── neuroone-1.0.0.x86_64.rpm      # Red Hat package
```

**Publicar Release**:
```bash
# Criar tag no Git
git tag v1.0.0
git push --tags

# Publicar no GitHub Releases
npm run publish
```

---

### 10. Instalação e Distribuição

### 10.1 Windows

**Opção 1: NSIS Installer** (Recomendado)
- Download: `NeuroOne-Setup-1.0.0.exe`
- Instala em: `C:\Program Files\NeuroOne\`
- Cria atalhos: Desktop + Menu Iniciar
- Desinstalador incluído

**Opção 2: Portable**
- Extrair ZIP
- Executar `NeuroOne.exe`

### 10.2 macOS

**DMG Installer**:
1. Download: `NeuroOne-1.0.0.dmg`
2. Abrir DMG
3. Arrastar NeuroOne para pasta Aplicativos
4. Ejetar DMG

**Nota**: Apps não assinados exigem bypass Gatekeeper:
```bash
xattr -cr /Applications/NeuroOne.app
```

### 10.3 Linux

**AppImage** (Universal):
```bash
chmod +x NeuroOne-1.0.0.AppImage
./NeuroOne-1.0.0.AppImage
```

**Debian/Ubuntu**:
```bash
sudo dpkg -i neuroone_1.0.0_amd64.deb
```

**Fedora/RHEL**:
```bash
sudo rpm -i neuroone-1.0.0.x86_64.rpm
```

---

## 11. Funcionalidades Avançadas (Opcionais)

### 11.1 System Tray

**main/tray.js**:
```javascript
const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray;

function createTray(mainWindow) {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../build/tray-icon.png')
  );

  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir NeuroOne',
      click: () => {
        mainWindow.show();
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('NeuroOne');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

module.exports = createTray;
```

### 11.2 Deep Links

**Registrar protocolo `neuroone://`**:

```javascript
// main/main.js
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('neuroone', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('neuroone');
}

// Handler
app.on('open-url', (event, url) => {
  event.preventDefault();
  // Ex: neuroone://session/123
  const route = url.replace('neuroone://', '');
  mainWindow.webContents.send('deep-link', route);
});
```

### 11.3 Notificações Nativas

```javascript
// Frontend
if (isElectron()) {
  const api = getElectronAPI();

  api.showNotification(
    'Sessão Iniciada',
    '3º Ano A - Atenção média: 75%'
  );
}
```

---

## 12. Troubleshooting

### Problema: App não abre no macOS

**Solução**:
```bash
xattr -cr /Applications/NeuroOne.app
```

### Problema: Update não funciona

**Causa**: Falta de code signing

**Solução**:
- Windows: Adquirir certificado code signing
- macOS: Apple Developer ID
- Ou: Desativar verificação (não recomendado produção)

### Problema: App muito grande

**Otimizações**:
```javascript
// electron-builder.yml
files:
  - "!**/*.map"
  - "!**/node_modules/**/{CHANGELOG.md,README.md,README,readme.md,readme}"

asar: true
asarUnpack:
  - "**/*.node"
```

---

## Checklist de Conclusão

- [ ] Electron configurado e funcionando
- [ ] Preload script com context bridge
- [ ] Menu customizado
- [ ] Auto-update funcionando
- [ ] Ícones criados (Windows, macOS, Linux)
- [ ] electron-builder configurado
- [ ] Build Windows testado
- [ ] Build macOS testado (se disponível)
- [ ] Build Linux testado
- [ ] Instaladores funcionando
- [ ] Integração com frontend React
- [ ] Notificações funcionando
- [ ] Documentação de instalação

---

## Próximos Passos

- Publicar releases no GitHub
- Configurar code signing (produção)
- Distribuir via Microsoft Store (opcional)
- Distribuir via Mac App Store (opcional)

---

**Última atualização**: 2025-01-16
**Versão**: 1.0
