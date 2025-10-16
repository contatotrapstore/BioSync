# NeuroOne Launcher

Desktop application for browsing and playing the NeuroOne library.

## Features

- Secure login with persisted sessions (JWT + electron-store)
- Library view with search, categories and access badges
- Embedded HTML5 player using Electron `<webview>`
- Auto-handling of network/offline errors
- Cross-platform packaging with `electron-builder`

## Tech Stack

- Electron 29 (main process)
- React 18 + Vite 5 (renderer)
- Material UI 5
- Axios for HTTP requests
- Electron Store for local persistence

## Setup

```bash
npm install
```

Optional `.env` overrides:

```
VITE_API_URL=http://localhost:3000/api/v1
VITE_GAMES_PATH=../Jogos
```

The default expects the folder structure:

```
NeuroOne/
+- neuroone-launcher/
+- Jogos/
   +- autorama/
   ?  +- index.html
   +- balao/
   ?  +- index.html
   +- ...
```

## Development

```bash
npm run dev
```

- Vite serves the renderer at `http://localhost:5174`
- `wait-on` blocks until the port is ready
- `npx electron .` launches Electron with DevTools enabled
- `main.js` relaunches Electron if `ELECTRON_RUN_AS_NODE` is detected (Windows safeguard)

## Production / Packaging

```bash
npm run build        # build React (dist/)
npm run start        # run Electron pointing to dist/

npm run build:win    # Windows installer
npm run build:mac    # macOS dmg/zip
npm run build:linux  # AppImage/deb
npm run build:all    # All platforms
```

Artifacts are emitted to `dist-electron/`.

## API usage

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST   | `/api/v1/auth/login`         | Authenticate user |
| GET    | `/api/v1/auth/validate`      | Validate stored token |
| GET    | `/api/v1/games/user/games`   | Fetch library available to the user |
| GET    | `/api/v1/games/:id`          | Game details |
| GET    | `/api/v1/games/:id/validate` | Validate access before launching |

The base URL comes from `electron-store` settings (`storage.js`) and defaults to `http://localhost:3000/api/v1`.

## Storage

`electron-store` keeps:
- `auth_token`
- `user`
- `settings` (API URL override)

## Troubleshooting

- **Blank screen (dev):** ensure Vite compiled without errors and `npm run dev` prints the local URL.
- **Blank screen (start/build):** run `npm run build` to regenerate `dist/`.
- **CORS error during login:** add `http://localhost:5174` to `CORS_ORIGIN` in the backend `.env`.
- **"Failed to load game" message:** confirm `Jogos/<folder>/index.html` exists and the `folder_path` stored in Supabase matches the directory name.

## License

MIT

## Scripts utilitarios

### protect-games.js

Script auxiliar para proteger o conteudo dos jogos antes de distribuir os arquivos. Ele aplica o mecanismo de validacao do launcher diretamente nas pastas dos jogos gerando os assets finais.

```bash
node protect-games.js ./Jogos/nome-do-jogo
```

Opcionalmente mova o arquivo para um diretorio `scripts/` junto com outros utilitarios de automacao.
