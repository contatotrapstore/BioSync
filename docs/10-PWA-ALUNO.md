# 10 - FASE 4: MÓDULO ALUNO PWA ✅ IMPLEMENTADA

## Visão Geral

O módulo Aluno é uma Progressive Web App (PWA) otimizada para tablets e smartphones, permitindo que estudantes participem de sessões de neurofeedback usando dispositivos EEG via Bluetooth. A interface é minimalista e focada na experiência do aluno durante aulas e jogos.

**Duração estimada**: 2-3 semanas
**Prioridade**: Alta (Fase 4 do cronograma)
**Dependências**: Fase 1, 2 e 3 completas; Servidor Python configurado
**Status:** ✅ Implementação completa (Autenticação, conexão EEG Bluetooth, participação em sessões, histórico com PDF export)

---

## Funcionalidades do Módulo

### 1. Autenticação e Perfil
- **Login Simplificado**: Email e senha
- **Perfil do Aluno**: Nome, turma, avatar
- **Minhas Sessões**: Histórico de participação

### 2. Conexão com Dispositivo EEG
- **Scan Bluetooth**: Buscar headset TGAM nas proximidades
- **Pareamento**: Conectar via Web Bluetooth API
- **Status de Conexão**: Indicador visual (conectado/desconectado)
- **Calibração**: Período de ajuste inicial (30 segundos)

### 3. Participação em Sessão
- **Entrar em Sessão**: Detecta automaticamente sessão ativa da sua turma
- **Modo Aula**: Visualização simples com indicador de atenção
- **Modo Jogo**: Integração com jogos HTML5 de neurofeedback
- **Indicador Visual**: Círculo verde (atento) / vermelho (desatento)

### 4. Feedback em Tempo Real
- **Atenção Atual**: Porcentagem exibida de forma não-invasiva
- **Notificações Gentis**: Avisos quando perder atenção
- **Estatísticas da Sessão**: Tempo, média de atenção

### 5. Instalação PWA
- **Add to Home Screen**: Atalho na tela inicial
- **Funcionamento Offline**: Service Worker para assets
- **Ícone e Splash Screen**: Branding NeuroOne

---

## Estrutura de Arquivos

```
frontend/
├── public/
│   ├── manifest.json                    # PWA manifest
│   ├── service-worker.js                # Service Worker
│   └── icons/
│       ├── icon-192x192.png
│       ├── icon-512x512.png
│       └── splash-*.png
├── src/
│   ├── pages/
│   │   └── student/
│   │       ├── StudentDashboard.jsx     # Dashboard do aluno
│   │       ├── SessionJoin.jsx          # Entrar em sessão
│   │       ├── SessionActive.jsx        # Sessão ativa
│   │       ├── DeviceConnect.jsx        # Conectar EEG
│   │       └── SessionHistory.jsx       # Histórico
│   ├── components/
│   │   └── student/
│   │       ├── AttentionCircle.jsx      # Indicador visual
│   │       ├── BluetoothScanner.jsx     # Scanner Bluetooth
│   │       ├── DeviceStatus.jsx         # Status do dispositivo
│   │       ├── GameFrame.jsx            # iFrame para jogos
│   │       └── SessionStats.jsx         # Estatísticas
│   └── lib/
│       ├── bluetooth.js                 # Web Bluetooth API
│       ├── thinkgear-parser.js          # Parser TGAM
│       └── websocket-client.js          # Cliente WebSocket Python
```

---

## Implementação Semana a Semana

### **Semana 1: PWA Setup e Bluetooth**

#### Dia 1-2: Configuração PWA

**Arquivo**: `public/manifest.json`

```json
{
  "name": "NeuroOne - Aluno",
  "short_name": "NeuroOne",
  "description": "Plataforma de neurofeedback educacional",
  "start_url": "/student",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0B0B0B",
  "theme_color": "#CDA434",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
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
      "sizes": "540x720",
      "type": "image/png"
    }
  ],
  "categories": ["education", "health"],
  "prefer_related_applications": false
}
```

**Arquivo**: `public/service-worker.js`

```javascript
const CACHE_NAME = 'neuroone-v1';
const urlsToCache = [
  '/',
  '/student',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Ativação
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - estratégia Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
```

**Arquivo**: `src/main.jsx` (registrar Service Worker)

```jsx
// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registrado:', registration);
      })
      .catch(error => {
        console.log('SW falhou:', error);
      });
  });
}
```

---

#### Dia 3-5: Web Bluetooth API e Parser TGAM

**Arquivo**: `src/lib/bluetooth.js`

```javascript
/**
 * Web Bluetooth API para dispositivos TGAM
 */

const TGAM_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const TGAM_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

class BluetoothManager {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.onDataCallback = null;
  }

  /**
   * Verifica se Web Bluetooth está disponível
   */
  isAvailable() {
    return 'bluetooth' in navigator;
  }

  /**
   * Solicita pareamento com dispositivo
   */
  async requestDevice() {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [TGAM_SERVICE_UUID] }
        ],
        optionalServices: [TGAM_SERVICE_UUID]
      });

      console.log('Dispositivo encontrado:', this.device.name);
      return this.device;
    } catch (error) {
      console.error('Erro ao solicitar dispositivo:', error);
      throw error;
    }
  }

  /**
   * Conecta ao dispositivo e inicia leitura de dados
   */
  async connect() {
    if (!this.device) {
      throw new Error('Nenhum dispositivo selecionado');
    }

    try {
      const server = await this.device.gatt.connect();
      console.log('Conectado ao GATT Server');

      const service = await server.getPrimaryService(TGAM_SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(TGAM_CHARACTERISTIC_UUID);

      // Iniciar notificações
      await this.characteristic.startNotifications();

      // Listener para dados recebidos
      this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        this.handleData(value);
      });

      console.log('Notificações iniciadas');
      return true;
    } catch (error) {
      console.error('Erro ao conectar:', error);
      throw error;
    }
  }

  /**
   * Processa dados brutos recebidos
   */
  handleData(dataView) {
    const bytes = new Uint8Array(dataView.buffer);

    // Enviar bytes para parser
    if (this.onDataCallback) {
      this.onDataCallback(bytes);
    }
  }

  /**
   * Define callback para dados recebidos
   */
  onData(callback) {
    this.onDataCallback = callback;
  }

  /**
   * Desconecta do dispositivo
   */
  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
      console.log('Dispositivo desconectado');
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected() {
    return this.device && this.device.gatt.connected;
  }
}

export default new BluetoothManager();
```

**Arquivo**: `src/lib/thinkgear-parser.js`

```javascript
/**
 * Parser para protocolo ThinkGear (TGAM)
 */

class ThinkGearParser {
  constructor() {
    this.state = 'SYNC';
    this.payloadLength = 0;
    this.payload = [];
    this.checksum = 0;
    this.onParsedCallback = null;
  }

  /**
   * Processa um byte do protocolo ThinkGear
   */
  parseByte(byte) {
    switch (this.state) {
      case 'SYNC':
        if (byte === 0xAA) {
          this.state = 'SYNC2';
        }
        break;

      case 'SYNC2':
        if (byte === 0xAA) {
          this.state = 'PAYLOAD_LENGTH';
        } else {
          this.state = 'SYNC';
        }
        break;

      case 'PAYLOAD_LENGTH':
        this.payloadLength = byte;
        this.payload = [];
        this.checksum = 0;
        this.state = 'PAYLOAD';
        break;

      case 'PAYLOAD':
        this.payload.push(byte);
        this.checksum += byte;

        if (this.payload.length === this.payloadLength) {
          this.state = 'CHECKSUM';
        }
        break;

      case 'CHECKSUM':
        // Validar checksum
        const checksumValid = ((~this.checksum & 0xFF) === byte);

        if (checksumValid) {
          this.parsePayload(this.payload);
        } else {
          console.warn('Checksum inválido');
        }

        this.state = 'SYNC';
        break;
    }
  }

  /**
   * Processa array de bytes
   */
  parseBytes(bytes) {
    for (let i = 0; i < bytes.length; i++) {
      this.parseByte(bytes[i]);
    }
  }

  /**
   * Extrai dados do payload
   */
  parsePayload(payload) {
    const data = {};
    let i = 0;

    while (i < payload.length) {
      const code = payload[i];
      i++;

      switch (code) {
        case 0x02: // Signal Quality (0-200)
          data.signalQuality = payload[i];
          i++;
          break;

        case 0x04: // Attention (0-100)
          data.attention = payload[i];
          i++;
          break;

        case 0x05: // Meditation/Relaxation (0-100)
          data.relaxation = payload[i];
          i++;
          break;

        case 0x83: // EEG Power (8 bandas de 3 bytes cada)
          const eegData = payload.slice(i + 1, i + 25);
          data.delta = this.bytes3ToInt(eegData.slice(0, 3));
          data.theta = this.bytes3ToInt(eegData.slice(3, 6));
          data.lowAlpha = this.bytes3ToInt(eegData.slice(6, 9));
          data.highAlpha = this.bytes3ToInt(eegData.slice(9, 12));
          data.lowBeta = this.bytes3ToInt(eegData.slice(12, 15));
          data.highBeta = this.bytes3ToInt(eegData.slice(15, 18));
          data.lowGamma = this.bytes3ToInt(eegData.slice(18, 21));
          data.midGamma = this.bytes3ToInt(eegData.slice(21, 24));
          i += 25;
          break;

        default:
          // Código desconhecido, pular
          if (code >= 0x80) {
            const length = payload[i];
            i += length + 1;
          } else {
            i++;
          }
      }
    }

    // Normalizar EEG para 0-1
    if (data.delta !== undefined) {
      const maxPower = 16777215; // 2^24 - 1
      data.delta = data.delta / maxPower;
      data.theta = data.theta / maxPower;
      data.alpha = (data.lowAlpha + data.highAlpha) / (2 * maxPower);
      data.beta = (data.lowBeta + data.highBeta) / (2 * maxPower);
      data.gamma = (data.lowGamma + data.midGamma) / (2 * maxPower);
    }

    if (this.onParsedCallback) {
      this.onParsedCallback(data);
    }
  }

  /**
   * Converte 3 bytes em inteiro
   */
  bytes3ToInt(bytes) {
    return (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
  }

  /**
   * Define callback para dados parseados
   */
  onParsed(callback) {
    this.onParsedCallback = callback;
  }
}

export default new ThinkGearParser();
```

---

### **Semana 2: Interface do Aluno e Sessão Ativa**

#### Dashboard do Aluno

**Arquivo**: `src/pages/student/StudentDashboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import BluetoothManager from '../../lib/bluetooth';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(null);
  const [myClass, setMyClass] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [bluetoothAvailable, setBluetoothAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBluetoothAvailable(BluetoothManager.isAvailable());
    fetchStudentData();

    // Verificar sessão ativa a cada 10 segundos
    const interval = setInterval(checkActiveSession, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStudentData = async () => {
    try {
      // Buscar turma do aluno
      const { data: classStudent } = await supabase
        .from('class_students')
        .select(`
          class:classes(
            id,
            name,
            description,
            teacher:users!teacher_id(name)
          )
        `)
        .eq('student_id', user.id)
        .single();

      setMyClass(classStudent?.class);

      // Buscar sessões recentes
      const { data: sessions } = await supabase
        .from('session_participants')
        .select(`
          session:sessions(
            id,
            start_time,
            end_time,
            class:classes(name)
          )
        `)
        .eq('student_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(5);

      setRecentSessions(sessions?.map(sp => sp.session) || []);

      // Verificar sessão ativa
      await checkActiveSession();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = async () => {
    if (!myClass) return;

    try {
      const { data: session } = await supabase
        .from('sessions')
        .select('id, start_time, class:classes(name)')
        .eq('class_id', myClass.id)
        .is('end_time', null)
        .single();

      setActiveSession(session);
    } catch (error) {
      setActiveSession(null);
    }
  };

  const joinSession = () => {
    if (activeSession) {
      navigate(`/student/session/${activeSession.id}/join`);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="student-dashboard">
      <div className="welcome-header">
        <h1>Olá, {user.name}!</h1>
        {myClass && (
          <p className="class-info">
            Turma: <strong>{myClass.name}</strong>
            <br />
            Professor: {myClass.teacher.name}
          </p>
        )}
      </div>

      {/* Sessão Ativa */}
      {activeSession && (
        <div className="active-session-alert">
          <div className="alert-content">
            <span className="pulse-dot">🔴</span>
            <div>
              <h3>Sessão Ativa!</h3>
              <p>
                {activeSession.class.name} iniciou às{' '}
                {new Date(activeSession.start_time).toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
          <button onClick={joinSession} className="btn-join-session">
            🎮 Entrar na Sessão
          </button>
        </div>
      )}

      {/* Status Bluetooth */}
      {!bluetoothAvailable && (
        <div className="warning-box">
          <p>⚠️ Web Bluetooth não está disponível neste navegador.</p>
          <p>Use Chrome, Edge ou Opera no Android/Windows.</p>
        </div>
      )}

      {/* Histórico */}
      <div className="section">
        <h2>Sessões Recentes</h2>
        {recentSessions.length === 0 ? (
          <p className="empty-state">Você ainda não participou de nenhuma sessão.</p>
        ) : (
          <div className="sessions-list">
            {recentSessions.map(session => (
              <div key={session.id} className="session-item">
                <div className="session-icon">📊</div>
                <div className="session-info">
                  <h4>{session.class.name}</h4>
                  <p>{new Date(session.start_time).toLocaleDateString('pt-BR')}</p>
                </div>
                <button
                  onClick={() => navigate(`/student/session/${session.id}/report`)}
                  className="btn-small"
                >
                  Ver
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

#### Conectar Dispositivo EEG

**Arquivo**: `src/pages/student/DeviceConnect.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BluetoothManager from '../../lib/bluetooth';
import ThinkGearParser from '../../lib/thinkgear-parser';
import DeviceStatus from '../../components/student/DeviceStatus';

export default function DeviceConnect() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, scanning, connecting, connected, calibrating
  const [deviceName, setDeviceName] = useState('');
  const [signalQuality, setSignalQuality] = useState(0);
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  const handleConnect = async () => {
    try {
      setStatus('scanning');

      // Solicitar dispositivo
      const device = await BluetoothManager.requestDevice();
      setDeviceName(device.name);

      setStatus('connecting');

      // Conectar
      await BluetoothManager.connect();

      // Configurar parser
      BluetoothManager.onData((bytes) => {
        ThinkGearParser.parseBytes(bytes);
      });

      ThinkGearParser.onParsed((data) => {
        if (data.signalQuality !== undefined) {
          setSignalQuality(data.signalQuality);
        }

        // Verificar se sinal está bom (< 50)
        if (data.signalQuality < 50 && status === 'connecting') {
          setStatus('calibrating');
          startCalibration();
        }
      });

      setStatus('connected');
    } catch (error) {
      console.error('Erro ao conectar:', error);
      alert('Erro ao conectar ao dispositivo: ' + error.message);
      setStatus('idle');
    }
  };

  const startCalibration = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 3.33; // 30 segundos = 100%
      setCalibrationProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setStatus('ready');
      }
    }, 1000);
  };

  const handleContinue = () => {
    navigate(`/student/session/${sessionId}/active`);
  };

  return (
    <div className="device-connect">
      <h1>Conectar Dispositivo EEG</h1>

      <DeviceStatus
        status={status}
        deviceName={deviceName}
        signalQuality={signalQuality}
        calibrationProgress={calibrationProgress}
      />

      <div className="connect-actions">
        {status === 'idle' && (
          <button onClick={handleConnect} className="btn-primary btn-large">
            🔵 Conectar Bluetooth
          </button>
        )}

        {status === 'calibrating' && (
          <div className="calibration-box">
            <p>Calibrando dispositivo...</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${calibrationProgress}%` }}
              />
            </div>
            <p className="help-text">
              Permaneça relaxado e concentrado durante a calibração.
            </p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className="success-message">
              ✅ Dispositivo conectado e calibrado!
            </div>
            <button onClick={handleContinue} className="btn-primary btn-large">
              Continuar para Sessão →
            </button>
          </>
        )}
      </div>

      <div className="help-section">
        <h3>Instruções</h3>
        <ol>
          <li>Coloque o headset EEG confortavelmente</li>
          <li>Ligue o dispositivo</li>
          <li>Clique em "Conectar Bluetooth"</li>
          <li>Selecione seu dispositivo na lista</li>
          <li>Aguarde a calibração (30 segundos)</li>
        </ol>
      </div>
    </div>
  );
}
```

**Arquivo**: `src/components/student/DeviceStatus.jsx`

```jsx
import React from 'react';

export default function DeviceStatus({ status, deviceName, signalQuality, calibrationProgress }) {
  const statusInfo = {
    idle: { icon: '⚪', text: 'Aguardando conexão', color: 'gray' },
    scanning: { icon: '🔵', text: 'Procurando dispositivos...', color: 'blue' },
    connecting: { icon: '🟡', text: 'Conectando...', color: 'yellow' },
    connected: { icon: '🟢', text: 'Conectado', color: 'green' },
    calibrating: { icon: '🟡', text: 'Calibrando...', color: 'yellow' },
    ready: { icon: '🟢', text: 'Pronto!', color: 'green' }
  };

  const info = statusInfo[status] || statusInfo.idle;

  return (
    <div className={`device-status device-status-${info.color}`}>
      <div className="status-icon">{info.icon}</div>
      <div className="status-content">
        <h3>{info.text}</h3>
        {deviceName && <p>Dispositivo: {deviceName}</p>}
        {signalQuality !== null && (
          <p>
            Qualidade do Sinal: {signalQuality === 0 ? 'Excelente' : signalQuality < 50 ? 'Boa' : 'Ruim'}
            {' '}({200 - signalQuality}/200)
          </p>
        )}
      </div>
    </div>
  );
}
```

---

### **Semana 3: Sessão Ativa e Integração com Jogos**

#### Sessão Ativa do Aluno

**Arquivo**: `src/pages/student/SessionActive.jsx`

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import BluetoothManager from '../../lib/bluetooth';
import ThinkGearParser from '../../lib/thinkgear-parser';
import AttentionCircle from '../../components/student/AttentionCircle';
import GameFrame from '../../components/student/GameFrame';
import SessionStats from '../../components/student/SessionStats';

const PYTHON_WS_URL = 'ws://SEU_SERVIDOR_PYTHON:8080';

export default function SessionActive() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [currentData, setCurrentData] = useState({
    attention: 0,
    relaxation: 0,
    delta: 0,
    theta: 0,
    alpha: 0,
    beta: 0,
    gamma: 0
  });
  const [attentionLevel, setAttentionLevel] = useState('medium');
  const [stats, setStats] = useState({
    duration: 0,
    avgAttention: 0,
    dataPoints: 0
  });
  const wsRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetchSession();
    connectWebSocket();
    setupEEGParser();
    startTimeRef.current = Date.now();

    // Atualizar duração a cada segundo
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setStats(prev => ({ ...prev, duration: elapsed }));
    }, 1000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  const fetchSession = async () => {
    const { data } = await supabase
      .from('sessions')
      .select(`
        *,
        class:classes(name),
        teacher:users!teacher_id(name)
      `)
      .eq('id', sessionId)
      .single();

    setSession(data);

    // Registrar participação
    await supabase
      .from('session_participants')
      .upsert({
        session_id: sessionId,
        student_id: user.id,
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      });
  };

  const connectWebSocket = () => {
    wsRef.current = new WebSocket(PYTHON_WS_URL);

    wsRef.current.onopen = () => {
      console.log('WebSocket Python conectado');
    };

    wsRef.current.onerror = (error) => {
      console.error('Erro WebSocket:', error);
    };
  };

  const setupEEGParser = () => {
    BluetoothManager.onData((bytes) => {
      ThinkGearParser.parseBytes(bytes);
    });

    ThinkGearParser.onParsed((data) => {
      // Atualizar dados atuais
      setCurrentData(prev => ({
        ...prev,
        ...data
      }));

      // Determinar nível de atenção
      if (data.attention !== undefined) {
        let level = 'medium';
        if (data.attention < 40) level = 'low';
        else if (data.attention >= 70) level = 'high';
        setAttentionLevel(level);

        // Atualizar estatísticas
        setStats(prev => {
          const newDataPoints = prev.dataPoints + 1;
          const newAvg = ((prev.avgAttention * prev.dataPoints) + data.attention) / newDataPoints;
          return {
            ...prev,
            avgAttention: newAvg,
            dataPoints: newDataPoints
          };
        });
      }

      // Enviar para servidor Python via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          Codigo: user.id,
          Nome: user.name.replace(/\s+/g, '_'),
          Att: data.attention || 0,
          Med: data.relaxation || 0,
          Delta: Math.floor((data.delta || 0) * 1000000),
          Theta: Math.floor((data.theta || 0) * 1000000),
          LowAlpha: Math.floor((data.alpha || 0) * 500000),
          HighAlpha: Math.floor((data.alpha || 0) * 500000),
          LowBeta: Math.floor((data.beta || 0) * 500000),
          HighBeta: Math.floor((data.beta || 0) * 500000),
          LowGamma: Math.floor((data.gamma || 0) * 500000),
          MiddleGamma: Math.floor((data.gamma || 0) * 500000)
        }));
      }

      // Também enviar para backend Node.js via Socket.io (opcional)
      // socketIo.emit('eeg:data', { sessionId, studentId: user.id, ...data });
    });
  };

  if (!session) {
    return <div className="loading">Carregando sessão...</div>;
  }

  const sessionType = session.config?.session_type || 'aula';

  return (
    <div className="session-active-student">
      <div className="session-header-compact">
        <h2>{session.class.name}</h2>
        <p>Professor: {session.teacher.name}</p>
      </div>

      {/* Indicador de Atenção */}
      <AttentionCircle
        level={attentionLevel}
        attention={currentData.attention}
      />

      {/* Modo Jogo ou Aula */}
      {sessionType === 'jogo' ? (
        <GameFrame sessionId={sessionId} />
      ) : (
        <div className="aula-mode">
          <p className="aula-message">
            Mantenha-se atento à aula.
            <br />
            Seu professor está acompanhando seu progresso.
          </p>
        </div>
      )}

      {/* Estatísticas */}
      <SessionStats stats={stats} />
    </div>
  );
}
```

**Arquivo**: `src/components/student/AttentionCircle.jsx`

```jsx
import React from 'react';

export default function AttentionCircle({ level, attention }) {
  const colors = {
    low: '#EF4444',     // Vermelho
    medium: '#F59E0B',  // Amarelo
    high: '#10B981'     // Verde
  };

  const messages = {
    low: 'Tente se concentrar mais',
    medium: 'Continue assim!',
    high: 'Excelente foco!'
  };

  return (
    <div className="attention-circle-container">
      <div
        className="attention-circle"
        style={{
          backgroundColor: colors[level],
          boxShadow: `0 0 40px ${colors[level]}`
        }}
      >
        <span className="attention-value">{attention}%</span>
      </div>
      <p className="attention-message">{messages[level]}</p>
    </div>
  );
}
```

**Arquivo**: `src/components/student/GameFrame.jsx`

```jsx
import React from 'react';

export default function GameFrame({ sessionId }) {
  // URL do jogo (pode ser selecionado pelo professor)
  const gameUrl = '/games/autorama/index.html';

  return (
    <div className="game-frame-container">
      <iframe
        src={gameUrl}
        title="Neurogame"
        className="game-iframe"
        allow="accelerometer; gyroscope"
      />
    </div>
  );
}
```

**Arquivo**: `src/components/student/SessionStats.jsx`

```jsx
import React from 'react';

export default function SessionStats({ stats }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="session-stats-compact">
      <div className="stat">
        <span className="label">Duração</span>
        <span className="value">{formatDuration(stats.duration)}</span>
      </div>
      <div className="stat">
        <span className="label">Atenção Média</span>
        <span className="value">{stats.avgAttention.toFixed(1)}%</span>
      </div>
      <div className="stat">
        <span className="label">Dados</span>
        <span className="value">{stats.dataPoints}</span>
      </div>
    </div>
  );
}
```

---

## CSS do Módulo Aluno

**Arquivo**: `src/styles/student.css`

```css
/* Student Dashboard */
.student-dashboard {
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.welcome-header {
  text-align: center;
  margin-bottom: 2rem;
}

.class-info {
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

/* Active Session Alert */
.active-session-alert {
  background: linear-gradient(135deg, #CDA434, #F59E0B);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pulse-dot {
  font-size: 1.5rem;
  animation: pulse 1.5s infinite;
}

.btn-join-session {
  background: white;
  color: #CDA434;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

/* Sessions List */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-item {
  background: var(--surface-dark);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.session-icon {
  font-size: 2rem;
}

.session-info {
  flex: 1;
}

.session-info h4 {
  margin: 0 0 0.25rem 0;
}

.session-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Device Connect */
.device-connect {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 12px;
  margin: 2rem 0;
}

.device-status-gray { background: #6B7280; }
.device-status-blue { background: #3B82F6; }
.device-status-yellow { background: #F59E0B; }
.device-status-green { background: #10B981; }

.status-icon {
  font-size: 3rem;
}

.status-content {
  flex: 1;
  color: white;
}

.calibration-box {
  text-align: center;
  margin: 2rem 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: var(--surface-dark);
  border-radius: 10px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #CDA434, #10B981);
  transition: width 1s linear;
}

/* Session Active Student */
.session-active-student {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1rem;
}

.session-header-compact {
  text-align: center;
  margin-bottom: 1rem;
}

.session-header-compact h2 {
  margin: 0;
}

.session-header-compact p {
  margin: 0.25rem 0 0 0;
  color: var(--text-secondary);
}

/* Attention Circle */
.attention-circle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem 0;
}

.attention-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s;
  animation: pulse-circle 2s infinite;
}

@keyframes pulse-circle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.attention-value {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.attention-message {
  margin-top: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Game Frame */
.game-frame-container {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.game-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Aula Mode */
.aula-mode {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.aula-message {
  text-align: center;
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

/* Session Stats Compact */
.session-stats-compact {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: var(--surface-dark);
  border-radius: 8px;
  margin-top: 1rem;
}

.session-stats-compact .stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.session-stats-compact .label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.session-stats-compact .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gold);
  margin-top: 0.25rem;
}
```

---

## Testes de Compatibilidade

### Navegadores Suportados

**Android**:
- ✅ Chrome 79+
- ✅ Edge 79+
- ✅ Opera 66+
- ❌ Firefox (sem Web Bluetooth)
- ❌ Samsung Internet (sem Web Bluetooth)

**iOS/iPadOS**:
- ⚠️ Safari 16+ (suporte limitado, verificar)
- ⚠️ Chrome/Edge iOS (usa motor Safari)

**Desktop**:
- ✅ Chrome 79+
- ✅ Edge 79+
- ✅ Opera 66+
- ❌ Firefox (sem Web Bluetooth)
- ❌ Safari macOS (sem Web Bluetooth)

---

## Instalação PWA - Guia do Usuário

### Android

1. Abra o site no Chrome
2. Toque no menu (⋮) → "Adicionar à tela inicial"
3. Confirme o nome "NeuroOne"
4. Ícone aparecerá na tela inicial

### Windows

1. Abra o site no Chrome/Edge
2. Clique no ícone ➕ na barra de endereço
3. Clique em "Instalar"
4. App aparecerá como programa instalado

---

## Checklist de Conclusão

- [ ] PWA configurado (manifest + service worker)
- [ ] Web Bluetooth funcionando
- [ ] Parser ThinkGear processando dados
- [ ] Dashboard do aluno
- [ ] Conexão com dispositivo EEG
- [ ] Calibração automática
- [ ] Sessão ativa com indicador visual
- [ ] WebSocket Python enviando dados
- [ ] Integração com jogos via iframe
- [ ] Modo aula tradicional
- [ ] Estatísticas em tempo real
- [ ] Instalação PWA testada
- [ ] Compatibilidade navegadores verificada

---

## Próximos Passos

Após completar a Fase 4 (Módulo Aluno PWA), seguir para:

**Fase 5**: Relatórios e Analytics (doc 11-FASE-5-RELATORIOS.md)
- Relatórios detalhados para professores
- Dashboards analíticos para direção
- Exportação de dados
- Visualizações avançadas
