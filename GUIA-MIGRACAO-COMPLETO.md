# 📦 Guia Completo de Migração NeuroGame

**Versão:** 1.2.6 | **Data:** 16/10/2025

Este documento descreve como migrar todos os sistemas desenvolvidos no NeuroGame para outro projeto. Inclui: Sistema de Psicólogos, Sistema de Pontuação, Sistema de Imagens e Admin Panel.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Pré-Requisitos](#-pré-requisitos)
3. [Estrutura da Migração](#-estrutura-da-migração)
4. [Migração do Backend](#-migração-do-backend)
5. [Migração do Admin Panel](#-migração-do-admin-panel)
6. [Migração do Launcher](#-migração-do-launcher)
7. [Migração do Banco de Dados](#-migração-do-banco-de-dados)
8. [Sistema de Imagens](#-sistema-de-imagens)
9. [Testes e Validação](#-testes-e-validação)
10. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

### Sistemas a Migrar

1. **Sistema de Psicólogos** (v1.2.0)
   - Cadastro e autenticação de psicólogos
   - Dashboard de psicólogos
   - Atribuição de pacientes
   - JWT com campo `isPsychologist`

2. **Sistema de Pontuação** (v1.0.0)
   - Captura automática de pontuações nos jogos
   - API REST para pontuações
   - Dashboard com estatísticas e gráficos
   - Histórico detalhado de sessões

3. **Sistema de Imagens** (v1.2.5/1.2.6)
   - Validação rigorosa de URLs
   - Supabase Storage para hospedar imagens
   - Script Python para upload
   - Correção de URLs no banco

4. **Admin Panel Melhorado** (v2.0)
   - Dashboard reformulado
   - Formulário de jogos simplificado
   - Upload direto de pastas
   - Interface responsiva

---

## 🔧 Pré-Requisitos

### Ferramentas Necessárias

- **Node.js:** v18+ (recomendado v20)
- **npm:** v9+
- **PostgreSQL:** v15+ (Supabase recomendado)
- **Python:** v3.8+ (para scripts de upload)
- **Git:** Para versionamento

### Conhecimentos Requeridos

- Express.js e Node.js
- React 18 e Material-UI v5
- PostgreSQL e SQL
- JWT Authentication
- RESTful APIs

### Projeto Destino

- Backend Node.js + Express existente
- Admin Panel React existente (ou criar novo)
- Banco de dados PostgreSQL
- (Opcional) Launcher Electron

---

## 📂 Estrutura da Migração

```
migration-package/
├── backend/
│   ├── controllers/
│   │   ├── psychologistController.js
│   │   └── scoresController.js
│   ├── routes/
│   │   ├── psychologists.js
│   │   └── scores.js
│   ├── middleware/
│   │   └── isPsychologist.js
│   └── README-BACKEND.md
│
├── admin-panel/
│   ├── pages/
│   │   ├── PsychologistDashboard.jsx
│   │   ├── GamesList.jsx
│   │   └── NewGameForm.jsx
│   ├── components/
│   │   ├── PatientCard.jsx
│   │   ├── ScoreChart.jsx
│   │   └── ScoreHistory.jsx
│   └── README-ADMIN.md
│
├── launcher/
│   ├── utils/
│   │   └── placeholders.js
│   ├── pages/
│   │   └── GameDetail.jsx
│   └── README-LAUNCHER.md
│
├── database/
│   ├── 01-create-tables.sql
│   ├── 02-rls-policies.sql
│   ├── 03-fix-game-images.sql
│   └── README-DATABASE.md
│
├── scripts/
│   ├── upload-game-covers.py
│   ├── test-api-endpoints.js
│   └── README-SCRIPTS.md
│
└── README.md (este arquivo)
```

---

## 🖥️ Migração do Backend

### 1. Instalar Dependências

```bash
cd seu-backend/
npm install bcrypt uuid @supabase/supabase-js
```

### 2. Copiar Controllers

**Arquivo:** `migration-package/backend/controllers/psychologistController.js`

```javascript
// Copiar para: src/controllers/psychologistController.js
const { supabase } = require('../config/supabase');

// GET /api/v1/psychologists/patients
exports.getPatientsWithScores = async (req, res) => {
  try {
    const psychologistId = req.user.id;

    // Buscar pacientes atribuídos
    const { data: patients, error } = await supabase
      .from('psychologist_patients')
      .select(`
        patient_id,
        users!psychologist_patients_patient_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('psychologist_id', psychologistId);

    if (error) throw error;

    // Para cada paciente, buscar estatísticas de pontuação
    const patientsWithScores = await Promise.all(
      patients.map(async (p) => {
        const patientId = p.patient_id;
        const patientInfo = p.users;

        // Buscar pontuações do paciente
        const { data: scores, error: scoresError } = await supabase
          .from('game_scores')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false });

        if (scoresError) throw scoresError;

        // Calcular estatísticas
        const totalSessions = scores.length;
        const avgScore = scores.length > 0
          ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
          : 0;
        const bestScore = scores.length > 0
          ? Math.max(...scores.map(s => s.score))
          : 0;

        return {
          id: patientId,
          name: patientInfo.name,
          email: patientInfo.email,
          stats: {
            totalSessions,
            avgScore: Math.round(avgScore),
            bestScore
          }
        };
      })
    );

    res.json({
      success: true,
      data: patientsWithScores
    });
  } catch (error) {
    console.error('[psychologist] Erro ao buscar pacientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pacientes'
    });
  }
};

// GET /api/v1/psychologists/patients/:id/scores
exports.getPatientScores = async (req, res) => {
  try {
    const psychologistId = req.user.id;
    const patientId = req.params.id;

    // Verificar se o paciente pertence a este psicólogo
    const { data: relationship, error: relError } = await supabase
      .from('psychologist_patients')
      .select('*')
      .eq('psychologist_id', psychologistId)
      .eq('patient_id', patientId)
      .single();

    if (relError || !relationship) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a este paciente'
      });
    }

    // Buscar todas as pontuações
    const { data: scores, error } = await supabase
      .from('game_scores')
      .select(`
        *,
        games (
          name,
          slug
        )
      `)
      .eq('user_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    console.error('[psychologist] Erro ao buscar pontuações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pontuações'
    });
  }
};
```

**Arquivo:** `migration-package/backend/controllers/scoresController.js`

```javascript
// Copiar para: src/controllers/scoresController.js
const { supabase } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// POST /api/v1/scores
exports.createScore = async (req, res) => {
  try {
    const { gameSlug, score, metadata } = req.body;
    const userId = req.user.id;

    // Validação
    if (!gameSlug || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'gameSlug e score são obrigatórios'
      });
    }

    // Buscar o jogo pelo slug
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('slug', gameSlug)
      .single();

    if (gameError || !game) {
      return res.status(404).json({
        success: false,
        error: 'Jogo não encontrado'
      });
    }

    // Criar idempotency key para evitar duplicatas
    const idempotencyKey = `${userId}-${game.id}-${Date.now()}`;

    // Inserir pontuação
    const { data: newScore, error } = await supabase
      .from('game_scores')
      .insert({
        id: uuidv4(),
        user_id: userId,
        game_id: game.id,
        score: parseInt(score),
        metadata: metadata || {},
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Se erro de duplicata (idempotency), retornar sucesso
      if (error.code === '23505') {
        return res.status(200).json({
          success: true,
          message: 'Pontuação já registrada'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data: newScore
    });
  } catch (error) {
    console.error('[scores] Erro ao criar pontuação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar pontuação'
    });
  }
};
```

### 3. Copiar Middleware

**Arquivo:** `migration-package/backend/middleware/isPsychologist.js`

```javascript
// Copiar para: src/middleware/isPsychologist.js

// Middleware para verificar se o usuário é psicólogo
const isPsychologist = (req, res, next) => {
  // Verificar se o usuário está autenticado
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado'
    });
  }

  // Verificar se tem flag isPsychologist
  if (!req.user.isPsychologist) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas psicólogos podem acessar este recurso.'
    });
  }

  next();
};

module.exports = isPsychologist;
```

### 4. Copiar Rotas

**Arquivo:** `migration-package/backend/routes/psychologists.js`

```javascript
// Copiar para: src/routes/psychologists.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // Seu middleware de auth existente
const isPsychologist = require('../middleware/isPsychologist');
const psychologistController = require('../controllers/psychologistController');

// Todas as rotas requerem autenticação + ser psicólogo
router.use(authMiddleware);
router.use(isPsychologist);

// GET /api/v1/psychologists/patients - Listar pacientes
router.get('/patients', psychologistController.getPatientsWithScores);

// GET /api/v1/psychologists/patients/:id/scores - Pontuações de um paciente
router.get('/patients/:id/scores', psychologistController.getPatientScores);

module.exports = router;
```

**Arquivo:** `migration-package/backend/routes/scores.js`

```javascript
// Copiar para: src/routes/scores.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const scoresController = require('../controllers/scoresController');
const { body } = require('express-validator');

// POST /api/v1/scores - Registrar pontuação
router.post(
  '/',
  authMiddleware,
  [
    body('gameSlug').notEmpty().withMessage('gameSlug é obrigatório'),
    body('score').isNumeric().withMessage('score deve ser numérico')
  ],
  scoresController.createScore
);

module.exports = router;
```

### 5. Registrar Rotas no App Principal

**Adicionar em:** `src/server.js` ou `src/app.js`

```javascript
// Importar novas rotas
const psychologistsRouter = require('./routes/psychologists');
const scoresRouter = require('./routes/scores');

// Registrar rotas
app.use('/api/v1/psychologists', psychologistsRouter);
app.use('/api/v1/scores', scoresRouter);
```

### 6. Atualizar Geração de JWT

**Modificar:** Seu controller de autenticação (ex: `authController.js`)

```javascript
// Ao gerar o token JWT, adicionar campo isPsychologist

// Buscar usuário do banco
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single();

// Gerar token com flag isPsychologist
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    isPsychologist: user.is_psychologist || false // ⬅️ ADICIONAR ISTO
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

---

## 🎨 Migração do Admin Panel

### 1. Instalar Dependências (se necessário)

```bash
cd seu-admin-panel/
npm install recharts axios
```

### 2. Copiar Dashboard de Psicólogos

**Arquivo:** `migration-package/admin-panel/pages/PsychologistDashboard.jsx`

```jsx
// Copiar para: src/pages/PsychologistDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';
import PatientCard from '../components/PatientCard';

const PsychologistDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Ajustar conforme seu sistema
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/psychologists/patients`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPatients(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
      setError('Erro ao carregar pacientes. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard de Psicólogos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {patients.length === 0 ? (
        <Alert severity="info">
          Nenhum paciente atribuído ainda.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {patients.map((patient) => (
            <Grid item xs={12} md={6} lg={4} key={patient.id}>
              <PatientCard patient={patient} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default PsychologistDashboard;
```

### 3. Copiar Componentes

**Arquivo:** `migration-package/admin-panel/components/PatientCard.jsx`

```jsx
// Copiar para: src/components/PatientCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip
} from '@mui/material';
import { Person, TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PatientCard = ({ patient }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Person sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">{patient.name}</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {patient.email}
        </Typography>

        <Box mt={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Sessões:</Typography>
            <Chip label={patient.stats.totalSessions} size="small" />
          </Box>

          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Média:</Typography>
            <Chip
              label={patient.stats.avgScore}
              size="small"
              color="primary"
            />
          </Box>

          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Melhor:</Typography>
            <Chip
              label={patient.stats.bestScore}
              size="small"
              color="success"
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          startIcon={<TrendingUp />}
          onClick={() => navigate(`/psicologos/pacientes/${patient.id}`)}
        >
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
```

### 4. Adicionar Rota no Router

**Modificar:** `src/App.jsx` ou `src/routes.jsx`

```jsx
import PsychologistDashboard from './pages/PsychologistDashboard';
import PatientDetail from './pages/PatientDetail'; // Detalhado no migration-package

// Adicionar rotas protegidas
<Route path="/psicologos" element={<PsychologistDashboard />} />
<Route path="/psicologos/pacientes/:id" element={<PatientDetail />} />
```

---

## 🎮 Migração do Launcher

### 1. Copiar Sistema de Validação de Imagens

**Arquivo:** `migration-package/launcher/utils/placeholders.js`

```javascript
// Copiar para: src/utils/placeholders.js

// Validação rigorosa de URLs de imagens
export const getGameImage = (imageUrl) => {
  // Se tem URL válida, retornar diretamente
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
    const url = imageUrl.trim()

    // Rejeitar caminhos locais inválidos
    if (url.startsWith('/') || url.startsWith('C:') || url.startsWith('file://')) {
      console.warn('[placeholders] Caminho local inválido rejeitado:', url);
      return null
    }

    // Aceitar apenas URLs completas (http:// ou https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    // Qualquer outro formato é inválido
    console.warn('[placeholders] Formato de URL inválido:', url);
    return null
  }

  // Sem imagem - retornar null para usar placeholder
  return null
}

// Gerar placeholder com cor e texto
export const buildGamePlaceholder = (gameName, width = 400, height = 225) => {
  // ... (código completo no migration-package)
}
```

### 2. Corrigir GameDetail

**Arquivo:** `migration-package/launcher/pages/GameDetail.jsx`

```jsx
// Modificar em: src/pages/GameDetail.jsx

useEffect(() => {
  if (!game) return;

  // Usar coverImage que já vem do banco com a URL completa do Supabase
  const imageUrl = getGameImage(game.coverImage);

  if (imageUrl) {
    setCoverImage(imageUrl);
  } else {
    setCoverImage(buildGamePlaceholder(game.name, 800, 450));
  }
}, [game]);
```

### 3. Captura de Pontuações nos Jogos

Adicionar em cada jogo HTML (template):

```html
<!-- Adicionar no <head> ou antes de </body> -->
<script>
  // Captura automática de pontuação ao sair do jogo
  window.addEventListener('beforeunload', function() {
    const finalScore = /* sua variável de pontuação */;

    // Salvar no localStorage
    localStorage.setItem('neurogame_last_score', JSON.stringify({
      score: finalScore,
      timestamp: Date.now()
    }));
  });
</script>
```

---

## 🗄️ Migração do Banco de Dados

### 1. Criar Tabelas

**Arquivo:** `migration-package/database/01-create-tables.sql`

```sql
-- ===================================================================
-- TABELA: psychologist_patients
-- Relaciona psicólogos com seus pacientes
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.psychologist_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psychologist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT psychologist_patient_unique UNIQUE (psychologist_id, patient_id),
  CONSTRAINT psychologist_not_patient CHECK (psychologist_id != patient_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_psychologist_patients_psychologist
  ON public.psychologist_patients(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_psychologist_patients_patient
  ON public.psychologist_patients(patient_id);

-- ===================================================================
-- TABELA: game_scores
-- Armazena pontuações dos jogos
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices
  CONSTRAINT game_scores_user_game_idx UNIQUE (user_id, game_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_game_scores_user ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON public.game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_created ON public.game_scores(created_at DESC);

-- ===================================================================
-- ADICIONAR COLUNA: is_psychologist na tabela users
-- ===================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_psychologist BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_psychologist
  ON public.users(is_psychologist) WHERE is_psychologist = TRUE;
```

### 2. Configurar RLS Policies

**Arquivo:** `migration-package/database/02-rls-policies.sql`

```sql
-- ===================================================================
-- RLS POLICIES
-- ===================================================================

-- Habilitar RLS
ALTER TABLE public.psychologist_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- POLICIES: psychologist_patients
-- ===================================================================

-- Psicólogos podem ver seus próprios pacientes
CREATE POLICY "psychologists_view_own_patients"
  ON public.psychologist_patients
  FOR SELECT
  USING (
    psychologist_id = auth.uid() OR
    patient_id = auth.uid()
  );

-- Apenas admins podem criar relações
CREATE POLICY "admins_manage_relationships"
  ON public.psychologist_patients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===================================================================
-- POLICIES: game_scores
-- ===================================================================

-- Usuários podem criar suas próprias pontuações
CREATE POLICY "users_create_own_scores"
  ON public.game_scores
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuários podem ver suas próprias pontuações
CREATE POLICY "users_view_own_scores"
  ON public.game_scores
  FOR SELECT
  USING (user_id = auth.uid());

-- Psicólogos podem ver pontuações de seus pacientes
CREATE POLICY "psychologists_view_patient_scores"
  ON public.game_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.psychologist_patients
      WHERE psychologist_id = auth.uid()
        AND patient_id = game_scores.user_id
    )
  );

-- Admins podem ver todas as pontuações
CREATE POLICY "admins_view_all_scores"
  ON public.game_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3. Corrigir URLs de Imagens

**Arquivo:** `migration-package/database/03-fix-game-images.sql`

```sql
-- ===================================================================
-- CORRIGIR URLs DE IMAGENS DOS JOGOS
-- ===================================================================

-- Substitua {SUA_URL_SUPABASE} pela URL do seu projeto Supabase
-- Exemplo: https://btsarxzpiroprpdcrpcx.supabase.co

-- Atualizar jogos com caminhos locais inválidos
UPDATE games
SET cover_image = 'https://{SUA_URL_SUPABASE}.supabase.co/storage/v1/object/public/games/covers/' || slug || '-cover.png'
WHERE cover_image IS NULL OR cover_image LIKE '/assets/%' OR cover_image LIKE 'C:%';

-- Verificar
SELECT slug, name, cover_image
FROM games
ORDER BY slug;
```

---

## 🖼️ Sistema de Imagens

### 1. Configurar Supabase Storage

1. **Criar Bucket:**
   - Nome: `games`
   - Público: ✅ Sim
   - Permitted file types: `image/*`

2. **Criar Pasta:**
   - Dentro do bucket `games`, criar pasta `covers/`

### 2. Converter Imagens para PNG

**Script Python:** `migration-package/scripts/convert-images.py`

```python
#!/usr/bin/env python3
from PIL import Image
from pathlib import Path

input_dir = Path("imagens-originais/")
output_dir = Path("imagens-convertidas/")
output_dir.mkdir(exist_ok=True)

for img_path in input_dir.glob("*"):
    if img_path.suffix.lower() in ['.jpg', '.jpeg', '.jfif', '.webp']:
        try:
            img = Image.open(img_path)
            # Converter para RGB se necessário
            if img.mode in ['RGBA', 'P']:
                img = img.convert('RGB')

            # Salvar como PNG
            output_path = output_dir / f"{img_path.stem}-cover.png"
            img.save(output_path, 'PNG', optimize=True)
            print(f"✅ {img_path.name} → {output_path.name}")
        except Exception as e:
            print(f"❌ Erro em {img_path.name}: {e}")
```

### 3. Upload para Supabase

**Script Python:** `migration-package/scripts/upload-game-covers.py`

```python
#!/usr/bin/env python3
import os
import requests
from pathlib import Path

# CONFIGURAÇÃO - AJUSTAR PARA SEU PROJETO
SUPABASE_URL = "https://{SEU_PROJETO}.supabase.co"
SUPABASE_ANON_KEY = "{SUA_ANON_KEY}"
STORAGE_BUCKET = "games"
STORAGE_PATH = "covers"
IMAGES_DIR = Path("imagens-convertidas/")

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}

def upload_image(file_path: Path):
    file_name = file_path.name
    storage_file_path = f"{STORAGE_PATH}/{file_name}"
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_file_path}"

    print(f"Uploading {file_name}...", end=" ")

    with open(file_path, "rb") as f:
        file_data = f.read()

    upload_headers = headers.copy()
    upload_headers["Content-Type"] = "image/png"

    # POST (criar novo)
    response = requests.post(url, data=file_data, headers=upload_headers)

    if response.status_code == 200:
        print("[OK] Sucesso!")
        return True
    elif response.status_code == 409:
        # Já existe, tentar atualizar
        print("[UPDATE] Atualizando...", end=" ")
        response = requests.put(url, data=file_data, headers=upload_headers)
        if response.status_code == 200:
            print("[OK]")
            return True

    print(f"[ERRO] {response.status_code} - {response.text}")
    return False

def main():
    print("=" * 70)
    print("UPLOAD DE IMAGENS PARA SUPABASE STORAGE")
    print("=" * 70)

    images = list(IMAGES_DIR.glob("*.png"))

    if not images:
        print(f"[ERRO] Nenhuma imagem encontrada em {IMAGES_DIR}")
        return

    print(f"[INFO] Encontradas {len(images)} imagens")
    print()

    success = 0
    fail = 0

    for img in sorted(images):
        if upload_image(img):
            success += 1
        else:
            fail += 1

    print()
    print("=" * 70)
    print(f"[OK] Sucessos: {success}")
    print(f"[FAIL] Falhas: {fail}")
    print(f"[TOTAL] Total: {len(images)}")
    print("=" * 70)

if __name__ == "__main__":
    main()
```

---

## ✅ Testes e Validação

### 1. Testar Backend

**Script:** `migration-package/scripts/test-api-endpoints.js`

```javascript
const axios = require('axios');

const API_URL = 'https://seu-backend.com/api/v1';
let TOKEN = null;

async function testLogin() {
  console.log('\n1️⃣ Testando Login de Psicólogo...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'psicologo.teste@exemplo.com',
      password: 'senha123'
    });
    TOKEN = response.data.token;
    console.log('✅ Login bem-sucedido!');
    console.log('   Token:', TOKEN.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
  }
}

async function testGetPatients() {
  console.log('\n2️⃣ Testando GET /psychologists/patients...');
  try {
    const response = await axios.get(`${API_URL}/psychologists/patients`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('✅ Pacientes recuperados!');
    console.log(`   Total: ${response.data.data.length} pacientes`);
    response.data.data.forEach(p => {
      console.log(`   - ${p.name} (${p.stats.totalSessions} sessões)`);
    });
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

async function testCreateScore() {
  console.log('\n3️⃣ Testando POST /scores...');
  try {
    const response = await axios.post(
      `${API_URL}/scores`,
      {
        gameSlug: 'labirinto',
        score: 1500,
        metadata: { level: 5, timeSeconds: 120 }
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log('✅ Pontuação criada!');
    console.log('   ID:', response.data.data.id);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('TESTE DOS ENDPOINTS DA API');
  console.log('='.repeat(70));

  await testLogin();
  if (!TOKEN) {
    console.log('\n❌ Testes interrompidos: Login falhou');
    return;
  }

  await testGetPatients();
  await testCreateScore();

  console.log('\n' + '='.repeat(70));
  console.log('TESTES CONCLUÍDOS');
  console.log('='.repeat(70));
}

runTests();
```

### 2. Checklist de Validação

**Backend:**
- [ ] POST /api/v1/auth/login retorna token com `isPsychologist`
- [ ] GET /api/v1/psychologists/patients retorna lista de pacientes
- [ ] GET /api/v1/psychologists/patients/:id/scores retorna pontuações
- [ ] POST /api/v1/scores cria nova pontuação
- [ ] Middleware `isPsychologist` bloqueia não-psicólogos

**Admin Panel:**
- [ ] Rota `/psicologos` acessível após login
- [ ] Dashboard lista todos os pacientes
- [ ] Estatísticas (sessões, média, melhor) exibidas corretamente
- [ ] Clicar em "Ver Detalhes" navega para página do paciente
- [ ] Gráfico de evolução renderiza corretamente

**Banco de Dados:**
- [ ] Tabela `psychologist_patients` criada
- [ ] Tabela `game_scores` criada
- [ ] Coluna `is_psychologist` adicionada em `users`
- [ ] RLS policies aplicadas
- [ ] URLs de imagens atualizadas

**Imagens:**
- [ ] Todas as imagens convertidas para PNG
- [ ] Upload para Supabase Storage concluído
- [ ] URLs acessíveis publicamente
- [ ] Launcher exibe imagens corretamente

---

## 🔧 Troubleshooting

### Problema: "Não autorizado" ao acessar /psychologists/*

**Solução:**
1. Verificar se o token JWT contém `isPsychologist: true`
2. Verificar se o middleware `isPsychologist` está registrado
3. Verificar se o usuário tem `is_psychologist = true` no banco

```javascript
// Debug do token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('Token decoded:', decoded);
// Deve conter: { id, email, isPsychologist: true }
```

### Problema: Imagens não carregam no launcher

**Solução:**
1. Verificar se as URLs no banco são completas (https://...)
2. Verificar se o bucket Supabase é público
3. Testar URLs diretamente no navegador
4. Verificar logs do console: `console.warn('[placeholders]...')`

```javascript
// Testar validação
const url = "https://supabase.co/storage/v1/object/public/games/covers/jogo.png";
console.log(getGameImage(url)); // Deve retornar a URL
console.log(getGameImage("/assets/jogo.jpg")); // Deve retornar null
```

### Problema: Pontuações não salvam

**Solução:**
1. Verificar se o `gameSlug` existe no banco
2. Verificar se o token de autenticação está válido
3. Verificar se a tabela `game_scores` tem RLS policy para INSERT

```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'game_scores';

-- Testar inserção direta
INSERT INTO game_scores (id, user_id, game_id, score)
VALUES (
  uuid_generate_v4(),
  '{USER_ID}',
  (SELECT id FROM games WHERE slug = 'labirinto' LIMIT 1),
  1000
);
```

### Problema: RLS bloqueia tudo

**Solução:**
1. Verificar se as policies foram criadas corretamente
2. Temporariamente desabilitar RLS para testes:

```sql
-- APENAS PARA DEBUG - NÃO USAR EM PRODUÇÃO
ALTER TABLE game_scores DISABLE ROW LEVEL SECURITY;

-- Testar operações...

-- RE-HABILITAR DEPOIS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
```

---

## 📚 Referências

### Documentação do Projeto Original

- [README Principal](../README.md)
- [Status de Produção](STATUS_PRODUCAO.md)
- [Sistema de Pontuação](sistema-pontuacao/RESUMO_EXECUTIVO.md)
- [Cadastro de Psicólogos](CADASTRO-PSICOLOGOS.md)

### Scripts Úteis

- [upload-game-covers.py](../upload-game-covers.py)
- [fix-game-covers.sql](../neurogame-backend/fix-game-covers.sql)
- [test-api-endpoints.js](sistema-pontuacao/test-api-endpoints.js)

### Links Externos

- [Supabase Docs](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Router](https://reactrouter.com/en/main)
- [Material-UI](https://mui.com/material-ui/getting-started/)

---

## 🎯 Conclusão

Este guia contém todos os passos necessários para migrar os sistemas do NeuroGame para outro projeto. A pasta `migration-package/` contém todos os arquivos de código-fonte prontos para copiar.

**Próximos Passos:**

1. Ler este guia completamente
2. Preparar ambiente de destino
3. Criar/atualizar banco de dados (SQL scripts)
4. Copiar código do backend (controllers, routes, middleware)
5. Copiar código do admin panel (pages, components)
6. Configurar Supabase Storage e fazer upload de imagens
7. Testar cada sistema individualmente
8. Testar integração completa
9. Documentar mudanças específicas do seu projeto

**Dúvidas?**
- Consultar os arquivos README-*.md dentro de cada pasta do migration-package
- Verificar os comentários no código-fonte
- Consultar a documentação original do projeto

---

**Desenvolvido pela equipe NeuroGame**
*© 2025 NeuroGame - Guia de Migração v1.2.6*
