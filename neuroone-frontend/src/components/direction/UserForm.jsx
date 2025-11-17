import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Box,
  Alert,
} from '@mui/material';
import { Button } from '../atoms/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function UserForm({ user, open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    user_role: 'aluno',
    password: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        user_role: user.user_role,
        password: '', // Não preencher senha ao editar
        active: user.active,
      });
    } else {
      // Reset form para novo usuário
      setFormData({
        name: '',
        email: '',
        user_role: 'aluno',
        password: '',
        active: true,
      });
    }
    setError('');
  }, [user, open]);

  const handleChange = (field) => (event) => {
    const value = field === 'active' ? event.target.checked : event.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user) {
        // UPDATE existing user
        console.log(`[UserForm] Updating user ${user.id}...`);

        const updateData = {
          name: formData.name,
          user_role: formData.user_role,
          active: formData.active,
        };

        const response = await fetch(`${API_URL}/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update user');
        }

        const result = await response.json();
        console.log('[UserForm] User updated:', result);

      } else {
        // CREATE new user
        console.log(`[UserForm] Creating user ${formData.email}...`);

        if (!formData.password) {
          setError('Senha é obrigatória para novos usuários');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Senha deve ter no mínimo 6 caracteres');
          setLoading(false);
          return;
        }

        const createData = {
          email: formData.email,
          name: formData.name,
          user_role: formData.user_role,
          password: formData.password,
        };

        const response = await fetch(`${API_URL}/api/users/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create user');
        }

        const result = await response.json();
        console.log('[UserForm] User created:', result);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('[UserForm] Erro ao salvar usuário:', error);
      setError(error.message || 'Erro ao salvar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {user ? 'Editar Usuário' : 'Novo Usuário'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nome Completo"
            value={formData.name}
            onChange={handleChange('name')}
            required
            margin="normal"
            autoFocus
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            required
            margin="normal"
            disabled={!!user} // Não permitir editar email
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Tipo de Usuário</InputLabel>
            <Select
              value={formData.user_role}
              onChange={handleChange('user_role')}
              label="Tipo de Usuário"
            >
              <MenuItem value="aluno">Aluno</MenuItem>
              <MenuItem value="professor">Professor</MenuItem>
              <MenuItem value="direcao">Direção</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={user ? 'Nova Senha (opcional)' : 'Senha'}
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            required={!user}
            margin="normal"
            helperText={
              user
                ? 'Deixe em branco para não alterar'
                : 'Mínimo de 6 caracteres'
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.active}
                onChange={handleChange('active')}
              />
            }
            label="Usuário ativo"
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="outlined" disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
