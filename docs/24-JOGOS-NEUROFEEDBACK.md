# 24 - JOGOS DE NEUROFEEDBACK

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura dos Jogos](#arquitetura-dos-jogos)
3. [Integração com EEG](#integração-com-eeg)
4. [Catálogo de Jogos](#catálogo-de-jogos)
5. [Servidor de Comandos](#servidor-de-comandos)
6. [Como Adicionar Novos Jogos](#como-adicionar-novos-jogos)
7. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O NeuroOne inclui **13 jogos HTML5** baseados em neurofeedback que respondem em tempo real aos dados do EEG do aluno. Todos os jogos são construídos com **Three.js** (WebGL) e seguem uma arquitetura padronizada.

### Conceito de Neurofeedback

```
[Aluno concentra] → [Atenção ↑] → [Comando: "reforça"] → [Jogo: acelera carro]
                                                              ↓
[Aluno relaxa] → [Atenção ↓] → [Comando: "penaliza"] → [Jogo: desacelera carro]
```

**Objetivo Pedagógico:**
- Treinar controle atencional
- Melhorar capacidade de foco
- Aumentar engajamento em aulas
- Gamificação do aprendizado

---

## Arquitetura dos Jogos

### Estrutura Padrão

Todos os 13 jogos seguem a mesma estrutura:

```
/Jogos/{Nome_Do_Jogo}/
├── index.html          # Interface (canvas, menu, HUD)
├── game.js             # Lógica do jogo + integração EEG
├── three.min.js        # Three.js library
├── GLTFLoader.js       # Loader de modelos 3D
└── assets/
    ├── modelos/
    │   ├── *.gltf      # Modelos 3D
    │   └── *.glb       # Modelos compactados
    ├── audio/
    │   └── *.mp3       # Música e efeitos sonoros
    └── imagens/
        ├── logo.png    # Logo NeuroOne
        └── *.png       # Texturas
```

### Stack Tecnológico

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Three.js** | r128+ | Renderização 3D WebGL |
| **GLTFLoader** | - | Carregar modelos 3D |
| **Vanilla JS** | ES6 | Lógica do jogo |
| **HTML5 Canvas** | - | Rendering |
| **Web Audio API** | - | Som |

---

## Integração com EEG

### Fluxo de Comunicação

```
┌────────────────────────────────────────────────────────────┐
│                    FLUXO DE NEUROFEEDBACK                   │
└────────────────────────────────────────────────────────────┘

[Aluno + EEG] → [PWA] → [WebSocket] → [Backend Node.js]
                                             ↓
                                    [Processa dados EEG]
                                             ↓
                              [Determina: reforça ou penaliza]
                                             ↓
                                    [API Comandos :5001]
                                             ↓
                                       [Jogo HTML5]
                                             ↓
                                    [Executa ação no jogo]
```

### API de Comandos (Porta 5001)

**Endpoint:** `http://localhost:5001/comando_jogo`

**Método:** GET

**Response:**
```json
{
  "indiceComando": 123,
  "objetivo": "velocidade",
  "comando": "reforça"
}
```

ou

```json
{
  "indiceComando": 124,
  "objetivo": "velocidade",
  "comando": "penaliza"
}
```

### Lógica de Decisão

```javascript
// Backend Node.js determina comando baseado em atenção/relaxamento

function determinarComando(attention, relaxation) {
    if (attention > 70) {
        return {
            objetivo: 'velocidade',
            comando: 'reforça'  // Aluno focado → recompensa
        };
    } else if (attention < 40) {
        return {
            objetivo: 'velocidade',
            comando: 'penaliza'  // Aluno distraído → penalidade
        };
    } else {
        return null;  // Zona neutra
    }
}
```

### Implementação no Jogo

**Código padrão em `game.js`:**

```javascript
// Variáveis globais
let ultimoIndiceComando = null;
let objetivoAtual = null;
let comandoAtual = null;

// Polling a cada 1 segundo
setInterval(() => {
    fetch('http://localhost:5001/comando_jogo')
        .then(response => response.json())
        .then(data => {
            // Verifica se é comando novo
            if (data.indiceComando !== ultimoIndiceComando) {
                ultimoIndiceComando = data.indiceComando;
                objetivoAtual = data.objetivo;
                comandoAtual = data.comando;

                // Executa ação correspondente
                executarAcao(objetivoAtual, comandoAtual);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar comando:', error);
        });
}, 1000);

// Executar ação baseada no comando
function executarAcao(objetivo, comando) {
    if (objetivo === 'velocidade') {
        if (comando === 'reforça') {
            aumentarVelocidade();  // Acelera
        } else if (comando === 'penaliza') {
            diminuirVelocidade();  // Desacelera
        }
    }
    // Adicionar outros objetivos conforme necessário
}

// Funções de ação (variam por jogo)
function aumentarVelocidade() {
    velocidadeAtual += 5;
    velocidadeAtual = Math.min(velocidadeAtual, velocidadeMaxima);
}

function diminuirVelocidade() {
    velocidadeAtual -= 3;
    velocidadeAtual = Math.max(velocidadeAtual, velocidadeMinima);
}
```

---

## Catálogo de Jogos

### 1. AUTORAMA 🏎️

**Pasta:** `/Jogos/AUTORAMA/`

**Tipo:** Corrida de velocidade

**Objetivo:** Completar 12 voltas no menor tempo possível

**Mecânica:**
- Controle de velocidade via neurofeedback
- **Reforça:** Acelera carro
- **Penaliza:** Desacelera carro

**Assets:**
- `mapa.gltf`, `mapa2.gltf` - Pistas 3D
- `carro.gltf` até `carro4.gltf` - 4 modelos de carros
- `chegada.gltf` - Linha de chegada
- `musicacorrida.mp3` - Trilha sonora

**Dificuldade:** ⭐⭐ Média

**Idade recomendada:** 8+

---

### 2. BALÃO (Corrida de Balões) 🎈

**Pasta:** `/Jogos/BALAO/`

**Tipo:** Competição vertical

**Objetivo:** Ultrapassar 5 balões oponentes e chegar em 1º lugar

**Mecânica:**
- Controle de altitude via neurofeedback
- **Reforça:** Balão sobe
- **Penaliza:** Balão desce

**Assets:**
- `mapa.gltf` - Cenário céu
- `balao.gltf` - Balão do jogador
- `balao2.gltf` a `balao6.gltf` - 5 oponentes
- `chegada.gltf` - Ponto de chegada
- `musica.mp3` - Trilha sonora

**Dificuldade:** ⭐ Fácil

**Idade recomendada:** 6+

---

### 3. BATALHA DE TANQUES 💥

**Pasta:** `/Jogos/BATALHA DE TANQUES/`

**Tipo:** Ação e combate

**Objetivo:** Destruir tanques inimigos e sobreviver o máximo de tempo

**Mecânica:**
- Movimento controlado por neurofeedback
- **Reforça:** Aumenta velocidade de movimento
- **Penaliza:** Diminui velocidade

**Assets:**
- `mapa2.gltf` - Campo de batalha
- `tanque.gltf` - Tanque do jogador
- `tanque2.gltf` - Tanques inimigos
- `explosao.gltf` - Efeito de explosão
- `explosao.mp3`, `tiro.mp3`, `tanque.mp3` - Efeitos sonoros
- `musicaguerra.mp3` - Trilha sonora

**Dificuldade:** ⭐⭐⭐ Difícil

**Idade recomendada:** 10+

---

### 4. DESAFIO AÉREO ✈️

**Pasta:** `/Jogos/DESAFIO AEREO/`

**Tipo:** Navegação aérea

**Objetivo:** Pilotar avião e passar por pontos de controle

**Mecânica:**
- Controle de voo via neurofeedback
- **Reforça:** Aumenta velocidade do avião
- **Penaliza:** Diminui velocidade

**Assets:**
- `mapa3.gltf` - Cenário aéreo
- `aviao.gltf` - Avião
- `objetivo.gltf` - Checkpoint
- `aviao2.mp3` - Som do motor
- `check.mp3` - Som ao passar checkpoint
- `musicaaviao.mp3` - Trilha sonora

**Dificuldade:** ⭐⭐ Média

**Idade recomendada:** 8+

---

### 5. LABIRINTO 🧩

**Pasta:** `/Jogos/LABIRINTO/`

**Tipo:** Exploração e puzzle

**Objetivo:** Encontrar saída do labirinto

**Mecânica:**
- Velocidade de movimento via neurofeedback
- **Reforça:** Anda mais rápido
- **Penaliza:** Anda mais devagar

**Assets:**
- `labirinto.gltf` - Estrutura 3D do labirinto
- `personagem.gltf` - Personagem jogável
- `objetivo.gltf` - Saída
- `musicalabirinto.mp3` - Trilha sonora

**Dificuldade:** ⭐⭐ Média

**Idade recomendada:** 7+

---

### 6. MISSÃO ESPACIAL 🚀

**Pasta:** `/Jogos/MISSAO ESPACIAL/`

**Tipo:** Ação espacial

**Objetivo:** Desviar de asteroides e completar missão

**Mecânica:**
- Controle de velocidade da nave
- **Reforça:** Acelera nave
- **Penaliza:** Desacelera nave

**Assets:**
- `espaco2.gltf`, `planeta.gltf` - Cenário espacial
- `foguete4.gltf` - Nave espacial
- `fogo.gltf` - Efeito de propulsão
- `asteroide2.gltf` - Obstáculos
- `efeitonave.mp3` - Som da nave
- `musicaespaco2.mp3` - Trilha sonora

**Dificuldade:** ⭐⭐⭐ Difícil

**Idade recomendada:** 9+

---

### 7. TESOURO DO MAR 🌊

**Pasta:** `/Jogos/TESOURO DO MAR/`

**Tipo:** Exploração subaquática

**Objetivo:** Encontrar tesouro no fundo do mar

**Mecânica:**
- Controle de profundidade de mergulho
- **Reforça:** Mergulha mais fundo
- **Penaliza:** Sobe para superfície

**Assets:**
- `mapa2.gltf` - Fundo do mar
- `tesouro.gltf` - Baú do tesouro
- `pedra.gltf` - Obstáculos
- `peixenovo2.gltf` - Peixes
- `musicatesouro.mp3` - Trilha sonora

**Dificuldade:** ⭐⭐ Média

**Idade recomendada:** 7+

---

### 8. RESGATE EM CHAMAS 🚒

**Pasta:** `/Jogos/RESGATE EM CHAMAS/`

**Tipo:** Simulação de resgate

**Objetivo:** Apagar incêndios e resgatar pessoas

**Mecânica:**
- Controle de intensidade da água
- **Reforça:** Jato mais forte (apaga fogo mais rápido)
- **Penaliza:** Jato mais fraco

**Assets:**
- `cidade.gltf`, `cidade2.gltf` - Cenário urbano
- `caminhao3.gltf` - Caminhão de bombeiros
- `fogo.gltf` - Efeito de fogo
- `agua2.gltf` - Jato d'água
- `caminhao.mp3` - Som do caminhão
- `agua.mp3` - Som da água
- `musicabombeiro.mp3` - Trilha sonora

**Dificuldade:** ⭐⭐ Média

**Idade recomendada:** 8+

---

### 9. DESAFIO NAS ALTURAS 🪜

**Pasta:** `/Jogos/DESAFIO NAS ALTURAS/`

**Tipo:** Plataforma vertical

**Objetivo:** Subir o mais alto possível em plataformas

**Mecânica:**
- Controle de altura de pulo
- **Reforça:** Pulos mais altos
- **Penaliza:** Pulos mais baixos

**Assets:**
- `mapa2.gltf` - Plataformas
- `personagem2.gltf` - Personagem

**Dificuldade:** ⭐⭐⭐ Difícil

**Idade recomendada:** 9+

---

### 10. DESAFIO AUTOMOTIVO 🏁

**Pasta:** `/Jogos/DESAFIO AUTOMOTIVO/`

**Tipo:** Corrida com obstáculos

**Objetivo:** Completar pista evitando colisões

**Mecânica:**
- Controle de velocidade
- **Reforça:** Acelera
- **Penaliza:** Desacelera

**Assets:**
- `mapanovo1.gltf` - Pista
- `carro3.gltf` - Carro
- `objetivo.gltf` - Checkpoints
- `colisao3.gltf`, `colisaonova.gltf` - Obstáculos

**Dificuldade:** ⭐⭐ Média

**Idade recomendada:** 8+

---

### 11. FAZENDINHA 🚜

**Pasta:** `/Jogos/FAZENDINHA/`

**Tipo:** Coleta e fazenda

**Objetivo:** Coletar vegetais com trator

**Mecânica:**
- Controle de velocidade do trator
- **Reforça:** Trator mais rápido
- **Penaliza:** Trator mais lento

**Assets:**
- `fazenda.gltf`, `fazenda-bkp.gltf` - Cenário rural
- `trator.gltf` - Trator
- `milho.gltf`, `cenoura.gltf`, `couve.gltf` - Vegetais
- `objetivo.gltf` - Ponto de entrega

**Dificuldade:** ⭐ Fácil

**Idade recomendada:** 6+

---

### 12. TAXI CITY 🚕

**Pasta:** `/Jogos/TAXI CITY/`

**Tipo:** Transporte urbano

**Objetivo:** Buscar e levar passageiros aos destinos

**Mecânica:**
- Controle de velocidade do táxi
- **Reforça:** Táxi mais rápido (gorjeta maior)
- **Penaliza:** Táxi mais lento

**Assets:**
- `mapa2.gltf` - Cidade
- `taxi.gltf` - Táxi
- `passageiro.gltf` - Passageiro
- `objetivo.gltf` - Destinos

**Dificuldade:** ⭐⭐ Média

**Idade recomendada:** 8+

---

### 13. CORRENDO PELOS TRILHOS 🚂

**Pasta:** `/Jogos/CORRENDO PELOS TRILHOS/`

**Tipo:** Corrida em trilhos

**Objetivo:** Correr e coletar tesouros

**Mecânica:**
- Controle de velocidade de corrida
- **Reforça:** Corre mais rápido
- **Penaliza:** Corre mais devagar

**Assets:**
- `mapa2.gltf` - Trilhos
- `personagem3.gltf` - Personagem
- `vagao.gltf` - Vagão de trem
- `tesouro.gltf` - Tesouros colecionáveis

**Dificuldade:** ⭐⭐ Média

**Idade recomendada:** 7+

---

## Servidor de Comandos

### Implementação Backend (Node.js)

**Arquivo:** `biosync-backend/src/controllers/gameCommandController.js`

```javascript
const express = require('express');
const router = express.Router();

// Armazena último comando por sessão
const comandosPorSessao = new Map();

// Variável global de índice
let indiceGlobal = 0;

// Endpoint que o jogo consulta
router.get('/comando_jogo', (req, res) => {
    const sessionId = req.query.sessionId || 'default';

    // Busca comando da sessão ativa
    const comando = comandosPorSessao.get(sessionId);

    if (comando) {
        res.json(comando);
    } else {
        // Sem comando ativo
        res.json({
            indiceComando: indiceGlobal,
            objetivo: null,
            comando: null
        });
    }
});

// Endpoint interno: atualiza comando baseado em EEG
function atualizarComando(sessionId, attention, relaxation) {
    let comando = null;

    // Lógica de decisão
    if (attention > 75) {
        comando = {
            indiceComando: ++indiceGlobal,
            objetivo: 'velocidade',
            comando: 'reforça'
        };
    } else if (attention < 40) {
        comando = {
            indiceComando: ++indiceGlobal,
            objetivo: 'velocidade',
            comando: 'penaliza'
        };
    }

    if (comando) {
        comandosPorSessao.set(sessionId, comando);

        // Expira comando após 5 segundos
        setTimeout(() => {
            comandosPorSessao.delete(sessionId);
        }, 5000);
    }
}

module.exports = { router, atualizarComando };
```

**Integração com WebSocket:**

```javascript
// biosync-backend/src/websocket/sessionHandler.js

const { atualizarComando } = require('../controllers/gameCommandController');

io.on('connection', (socket) => {
    socket.on('eeg:data', (data) => {
        const { sessionId, studentId, attention, relaxation } = data;

        // Salvar no banco
        saveEEGData(data);

        // Atualizar comando do jogo
        atualizarComando(sessionId, attention, relaxation);

        // Broadcast para professor
        io.to(sessionId).emit('eeg:update', data);
    });
});
```

### Configuração da Porta 5001

**Adicionar em `biosync-backend/src/server.js`:**

```javascript
const gameCommandRouter = require('./controllers/gameCommandController').router;

// CORS para jogos locais
app.use('/comando_jogo', cors({ origin: '*' }), gameCommandRouter);

// Servidor na porta 5001 (separado do principal 3000)
const gameCommandServer = express();
gameCommandServer.use(cors({ origin: '*' }));
gameCommandServer.use('/comando_jogo', gameCommandRouter);
gameCommandServer.listen(5001, () => {
    console.log('Servidor de comandos rodando na porta 5001');
});
```

---

## Como Adicionar Novos Jogos

### Passo 1: Estrutura de Pastas

```bash
cd Jogos
mkdir MEU_NOVO_JOGO
cd MEU_NOVO_JOGO
```

### Passo 2: Criar `index.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Meu Novo Jogo - NeuroOne</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        #canvas {
            width: 100vw;
            height: 100vh;
            display: block;
        }
        #hud {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-size: 18px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
    </style>
</head>
<body>
    <div id="hud">
        <div>Pontuação: <span id="score">0</span></div>
        <div>Status EEG: <span id="eeg-status">Aguardando...</span></div>
    </div>
    <canvas id="canvas"></canvas>

    <script src="three.min.js"></script>
    <script src="GLTFLoader.js"></script>
    <script src="game.js"></script>
</body>
</html>
```

### Passo 3: Criar `game.js`

```javascript
// Configuração Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Variáveis de jogo
let pontuacao = 0;
let velocidade = 5;

// Variáveis de EEG
let ultimoIndiceComando = null;

// Loop de jogo
function animate() {
    requestAnimationFrame(animate);

    // Lógica do jogo aqui
    atualizarJogo();

    renderer.render(scene, camera);
}

function atualizarJogo() {
    // Sua lógica aqui
}

// Integração EEG
setInterval(() => {
    fetch('http://localhost:5001/comando_jogo')
        .then(response => response.json())
        .then(data => {
            if (data.indiceComando !== ultimoIndiceComando) {
                ultimoIndiceComando = data.indiceComando;

                if (data.comando === 'reforça') {
                    velocidade += 2;
                    document.getElementById('eeg-status').textContent = '🟢 Focado!';
                } else if (data.comando === 'penaliza') {
                    velocidade -= 1;
                    document.getElementById('eeg-status').textContent = '🔴 Distraído';
                }
            }
        })
        .catch(error => console.error('Erro EEG:', error));
}, 1000);

// Iniciar
animate();
```

### Passo 4: Copiar Dependências

```bash
# Copiar de outro jogo
cp ../AUTORAMA/three.min.js .
cp ../AUTORAMA/GLTFLoader.js .
```

### Passo 5: Adicionar Assets

```bash
mkdir assets
# Adicionar modelos 3D, áudios, texturas
```

### Passo 6: Testar

```bash
# Abrir no navegador
open index.html
```

---

## Troubleshooting

### ❌ "Erro CORS ao buscar comando"

**Sintomas:**
```
Access to fetch at 'http://localhost:5001/comando_jogo' from origin 'file://'
has been blocked by CORS policy
```

**Solução:**
```javascript
// Backend - Habilitar CORS
const cors = require('cors');
app.use(cors({ origin: '*' }));

// OU hospedar jogos em servidor local
npx http-server Jogos -p 8000
# Abrir: http://localhost:8000/AUTORAMA/
```

---

### ❌ "Comando não está mudando no jogo"

**Sintomas:** Jogo não responde ao neurofeedback

**Solução:**
1. Verificar se servidor porta 5001 está rodando
2. Verificar console do navegador (F12)
3. Testar endpoint manualmente:
```bash
curl http://localhost:5001/comando_jogo
```

---

### ❌ "Modelos 3D não carregam"

**Sintomas:** Tela preta, nada aparece

**Solução:**
1. Verificar caminho dos arquivos `.gltf`
2. Abrir DevTools > Network > verificar 404
3. Garantir que `GLTFLoader.js` foi incluído

---

### ❌ "Jogo muito rápido/lento"

**Sintomas:** Velocidade inadequada

**Solução:**
```javascript
// Ajustar delta time
const clock = new THREE.Clock();

function animate() {
    const delta = clock.getDelta();

    // Usar delta para normalizar velocidade
    objeto.position.x += velocidade * delta * 60;  // 60 FPS base

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
```

---

## Referências

- **Three.js Documentation:** https://threejs.org/docs/
- **GLTF Format:** https://www.khronos.org/gltf/
- **Web Audio API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Neurofeedback Games Research:** https://www.frontiersin.org/articles/10.3389/fnhum.2016.00522/full

---

**Documento:** 24-JOGOS-NEUROFEEDBACK.md
**Versão:** 1.0
**Data:** 07/11/2025
**Autor:** Claude Code (NeuroOne Team)
