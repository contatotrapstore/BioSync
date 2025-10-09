import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  InputAdornment,
  Chip,
  Box,
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import { CloudUpload, Folder } from '@mui/icons-material';

// Helper para gerar slug automático
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/-+/g, '-'); // Remove hífens duplicados
};

// Helper para formatar bytes em MB
const formatBytes = (bytes) => {
  if (!bytes) return '';
  return (bytes / (1024 * 1024)).toFixed(2);
};

// Helper para converter MB em bytes
const mbToBytes = (mb) => {
  if (!mb || mb === '') return null;
  return Math.round(parseFloat(mb) * 1024 * 1024);
};

const defaultState = {
  name: '',
  slug: '',
  description: '',
  category: '',
  version: '1.0.0',
  order: 0,
  isActive: true,
  gameFolder: null,
  coverImageFile: null
};

const GameForm = ({ open, onClose, onSave, game }) => {
  const [formData, setFormData] = useState(defaultState);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || '',
        slug: game.slug || '',
        description: game.description || '',
        category: game.category || '',
        version: game.version || '1.0.0',
        order: game.order ?? 0,
        isActive: game.isActive ?? true,
        gameFolder: null,
        coverImageFile: null
      });
    } else {
      setFormData(defaultState);
    }
    setErrors({});
    setUploading(false);
    setUploadProgress(0);
  }, [game, open]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    // Auto-gerar slug quando nome mudar (apenas em criação)
    if (name === 'name' && !game) {
      const autoSlug = generateSlug(value);
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: autoSlug
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFolderUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        gameFolder: files
      }));
    }
  };

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        coverImageFile: file
      }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Nome do jogo é obrigatório';
    }

    if (!formData.slug.trim()) {
      nextErrors.slug = 'Slug é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      nextErrors.slug = 'Use apenas letras minúsculas, números e hífens';
    }

    if (!game && !formData.gameFolder) {
      nextErrors.gameFolder = 'Selecione a pasta do jogo';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const payload = new FormData();

      // Dados básicos do jogo
      payload.append('name', formData.name.trim());
      payload.append('slug', formData.slug.trim());
      payload.append('description', formData.description.trim());
      payload.append('category', formData.category.trim());
      payload.append('version', formData.version.trim() || '1.0.0');
      payload.append('order', Number(formData.order) || 0);
      payload.append('isActive', formData.isActive);

      // Upload da pasta do jogo (apenas em criação)
      if (!game && formData.gameFolder) {
        for (const file of formData.gameFolder) {
          payload.append('gameFiles', file, file.webkitRelativePath || file.name);
        }
      }

      // Upload da imagem de capa
      if (formData.coverImageFile) {
        payload.append('coverImage', formData.coverImageFile);
      }

      // Se for edição, incluir ID
      if (game) {
        payload.append('id', game.id);
      }

      await onSave(payload);
    } catch (error) {
      console.error('Erro ao enviar jogo:', error);
      setErrors({ submit: 'Erro ao enviar dados. Tente novamente.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!uploading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 0 }
      }}
    >
      <DialogTitle>{game ? 'Editar Jogo' : 'Criar Novo Jogo'}</DialogTitle>
      <DialogContent>
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>Enviando arquivos...</Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Nome do Jogo */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome do jogo"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name || 'Digite o nome completo do jogo'}
              required
              disabled={uploading}
            />
          </Grid>

          {/* Slug - gerado automaticamente */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Identificador (Slug)"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              error={Boolean(errors.slug)}
              helperText={errors.slug || '✨ Gerado automaticamente a partir do nome'}
              required
              disabled={!game || uploading}
            />
          </Grid>

          {/* Descrição */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Breve descrição do jogo..."
              disabled={uploading}
            />
          </Grid>

          {/* Categoria */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Categoria"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={uploading}
            >
              <MenuItem value="">Nenhuma</MenuItem>
              <MenuItem value="Ação">Ação</MenuItem>
              <MenuItem value="Aventura">Aventura</MenuItem>
              <MenuItem value="Corrida">Corrida</MenuItem>
              <MenuItem value="Educativo">Educativo</MenuItem>
              <MenuItem value="Estratégia">Estratégia</MenuItem>
              <MenuItem value="Puzzle">Puzzle</MenuItem>
              <MenuItem value="Esportes">Esportes</MenuItem>
            </TextField>
          </Grid>

          {/* Versão */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Versão"
              name="version"
              value={formData.version}
              onChange={handleChange}
              placeholder="1.0.0"
              disabled={uploading}
            />
          </Grid>

          {/* Upload da Pasta do Jogo - apenas em criação */}
          {!game && (
            <Grid item xs={12}>
              <input
                accept="*"
                style={{ display: 'none' }}
                id="game-folder-upload"
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderUpload}
                disabled={uploading}
              />
              <label htmlFor="game-folder-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<Folder />}
                  sx={{ py: 2 }}
                  disabled={uploading}
                  color={errors.gameFolder ? 'error' : 'primary'}
                >
                  {formData.gameFolder
                    ? `✓ ${formData.gameFolder.length} arquivos selecionados`
                    : 'Selecionar Pasta do Jogo *'
                  }
                </Button>
              </label>
              {errors.gameFolder && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                  {errors.gameFolder}
                </Typography>
              )}
              {!errors.gameFolder && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Selecione a pasta completa contendo todos os arquivos do jogo
                </Typography>
              )}
            </Grid>
          )}

          {/* Upload da Imagem de Capa */}
          <Grid item xs={12}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="cover-image-upload"
              type="file"
              onChange={handleCoverUpload}
              disabled={uploading}
            />
            <label htmlFor="cover-image-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{ py: 1.5 }}
                disabled={uploading}
              >
                {formData.coverImageFile
                  ? `✓ ${formData.coverImageFile.name}`
                  : game ? 'Alterar Imagem de Capa (opcional)' : 'Imagem de Capa (opcional)'
                }
              </Button>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Formatos aceitos: JPG, PNG, WebP
            </Typography>
          </Grid>

          {/* Status Ativo/Inativo */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleChange}
                  name="isActive"
                  color="primary"
                  disabled={uploading}
                />
              }
              label={formData.isActive ? '🟢 Jogo Ativo (visível para usuários)' : '🔴 Jogo Inativo (oculto)'}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={uploading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={uploading}>
          {uploading ? 'Enviando...' : (game ? 'Atualizar' : 'Criar Jogo')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameForm;
