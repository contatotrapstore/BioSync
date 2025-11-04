# NeuroOne Mobile - Aplicativo Android

Aplicativo mobile da plataforma NeuroOne para acesso a jogos terapêuticos em dispositivos Android.

## 📱 Sobre o Aplicativo

O NeuroOne Mobile é a versão mobile da plataforma NeuroOne, permitindo que pacientes acessem jogos terapêuticos diretamente de seus smartphones e tablets Android. O app oferece:

- ✅ Autenticação segura de usuários
- ✅ Biblioteca de jogos com filtro por plataforma (apenas jogos compatíveis com mobile)
- ✅ Download e execução local de jogos
- ✅ Sistema de pontuação e progresso
- ✅ Interface Material Design responsiva
- ✅ Modo offline após download dos jogos

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Capacitor 7** - Framework mobile (bridge nativo)
- **Vite** - Build tool e bundler
- **Material-UI (MUI)** - Biblioteca de componentes
- **Axios** - Cliente HTTP
- **React Router DOM** - Navegação
- **JSZip** - Manipulação de arquivos ZIP

### Plataformas Suportadas

- ✅ Android 7.0+ (API Level 24+)
- ⏳ iOS (planejado para versões futuras)

## 📋 Pré-requisitos

### Desenvolvimento

- **Node.js** 18+ e npm
- **Android Studio** (para build Android)
- **Java JDK** 17+ (requerido pelo Gradle)
- **Android SDK** 24+ (Android 7.0+)

### Configuração do Ambiente Android

1. Instale o Android Studio
2. Configure o `ANDROID_HOME` nas variáveis de ambiente:
   ```bash
   # Windows
   set ANDROID_HOME=C:\Users\{SEU_USER}\AppData\Local\Android\Sdk

   # Linux/Mac
   export ANDROID_HOME=~/Android/Sdk
   ```

3. Instale as ferramentas SDK necessárias via Android Studio:
   - Android SDK Platform 24+
   - Android SDK Build-Tools
   - Android Emulator (opcional, para testes)

## 🚀 Instalação e Configuração

### 1. Instalar Dependências

```bash
cd neuroone-mobile
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=https://neurogame-7av9.onrender.com/api/v1
```

### 3. Sincronizar com Capacitor

```bash
npx cap sync android
```

Este comando:
- Copia os assets web para o projeto Android
- Atualiza plugins nativos
- Sincroniza dependências

## 💻 Desenvolvimento

### Servidor de Desenvolvimento Web

Para testar no navegador (desenvolvimento rápido):

```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Executar no Android Studio

1. Abrir o projeto Android:
```bash
npx cap open android
```

2. No Android Studio:
   - Conecte um dispositivo físico ou inicie um emulador
   - Clique em "Run" (▶️) para instalar e executar o app

### Live Reload (Desenvolvimento Ágil)

```bash
# Terminal 1: Inicia o servidor Vite
npm run dev

# Terminal 2: Sincroniza mudanças
npx cap sync android
```

Após mudanças no código:
- Salve o arquivo
- O Vite recarrega automaticamente
- Use "Sync Project" no Android Studio se necessário

## 📦 Build de Produção

### Build do APK (Debug)

```bash
# 1. Build dos assets web
npm run build

# 2. Sincronizar com Android
npx cap sync android

# 3. Build do APK Debug
cd android
./gradlew assembleDebug
```

APK gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build do APK (Release - Produção)

```bash
# 1. Build dos assets web (modo produção)
npm run build

# 2. Sincronizar com Android
npx cap sync android

# 3. Build do APK Release
cd android
./gradlew assembleRelease
```

APK gerado em: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Assinar APK para Distribuição

Para distribuir na Google Play Store ou via download direto, o APK precisa ser assinado:

```bash
# Gerar keystore (apenas uma vez)
keytool -genkey -v -keystore neurogame-release.keystore -alias neurogame -keyalg RSA -keysize 2048 -validity 10000

# Assinar o APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore neurogame-release.keystore app-release-unsigned.apk neurogame

# Alinhar o APK (otimização)
zipalign -v 4 app-release-unsigned.apk neurogame-release.apk
```

## 🏗️ Arquitetura do Aplicativo

```
neuroone-mobile/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── ErrorBoundary.tsx
│   │   ├── GameCard.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/               # Páginas principais
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── GameLibrary.tsx
│   │   ├── GameDetail.tsx
│   │   └── Profile.tsx
│   ├── services/            # Lógica de negócio
│   │   ├── api.ts          # Cliente da API (Axios)
│   │   ├── auth.ts         # Autenticação e tokens
│   │   ├── contentUpdater.ts  # Download de jogos
│   │   └── errorHandler.ts    # Tratamento de erros
│   ├── contexts/            # Contextos React
│   │   └── AuthContext.tsx  # Contexto de autenticação
│   ├── types/               # Definições TypeScript
│   │   └── index.ts
│   ├── theme.ts             # Tema Material-UI
│   ├── App.tsx              # Componente raiz
│   └── main.tsx             # Entry point
├── android/                 # Projeto Android nativo
│   ├── app/
│   │   └── src/
│   │       └── main/
│   │           ├── AndroidManifest.xml
│   │           ├── res/     # Recursos (ícones, etc.)
│   │           └── assets/  # Assets web compilados
│   └── build.gradle
├── public/                  # Assets estáticos
├── capacitor.config.ts      # Configuração do Capacitor
├── vite.config.ts           # Configuração do Vite
└── package.json

```

## 🔌 API e Autenticação

### Endpoints Utilizados

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/auth/login` | POST | Login de usuário |
| `/auth/register` | POST | Registro de novo usuário |
| `/auth/verify` | GET | Verificar token |
| `/games/user/games` | GET | Listar jogos do usuário (filtrado por `platform=mobile`) |
| `/games/:slug` | GET | Detalhes de um jogo específico |

### Fluxo de Autenticação

1. **Login**: Usuário fornece `username` e `password`
2. **Token JWT**: Backend retorna token JWT
3. **Armazenamento**: Token salvo no `localStorage`
4. **Requisições**: Token incluído no header `Authorization: Bearer {token}`
5. **Renovação**: Token verificado a cada inicialização do app

### Storage Local

O app utiliza o `@capacitor/preferences` para armazenar:
- Token de autenticação
- Dados do usuário
- Jogos baixados (metadados)

## 🎮 Sistema de Jogos

### Download de Jogos

```typescript
// Exemplo de uso do ContentUpdater
import { updateContent } from './services/contentUpdater';

const handleDownload = async (gameUrl: string) => {
  try {
    await updateContent(gameUrl, (progress) => {
      console.log(`Progresso: ${progress}%`);
    });
    console.log('Jogo baixado com sucesso!');
  } catch (error) {
    console.error('Erro ao baixar jogo:', error);
  }
};
```

### Estrutura de Armazenamento

Jogos são baixados e armazenados em:
- **Android**: `/data/data/com.neurogame.app/files/games/{game-slug}/`

Cada jogo possui:
- `index.html` - Entry point do jogo
- `assets/` - Imagens, sons, etc.
- `manifest.json` - Metadados do jogo

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. **Build Falha: "SDK location not found"**

**Solução**: Configure o `ANDROID_HOME`:
```bash
# Windows
set ANDROID_HOME=C:\Users\{SEU_USER}\AppData\Local\Android\Sdk

# Verifique
echo %ANDROID_HOME%
```

#### 2. **Erro: "Installed Build Tools revision X is corrupted"**

**Solução**: Reinstale o Build Tools via Android Studio:
- Tools → SDK Manager → SDK Tools → Android SDK Build-Tools

#### 3. **App não conecta à API**

**Verificar**:
- URL da API está correta no `.env`
- Backend está rodando
- Dispositivo tem acesso à internet
- CORS está configurado no backend para aceitar requisições do app

#### 4. **Jogos não carregam após download**

**Causas possíveis**:
- Arquivo ZIP corrompido
- Permissões de armazenamento não concedidas
- Estrutura do jogo inválida (falta `index.html`)

**Solução**:
```typescript
// Verificar logs no Chrome DevTools
// Android Studio → Logcat → Filtrar por "Capacitor"
```

#### 5. **Tela branca após build de produção**

**Solução**: Verifique o `base` no `vite.config.ts`:
```typescript
export default defineConfig({
  base: './', // Importante para paths relativos
  // ...
});
```

### Logs e Debug

#### Ver logs do app Android:

```bash
# Android Studio Logcat
# Ou via terminal:
adb logcat | grep -i "Capacitor\|NeuroGame"
```

#### Inspecionar WebView no Chrome:

1. Conecte dispositivo Android via USB
2. Ative "Depuração USB" no dispositivo
3. Abra `chrome://inspect` no Chrome desktop
4. Selecione o app NeuroOne na lista

## 📊 Status Atual e Limitações Conhecidas

### ✅ Funcionalidades Implementadas

- Login e autenticação JWT
- Listagem de jogos (filtrados por plataforma mobile)
- Download de jogos
- Execução de jogos em WebView
- Sistema de pontuação (scores)
- Perfil do usuário

### ⚠️ Limitações Conhecidas

Conforme documentado em `docs/mobile-launcher-review.md`:

1. **Performance**: Alguns jogos podem ter lag em dispositivos com hardware limitado
2. **Offline**: Jogos só funcionam offline após download completo
3. **Storage**: Limite de armazenamento depende do dispositivo
4. **Compatibilidade**: Nem todos os jogos web são otimizados para touch

### 🔮 Funcionalidades Planejadas

- [ ] Suporte a iOS
- [ ] Sincronização de pontuações em tempo real
- [ ] Modo multiplayer
- [ ] Notificações push
- [ ] Dark mode automático
- [ ] Cache de imagens otimizado
- [ ] Compressão de jogos

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção (assets web) |
| `npm run preview` | Preview do build |
| `npx cap sync` | Sincroniza assets com projeto nativo |
| `npx cap open android` | Abre Android Studio |
| `npx cap run android` | Build e executa no Android |

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Faça suas alterações
4. Teste em dispositivo físico e emulador
5. Commit: `git commit -m 'feat: adiciona nova funcionalidade'`
6. Push: `git push origin feature/nova-funcionalidade`
7. Abra um Pull Request

## 📄 Licença

Propriedade de NeuroOne Platform. Todos os direitos reservados.

## 🆘 Suporte

Para problemas ou dúvidas:
- Consulte `docs/mobile-launcher-review.md` para issues técnicos conhecidos
- Consulte `docs/TROUBLESHOOTING.md` para soluções de problemas comuns
- Contate o suporte: [contato da plataforma]

---

**Versão atual**: 2.3.0
**Última atualização**: 2025-11-04
**Plataforma**: NeuroOne
**Tipo**: Aplicativo Mobile Android
