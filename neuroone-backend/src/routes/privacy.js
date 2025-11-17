import express from 'express';
import { query } from '../services/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * LGPD Compliance Endpoints
 * Implementa os direitos do titular conforme Art. 18 da LGPD
 */

/**
 * GET /api/privacy/my-data
 * Retorna todos os dados pessoais do usuário
 * Direito: Confirmação e acesso aos dados (Art. 18, I e II)
 */
router.get('/my-data', async (req, res) => {
  try {
    // TODO: Implementar autenticação JWT middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autenticado',
      });
    }

    // Buscar dados do usuário
    const userResult = await query(
      `SELECT
        id,
        email,
        name,
        role,
        school,
        cpf,
        birthdate,
        created_at,
        updated_at
      FROM users
      WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userResult.rows[0];

    // Buscar consentimento LGPD
    const consentResult = await query(
      `SELECT
        data_processing_consent,
        eeg_data_consent,
        research_consent,
        accepted_at,
        version
      FROM privacy_consents
      WHERE user_id = $1
      ORDER BY accepted_at DESC
      LIMIT 1`,
      [userId]
    );

    // Buscar turmas (se aluno)
    let classes = [];
    if (userData.role === 'aluno') {
      const classesResult = await query(
        `SELECT
          c.id,
          c.name,
          c.school_year,
          cs.joined_at
        FROM class_students cs
        JOIN classes c ON c.id = cs.class_id
        WHERE cs.student_id = $1
        ORDER BY cs.joined_at DESC`,
        [userId]
      );
      classes = classesResult.rows;
    }

    // Buscar turmas criadas (se professor)
    let createdClasses = [];
    if (userData.role === 'professor') {
      const createdClassesResult = await query(
        `SELECT
          id,
          name,
          school_year,
          created_at
        FROM classes
        WHERE teacher_id = $1
        ORDER BY created_at DESC`,
        [userId]
      );
      createdClasses = createdClassesResult.rows;
    }

    // Buscar sessões participadas
    const sessionsResult = await query(
      `SELECT
        s.id,
        s.title,
        s.status,
        s.started_at,
        s.ended_at,
        s.game_id,
        c.name as class_name
      FROM sessions s
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN class_students cs ON cs.class_id = c.id
      WHERE cs.student_id = $1 OR s.teacher_id = $1
      ORDER BY s.started_at DESC
      LIMIT 100`,
      [userId]
    );

    // Buscar métricas de EEG (apenas agregadas, não dados brutos)
    const metricsResult = await query(
      `SELECT
        session_id,
        avg_attention,
        avg_relaxation,
        peak_attention,
        peak_relaxation,
        total_duration_ms,
        created_at
      FROM session_metrics
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 50`,
      [userId]
    );

    // Montar resposta completa
    const response = {
      message: 'Dados pessoais coletados conforme LGPD Art. 18',
      user: userData,
      consent: consentResult.rows[0] || null,
      classes,
      createdClasses,
      sessions: sessionsResult.rows,
      eegMetrics: metricsResult.rows,
      dataCollectionPurpose: {
        personalData: 'Identificação e autenticação no sistema',
        eegData: 'Neurofeedback educacional e acompanhamento pedagógico',
        sessionData: 'Histórico de participação e evolução ao longo do tempo',
      },
      retentionPeriod: '5 anos ou até solicitação de exclusão',
      exportedAt: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      error: 'Erro ao processar solicitação',
    });
  }
});

/**
 * GET /api/privacy/export
 * Exporta todos os dados do usuário em formato JSON
 * Direito: Portabilidade dos dados (Art. 18, V)
 */
router.get('/export', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autenticado',
      });
    }

    // Reutilizar lógica do /my-data
    // TODO: Implementar exportação completa incluindo dados de EEG raw

    // Por enquanto, redirecionar para /my-data
    // Em produção, pode gerar arquivo ZIP com CSVs
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="neuroone-data-${userId}-${Date.now()}.json"`);

    // Buscar todos os dados (mesmo código do /my-data)
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const consentResult = await query('SELECT * FROM privacy_consents WHERE user_id = $1', [userId]);
    const classesResult = await query(
      `SELECT c.*, cs.joined_at FROM class_students cs
       JOIN classes c ON c.id = cs.class_id WHERE cs.student_id = $1`,
      [userId]
    );
    const sessionsResult = await query(
      `SELECT s.* FROM sessions s
       JOIN classes c ON c.id = s.class_id
       LEFT JOIN class_students cs ON cs.class_id = c.id
       WHERE cs.student_id = $1 OR s.teacher_id = $1`,
      [userId]
    );
    const metricsResult = await query('SELECT * FROM session_metrics WHERE student_id = $1', [userId]);

    res.json({
      exportedAt: new Date().toISOString(),
      format: 'JSON',
      user: userResult.rows[0],
      consents: consentResult.rows,
      classes: classesResult.rows,
      sessions: sessionsResult.rows,
      metrics: metricsResult.rows,
    });
  } catch (error) {
    logger.error('Erro ao exportar dados:', error);
    res.status(500).json({
      error: 'Erro ao exportar dados',
    });
  }
});

/**
 * POST /api/privacy/consent
 * Registra consentimento LGPD do usuário
 */
router.post('/consent', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { dataProcessingConsent, eegDataConsent, researchConsent, version } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autenticado',
      });
    }

    if (!dataProcessingConsent || !eegDataConsent) {
      return res.status(400).json({
        error: 'Consentimentos obrigatórios não fornecidos',
      });
    }

    // Inserir consentimento
    const result = await query(
      `INSERT INTO privacy_consents
        (user_id, data_processing_consent, eeg_data_consent, research_consent, version, accepted_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, accepted_at`,
      [userId, dataProcessingConsent, eegDataConsent, researchConsent || false, version || '1.0.0']
    );

    res.json({
      message: 'Consentimento registrado com sucesso',
      consent: result.rows[0],
    });
  } catch (error) {
    logger.error('Erro ao registrar consentimento:', error);
    res.status(500).json({
      error: 'Erro ao registrar consentimento',
    });
  }
});

/**
 * DELETE /api/privacy/delete-account
 * Solicita exclusão de conta e todos os dados associados
 * Direito: Eliminação dos dados (Art. 18, VI)
 */
router.delete('/delete-account', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { confirmation } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autenticado',
      });
    }

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        error: 'Confirmação inválida. Envie { confirmation: "DELETE_MY_ACCOUNT" }',
      });
    }

    // IMPORTANTE: Em produção, implementar soft delete ou fila de exclusão
    // Manter dados por 30 dias antes de exclusão permanente (período de arrependimento)

    // Criar solicitação de exclusão
    await query(
      `INSERT INTO account_deletion_requests (user_id, requested_at, status)
       VALUES ($1, NOW(), 'pending')
       ON CONFLICT (user_id)
       DO UPDATE SET requested_at = NOW(), status = 'pending'`,
      [userId]
    );

    logger.warn(`Solicitação de exclusão de conta criada para usuário ${userId}`);

    res.json({
      message: 'Solicitação de exclusão registrada',
      warning:
        'Sua conta será excluída em 30 dias. Durante este período, você pode cancelar a solicitação fazendo login novamente.',
      deletionScheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao solicitar exclusão de conta:', error);
    res.status(500).json({
      error: 'Erro ao processar solicitação de exclusão',
    });
  }
});

/**
 * POST /api/privacy/cancel-deletion
 * Cancela solicitação de exclusão de conta
 */
router.post('/cancel-deletion', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autenticado',
      });
    }

    const result = await query(
      `UPDATE account_deletion_requests
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE user_id = $1 AND status = 'pending'
       RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Nenhuma solicitação de exclusão pendente encontrada',
      });
    }

    res.json({
      message: 'Solicitação de exclusão cancelada com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao cancelar exclusão:', error);
    res.status(500).json({
      error: 'Erro ao cancelar exclusão',
    });
  }
});

export default router;
