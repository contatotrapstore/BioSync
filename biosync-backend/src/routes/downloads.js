const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

/**
 * GET /downloads/latest.yml
 * Metadata para auto-updater (Windows)
 */
router.get('/latest.yml', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../releases/latest.yml');
    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo de atualização não encontrado'
      });
    }

    res.setHeader('Content-Type', 'text/yaml');
    const content = await fs.readFile(filePath);
    res.send(content);
  } catch (error) {
    console.error('Error serving latest.yml:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar atualização'
    });
  }
});

/**
 * GET /downloads/latest-mac.yml
 * Metadata para auto-updater (macOS)
 */
router.get('/latest-mac.yml', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../releases/latest-mac.yml');
    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo de atualização não encontrado'
      });
    }

    res.setHeader('Content-Type', 'text/yaml');
    const content = await fs.readFile(filePath);
    res.send(content);
  } catch (error) {
    console.error('Error serving latest-mac.yml:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar atualização'
    });
  }
});

/**
 * GET /downloads/latest-linux.yml
 * Metadata para auto-updater (Linux)
 */
router.get('/latest-linux.yml', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../releases/latest-linux.yml');
    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo de atualização não encontrado'
      });
    }

    res.setHeader('Content-Type', 'text/yaml');
    const content = await fs.readFile(filePath);
    res.send(content);
  } catch (error) {
    console.error('Error serving latest-linux.yml:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar atualização'
    });
  }
});

/**
 * GET /downloads/:filename
 * Download de instaladores e atualizações
 */
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Validar filename para segurança
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Nome de arquivo inválido'
      });
    }

    const filePath = path.join(__dirname, '../../releases', filename);
    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }

    // Determinar content-type baseado na extensão
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.exe': 'application/octet-stream',
      '.dmg': 'application/octet-stream',
      '.AppImage': 'application/octet-stream',
      '.deb': 'application/octet-stream',
      '.yml': 'text/yaml',
      '.blockmap': 'application/octet-stream'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileContent = await fs.readFile(filePath);
    res.send(fileContent);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer download do arquivo'
    });
  }
});

/**
 * GET /downloads/games/:slug
 * Download de jogos em formato ZIP
 */
router.get('/games/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Validar slug para segurança
    if (!slug || slug.includes('..') || slug.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Nome de jogo inválido'
      });
    }

    const filename = `${slug}.zip`;
    const filePath = path.join(__dirname, '../../downloads', filename);
    const exists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado'
      });
    }

    // Obter tamanho do arquivo para Content-Length
    const stats = await fs.stat(filePath);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileContent = await fs.readFile(filePath);
    res.send(fileContent);
  } catch (error) {
    console.error('Error downloading game:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer download do jogo'
    });
  }
});

/**
 * GET /downloads
 * Lista todos os arquivos disponíveis para download
 */
router.get('/', async (req, res) => {
  try {
    const releasesPath = path.join(__dirname, '../../releases');
    const exists = await fs.access(releasesPath).then(() => true).catch(() => false);

    if (!exists) {
      await fs.mkdir(releasesPath, { recursive: true });
      return res.json({
        success: true,
        data: {
          files: [],
          message: 'Nenhum release disponível'
        }
      });
    }

    const files = await fs.readdir(releasesPath);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(releasesPath, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          downloadUrl: `/api/v1/downloads/${file}`
        };
      })
    );

    res.json({
      success: true,
      data: {
        files: fileStats.sort((a, b) => b.modified - a.modified)
      }
    });
  } catch (error) {
    console.error('Error listing downloads:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar downloads'
    });
  }
});

module.exports = router;
