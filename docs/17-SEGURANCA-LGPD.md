# 17 - SEGURANÇA E LGPD

## Visão Geral

A plataforma NeuroOne lida com dados sensíveis de saúde e educação, incluindo informações neurofisiológicas de menores de idade. Este documento estabelece os requisitos de segurança e compliance com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) e GDPR.

---

## 1. Classificação de Dados

### 1.1 Dados Pessoais

**Definição LGPD**: Informação relacionada a pessoa natural identificada ou identificável.

**No NeuroOne**:
- Nome completo
- Email
- Data de nascimento
- CPF (se aplicável)
- Fotos/avatar

**Categoria LGPD**: Dados pessoais comuns

### 1.2 Dados Pessoais Sensíveis

**Definição LGPD**: Dados sobre saúde, dados biométricos.

**No NeuroOne**:
- Dados de EEG (ondas cerebrais)
- Métricas de atenção
- Métricas de relaxamento
- Histórico de sessões de neurofeedback

**Categoria LGPD**: Dados pessoais sensíveis (Art. 11)

### 1.3 Dados de Menores

**Definição LGPD**: Dados de crianças e adolescentes (<18 anos).

**No NeuroOne**:
- Todos os dados de alunos menores de 18 anos
- Requer consentimento dos pais/responsáveis

**Categoria LGPD**: Dados de crianças e adolescentes (Art. 14)

---

## 2. Bases Legais (LGPD Art. 7 e 11)

### 2.1 Base Legal para Processamento

**Para Dados Pessoais Comuns**:
- **Consentimento** (Art. 7, I): Professores e direção consentem ao aceitar termos
- **Execução de contrato** (Art. 7, V): Alunos participam mediante matrícula escolar
- **Legítimo interesse** (Art. 7, IX): Melhoria pedagógica

**Para Dados Sensíveis**:
- **Consentimento específico** (Art. 11, I): Obrigatório para dados de EEG
- **Tutela da saúde** (Art. 11, II, f): Monitoramento de atenção para fins educacionais

### 2.2 Consentimento

**Requisitos**:
- Livre, informado, inequívoco
- Finalidade específica
- Possibilidade de revogação
- Destacado das demais cláusulas

**Implementação no Sistema**:
```javascript
// Termo de Consentimento ao criar conta de aluno
const consentTerms = {
  version: "1.0",
  date: new Date().toISOString(),
  userId: studentId,
  terms: [
    {
      id: "data_collection_eeg",
      title: "Coleta de dados de EEG",
      description: "Autorizo a coleta e processamento de dados de eletroencefalograma (EEG)...",
      required: true,
      accepted: false,
      acceptedAt: null
    },
    {
      id: "data_sharing_teacher",
      title: "Compartilhamento com professor",
      description: "Autorizo o compartilhamento de minhas métricas com meu professor...",
      required: true,
      accepted: false,
      acceptedAt: null
    }
  ]
};
```

---

## 3. Segurança da Informação

### 3.1 Autenticação

**Método**: JWT (JSON Web Tokens)

**Implementação**:
```javascript
// Backend - geração de token
const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}
```

**Requisitos de Senha**:
- Mínimo 8 caracteres
- Ao menos 1 letra maiúscula
- Ao menos 1 letra minúscula
- Ao menos 1 número
- Ao menos 1 caractere especial

**Hashing de Senha**:
```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
```

### 3.2 Autorização (RBAC)

**Roles**:
- `student`: Acesso apenas aos próprios dados
- `teacher`: Acesso aos dados de seus alunos e turmas
- `direction`: Acesso a todos os dados (agregados quando possível)

**Middleware de Autorização**:
```javascript
function checkRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    next();
  };
}

// Uso nas rotas
app.get('/api/users', authenticateToken, checkRole(['direction']), getUsers);
app.get('/api/sessions/:id', authenticateToken, checkSessionAccess, getSession);
```

**Verificação de Acesso a Recursos**:
```javascript
async function checkSessionAccess(req, res, next) {
  const sessionId = req.params.id;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const session = await getSession(sessionId);

  // Direção tem acesso total
  if (userRole === 'direction') {
    return next();
  }

  // Professor só acessa sessões que criou
  if (userRole === 'teacher' && session.teacher_id === userId) {
    return next();
  }

  // Aluno só acessa sessões em que participou
  if (userRole === 'student') {
    const participated = await checkParticipation(sessionId, userId);
    if (participated) {
      return next();
    }
  }

  return res.status(403).json({ error: 'Acesso negado a este recurso' });
}
```

### 3.3 Criptografia

**Em Trânsito**:
- HTTPS/TLS 1.3 obrigatório
- WSS (WebSocket Secure) para dados em tempo real
- Certificado SSL válido

**Em Repouso**:
- Senhas: bcrypt (hash + salt)
- Dados sensíveis: Criptografia AES-256 (opcional para compliance extra)

```javascript
const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encrypted.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

  let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 3.4 Proteção de API

**Rate Limiting**:
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos'
});

app.use('/api/', apiLimiter);
```

**CORS**:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://neuroone.app',
    'https://www.neuroone.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null
  ].filter(Boolean),
  credentials: true
}));
```

**Helmet (Security Headers)**:
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**Sanitização de Entrada**:
```javascript
const validator = require('validator');

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Remover scripts
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Escapar HTML
  sanitized = validator.escape(sanitized);

  return sanitized;
}

// Middleware
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
});
```

---

## 4. Políticas de Privacidade

### 4.1 Row Level Security (RLS) - Supabase

**Política para Alunos**:
```sql
-- Alunos só veem seus próprios dados
CREATE POLICY "Students can view own data"
ON student_metrics
FOR SELECT
USING (auth.uid() = student_id);

-- Alunos não podem deletar/atualizar
CREATE POLICY "Students cannot modify metrics"
ON student_metrics
FOR UPDATE
USING (false);

CREATE POLICY "Students cannot delete metrics"
ON student_metrics
FOR DELETE
USING (false);
```

**Política para Professores**:
```sql
-- Professores veem dados de alunos em suas turmas
CREATE POLICY "Teachers view their students"
ON student_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = student_metrics.session_id
      AND c.teacher_id = auth.uid()
  )
);
```

**Política para Direção**:
```sql
-- Direção vê todos os dados
CREATE POLICY "Direction view all"
ON student_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'direction'
  )
);
```

### 4.2 Minimização de Dados

**Princípio**: Coletar apenas dados estritamente necessários.

**Implementação**:
- Não coletar CPF (não é necessário)
- Avatar/foto é opcional
- Data de nascimento apenas se necessário para validação de idade
- Não armazenar IP dos usuários

### 4.3 Anonimização para Analytics

**Dados Agregados**:
```javascript
// Dashboard de direção usa dados agregados, sem identificação individual
async function getAggregatedClassMetrics(classId) {
  const { data } = await supabase
    .from('student_metrics')
    .select('avg_attention, avg_relaxation')
    .eq('class_id', classId);

  return {
    classId: classId,
    totalStudents: data.length,
    avgAttention: data.reduce((sum, m) => sum + m.avg_attention, 0) / data.length,
    avgRelaxation: data.reduce((sum, m) => sum + m.avg_relaxation, 0) / data.length
    // Não retorna dados individuais
  };
}
```

---

## 5. Direitos dos Titulares (LGPD Art. 18)

### 5.1 Confirmação e Acesso

**Endpoint**:
```javascript
// GET /api/lgpd/my-data
app.get('/api/lgpd/my-data', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const userData = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  const sessions = await supabase
    .from('session_participants')
    .select('*')
    .eq('student_id', userId);

  const metrics = await supabase
    .from('student_metrics')
    .select('*')
    .eq('student_id', userId);

  res.json({
    personalData: userData,
    sessions: sessions,
    metrics: metrics,
    exportedAt: new Date().toISOString()
  });
});
```

### 5.2 Correção

**Endpoint**:
```javascript
// PATCH /api/users/me
app.patch('/api/users/me', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { name, email } = req.body;

  // Validar dados
  if (email && !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ name, email, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});
```

### 5.3 Portabilidade

**Exportação em JSON**:
```javascript
// GET /api/lgpd/export
app.get('/api/lgpd/export', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const format = req.query.format || 'json'; // json ou csv

  const allData = await gatherUserData(userId);

  if (format === 'csv') {
    const csv = convertToCSV(allData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=meus_dados_${userId}.csv`);
    return res.send(csv);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=meus_dados_${userId}.json`);
  res.json(allData);
});
```

### 5.4 Exclusão (Direito ao Esquecimento)

**Endpoint**:
```javascript
// DELETE /api/lgpd/delete-account
app.delete('/api/lgpd/delete-account', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  // Verificar se usuário pode ser deletado
  // (ex: direção não pode se auto-deletar se for único admin)
  if (req.user.role === 'direction') {
    const directionCount = await countUsersByRole('direction');
    if (directionCount <= 1) {
      return res.status(400).json({
        error: 'Não é possível deletar a única conta de direção'
      });
    }
  }

  // Anonimizar dados em vez de deletar fisicamente (para manter integridade)
  await supabase
    .from('users')
    .update({
      name: `Usuário Deletado ${userId.slice(0, 8)}`,
      email: `deleted_${userId}@neuroone.local`,
      active: false,
      deleted_at: new Date().toISOString(),
      deletion_requested: true
    })
    .eq('id', userId);

  // Agendar exclusão física após 30 dias (período de retenção legal)
  await schedulePhysicalDeletion(userId, 30);

  res.json({ message: 'Conta marcada para exclusão em 30 dias' });
});
```

### 5.5 Revogação de Consentimento

**Endpoint**:
```javascript
// POST /api/lgpd/revoke-consent
app.post('/api/lgpd/revoke-consent', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { consentId } = req.body;

  await supabase
    .from('user_consents')
    .update({
      revoked: true,
      revoked_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('consent_id', consentId);

  // Se consentimento essencial, desativar funcionalidade
  if (consentId === 'data_collection_eeg') {
    await supabase
      .from('users')
      .update({ eeg_data_collection_enabled: false })
      .eq('id', userId);
  }

  res.json({ message: 'Consentimento revogado com sucesso' });
});
```

---

## 6. Auditoria e Logs

### 6.1 Log de Acesso a Dados Sensíveis

```javascript
async function logDataAccess(userId, action, resourceType, resourceId) {
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: req.ip, // Opcional, anonimizar
      timestamp: new Date().toISOString()
    });
}

// Exemplo de uso
app.get('/api/sessions/:id', authenticateToken, async (req, res) => {
  const sessionId = req.params.id;

  // Registrar acesso
  await logDataAccess(req.user.userId, 'VIEW', 'session', sessionId);

  const session = await getSession(sessionId);
  res.json(session);
});
```

### 6.2 Retenção de Logs

- Logs de auditoria: 12 meses
- Logs de aplicação: 6 meses
- Logs de erro: 12 meses

**Rotina de Limpeza**:
```javascript
// Cron job diário
cron.schedule('0 2 * * *', async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  await supabase
    .from('audit_logs')
    .delete()
    .lt('timestamp', twelveMonthsAgo.toISOString());

  console.log('Logs antigos removidos');
});
```

---

## 7. Incidentes de Segurança

### 7.1 Plano de Resposta

**Etapas**:
1. **Detecção**: Monitoramento automático + relatos
2. **Contenção**: Isolar sistema afetado
3. **Investigação**: Determinar escopo e causa
4. **Notificação**: ANPD + titulares (se aplicável)
5. **Remediação**: Corrigir vulnerabilidade
6. **Prevenção**: Implementar medidas preventivas

**Prazo de Notificação à ANPD**:
- Prazo razoável (geralmente 2-5 dias úteis)
- Imediatamente se risco alto aos titulares

### 7.2 Comunicação de Incidente

**Template de Email aos Titulares**:
```
Assunto: Notificação de Incidente de Segurança - NeuroOne

Prezado(a) [NOME],

Informamos que em [DATA], identificamos um incidente de segurança que pode ter afetado
seus dados pessoais na plataforma NeuroOne.

DADOS AFETADOS:
- [Listar tipos de dados]

MEDIDAS TOMADAS:
- [Listar ações de contenção e correção]

RECOMENDAÇÕES:
- Alterar sua senha imediatamente
- Monitorar atividades suspeitas

Para mais informações, entre em contato: privacidade@neuroone.com

Atenciosamente,
Equipe NeuroOne
```

---

## 8. Compliance e Documentação

### 8.1 Registro de Atividades de Tratamento (LGPD Art. 37)

**Template**:
```markdown
# REGISTRO DE ATIVIDADES DE TRATAMENTO

## 1. IDENTIFICAÇÃO DO CONTROLADOR
- Nome: [Instituição de Ensino]
- CNPJ: [CNPJ]
- Endereço: [Endereço]

## 2. ENCARREGADO (DPO)
- Nome: [Nome do DPO]
- Email: privacidade@neuroone.com
- Telefone: [Telefone]

## 3. ATIVIDADE: Monitoramento de Atenção em Sala de Aula

### 3.1 Finalidade
- Melhorar desempenho acadêmico dos alunos
- Fornecer feedback personalizado aos professores
- Gerar relatórios de engajamento

### 3.2 Categorias de Dados Tratados
- Dados pessoais: Nome, email, turma
- Dados sensíveis: Métricas de EEG (atenção, relaxamento, ondas cerebrais)
- Dados de menores: Sim (alunos < 18 anos)

### 3.3 Base Legal
- Consentimento específico (Art. 11, I)
- Tutela da saúde (Art. 11, II, f)

### 3.4 Período de Retenção
- Dados ativos: Durante período letivo + 5 anos
- Após: Anonimização ou exclusão

### 3.5 Medidas de Segurança
- Criptografia em trânsito (TLS 1.3)
- Autenticação JWT
- RLS (Row Level Security)
- Logs de auditoria
- Backup diário

### 3.6 Compartilhamento
- Interno: Professores (dados de seus alunos), Direção (dados agregados)
- Externo: Nenhum

### 3.7 Transferência Internacional
- Não aplicável
```

### 8.2 Política de Privacidade (Resumida)

**Pontos Principais**:
1. Quais dados coletamos
2. Como usamos os dados
3. Com quem compartilhamos
4. Como protegemos os dados
5. Seus direitos (Art. 18 LGPD)
6. Contato do encarregado
7. Alterações na política

**Link**: `https://neuroone.app/privacidade`

### 8.3 Termos de Uso

**Pontos Principais**:
1. Descrição do serviço
2. Requisitos de idade (menores precisam de autorização)
3. Responsabilidades dos usuários
4. Propriedade intelectual
5. Limitação de responsabilidade
6. Legislação aplicável

**Link**: `https://neuroone.app/termos`

---

## 9. Checklist de Implementação

### Autenticação e Autorização
- [ ] JWT com expiração de 15 minutos
- [ ] Refresh tokens de 7 dias
- [ ] Hashing bcrypt com 12 rounds
- [ ] RBAC implementado
- [ ] Middleware de verificação de acesso

### Proteção de Dados
- [ ] HTTPS/TLS 1.3 obrigatório
- [ ] WSS para WebSocket
- [ ] RLS configurado no Supabase
- [ ] Sanitização de inputs
- [ ] Rate limiting
- [ ] CORS configurado
- [ ] Helmet (security headers)

### LGPD
- [ ] Termo de consentimento implementado
- [ ] Endpoint de acesso aos dados (/lgpd/my-data)
- [ ] Endpoint de exportação (/lgpd/export)
- [ ] Endpoint de exclusão (/lgpd/delete-account)
- [ ] Endpoint de revogação de consentimento
- [ ] Política de privacidade publicada
- [ ] Termos de uso publicados
- [ ] Encarregado (DPO) designado

### Auditoria
- [ ] Logs de acesso a dados sensíveis
- [ ] Retenção de logs configurada
- [ ] Rotina de limpeza de logs
- [ ] Plano de resposta a incidentes

### Documentação
- [ ] Registro de atividades de tratamento
- [ ] Mapeamento de fluxo de dados
- [ ] Documentação técnica de segurança

---

## 10. Contatos

**Encarregado de Proteção de Dados (DPO)**:
- Email: privacidade@neuroone.com
- Telefone: [A definir]

**Suporte Técnico**:
- Email: suporte@neuroone.com

**Notificação de Incidentes**:
- Email: seguranca@neuroone.com
- Disponível 24/7

---

## Referências Legais

- Lei 13.709/2018 (LGPD)
- GDPR (Regulamento UE 2016/679)
- Marco Civil da Internet (Lei 12.965/2014)
- Resoluções ANPD
