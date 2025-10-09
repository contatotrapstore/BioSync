import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

const defaultState = {
  name: '',
  description: '',
  price: '',
  durationDays: 30,
  features: [],
  gameIds: [],
  isActive: true
};

const PlanForm = ({ open, onClose, onSave, plan, availableGames = [] }) => {
  const [formData, setFormData] = useState(defaultState);
  const [featureInput, setFeatureInput] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price ?? '',
        durationDays: plan.durationDays || 30,
        features: plan.features || [],
        gameIds: plan.games?.map((game) => game.id) || [],
        isActive: plan.isActive ?? true
      });
    } else {
      setFormData(defaultState);
    }
    setErrors({});
    setFeatureInput('');
  }, [plan, open]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleGamesChange = (event) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      gameIds: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddFeature();
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Nome do plano é obrigatório';
    }

    if (!formData.price || Number(formData.price) <= 0) {
      nextErrors.price = 'Preço válido é obrigatório';
    }

    if (!formData.durationDays || Number(formData.durationDays) <= 0) {
      nextErrors.durationDays = 'Duração deve ser de pelo menos 1 dia';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSave({
      ...formData,
      price: Number(formData.price),
      durationDays: Number(formData.durationDays)
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{plan ? 'Editar Plano de Assinatura' : 'Criar Novo Plano de Assinatura'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome do plano"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Preço"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              error={Boolean(errors.price)}
              helperText={errors.price}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Duração (dias)"
              name="durationDays"
              type="number"
              value={formData.durationDays}
              onChange={handleChange}
              error={Boolean(errors.durationDays)}
              helperText={errors.durationDays}
              required
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Jogos incluídos</InputLabel>
              <Select
                multiple
                name="gameIds"
                value={formData.gameIds}
                onChange={handleGamesChange}
                label="Jogos incluídos"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const game = availableGames.find((item) => item.id === value);
                      return <Chip key={value} label={game?.name || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {availableGames.map((game) => (
                  <MenuItem key={game.id} value={game.id}>
                    {game.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box>
              <TextField
                fullWidth
                label="Adicionar recurso"
                value={featureInput}
                onChange={(event) => setFeatureInput(event.target.value)}
                onKeyPress={handleFeatureKeyPress}
                placeholder="Digite um recurso e pressione Enter ou clique em Adicionar"
                InputProps={{
                  endAdornment: (
                    <Button
                      size="small"
                      onClick={handleAddFeature}
                      disabled={!featureInput.trim()}
                      startIcon={<AddIcon />}
                    >
                      Adicionar
                    </Button>
                  )
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {formData.features.map((feature, index) => (
                  <Chip
                    key={feature + index}
                    label={feature}
                    onDelete={() => handleRemoveFeature(index)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleChange}
                  name="isActive"
                />
              }
              label="Ativo"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          {plan ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanForm;
