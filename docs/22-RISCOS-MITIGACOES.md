# 22 - RISCOS E MITIGAÇÕES

## Visão Geral

Este documento identifica os principais riscos do projeto NeuroOne, avalia sua probabilidade e impacto, e define estratégias de mitigação e planos de contingência.

**Metodologia**: Matriz de Risco (Probabilidade × Impacto)

**Classificação**:
- 🔴 **Crítico** (P×I ≥ 12): Ação imediata obrigatória
- 🟠 **Alto** (P×I 8-11): Monitoramento semanal
- 🟡 **Médio** (P×I 4-7): Monitoramento quinzenal
- 🟢 **Baixo** (P×I ≤ 3): Monitoramento mensal

**Escala**: Probabilidade e Impacto de 1 (baixo) a 4 (alto)

---

## Matriz de Riscos

| ID | Risco | Prob. | Impacto | Score | Nível |
|----|-------|-------|---------|-------|-------|
| R01 | Latência Bluetooth > 100ms | 3 | 4 | 12 | 🔴 |
| R02 | Supabase downtime | 2 | 4 | 8 | 🟠 |
| R03 | Python server crash | 3 | 3 | 9 | 🟠 |
| R04 | Violação LGPD | 1 | 4 | 4 | 🟡 |
| R05 | Safari não suporta Web Bluetooth | 4 | 3 | 12 | 🔴 |
| R06 | Escalabilidade (>500 alunos simultâneos) | 2 | 3 | 6 | 🟡 |
| R07 | Falta de code signing (launcher) | 3 | 2 | 6 | 🟡 |
| R08 | Dependência de biblioteca descontinuada | 2 | 3 | 6 | 🟡 |
| R09 | Perda de dados EEG (falha no CSV) | 2 | 4 | 8 | 🟠 |
| R10 | Vazamento de token JWT | 1 | 4 | 4 | 🟡 |
| R11 | Performance ruim em dispositivos antigos | 3 | 2 | 6 | 🟡 |
| R12 | Scope creep (atraso no MVP) | 3 | 3 | 9 | 🟠 |

---

## Riscos Técnicos

### R01: Latência Bluetooth > 100ms 🔴

**Descrição**: Conexão Bluetooth com headset EEG pode ter latência alta (>100ms), prejudicando feedback em tempo real nos jogos.

**Probabilidade**: 3 (Médio-Alta) - Bluetooth LE tem variabilidade conhecida
**Impacto**: 4 (Crítico) - Jogos neurofeedback exigem latência <50ms
**Score**: 12 🔴 Crítico

**Mitigação**:
1. ✅ **Usar Bluetooth Low Energy (BLE)** com GATT (Generic Attribute Profile)
2. ✅ **Configurar intervalo de conexão mínimo** (7.5ms):
   ```javascript
   // Web Bluetooth API
   const server = await device.gatt.connect();
   const service = await server.getPrimaryService('battery_service');
   const characteristic = await service.getCharacteristic('battery_level');

   // Request fastest connection interval
   await characteristic.startNotifications();
   characteristic.addEventListener('characteristicvaluechanged', handleData);
   ```
3. ✅ **Buffer adaptativo** no cliente:
   ```javascript
   const adaptiveBuffer = {
     targetLatency: 50, // ms
     bufferSize: 3, // samples
     adjust: function(measuredLatency) {
       if (measuredLatency > 80) this.bufferSize = Math.max(1, this.bufferSize - 1);
       if (measuredLatency < 30) this.bufferSize = Math.min(5, this.bufferSize + 1);
     }
   };
   ```
4. ✅ **Testar em múltiplos dispositivos** (Android, Windows, Chromebook)
5. ✅ **Fallback para modo "Near Real-Time"** (latência até 200ms aceitável)

**Contingência**:
- Se latência > 150ms persistir, mudar jogo para **modo baseado em sessão** (análise post-sessão ao invés de tempo real)
- Considerar headsets EEG com USB/WiFi como alternativa

**Monitoramento**:
- Métrica: `avg_bluetooth_latency` (meta: <50ms, alerta se >80ms)
- Dashboard Grafana com alertas automáticos

---

### R02: Supabase Downtime 🟠

**Descrição**: Supabase pode ter indisponibilidade (uptime 99.9% = 8.7h downtime/ano).

**Probabilidade**: 2 (Baixa) - Supabase tem SLA 99.9%
**Impacto**: 4 (Crítico) - Sistema fica inoperante
**Score**: 8 🟠 Alto

**Mitigação**:
1. ✅ **Fallback local com IndexedDB**:
   ```javascript
   // src/services/offlineStorage.js
   import { openDB } from 'idb';

   const dbPromise = openDB('neuroone-offline', 1, {
     upgrade(db) {
       db.createObjectStore('sessions', { keyPath: 'id' });
       db.createObjectStore('metrics', { keyPath: 'id' });
     }
   });

   export async function saveOffline(storeName, data) {
     const db = await dbPromise;
     return db.put(storeName, data);
   }

   export async function syncOfflineData() {
     const db = await dbPromise;
     const sessions = await db.getAll('sessions');
     // Sync to Supabase when online
     for (const session of sessions) {
       await supabase.from('sessions').upsert(session);
       await db.delete('sessions', session.id);
     }
   }
   ```
2. ✅ **Modo offline-first para PWA**:
   ```javascript
   // Service Worker
   self.addEventListener('fetch', (event) => {
     event.respondWith(
       caches.match(event.request).then((response) => {
         return response || fetch(event.request).catch(() => {
           return caches.match('/offline.html');
         });
       })
     );
   });
   ```
3. ✅ **Health check endpoint** (verificar status a cada 30s)
4. ✅ **Cache Redis** no backend para queries frequentes
5. ✅ **Notificação ao usuário** quando offline

**Contingência**:
- Se downtime > 1h: comunicar status via [status.neuroone.app](https://status.neuroone.app)
- Se downtime > 4h: ativar backup PostgreSQL em DigitalOcean (custo adicional $12/mês)

**Monitoramento**:
- Uptime Robot: ping a cada 5 minutos
- PagerDuty: alerta se 3 falhas consecutivas
- Status Page: [status.supabase.com](https://status.supabase.com)

---

### R03: Python Server Crash 🟠

**Descrição**: Servidor Python (`server_headless-V4.py`) pode crashar por exceções não tratadas ou sobrecarga.

**Probabilidade**: 3 (Médio-Alta) - Código legado, não 100% estável
**Impacto**: 3 (Alto) - EEG streaming para, mas backend Node.js continua
**Score**: 9 🟠 Alto

**Mitigação**:
1. ✅ **Supervisor process (systemd)**:
   ```ini
   # /etc/systemd/system/neuroone-python.service
   [Unit]
   Description=NeuroOne Python EEG Server
   After=network.target

   [Service]
   Type=simple
   User=neuroone
   WorkingDirectory=/opt/neuroone/python-server
   ExecStart=/usr/bin/python3 server_headless-V4.py
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```
2. ✅ **Error handling robusto**:
   ```python
   # server_headless-V4.py
   import logging
   logging.basicConfig(level=logging.ERROR, filename='errors.log')

   @app.websocket('/ws')
   async def websocket_endpoint(websocket: WebSocket):
       try:
           await websocket.accept()
           while True:
               data = await websocket.receive_json()
               await process_eeg_data(data)
       except WebSocketDisconnect:
           logging.info("Client disconnected")
       except Exception as e:
           logging.error(f"Unexpected error: {e}", exc_info=True)
           await websocket.close(code=1011, reason="Internal error")
   ```
3. ✅ **Health endpoint**:
   ```python
   @app.get("/health")
   async def health_check():
       return {"status": "ok", "uptime": get_uptime(), "active_connections": len(active_websockets)}
   ```
4. ✅ **Rate limiting** (max 50 conexões simultâneas)
5. ✅ **Memory profiling** semanal (detectar memory leaks)

**Contingência**:
- Se crash > 3x/dia: migrar para **Gunicorn com múltiplos workers**
- Plano B: Reescrever em Node.js (2-3 semanas de dev)

**Monitoramento**:
- Prometheus + Grafana: `python_server_uptime`, `active_websocket_connections`
- Alerta se `restart_count > 5/hora`

---

### R05: Safari não suporta Web Bluetooth 🔴

**Descrição**: Safari (iOS/macOS) não implementa Web Bluetooth API completamente, impedindo alunos com iPad/iPhone de usar o sistema.

**Probabilidade**: 4 (Alta) - Confirmado, Safari não tem Web Bluetooth
**Impacto**: 3 (Alto) - 30% dos usuários escolares usam iPads
**Score**: 12 🔴 Crítico

**Mitigação**:
1. ✅ **Focar em Android tablets** (mercado escolar brasileiro = 70% Android)
2. ✅ **Wrapper Capacitor para iOS**:
   ```bash
   # Apenas se necessário no futuro
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add ios

   # Usar plugin Bluetooth nativo
   npm install @capacitor-community/bluetooth-le
   ```
   ```typescript
   // src/services/bluetooth.capacitor.ts
   import { BleClient } from '@capacitor-community/bluetooth-le';

   export async function connectDeviceCapacitor(deviceId: string) {
     await BleClient.initialize();
     await BleClient.connect(deviceId);
     await BleClient.startNotifications(deviceId, SERVICE_UUID, CHAR_UUID, (value) => {
       processEEGData(value);
     });
   }
   ```
3. ✅ **Página de compatibilidade**:
   ```javascript
   // src/utils/browserCheck.js
   export function checkWebBluetooth() {
     if (!navigator.bluetooth) {
       return {
         supported: false,
         message: "Seu navegador não suporta Web Bluetooth. Use Chrome, Edge ou Android.",
         recommendation: "Recomendamos tablets Android com Chrome."
       };
     }
     return { supported: true };
   }
   ```
4. ✅ **Documentação clara** sobre dispositivos compatíveis

**Contingência**:
- Se > 20% dos usuários exigem iOS: implementar app Capacitor/React Native (4-6 semanas)
- Oferecer tablets Android subsidiados para escolas

**Monitoramento**:
- Analytics: `browser_type`, `bluetooth_support`
- Survey mensal com usuários iOS

---

## Riscos Operacionais

### R06: Escalabilidade (>500 alunos simultâneos) 🟡

**Descrição**: Sistema pode não escalar para >500 alunos simultâneos em sessões.

**Probabilidade**: 2 (Baixa) - MVP terá <100 alunos inicialmente
**Impacto**: 3 (Alto) - Crescimento futuro comprometido
**Score**: 6 🟡 Médio

**Mitigação**:
1. ✅ **Supabase Pro plan** (100GB bandwidth, 8GB RAM PostgreSQL)
2. ✅ **Load testing precoce** (Artillery):
   ```yaml
   # artillery-config.yml
   config:
     target: 'wss://python-server.neuroone.app'
     phases:
       - duration: 60
         arrivalRate: 10  # 10 conexões/segundo
         rampTo: 50       # até 50/s
   scenarios:
     - engine: ws
       flow:
         - send: {"type": "eeg_data", "alpha": 0.5}
         - think: 0.05  # 50ms latency
   ```
3. ✅ **Redis para cache** (sessions, user profiles)
4. ✅ **CDN para assets estáticos** (Vercel Edge Network)
5. ✅ **Database sharding** (se >1000 escolas):
   ```sql
   -- Partition por região geográfica
   CREATE TABLE sessions_north PARTITION OF sessions
   FOR VALUES IN ('north', 'northeast');
   ```

**Contingência**:
- Se carga > 80%: upgrade Supabase para Team plan ($599/mês)
- Se carga > 90%: migrar Python para **múltiplos servidores** com load balancer (Nginx)

**Monitoramento**:
- Supabase Dashboard: `active_connections`, `query_time_p95`
- Alerta se `connections > 80` (limite Pro = 100)

---

### R09: Perda de Dados EEG (falha no CSV) 🟠

**Descrição**: Falha ao salvar dados EEG em CSV pode resultar em perda de sessões inteiras.

**Probabilidade**: 2 (Baixa) - Código Python já testado
**Impacto**: 4 (Crítico) - Dados irrecuperáveis, pesquisa comprometida
**Score**: 8 🟠 Alto

**Mitigação**:
1. ✅ **Redundância dupla**:
   ```python
   # server_headless-V4.py
   import csv
   import json

   def save_eeg_data(session_id, data):
       # 1. Salvar CSV local
       csv_path = f"data/{session_id}.csv"
       with open(csv_path, 'a', newline='') as f:
           writer = csv.writer(f)
           writer.writerow([data['timestamp'], data['alpha'], data['beta'], ...])

       # 2. Backup JSON (redundância)
       json_path = f"data/backup/{session_id}.jsonl"
       with open(json_path, 'a') as f:
           f.write(json.dumps(data) + '\n')

       # 3. Upload para Supabase Storage (assíncrono)
       asyncio.create_task(upload_to_supabase(session_id, csv_path))
   ```
2. ✅ **Supabase Storage** (backup automático a cada 5 minutos)
3. ✅ **Validação de integridade**:
   ```python
   def validate_csv(file_path):
       try:
           df = pd.read_csv(file_path)
           assert len(df) > 0, "Empty CSV"
           assert 'timestamp' in df.columns, "Missing timestamp"
           return True
       except Exception as e:
           logging.error(f"CSV validation failed: {e}")
           return False
   ```
4. ✅ **Backup diário** (rsync para S3)

**Contingência**:
- Se CSV corrompido: recuperar de backup JSON
- Se ambos falharem: notificar professor para repetir sessão

**Monitoramento**:
- Cron job diário: verificar integridade de todos os CSVs
- Alerta se `failed_csv_writes > 0`

---

### R12: Scope Creep (atraso no MVP) 🟠

**Descrição**: Adicionar features não essenciais pode atrasar o MVP.

**Probabilidade**: 3 (Médio-Alta) - Comum em projetos educacionais
**Impacto**: 3 (Alto) - Atraso no go-live, frustração de stakeholders
**Score**: 9 🟠 Alto

**Mitigação**:
1. ✅ **MVP rigorosamente definido** (ver [07-FASE-1-FUNDACAO.md](07-FASE-1-FUNDACAO.md))
2. ✅ **Backlog separado** (MVP vs Post-MVP):
   ```markdown
   # MVP (Fase 1-7)
   - [ ] Autenticação básica (email + senha)
   - [ ] Dashboard professor (tempo real)
   - [ ] 1 jogo (Atenção Contínua)

   # Post-MVP (v2.0)
   - [ ] Login social (Google, Microsoft)
   - [ ] Relatórios avançados (ML)
   - [ ] 5 jogos adicionais
   ```
3. ✅ **Processo de aprovação de features**:
   - Proposta → Estimativa (horas) → Aprovação por PM
   - Se impacto > 1 semana: adiar para Post-MVP
4. ✅ **Sprints de 2 semanas** com demo obrigatória
5. ✅ **Timebox rigoroso** (Feature Freeze 2 semanas antes do lançamento)

**Contingência**:
- Se atraso > 1 mês: cortar features não críticas
- Priorização: P0 (blocker) > P1 (crítico) > P2 (importante) > P3 (nice-to-have)

**Monitoramento**:
- Burndown chart semanal (Jira/GitHub Projects)
- Velocity tracking (story points/sprint)

---

## Riscos de Segurança

### R04: Violação LGPD 🟡

**Descrição**: Dados pessoais de menores podem ser expostos ou mal utilizados, violando LGPD.

**Probabilidade**: 1 (Baixa) - Segurança bem planejada
**Impacto**: 4 (Crítico) - Multa até 2% do faturamento + danos à reputação
**Score**: 4 🟡 Médio

**Mitigação**:
1. ✅ **Consentimento parental obrigatório** (ver [17-SEGURANCA-LGPD.md](17-SEGURANCA-LGPD.md)):
   ```sql
   CREATE TABLE parental_consents (
     id UUID PRIMARY KEY,
     student_id UUID REFERENCES students(id),
     parent_name TEXT NOT NULL,
     consent_date TIMESTAMPTZ DEFAULT NOW(),
     ip_address INET,
     consent_text TEXT,
     signature_hash TEXT
   );
   ```
2. ✅ **Anonimização em relatórios**:
   ```sql
   -- View sem dados identificáveis
   CREATE VIEW analytics_anonymous AS
   SELECT
     hash_student_id(student_id) AS student_hash,
     AVG(attention_level) AS avg_attention,
     class_id
   FROM student_metrics
   GROUP BY student_id, class_id;
   ```
3. ✅ **Direito ao esquecimento** (botão "Excluir meus dados"):
   ```javascript
   // api/auth/delete-account.js
   export async function deleteAccount(userId) {
     // 1. Deletar dados pessoais
     await supabase.from('students').delete().eq('id', userId);

     // 2. Anonimizar métricas (manter para pesquisa)
     await supabase.from('student_metrics')
       .update({ student_id: 'ANONYMIZED', student_name: null })
       .eq('student_id', userId);

     // 3. Deletar arquivos (Storage)
     await supabase.storage.from('eeg-data').remove([`${userId}/`]);
   }
   ```
4. ✅ **Auditoria de acesso**:
   ```sql
   CREATE TABLE audit_log (
     id SERIAL PRIMARY KEY,
     user_id UUID,
     action TEXT,  -- 'view_student', 'export_data', 'delete_account'
     target_id UUID,
     timestamp TIMESTAMPTZ DEFAULT NOW(),
     ip_address INET
   );
   ```
5. ✅ **DPO (Data Protection Officer)** designado

**Contingência**:
- Se violação detectada: notificar ANPD em 72h
- Ativar plano de resposta a incidentes ([17-SEGURANCA-LGPD.md](17-SEGURANCA-LGPD.md))

**Monitoramento**:
- Revisão trimestral de logs de acesso
- Auditoria anual por consultor externo

---

### R10: Vazamento de Token JWT 🟡

**Descrição**: Token JWT pode ser roubado (XSS, MitM) e usado para personificação.

**Probabilidade**: 1 (Baixa) - Proteções implementadas
**Impacto**: 4 (Crítico) - Acesso não autorizado a dados de alunos
**Score**: 4 🟡 Médio

**Mitigação**:
1. ✅ **HttpOnly cookies** (inacessível via JavaScript):
   ```javascript
   // backend/auth.js
   res.cookie('refreshToken', refreshToken, {
     httpOnly: true,
     secure: true,  // HTTPS only
     sameSite: 'strict',
     maxAge: 7 * 24 * 60 * 60 * 1000  // 7 dias
   });
   ```
2. ✅ **Access Token de curta duração** (15 minutos)
3. ✅ **Revogação de token**:
   ```sql
   CREATE TABLE token_blacklist (
     jti TEXT PRIMARY KEY,  -- JWT ID
     expires_at TIMESTAMPTZ,
     reason TEXT
   );

   -- Verificar em middleware
   SELECT EXISTS(SELECT 1 FROM token_blacklist WHERE jti = $1);
   ```
4. ✅ **Content Security Policy (CSP)**:
   ```html
   <meta http-equiv="Content-Security-Policy"
         content="default-src 'self'; script-src 'self' https://cdn.supabase.io; connect-src 'self' wss://python-server.neuroone.app">
   ```
5. ✅ **HTTPS obrigatório** (HSTS header)

**Contingência**:
- Se vazamento detectado: invalidar todos os tokens (forçar re-login)
- Rotacionar JWT secret imediatamente

**Monitoramento**:
- Anomalias: logins de IPs distantes em curto período
- Alerta se `failed_auth_attempts > 5/minuto`

---

## Riscos de Dependências

### R08: Dependência de Biblioteca Descontinuada 🟡

**Descrição**: Biblioteca crítica pode ser descontinuada ou ter vulnerabilidade não corrigida.

**Probabilidade**: 2 (Baixa) - Libs maduras selecionadas
**Impacto**: 3 (Alto) - Pode exigir reescrita
**Score**: 6 🟡 Médio

**Mitigação**:
1. ✅ **Dependências maduras** (downloads/semana > 100k, última atualização < 6 meses)
2. ✅ **Renovate Bot** (updates automáticos):
   ```json
   // renovate.json
   {
     "extends": ["config:base"],
     "automerge": true,
     "major": {
       "automerge": false
     },
     "vulnerabilityAlerts": {
       "enabled": true
     }
   }
   ```
3. ✅ **npm audit** no CI/CD:
   ```yaml
   # .github/workflows/security.yml
   - name: Security audit
     run: npm audit --audit-level=high
   ```
4. ✅ **Snyk monitoring** (alertas de CVEs)
5. ✅ **Abstração de dependências críticas**:
   ```javascript
   // src/lib/charting.js - abstração do Chart.js
   export function createChart(type, data, options) {
     // Se Chart.js for descontinuado, trocar aqui por ECharts/Recharts
     return new Chart(ctx, { type, data, options });
   }
   ```

**Contingência**:
- Se lib descontinuada: fork ou migrar para alternativa (exemplo: Chart.js → ECharts)

**Monitoramento**:
- Review mensal de dependências (npm outdated)
- GitHub Dependabot alerts

---

## Riscos de Performance

### R11: Performance Ruim em Dispositivos Antigos 🟡

**Descrição**: PWA pode ter baixa performance em tablets antigos (<2GB RAM, Android 7).

**Probabilidade**: 3 (Médio-Alta) - Escolas têm dispositivos antigos
**Impacto**: 2 (Médio) - UX degradada, mas funcional
**Score**: 6 🟡 Médio

**Mitigação**:
1. ✅ **Performance budget**:
   ```javascript
   // vite.config.js
   export default {
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             charts: ['chart.js', 'react-chartjs-2'],
             supabase: ['@supabase/supabase-js']
           }
         }
       },
       chunkSizeWarningLimit: 500  // KB
     }
   };
   ```
2. ✅ **Lazy loading**:
   ```javascript
   const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
   const StudentGame = lazy(() => import('./pages/StudentGame'));
   ```
3. ✅ **Detecção de device**:
   ```javascript
   // src/utils/deviceDetection.js
   export function isLowEndDevice() {
     return (
       navigator.hardwareConcurrency <= 2 ||  // <= 2 cores
       navigator.deviceMemory <= 2 ||          // <= 2GB RAM
       /Android [4-7]/.test(navigator.userAgent)
     );
   }

   // Reduzir qualidade de gráficos em low-end
   const chartOptions = isLowEndDevice()
     ? { animation: false, elements: { point: { radius: 0 } } }
     : { animation: true };
   ```
4. ✅ **Service Worker cache** (reduzir requests)
5. ✅ **Testes em dispositivos reais** (Moto G4, Galaxy Tab A7 Lite)

**Contingência**:
- Se FPS < 30: oferecer "Modo Lite" (sem animações)

**Monitoramento**:
- Lighthouse CI: performance score > 80
- Real User Monitoring (RUM): `time_to_interactive < 3s`

---

## Plano de Monitoramento de Riscos

### Ferramentas

| Ferramenta | Propósito | Frequência |
|------------|-----------|------------|
| **Uptime Robot** | Disponibilidade (Supabase, Python server) | 5 minutos |
| **Grafana** | Métricas técnicas (latência, CPU, RAM) | Tempo real |
| **Sentry** | Error tracking (frontend + backend) | Tempo real |
| **Snyk** | Vulnerabilidades de dependências | Diário |
| **Lighthouse CI** | Performance score | A cada deploy |
| **GitHub Projects** | Progresso de desenvolvimento (scope creep) | Semanal |
| **Google Analytics** | Uso do sistema, browsers | Semanal |

### Reuniões de Revisão de Riscos

**Semanal** (15 minutos):
- Revisar riscos 🔴 Críticos
- Atualizar status de mitigações

**Mensal** (1 hora):
- Revisar todos os riscos
- Adicionar novos riscos identificados
- Atualizar scores (probabilidade/impacto)
- Revisar contingências

---

## Novos Riscos Identificados

### Como Reportar Novo Risco

```markdown
### RXX: [Nome do Risco] [🔴/🟠/🟡/🟢]

**Descrição**: [Descrição clara do risco]

**Probabilidade**: X (Baixa/Média/Alta/Muito Alta)
**Impacto**: Y (Baixo/Médio/Alto/Crítico)
**Score**: X×Y [Nível]

**Mitigação**:
1. ✅ [Ação preventiva]
2. ✅ [Ação preventiva]

**Contingência**:
- [Plano se risco se materializar]

**Monitoramento**:
- [Métrica/ferramenta]
```

---

## Glossário

- **RLS**: Row Level Security (Segurança a nível de linha no PostgreSQL)
- **JWT**: JSON Web Token
- **BLE**: Bluetooth Low Energy
- **LGPD**: Lei Geral de Proteção de Dados
- **MVP**: Minimum Viable Product
- **SLA**: Service Level Agreement
- **DPO**: Data Protection Officer
- **ANPD**: Autoridade Nacional de Proteção de Dados

---

## Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Risk Management Framework](https://www.nist.gov/cyberframework)
- [ISO 31000 - Risk Management](https://www.iso.org/iso-31000-risk-management.html)
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

---

**Última atualização**: 2025-01-16
**Versão**: 1.0
**Responsável**: Equipe Técnica NeuroOne
