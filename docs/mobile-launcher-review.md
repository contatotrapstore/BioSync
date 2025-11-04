# Revisao do launcher mobile NeuroOne

## Problemas criticos (bloqueiam o APK atual)
- [x] Corrigir a desserializacao das respostas da API: o backend responde `{ success, data }`, mas `apiService` retorna `response.data` e os servicos consomem como se `token`, `user` e `games` estivessem na raiz. Resultado: login nunca persiste token nem usuario e todas as chamadas autenticadas falham (`neuroone-mobile/src/services/api.ts:192`, `neuroone-mobile/src/services/auth.ts:32`, `neuroone-mobile/src/pages/GameLibrary.tsx:72`). Ajustar `apiService` para devolver `response.data.data` (ou centralizar num helper) e revisar todos os consumidores.
- [x] Mapear os campos de jogos que chegam do backend (`games.name`, `games.download_url`, etc.) para os nomes que a UI usa (`title`, `zipUrl`, `thumbnail`). Hoje a listagem fica com textos vazios e o filtro quebra porque procura `game.title` (`neuroone-mobile/src/types/index.ts:44`, `biosync-backend/src/controllers/gameController.js:20`, `neuroone-mobile/src/pages/GameLibrary.tsx:101`).
- [x] Converter os caminhos retornados pelo `Filesystem.getUri` antes de carregar o `<iframe>`: no Android recebemos `content://...` e a WebView so aceita rotas convertidas via `Capacitor.convertFileSrc`. Isso explica jogos instalados que nao abrem (`neuroone-mobile/src/components/GameWebView.tsx:68`, `neuroone-mobile/src/capacitor/filesystem.ts:164`).
- [x] Reescrever o fluxo de download para nao manter o ZIP inteiro em memoria e depois transformar em base64. Arquivos com >100 MB derrubam o app por falta de memoria. Usar stream gravando direto com `Filesystem.writeFile` em blocos ou `Filesystem.downloadFile` (`neuroone-mobile/src/capacitor/downloadManager.ts:109`, `neuroone-mobile/src/services/contentUpdater.ts:82`).

## Prioridade alta
- [x] Centralizar a configuracao da URL do backend em variaveis de ambiente (Vite + Capacitor). O endereco esta hardcoded para o Render (`neuroone-mobile/src/services/api.ts:23`), dificultando testes locais e acoes de fallback.
- [x] Ajustar `authService.getCurrentUser`/`refreshUserData` para ler do novo formato de resposta; hoje salvamos `undefined` e o drawer de perfil exibe dados inconsistentes (`neuroone-mobile/src/services/auth.ts:156`).
- [x] Revisar `GameLibrary` para sempre trabalhar com arrays (desestruturar `{ games }` ao receber a resposta). Sem isso `setGames` recebe um objeto e o grid quebra (`neuroone-mobile/src/pages/GameLibrary.tsx:72`).
- [x] Remover o `window.confirm` do `GameWebView` e substituir por um dialog nativo/React. O confirm bloqueia a thread principal e nao respeita o guia de UI mobile (`neuroone-mobile/src/components/GameWebView.tsx:96`).

## Backend e banco (Supabase)
- [x] Eliminar os logs de debug que imprimem senha recebida em texto claro durante o login (`biosync-backend/src/controllers/authController.js:277`). Guardar so hashes e usar logs anonimizados.
- [x] Unificar a checagem de assinatura em uma unica tabela. Hoje `authController` e `getUserGames` usam `subscriptions`, enquanto `getGameById` ancora em `user_subscriptions` (`biosync-backend/src/controllers/authController.js:50`, `biosync-backend/src/controllers/gameController.js:118`). Definir a tabela oficial e atualizar queries/relatorios.
- [x] Atualizar o blueprint SQL em `supabase-schema.sql` para refletir as migracoes recentes (coluna `is_psychologist`, tabelas `subscriptions`, `launcher_sessions`, etc.). Os scripts estao defasados em relacao a `migrations/006_psychologists_and_scores_system.sql` e podem gerar ambientes incoerentes.
- [x] Criar indices para consultas frequentes usadas pelo launcher (`subscriptions.user_id`, `user_game_access.user_id` + `game_id`, `launcher_sessions.user_id`). Apesar de alguns indices existirem, as consultas atuais misturam filtros por data/status sem suporte explicito.

## Melhorias e manutencao futura
- [ ] Consolidar funcoes duplicadas (`filesystem.downloadAndExtractGame` nunca e utilizada porque `contentUpdater` assumiu o papel; avaliar remover ou reciclar).
- [ ] Monitorar as pastas espelhadas (`srccapacitor`, `srccomponents`, etc.) herdadas da extracao do APK e limpa-las para nao confundir o time.
- [ ] Adotar tipagem compartilhada backend/frontend (gerar DTOs ou usar Zod/TypeScript a partir do backend) para evitar divergencias como `title` vs `name`.
- [ ] Automatizar testes de smoke (login + listagem + abrir jogo dummy) via Capacitor End-to-End ou Detox antes de gerar novos APKs.

## Atualizações 2025-11-04
- [x] Corrigimos o adaptador HTTP nativo para sempre enviar `params` válidos e aplicar fallback ao adapter padrão, eliminando o `NullPointerException` do plugin Http.
- [x] Ajustamos o serviço de storage seguro para ignorar erros "Item with given key does not exist", evitando ruído no Logcat durante o login inicial.
- [x] Refatoramos o `PaymentAlert` (ordem das constantes, textos formatados, dismiss funcional também no estado ativo).
- [x] Reestilizamos as telas principais (GameLibrary, GameCard, GameDetail) com o novo tema mobile e copy atualizada.
- [x] Geramos os ícones Android com o favicon oficial (via `@capacitor/assets`) e alinhamos o `public/favicon.png` ao novo logo.
- [x] Remodelamos a tela de detalhes do jogo com header explícito de navegação, cartões menos arredondados e feedback visual mais discreto.
- [x] Tratamos jogos sem `download_url`: a ação agora exibe aviso amigável e impede o fluxo, evitando o erro `Game ... does not have a download URL` repetido no log `ultimate`.
- [x] Superficializamos o feedback de download com snackbar/alerta quando a instalação falha e confirmamos sucesso após a conclusão.
