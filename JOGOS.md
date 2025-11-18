# 🎮 Jogos Integrados - NeuroOne

**Versão:** 2.5.0
**Última atualização:** 18/11/2025

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Jogos Disponíveis](#jogos-disponíveis)
- [Arquitetura](#arquitetura)
- [Como Acessar](#como-acessar)
- [Tecnologias](#tecnologias)
- [Desenvolvimento](#desenvolvimento)

---

## 🎯 Visão Geral

O NeuroOne inclui jogos neurofeedback que utilizam **EEG em tempo real** via MindWave Mobile headset para treinar atenção, meditação e controle cognitivo.

**Principais Features:**
- ✅ Conexão Bluetooth com MindWave Mobile (Web Bluetooth API)
- ✅ Feedback em tempo real baseado em métricas EEG
- ✅ Jogos 3D imersivos (Three.js)
- ✅ Monitor EEG standalone para visualização de dados
- ✅ Servidos estaticamente pelo backend Express

---

## 🎮 Jogos Disponíveis

### 1. **Fazendinha** 🚜

**Descrição:** Jogo de fazenda 3D onde o jogador controla um trator para colher vegetais.

**Objetivo:** Coletar 42+ vegetais (milho, cenoura, couve) e levá-los ao celeiro.

**Controle via Neurofeedback:**
- **Atenção > 51%** → Trator acelera ✅
- **Atenção < 45%** → Trator para ❌
- **Controles manuais:** Setas do teclado ou swipes (mobile)

**Tecnologias:**
- Three.js (engine 3D)
- GLTFLoader (modelos 3D)
- Web Bluetooth API
- ThinkGear protocol

**Localização:** `neuroone-backend/public/games/fazendinha/`

**URL de Acesso:** `http://localhost:3001/games/fazendinha/index.html`

**Arquivos Principais:**
```
fazendinha/
├── index.html          # UI do jogo, menu, HUD
├── game.js             # Lógica principal do jogo
├── three.min.js        # Three.js library
├── GLTFLoader.js       # Loader de modelos 3D
└── assets/
    ├── funcoes.js      # Bluetooth, EEG parsing, feedback
    ├── fazenda.gltf    # Cenário 3D da fazenda
    ├── trator.gltf     # Modelo 3D do trator
    ├── milho.gltf      # Vegetais coletáveis
    ├── cenoura.gltf
    ├── couve.gltf
    ├── objetivo.gltf   # Celeiro (meta)
    ├── estilo.css      # Estilos do jogo
    └── *.mp3           # Áudios (música, efeitos)
```

---

### 2. **Monitor EEG** 📊

**Descrição:** Interface standalone para monitoramento visual de dados EEG em tempo real.

**Features:**
- LED de status (Verde/Vermelho/Cinza) baseado em atenção
- Entrada de nome do aluno
- Visualização de métricas EEG:
  - Atenção (Att)
  - Meditação (Med)
  - Ondas cerebrais (Delta, Theta, Alpha, Beta, Gamma)

**Localização:** `neuroone-backend/public/monitor/`

**URL de Acesso:** `http://localhost:3001/monitor/eeg-monitor.html`

**Estados do LED:**
- 🟢 **Verde** → Atenção > 51%
- 🔴 **Vermelho** → Atenção < 45%
- ⚪ **Cinza** → Aguardando/Neutro

---

## 🏗️ Arquitetura

### **Estrutura de Diretórios**

```
neuroone-backend/
├── public/
│   ├── games/
│   │   └── fazendinha/          # Jogo Fazendinha
│   │       ├── index.html
│   │       ├── game.js
│   │       ├── three.min.js
│   │       ├── GLTFLoader.js
│   │       └── assets/
│   │           ├── funcoes.js
│   │           ├── *.gltf (modelos 3D)
│   │           ├── *.mp3 (áudios)
│   │           └── estilo.css
│   └── monitor/
│       └── eeg-monitor.html      # Monitor EEG
└── src/
    └── server.js                 # Express static serving configurado
```

### **Express Static Serving**

```javascript
// server.js (linhas 50-53)
app.use('/games', express.static(path.join(__dirname, '../public/games')));
app.use('/monitor', express.static(path.join(__dirname, '../public/monitor')));
logger.info('🎮 Static files serving enabled: /games and /monitor');
```

---

## 🚀 Como Acessar

### **Desenvolvimento Local**

1. **Iniciar Backend:**
   ```bash
   cd neuroone-backend
   npm run dev
   ```
   Backend rodará em: `http://localhost:3001`

2. **Acessar Jogos Diretamente:**
   - Fazendinha: http://localhost:3001/games/fazendinha/index.html
   - Monitor EEG: http://localhost:3001/monitor/eeg-monitor.html

3. **Conectar MindWave:**
   - Ligar headset MindWave Mobile
   - LED deve piscar (modo pairing)
   - No jogo/monitor, clicar em "Conectar" (modal Bluetooth)
   - Selecionar "MindWave Mobile" na lista
   - Aguardar conexão (LED fixo = conectado)

### **Via Frontend (Futuro)**

Integração planejada no StudentSession:

```jsx
// StudentSession.jsx
<Select value={selectedGame}>
  <MenuItem value="concentration">Concentração</MenuItem>
  <MenuItem value="balance">Balanço</MenuItem>
  <MenuItem value="fazendinha">Fazendinha</MenuItem> {/* ✅ */}
</Select>

{selectedGame === 'fazendinha' && (
  <iframe
    src={`${API_URL}/games/fazendinha/index.html?sessionId=${sessionId}`}
    width="100%"
    height="600px"
  />
)}
```

---

## 🛠️ Tecnologias

### **Frontend Jogos**

| Tecnologia | Uso |
|------------|-----|
| **Three.js** | Engine 3D para renderização |
| **GLTFLoader** | Carregamento de modelos 3D |
| **Web Bluetooth API** | Conexão com MindWave headset |
| **Socket.IO Client** | Comunicação WebSocket (preparado) |
| **Vanilla JS** | Lógica do jogo, física, colisões |

### **EEG Integration**

| Componente | Descrição |
|------------|-----------|
| **ThinkGear Protocol** | Protocolo de comunicação MindWave |
| **Packet Parsing** | Decodificação de pacotes binários EEG |
| **Attention/Meditation** | Métricas principais (0-100) |
| **Brain Waves** | Delta, Theta, Alpha, Beta, Gamma |

### **Backend**

| Tecnologia | Uso |
|------------|-----|
| **Express.js** | Servidor HTTP + static files |
| **Socket.IO** | WebSocket server (preparado) |
| **Node.js** | Runtime JavaScript |

---

## 💻 Desenvolvimento

### **Adicionar Novo Jogo**

1. **Criar pasta:**
   ```bash
   mkdir neuroone-backend/public/games/novo-jogo
   ```

2. **Estrutura mínima:**
   ```
   novo-jogo/
   ├── index.html        # Entry point
   ├── game.js           # Lógica do jogo
   └── assets/
       ├── styles.css
       └── eeg.js        # Integração EEG
   ```

3. **Conectar Bluetooth:**
   ```javascript
   // Copiar de fazendinha/assets/funcoes.js
   async function connectAndDiscover() {
     device = await navigator.bluetooth.requestDevice({
       filters: [{ services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }]
     });
     server = await device.gatt.connect();
     // ...
   }
   ```

4. **Parsear dados EEG:**
   ```javascript
   function parseThinkGearPacket(buffer) {
     // Implementação em funcoes.js
     // Retorna: Attention, Meditation, Brain Waves
   }
   ```

5. **Acessar:**
   ```
   http://localhost:3001/games/novo-jogo/index.html
   ```

### **Integração com Socket.IO (Opcional)**

Para enviar dados EEG para o backend NeuroOne:

1. **Adicionar Socket.IO client:**
   ```html
   <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
   ```

2. **Conectar ao backend:**
   ```javascript
   const socket = io('http://localhost:3001', {
     auth: { token: JWT_TOKEN }
   });

   socket.emit('student:join', { sessionId, studentId });
   ```

3. **Enviar dados EEG:**
   ```javascript
   socket.emit('eeg:data', {
     sessionId,
     studentId,
     attention: 75,
     meditation: 60,
     timestamp: Date.now()
   });
   ```

---

## 📊 Dados EEG - Referência

### **Métricas Principais**

| Métrica | Range | Descrição |
|---------|-------|-----------|
| **Attention** | 0-100 | Nível de foco/concentração |
| **Meditation** | 0-100 | Nível de relaxamento |
| **Poor Signal** | 0-200 | Qualidade do sinal (0 = perfeito) |

### **Ondas Cerebrais**

| Onda | Frequência | Significado |
|------|------------|-------------|
| **Delta** | 0.5-4 Hz | Sono profundo |
| **Theta** | 4-8 Hz | Meditação, criatividade |
| **Low Alpha** | 8-10 Hz | Relaxamento |
| **High Alpha** | 10-12 Hz | Relaxamento ativo |
| **Low Beta** | 12-18 Hz | Concentração leve |
| **High Beta** | 18-30 Hz | Foco intenso |
| **Low Gamma** | 30-50 Hz | Processamento cognitivo |
| **Mid Gamma** | 50-100 Hz | Atenção elevada |

---

## 🔧 Troubleshooting

### **Bluetooth não conecta**

**Problema:** Modal Bluetooth não aparece ou não encontra dispositivo.

**Soluções:**
1. Verificar se está em HTTPS (produção) ou localhost (dev)
2. Usar Chrome/Edge (Firefox não suporta Web Bluetooth API)
3. Verificar se MindWave está em modo pairing (LED piscando)
4. Tentar parear via configurações do sistema primeiro

### **Dados EEG não aparecem**

**Problema:** LED permanece cinza, sem dados.

**Soluções:**
1. Verificar se headset está no contato correto (testa + orelha)
2. Verificar se `Poor Signal` está baixo (< 50)
3. Limpar sensores com álcool isopropílico
4. Aguardar 10-15 segundos para calibração automática

### **Jogo não carrega**

**Problema:** Erro 404 ou página em branco.

**Soluções:**
1. Verificar se backend está rodando (`npm run dev`)
2. Confirmar URL: `http://localhost:3001/games/fazendinha/index.html`
3. Verificar console do navegador (F12) para erros JavaScript
4. Limpar cache do navegador (Ctrl+Shift+R)

---

## 📝 Próximas Melhorias

### **Planejadas**
- [ ] Integração completa com Socket.IO backend
- [ ] Autenticação via JWT para jogos
- [ ] Salvamento de resultados em sessões
- [ ] Mais jogos neurofeedback
- [ ] Modo multiplayer (competição)
- [ ] Dashboard de estatísticas de jogo

### **Em Desenvolvimento**
- [ ] StudentSession com seletor de jogos
- [ ] Passar sessionId via URL params
- [ ] Gráficos em tempo real de performance

---

## 📞 Suporte

**Documentação Principal:** [README.md](README.md)
**Deploy:** [DEPLOY.md](DEPLOY.md)
**Quick Start:** [QUICK-START.md](QUICK-START.md)

**Problemas ou Dúvidas:** Abra uma issue no repositório

---

**Desenvolvido por:** Equipe NeuroOne
**Versão:** 2.5.0 - Jogos Integrados
**Data:** Novembro 2025
