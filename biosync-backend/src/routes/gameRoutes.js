const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { validateCreateGame, validateUpdateGame, validateUUID } = require('../middleware/validator');
const { supabase } = require('../config/supabase');

// Protected user routes
router.get('/user/games', authenticate, gameController.getUserGames);
router.get('/:id/validate', authenticate, validateUUID, gameController.validateAccess);

// Session validation route
router.post('/:id/validate-session', authenticate, validateUUID, async (req, res) => {
  try {
    const { id: gameId } = req.params;
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'Token de sessão é obrigatório'
      });
    }

    // Decrypt and validate session token
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.GAME_SESSION_SECRET || 'biosync-session-secret-key-32b', 'utf8').slice(0, 32);

    try {
      const parts = sessionToken.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const sessionData = JSON.parse(decrypted);

      // Validate session data
      if (sessionData.gameId !== gameId) {
        return res.status(403).json({
          success: false,
          message: 'Token de sessão inválido para este jogo'
        });
      }

      if (sessionData.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Token de sessão não pertence ao usuário atual'
        });
      }

      const now = Date.now();
      if (now > sessionData.expiresAt) {
        return res.status(403).json({
          success: false,
          message: 'Sessão expirada'
        });
      }

      res.json({
        success: true,
        data: {
          valid: true,
          expiresAt: sessionData.expiresAt
        }
      });
    } catch (error) {
      console.error('Session token decryption error:', error);
      return res.status(403).json({
        success: false,
        message: 'Token de sessão inválido'
      });
    }
  } catch (error) {
    console.error('Error validating game session:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar sessão do jogo'
    });
  }
});

// Update checking routes
router.get('/updates', authenticate, async (req, res) => {
  try {
    const { lastSyncVersion } = req.query;

    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const latestGame = games[0];
    const currentContentVersion = latestGame ? new Date(latestGame.updated_at || latestGame.created_at).getTime() : 0;

    const hasUpdates = !lastSyncVersion || currentContentVersion > parseInt(lastSyncVersion);

    let newGames = games;
    if (lastSyncVersion) {
      newGames = games.filter(game =>
        new Date(game.updated_at || game.created_at).getTime() > parseInt(lastSyncVersion)
      );
    }

    res.json({
      success: true,
      data: {
        hasUpdates,
        contentVersion: currentContentVersion,
        totalGames: games.length,
        newGames: newGames.length,
        games: newGames
      }
    });
  } catch (error) {
    console.error('Error checking for game updates:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar atualizações de jogos'
    });
  }
});

router.get('/manifest', authenticate, async (req, res) => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('id, name, slug, version, download_url, file_size, checksum, installer_type, created_at, updated_at, cover_image, cover_image_local, category, description, folder_path')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    const manifestVersion = games.length > 0
      ? Math.max(...games.map(g => new Date(g.updated_at || g.created_at).getTime()))
      : Date.now();

    res.json({
      success: true,
      data: {
        manifestVersion,
        generatedAt: new Date().toISOString(),
        totalGames: games.length,
        games: games.map(game => ({
          id: game.id,
          name: game.name,
          slug: game.slug,
          version: game.version || '1.0.0',
          downloadUrl: game.download_url,
          fileSize: game.file_size,
          checksum: game.checksum,
          installerType: game.installer_type || 'exe',
          coverImage: game.cover_image,
          coverImageLocal: game.cover_image_local,
          category: game.category,
          description: game.description,
          folderPath: game.folder_path,
          updatedAt: game.updated_at || game.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Error getting games manifest:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter manifest de jogos'
    });
  }
});

// Track downloads
router.post('/:gameId/download-track', authenticate, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('game_downloads')
      .insert([
        {
          user_id: userId,
          game_id: gameId,
          downloaded_at: new Date().toISOString()
        }
      ]);

    if (error && error.code !== '23505') {
      throw error;
    }

    res.json({
      success: true,
      message: 'Download registrado'
    });
  } catch (error) {
    console.error('Error tracking game download:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar download'
    });
  }
});

// Public/Admin routes
router.get('/', authenticate, gameController.getAllGames);
router.get('/categories', authenticate, gameController.getCategories);
router.get('/:id', authenticate, validateUUID, gameController.getGameById);

// Admin only routes
router.post('/', authenticate, authorizeAdmin, validateCreateGame, gameController.createGame);
router.put('/:id', authenticate, authorizeAdmin, validateUUID, validateUpdateGame, gameController.updateGame);
router.delete('/:id', authenticate, authorizeAdmin, validateUUID, gameController.deleteGame);

module.exports = router;
