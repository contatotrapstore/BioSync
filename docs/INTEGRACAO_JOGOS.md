# 🎮 Guia de Integração dos Jogos HTML5

Este guia explica como os 14 jogos HTML5 existentes são integrados à plataforma BioSync.

## 📁 Estrutura dos Jogos

Todos os jogos seguem esta estrutura básica:

```
Jogos/
├── [nome-do-jogo]/
│   ├── index.html       # Ponto de entrada
│   ├── game.js          # Lógica do jogo
│   ├── assets/          # Recursos (imagens, sons, modelos)
│   │   ├── models/
│   │   ├── textures/
│   │   └── sounds/
│   └── libs/            # Bibliotecas (Three.js, etc)
│       ├── three.min.js
│       └── GLTFLoader.js
```

## 🔗 Como os Jogos São Servidos

### Backend (Express)

O backend serve os jogos como arquivos estáticos:

```javascript
// biosync-backend/src/server.js
const path = require('path');
const gamesDir = process.env.GAMES_DIR || '../Jogos';

app.use('/games', express.static(path.join(__dirname, gamesDir)));
```

### URLs dos Jogos

Cada jogo fica acessível em:
```
http://localhost:3000/games/[nome-da-pasta]/index.html
```

Exemplos:
- `http://localhost:3000/games/autorama/index.html`
- `http://localhost:3000/games/balao/index.html`
- `http://localhost:3000/games/batalhadetanques/index.html`

## 📊 Metadados dos Jogos no Banco de Dados

Os jogos são cadastrados no banco via seed:

```javascript
// biosync-backend/src/utils/seed.js
const gamesData = [
  {
    name: 'Autorama',
    slug: 'autorama',
    description: 'Jogo de corrida emocionante...',
    folderPath: 'Jogos/autorama',  // Caminho relativo
    category: 'Corrida',
    coverImage: null,  // Opcional: URL da capa
    order: 1
  },
  // ... outros jogos
];
```

## 🎯 Fluxo de Acesso ao Jogo

### 1. Usuário clica em "Jogar" no Launcher

```jsx
// biosync-launcher/src/components/GameCard.jsx
const handlePlay = async () => {
  if (!game.hasAccess) {
    alert('Você não tem acesso a este jogo.');
    return;
  }
  onPlay(game);  // Abre GamePlayer
};
```

### 2. Validação de Acesso

```jsx
// biosync-launcher/src/components/GamePlayer.jsx
const validateAccess = async () => {
  const response = await gamesAPI.validateAccess(game.id);
  if (response.data.data.hasAccess) {
    setValidated(true);
  } else {
    setError('Acesso negado');
  }
};
```

### 3. Backend Valida Permissões

```javascript
// biosync-backend/src/controllers/gameController.js
exports.validateAccess = async (req, res) => {
  const { id: gameId } = req.params;
  const userId = req.user.id;

  // Verifica assinatura do usuário
  const hasSubscriptionAccess = // ... lógica

  // Verifica acesso individual
  const hasIndividualAccess = // ... lógica

  const hasAccess = hasSubscriptionAccess || hasIndividualAccess;

  // Registra acesso
  if (hasAccess) {
    await AccessHistory.create({ userId, gameId, ipAddress: req.ip });
  }

  res.json({ success: true, data: { hasAccess, game } });
};
```

### 4. Jogo é Carregado no WebView

```jsx
// biosync-launcher/src/components/GamePlayer.jsx
const gameUrl = `http://localhost:3000/games/${game.folderPath}/index.html`;

return (
  <webview
    src={gameUrl}
    className="game-webview"
    allowFullScreen
  />
);
```

## 🔧 Adaptando Jogos Existentes

Se seus jogos HTML5 já estão prontos, siga estes passos:

### 1. Verificar Estrutura

Certifique-se que cada jogo tem:
- ✅ `index.html` na raiz da pasta
- ✅ Caminhos relativos para assets
- ✅ Sem dependências externas de rede (CDN)

### 2. Corrigir Caminhos

```html
<!-- ❌ Evite caminhos absolutos -->
<script src="/assets/game.js"></script>

<!-- ✅ Use caminhos relativos -->
<script src="./game.js"></script>
<script src="./assets/lib.js"></script>
```

### 3. Adicionar Fullscreen (Opcional)

```javascript
// game.js - Adicionar botão de fullscreen
function requestFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
}

// Adicionar botão no HTML
// <button onclick="requestFullscreen()">Tela Cheia</button>
```

### 4. Adicionar ao Seed

Edite `biosync-backend/src/utils/seed.js`:

```javascript
const gamesData = [
  // ... jogos existentes
  {
    name: 'Meu Novo Jogo',
    slug: 'meunovojojogo',
    description: 'Descrição do jogo...',
    folderPath: 'Jogos/meunovojojogo',
    category: 'Aventura',
    coverImage: null,
    order: 14
  }
];
```

### 5. Executar Seed

```bash
cd biosync-backend
npm run seed
```

## 🖼️ Adicionando Capas aos Jogos

### Opção 1: Arquivos Locais

1. Crie pasta para capas:
```bash
mkdir biosync-backend/uploads/covers
```

2. Adicione imagens (formato: `slug.jpg` ou `slug.png`)

3. Atualize no seed:
```javascript
coverImage: '/uploads/covers/autorama.jpg'
```

### Opção 2: URLs Externas

```javascript
coverImage: 'https://seu-cdn.com/images/autorama.jpg'
```

### Opção 3: Via Dashboard Admin

1. Acesse Dashboard → Jogos → Editar
2. Upload de imagem de capa
3. API atualiza o campo `coverImage`

## 🎨 Personalizando a Aparência

### Adicionar Logo da Plataforma nos Jogos

```html
<!-- Adicionar no index.html de cada jogo -->
<div id="game-header">
  <img src="http://localhost:3000/assets/logo.png" alt="BioSync" />
  <button onclick="exitGame()">Sair</button>
</div>

<script>
function exitGame() {
  // No launcher Electron, isso retornará à biblioteca
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
}
</script>
```

## 📊 Rastreamento de Uso

### Registrar Tempo de Jogo

```javascript
// Adicionar no game.js de cada jogo
let gameStartTime = Date.now();

window.addEventListener('beforeunload', function() {
  const duration = Math.floor((Date.now() - gameStartTime) / 1000);

  // Enviar para API (se necessário)
  fetch('http://localhost:3000/api/v1/games/log-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      gameId: '[GAME_ID]',
      duration: duration
    })
  });
});
```

## 🔍 Testando Jogos

### Teste Individual (Navegador)

```bash
# Iniciar apenas o backend
cd biosync-backend
npm run dev

# Acessar no navegador
http://localhost:3000/games/autorama/index.html
```

### Teste com Autenticação

1. Fazer login no launcher ou dashboard
2. Pegar token do localStorage (DevTools → Application → Local Storage)
3. Usar token em requisições

### Teste no Launcher

```bash
cd biosync-launcher
npm start
# Login e testar cada jogo
```

## 🐛 Solução de Problemas

### Jogo não carrega

**Problema:** Tela branca ou erro 404

**Soluções:**
1. Verificar se `folderPath` está correto no banco
2. Confirmar que `index.html` existe na pasta
3. Verificar console do navegador (F12) para erros

```bash
# Verificar estrutura
ls Jogos/autorama/
# Deve listar: index.html, game.js, etc.
```

### Assets não carregam

**Problema:** Imagens/sons não aparecem

**Solução:** Corrigir caminhos relativos

```javascript
// ❌ Errado
const texture = loader.load('/assets/texture.jpg');

// ✅ Correto
const texture = loader.load('./assets/texture.jpg');
```

### Jogo lento no WebView

**Problema:** Performance baixa

**Soluções:**
1. Otimizar assets (comprimir imagens/modelos)
2. Reduzir qualidade gráfica
3. Habilitar hardware acceleration no Electron:

```javascript
// electron.js
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-gpu-rasterization');
```

### Fullscreen não funciona

**Problema:** Botão de tela cheia não responde

**Solução:** Configurar permissões no WebView

```jsx
// GamePlayer.jsx
<webview
  src={gameUrl}
  allowfullscreen="true"
  webpreferences="allowRunningInsecureContent"
/>
```

## 📝 Checklist para Adicionar Novo Jogo

- [ ] Criar pasta em `Jogos/[nome-do-jogo]/`
- [ ] Adicionar `index.html` como ponto de entrada
- [ ] Garantir caminhos relativos para assets
- [ ] Testar jogo individualmente no navegador
- [ ] Adicionar metadados no seed
- [ ] Executar `npm run seed`
- [ ] (Opcional) Adicionar imagem de capa
- [ ] Testar no launcher
- [ ] Atribuir jogo a planos de assinatura
- [ ] Validar acesso com usuário de teste

## 🚀 Próximos Passos

1. **Multiplayer:** Adicionar Socket.io para jogos multiplayer
2. **Save Games:** Implementar salvamento de progresso
3. **Conquistas:** Sistema de achievements
4. **Leaderboards:** Ranking de pontuações
5. **Mods:** Suporte a modificações pelos usuários

---

**Seus 14 jogos estão prontos para serem jogados na plataforma!** 🎉

Se precisar adicionar mais jogos, basta seguir este guia e eles se integrarão perfeitamente ao ecossistema BioSync.
