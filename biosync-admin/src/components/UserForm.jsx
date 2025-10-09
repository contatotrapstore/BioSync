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
  Divider,
  Typography,
  Box
} from '@mui/material';

const defaultState = {
  username: '',
  email: '',
  fullName: '',
  password: '',
  isAdmin: false,
  isActive: true,
  enableManualSubscription: false,
  subscriptionDays: 30,
  subscriptionValue: 149.90
};

const UserForm = ({ open, onClose, onSave, user }) => {
  const [formData, setFormData] = useState(defaultState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        password: '',
        isAdmin: user.isAdmin || false,
        isActive: user.isActive !== undefined ? user.isActive : true,
        enableManualSubscription: false,
        subscriptionDays: 30,
        subscriptionValue: 149.90
      });
    } else {
      setFormData(defaultState);
    }
    setErrors({});
  }, [user, open]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Email é inválido';
    }

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!user && !formData.password) {
      nextErrors.password = 'Senha é obrigatória para novos usuários';
    } else if (formData.password && formData.password.length < 6) {
      nextErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      email: formData.email.trim(),
      fullName: formData.fullName.trim(),
      isAdmin: formData.isAdmin,
      isActive: formData.isActive
    };

    // Opcional: adicionar username apenas se preenchido
    if (formData.username.trim()) {
      payload.username = formData.username.trim();
    }

    if (formData.password) {
      payload.password = formData.password;
    }

    // Adicionar dados de assinatura manual se habilitado
    if (formData.enableManualSubscription) {
      payload.manualSubscription = {
        enabled: true,
        durationDays: parseInt(formData.subscriptionDays),
        value: parseFloat(formData.subscriptionValue)
      };
    }

    onSave(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 0 }
      }}
    >
      <DialogTitle>{user ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={Boolean(errors.email)}
              helperText={errors.email}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome completo"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={Boolean(errors.fullName)}
              helperText={errors.fullName}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Senha"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={
                errors.password || (user ? 'Deixe em branco para manter a senha atual' : '')
              }
              required={!user}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAdmin}
                  onChange={handleChange}
                  name="isAdmin"
                />
              }
              label="Administrador"
            />
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

          {user && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Assinatura Manual
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableManualSubscription}
                      onChange={handleChange}
                      name="enableManualSubscription"
                      color="success"
                    />
                  }
                  label="Ativar assinatura manual para este usuário"
                />
              </Grid>

              {formData.enableManualSubscription && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Duração (dias)"
                      name="subscriptionDays"
                      type="number"
                      value={formData.subscriptionDays}
                      onChange={handleChange}
                      inputProps={{ min: 1 }}
                      helperText="Número de dias de acesso"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Valor (R$)"
                      name="subscriptionValue"
                      type="number"
                      value={formData.subscriptionValue}
                      onChange={handleChange}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Valor da assinatura"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.dark">
                        ✓ Ao salvar, uma assinatura de {formData.subscriptionDays} dias no valor de R$ {parseFloat(formData.subscriptionValue).toFixed(2)} será criada para este usuário.
                      </Typography>
                    </Box>
                  </Grid>
                </>
              )}
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          {user ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;
