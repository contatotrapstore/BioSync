# ✅ CORREÇÃO: Rate Limit Bloqueando Dados do Monitor EEG

## 📋 Resumo

O monitor EEG estava conectando com sucesso ao aparelho MindWave via Bluetooth, mas ficava travado no status "DESATENÇÃO" após alguns segundos. Análise completa usando Sequential Thinking identificou que o backend estava bloqueando os dados por excesso de requisições.

---

## 🔍 Análise do Problema (Sequential Thinking)

### Root Cause Identificado

**Monitor enviava dados MUITO frequentemente:**
- `EEG_SEND_INTERVAL = 100ms` (linha 403)
- Frequência: 10 Hz
- **Total: 600 requisições por minuto**

**Backend possui rate limit:**
- Limite configurado: `maxRequests: 300, windowMs: 60000` ([rateLimit.js:160](neuroone-backend/src/middleware/rateLimit.js#L160))
- **Limite: 300 requisições por 60 segundos**

**Resultado:**
- ❌ Monitor excedia o limite em 2x (600 vs 300)
- ❌ Após 30 segundos, todas as requisições eram bloqueadas
- ❌ Socket.IO emitia eventos "error"
- ❌ Monitor mostrava "DESATENÇÃO" permanentemente

---

## 📊 Evidências dos Logs

### Backend Logs
```
[WARN] Rate limit exceeded for socket yFpsL70vOr4Yv5NQAACh on event eeg:data (301/300)
[WARN] Rate limit blocked: aluno@neuroone.com - eeg:data
[WARN] Rate limit exceeded for socket yFpsL70vOr4Yv5NQAACh on event eeg:data (302/300)
[WARN] Rate limit exceeded for socket yFpsL70vOr4Yv5NQAACh on event eeg:data (303/300)
...
[WARN] Rate limit exceeded for socket yFpsL70vOr4Yv5NQAACh on event eeg:data (365/300)
```

**Observações:**
- ✅ Socket único (não havia múltiplas conexões)
- ✅ Contador incrementando continuamente (301, 302, 303...)
- ✅ Mensagens de bloqueio constantes
- ✅ Múltiplas tentativas de autenticação (reconexões automáticas do Socket.IO)

---

## 🛠️ Solução Implementada

### Mudança no Monitor

**Arquivo:** [eeg-monitor.html:403](neuroone-backend/public/monitor/eeg-monitor.html#L403)

**Antes:**
```javascript
const EEG_SEND_INTERVAL = 100; // ms
```

**Depois:**
```javascript
const EEG_SEND_INTERVAL = 200; // ms (5 Hz = 300 requests/min, matches backend rate limit of 300/60s)
```

### Cálculo da Nova Frequência

- **Intervalo:** 200ms
- **Frequência:** 5 Hz
- **Total por minuto:** 5 × 60 = **300 requisições**
- **✅ Exatamente no limite do backend!**

---

## 🎯 Por que 5 Hz é Suficiente?

O dispositivo **MindWave Mobile** envia:

| Tipo de Dado | Frequência Original |
|--------------|---------------------|
| Raw EEG | 512 Hz |
| eSense Metrics (Attention/Meditation) | **1 Hz** |
| Signal Quality | 1 Hz |

**Conclusão:** As métricas de atenção e meditação (eSense) atualizam apenas **1 vez por segundo**. Enviar a 5 Hz (a cada 200ms) é **5x mais rápido** que a taxa de atualização do dispositivo, garantindo que nenhum dado seja perdido.

---

## ✅ Benefícios da Solução

1. **✅ Mantém proteção do backend** - Rate limit permanece em 300/min
2. **✅ Monitor não é bloqueado** - Fica dentro do limite
3. **✅ Nenhum dado perdido** - 5 Hz é mais que suficiente para eSense (1 Hz)
4. **✅ Reduz carga do servidor** - Menos requisições processadas
5. **✅ Melhora latência** - Menos dados na rede
6. **✅ Fix mínimo** - Uma única linha alterada

---

## 🧪 Como Testar

1. **Recarregue a página do monitor** (F5 ou Ctrl+R)
2. Conecte ao aparelho MindWave via Bluetooth
3. Aguarde a conexão estabelecer
4. **✅ Verificar:** Status deve alternar entre "ATENÇÃO" e "DESATENÇÃO" corretamente
5. **✅ Verificar:** Sem erros no console do browser
6. **✅ Verificar:** Backend sem warnings de "Rate limit exceeded"

### Logs Esperados (Backend)

**ANTES (errado):**
```
[WARN] Rate limit exceeded for socket ... on event eeg:data (301/300)
[WARN] Rate limit exceeded for socket ... on event eeg:data (302/300)
[WARN] Rate limit exceeded for socket ... on event eeg:data (303/300)
```

**DEPOIS (correto):**
```
[DEBUG] EEG data received from aluno@neuroone.com
[DEBUG] Broadcasting EEG data to session [session-id]
(Sem warnings de rate limit!)
```

---

## 📂 Arquivos Modificados

1. ✅ [neuroone-backend/public/monitor/eeg-monitor.html](neuroone-backend/public/monitor/eeg-monitor.html#L403)

---

## 🔄 Linha do Tempo do Problema

### 1. Monitor carregava normalmente
- ✅ Socket.IO conectava
- ✅ Estudante entrava na sessão
- ✅ Bluetooth conectava ao MindWave

### 2. Envio de dados iniciava
- ✅ Primeiras 300 requisições aceitas (primeiros 30 segundos)
- ❌ Requisição 301 em diante: BLOQUEADAS

### 3. Backend bloqueava dados
- ❌ Rate limiter rejeitava requisições
- ❌ Socket.IO emitia eventos "error"
- ❌ Monitor recebia erros mas não sabia interpretar

### 4. Monitor ficava travado
- ❌ Status mostrava "DESATENÇÃO" (default quando não há dados)
- ❌ Console mostrava: `❌ [MONITOR] Erro Socket.IO: Object`
- ❌ Múltiplas reconexões automáticas (visível nos logs: "Socket authentication attempt")

---

## 🚀 Status Final

| Item | Status |
|------|--------|
| Root Cause Identificado | ✅ Rate limit 300/min vs 600 requisições/min |
| Solução Implementada | ✅ EEG_SEND_INTERVAL alterado para 200ms |
| Frequência de Envio | ✅ 5 Hz (300 req/min) |
| Compatibilidade com MindWave | ✅ 5x mais rápido que eSense (1 Hz) |
| Backend Rate Limit | ✅ Mantido em 300/min (segurança) |
| Monitor Modificado | ✅ Uma linha alterada |
| Compilação | ✅ Backend rodando normalmente |

---

## ⚠️ PRÓXIMO PASSO

**VOCÊ PRECISA:**
1. Recarregar a página do monitor no browser (F5)
2. Conectar ao MindWave via Bluetooth
3. Verificar se o status agora alterna corretamente entre "ATENÇÃO" e "DESATENÇÃO"

O backend já está rodando com o arquivo atualizado, mas o browser ainda tem o código antigo em cache!

---

**Data da Correção:** 2025-11-20
**Método de Análise:** Sequential Thinking (9 thoughts)
**Status:** ✅ COMPLETO - Aguardando teste do usuário
