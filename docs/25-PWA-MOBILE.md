# 25 - PROGRESSIVE WEB APP (PWA) MOBILE

## Índice
1. [Visão Geral](#visão-geral)
2. [Por Que PWA em vez de App Nativo](#por-que-pwa-em-vez-de-app-nativo)
3. [Arquitetura PWA](#arquitetura-pwa)
4. [Manifest.json](#manifestjson)
5. [Service Worker](#service-worker)
6. [Instalação "Add to Home Screen"](#instalação-add-to-home-screen)
7. [Web Bluetooth API](#web-bluetooth-api)
8. [Funcionalidades Offline](#funcionalidades-offline)
9. [Interface do Aluno](#interface-do-aluno)
10. [Deploy e Hospedagem](#deploy-e-hospedagem)
11. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O **NeuroOne PWA** é um Progressive Web App otimizado para tablets e smartphones que permite aos alunos:

- 📱 **Conectar ao dispositivo EEG** via Bluetooth
- 📊 **Visualizar métricas em tempo real** (bolinha verde/vermelha de atenção)
- 🎮 **Jogar jogos de neurofeedback**
- 🏠 **Instalar como app nativo** ("Add to Home Screen")
- ⚡ **Funcionar offline** (após primeira carga)
- 🔔 **Receber notificações** de sessões

### Comparação: PWA vs App Nativo

| Característica | PWA | App Nativo (APK) |
|----------------|-----|------------------|
| **Instalação** | Simples (1 clique) | Google Play / APK manual |
| **Atualizações** | Automáticas | Manual pelo usuário |
| **Tamanho** | ~2 MB | ~50-100 MB |
| **Desenvolvimento** | React (1 codebase) | Java/Kotlin Android |
| **Funciona offline** | ✅ Sim | ✅ Sim |
| **Bluetooth** | ✅ Web Bluetooth API | ✅ Native Bluetooth |
| **Notificações** | ✅ Push API | ✅ Native Notifications |
| **Custo** | Baixo | Alto (2 plataformas) |
| **Manutenção** | Fácil | Média |

---

## Por Que PWA em vez de App Nativo

### Vantagens do PWA para NeuroOne

1. **Deploy Instantâneo**
   - Atualização em tempo real (sem aprovar na Play Store)
   - Correções de bugs imediatas
   - Novos recursos disponíveis instantaneamente

2. **Única Codebase**
   - React funciona em Android, iOS, Desktop
   - Não precisa manter 2 códigos (Android + iOS)
   - Economia de tempo de desenvolvimento

3. **Instalação Simplificada**
   ```
   Processo PWA:
   1. Aluno abre link no navegador
   2. Navegador sugere "Adicionar à tela inicial"
   3. Clica em "Adicionar"
   4. Ícone aparece na home (igual app nativo)

   vs.

   Processo APK:
   1. Baixar APK de fonte desconhecida
   2. Ativar "Instalar apps desconhecidos"
   3. Aceitar avisos de segurança
   4. Instalar manualmente
   ```

4. **Sem Aprovação de Loja**
   - Google Play leva 3-7 dias para aprovar
   - Políticas rigorosas (pode ser rejeitado)
   - Taxa de $25 para conta de desenvolvedor

5. **HTTPS = Seguro**
   - PWA requer HTTPS obrigatório
   - Garante criptografia de dados EEG
   - Confiança do usuário

### Limitações (e como contornar)

| Limitação | Solução no NeuroOne |
|-----------|---------------------|
| **Web Bluetooth limitado** | Funciona no Chrome Android (95%+ dos devices) |
| **Sem acesso total ao hardware** | Web APIs cobrem 100% das necessidades do projeto |
| **iOS restringe PWAs** | Foco inicial em Android, expandir depois |
| **Menor visibilidade (sem Play Store)** | Distribuição via link direto nas escolas |

---

## Arquitetura PWA

```
┌──────────────────────────────────────────────────────────────┐
│                    ARQUITETURA NEUROONE PWA                   │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   index.html    │  ← Entry point
└────────┬────────┘
         │
         v
┌─────────────────┐
│   manifest.json │  ← App metadata (nome, ícone, cores)
└─────────────────┘

┌─────────────────┐
│ service-worker  │  ← Cache, offline, push notifications
└────────┬────────┘
         │
         v
┌─────────────────────────────────────────────────┐
│              REACT APP (SPA)                    │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐            │
│  │ Bluetooth   │  │  WebSocket   │            │
│  │ EEG Manager │  │  Client      │            │
│  └─────────────┘  └──────────────┘            │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │         COMPONENTES                      │  │
│  ├─────────────────────────────────────────┤  │
│  │  • Login                                 │  │
│  │  • SessionList (minhas sessões)         │  │
│  │  │  • AttentionIndicator (bolinha)       │  │
│  │  • GamePlayer (jogar)                   │  │
│  │  • Metrics (minhas métricas)            │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Manifest.json

O arquivo `manifest.json` define as propriedades do app quando instalado.

**Localização:** `public/manifest.json`

```json
{
  "name": "NeuroOne - Aluno",
  "short_name": "NeuroOne",
  "description": "Plataforma de neurofeedback educacional",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B0B0B",
  "theme_color": "#CDA434",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/session.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["education", "health"],
  "lang": "pt-BR",
  "dir": "ltr",
  "shortcuts": [
    {
      "name": "Minhas Sessões",
      "short_name": "Sessões",
      "description": "Ver sessões ativas",
      "url": "/sessions",
      "icons": [
        {
          "src": "/icons/sessions-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Minhas Métricas",
      "short_name": "Métricas",
      "description": "Ver minhas métricas EEG",
      "url": "/metrics",
      "icons": [
        {
          "src": "/icons/metrics-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

**Campos Importantes:**

- `display: "standalone"` - Abre em tela cheia (sem barra do navegador)
- `background_color` - Cor da splash screen
- `theme_color` - Cor da barra de status
- `orientation: "portrait"` - Força modo retrato
- `icons` - Ícones de várias resoluções (PWA escolhe o melhor)
- `shortcuts` - Atalhos no launcher (long-press no ícone)

---

## Service Worker

O Service Worker é um script que roda em background e controla cache, offline e notificações.

**Localização:** `public/service-worker.js`

```javascript
// Nome da versão do cache (incrementar ao fazer deploy)
const CACHE_NAME = 'neuroone-v1.2.0';

// Arquivos para cachear (funcionarão offline)
const CACHE_URLS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// INSTALL: Cachear arquivos na instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando arquivos');
      return cache.addAll(CACHE_URLS);
    })
  );

  // Ativa imediatamente (não espera)
  self.skipWaiting();
});

// ACTIVATE: Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// FETCH: Estratégia Network First (API) / Cache First (assets)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a resposta para uso offline
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Se offline, tenta cache
          return caches.match(request);
        })
    );
  }
  // Assets estáticos: Cache First
  else {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request).then((response) => {
          // Cachear para próxima vez
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        });
      }).catch(() => {
        // Fallback: página offline
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
    );
  }
});

// PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Ação ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

**Registrar Service Worker em `index.html`:**

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('SW registrado:', registration);
        })
        .catch((error) => {
          console.error('Erro ao registrar SW:', error);
        });
    });
  }
</script>
```

---

## Instalação "Add to Home Screen"

### Como Funciona

Quando o usuário acessa o PWA pela primeira vez, o navegador (Chrome Android) mostra uma notificação:

```
┌────────────────────────────────────┐
│  🔔 Adicionar NeuroOne à tela      │
│     inicial?                       │
│                                     │
│  [Cancelar]  [Adicionar]           │
└────────────────────────────────────┘
```

### Critérios para PWA Instalável

O navegador só sugere instalação se:

- ✅ Servido via **HTTPS** (ou localhost)
- ✅ Possui **manifest.json** válido
- ✅ Possui **Service Worker** registrado
- ✅ Service Worker tem handler de **fetch**
- ✅ Pelo menos 1 ícone de **192x192px**

### Forçar Prompt de Instalação

```javascript
// src/components/InstallPrompt.jsx

import React, { useState, useEffect } from 'react';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Captura evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();  // Previne prompt automático
      setDeferredPrompt(e);
      setShowInstall(true);
    });

    // Detecta se já foi instalado
    window.addEventListener('appinstalled', () => {
      console.log('PWA foi instalado!');
      setShowInstall(false);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Mostra prompt nativo
    deferredPrompt.prompt();

    // Aguarda escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('Usuário aceitou instalação');
    } else {
      console.log('Usuário recusou instalação');
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="install-banner">
      <p>📱 Instale o NeuroOne para acesso rápido</p>
      <button onClick={handleInstall}>Instalar</button>
      <button onClick={() => setShowInstall(false)}>Agora não</button>
    </div>
  );
}

export default InstallPrompt;
```

### Passo a Passo para o Aluno

**Android Chrome:**

```
1. Abrir link: https://app.neuroone.com
2. Clicar no botão "Instalar" OU
3. Menu (⋮) > Adicionar à tela inicial
4. Confirmar nome do app
5. Ícone aparece na home
6. Abrir ícone = abre em tela cheia (sem barra do navegador)
```

**iOS Safari (limitado):**

```
1. Abrir link em Safari
2. Clicar em "Compartilhar" (ícone de compartilhamento)
3. Rolar e clicar "Adicionar à Tela de Início"
4. Confirmar nome
5. Ícone criado

NOTA: iOS não suporta Service Worker completamente
Funcionalidades limitadas em iOS:
- ❌ Notificações push
- ❌ Sincronização em background
- ✅ Bluetooth (parcial)
```

---

## Web Bluetooth API

### Verificar Suporte

```javascript
if ('bluetooth' in navigator) {
  console.log('Web Bluetooth suportado ✅');
} else {
  console.log('Web Bluetooth NÃO suportado ❌');
  // Mostrar mensagem para usar Chrome Android
}
```

### Conectar ao Dispositivo EEG

```javascript
// src/services/bluetoothEEG.js

class BluetoothEEGManager {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.parser = new ThinkGearParser();  // Parser do protocolo
  }

  async connect() {
    try {
      // 1. Solicitar dispositivo
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'TGAM' },
          { namePrefix: 'MindWave' },
          { namePrefix: 'Neuro' }
        ],
        optionalServices: ['battery_service']  // Adicionar service UUID real
      });

      console.log('Dispositivo selecionado:', this.device.name);

      // 2. Conectar ao GATT server
      this.server = await this.device.gatt.connect();
      console.log('GATT conectado');

      // 3. Obter serviço (substituir pelo UUID real)
      const service = await this.server.getPrimaryService('serial_port_service_uuid');

      // 4. Obter característica RX (dados do EEG)
      this.characteristic = await service.getCharacteristic('rx_characteristic_uuid');

      // 5. Escutar notificações
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleData.bind(this)
      );

      await this.characteristic.startNotifications();

      console.log('EEG conectado ✅');
      return true;

    } catch (error) {
      console.error('Erro ao conectar EEG:', error);
      throw error;
    }
  }

  handleData(event) {
    const value = event.target.value;  // DataView

    // Parse cada byte
    for (let i = 0; i < value.byteLength; i++) {
      const byte = value.getUint8(i);
      this.parser.parseByte(byte);
    }

    // Se dados completos estão prontos
    if (this.parser.isReady()) {
      const eegData = {
        attention: this.parser.attention,
        meditation: this.parser.meditation,
        delta: this.parser.delta,
        theta: this.parser.theta,
        lowAlpha: this.parser.lowAlpha,
        highAlpha: this.parser.highAlpha,
        lowBeta: this.parser.lowBeta,
        highBeta: this.parser.highBeta,
        lowGamma: this.parser.lowGamma,
        middleGamma: this.parser.middleGamma,
        signalQuality: this.parser.signalQuality
      };

      // Callback para componente React
      if (this.onDataReceived) {
        this.onDataReceived(eegData);
      }
    }
  }

  async disconnect() {
    if (this.characteristic) {
      await this.characteristic.stopNotifications();
    }
    if (this.server) {
      this.server.disconnect();
    }
    console.log('EEG desconectado');
  }
}

export default BluetoothEEGManager;
```

### Usar no Componente React

```javascript
// src/pages/SessionPage.jsx

import React, { useState, useEffect } from 'react';
import BluetoothEEGManager from '../services/bluetoothEEG';

function SessionPage() {
  const [eegManager] = useState(() => new BluetoothEEGManager());
  const [isConnected, setIsConnected] = useState(false);
  const [attention, setAttention] = useState(0);
  const [signalQuality, setSignalQuality] = useState(200);

  const handleConnect = async () => {
    try {
      eegManager.onDataReceived = (data) => {
        setAttention(data.attention);
        setSignalQuality(data.signalQuality);

        // Enviar para servidor via WebSocket
        socket.emit('eeg:data', {
          sessionId: currentSessionId,
          studentId: currentUserId,
          timestamp: new Date().toISOString(),
          ...data
        });
      };

      await eegManager.connect();
      setIsConnected(true);
    } catch (error) {
      alert('Erro ao conectar EEG: ' + error.message);
    }
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={handleConnect}>
          📡 Conectar Dispositivo EEG
        </button>
      ) : (
        <div>
          <div className="signal-status">
            Qualidade: {signalQuality < 50 ? '✅ Ótimo' : '⚠️ Ajustar'}
          </div>

          <div className="attention-indicator">
            <div
              className={`circle ${attention > 60 ? 'green' : 'red'}`}
            />
            <p>
              {attention > 60 ? 'Você está focado! 🟢' : 'Tente se concentrar 🔴'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Funcionalidades Offline

### Cache de Sessões

```javascript
// src/services/sessionCache.js

const CACHE_KEY = 'neuroone_sessions';

export function cacheSessions(sessions) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(sessions));
}

export function getCachedSessions() {
  const cached = localStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : [];
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}
```

### Sync em Background

```javascript
// service-worker.js

// Background Sync: envia dados quando volta online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-eeg-data') {
    event.waitUntil(syncEEGData());
  }
});

async function syncEEGData() {
  const pendingData = await getPendingData();  // IndexedDB

  for (const data of pendingData) {
    try {
      await fetch('/api/v1/eeg/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Remove do pending
      await removePendingData(data.id);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
  }
}
```

---

## Interface do Aluno

### Tela Principal

```
┌─────────────────────────────────────┐
│  NeuroOne                    [👤]   │
├─────────────────────────────────────┤
│                                      │
│  📅 Minhas Sessões                  │
│                                      │
│  🟢 Matemática - Equações           │
│      Hoje, 10:00 - 11:30            │
│      [Entrar na Sessão]             │
│                                      │
│  ⏰ História - Brasil Colônia       │
│      Amanhã, 14:00 - 15:30          │
│      (Ainda não iniciada)           │
│                                      │
│  ✅ Ciências - Sistema Solar        │
│      Ontem, 09:00 - 10:30           │
│      Atenção média: 85% 🎉          │
│                                      │
├─────────────────────────────────────┤
│  [Sessões] [Métricas] [Perfil]     │
└─────────────────────────────────────┘
```

### Tela de Sessão Ativa

```
┌─────────────────────────────────────┐
│  ← Matemática - Equações            │
├─────────────────────────────────────┤
│                                      │
│  📡 Dispositivo EEG                 │
│  ✅ Conectado - Sinal Ótimo         │
│                                      │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │       🟢                      │  │
│  │                               │  │
│  │  Você está FOCADO!            │  │
│  │  Continue assim! 👍           │  │
│  │                               │  │
│  │  Atenção: 85%                 │  │
│  │  Relaxamento: 68%             │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                      │
│  [🎮 Jogar Autorama]                │
│                                      │
│  Tempo de sessão: 25 min            │
│                                      │
└─────────────────────────────────────┘
```

---

## Deploy e Hospedagem

### Opção 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd biosync-pwa
vercel --prod

# Resultado: https://neuroone-pwa.vercel.app
```

**Configurar domínio personalizado:**
```
Vercel Dashboard > Settings > Domains
Adicionar: app.neuroone.com
```

### Opção 2: Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Resultado: https://neuroone.netlify.app
```

### Opção 3: Firebase Hosting

```bash
# Instalar Firebase CLI
npm i -g firebase-tools

# Configurar
firebase init hosting

# Deploy
firebase deploy --only hosting

# Resultado: https://neuroone.web.app
```

### Configurar HTTPS (Obrigatório!)

Todos os serviços acima fornecem HTTPS automaticamente via Let's Encrypt.

**Verificar HTTPS:**
```bash
curl -I https://app.neuroone.com
# Deve retornar: HTTP/2 200
```

---

## Troubleshooting

### ❌ "Add to Home Screen" não aparece

**Causas:**
- Não está em HTTPS
- manifest.json inválido
- Service Worker não registrado
- Falta ícone 192x192

**Solução:**
```bash
# 1. Verificar HTTPS
https://app.neuroone.com ✅

# 2. Validar manifest
https://manifest-validator.appspot.com

# 3. Verificar SW no DevTools
Chrome > F12 > Application > Service Workers
```

---

### ❌ Web Bluetooth não funciona

**Causas:**
- Navegador não suporta (usar Chrome Android)
- Não está em HTTPS
- Dispositivo EEG não encontrado

**Solução:**
1. Verificar suporte: `'bluetooth' in navigator`
2. Usar HTTPS obrigatório
3. Ligar dispositivo EEG antes de clicar "Conectar"

---

### ❌ PWA não funciona offline

**Causas:**
- Service Worker não cacheou arquivos
- URLs não estão em CACHE_URLS

**Solução:**
```javascript
// Adicionar URLs ao cache
const CACHE_URLS = [
  '/',
  '/static/css/main.css',  // Verificar paths corretos
  '/static/js/main.js'
];
```

---

## Referências

- **PWA Builder:** https://www.pwabuilder.com/
- **Web.dev PWA Guide:** https://web.dev/progressive-web-apps/
- **Web Bluetooth API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- **Service Worker Cookbook:** https://serviceworke.rs/
- **Manifest Generator:** https://www.simicart.com/manifest-generator.html/

---

**Documento:** 25-PWA-MOBILE.md
**Versão:** 1.0
**Data:** 07/11/2025
**Autor:** Claude Code (NeuroOne Team)
