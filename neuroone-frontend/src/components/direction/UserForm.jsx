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

// Validation functions
function validateName(value) {
  if (!value || !value.trim()) return 'Nome é obrigatório';
  if (value.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
  if (value.length > 100) return 'Nome muito longo (máximo 100 caracteres)';
  return '';
}

function validateEmail(value) {
  if (!value || !value.trim()) return 'Email é obrigatório';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Email inválido';
  return '';
}

function validatePassword(value, isRequired) {
  if (isRequired && !value) return 'Senha é obrigatória';
  if (value && value.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
  if (value && value.length > 50) return 'Senha muito longa (máximo 50 caracteres)';
  return '';
}

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
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        user_role: user.user_role,
        password: '',
        active: user.active,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        user_role: 'aluno',
        password: '',
        active: true,
      });
    }
    setError('');
    setFieldErrors({ name: '', email: '', password: '' });
    setTouched({ name: false, email: false, password: false });
  }, [user, open]);

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value, !user);
      default:
        return '';
    }
  };

  const handleChange = (field) => (event) => {
    const value = field === 'active' ? event.target.checked : event.target.value;
    setFormData({ ...formData, [field]: value });

    // Validate on change if field was already touched
    if (touched[field]) {
      const errorMsg = validateField(field, value);
      setFieldErrors({ ...fieldErrors, [field]: errorMsg });
    }
  };

  const handleBlur = (field) => () => {
    // Mark field as touched
    setTouched({ ...touched, [field]: true });

    // Validate on blur
    const errorMsg = validateField(field, formData[field]);
    setFieldErrors({ ...fieldErrors, [field]: errorMsg });
  };

  const hasErrors = () => {
    return (
      validateName(formData.name) ||
      validateEmail(formData.email) ||
      validatePassword(formData.password, !user)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ name: true, email: true, password: true });

    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password, !user);

    setFieldErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
    });

    // Stop if there are validation errors
    if (nameError || emailError || passwordError) {
      setError('Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (user) {
        // UPDATE existing user
        console.log(`[UserForm] Updating user ${user.id}...`);

        const updateData = {
          name: formData.name.trim(),
          user_role: formData.user_role,
          active: formData.active,
        };

        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await fetch(`${API_URL}/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Falha ao atualizar usuário');
        }

        const result = await response.json();
        console.log('[UserForm] User updated:', result);

      } else {
        // CREATE new user
        console.log(`[UserForm] Creating user ${formData.email}...`);

        const createData = {
          email: formData.email.trim(),
          name: formData.name.trim(),
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
          throw new Error(error.error || 'Falha ao criar usuário');
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
            onBlur={handleBlur('name')}
            error={touched.name && !!fieldErrors.name}
            helperText={touched.name && fieldErrors.name ? fieldErrors.name : 'Nome completo do usuário'}
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
            onBlur={handleBlur('email')}
            error={touched.email && !!fieldErrors.email}
            helperText={
              touched.email && fieldErrors.email
                ? fieldErrors.email
                : user
                ? 'Email não pode ser alterado'
                : 'Email será usado para login'
            }
            required
            margin="normal"
            disabled={!!user}
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
            onBlur={handleBlur('password')}
            error={touched.password && !!fieldErrors.password}
            helperText={
              touched.password && fieldErrors.password
                ? fieldErrors.password
                : user
                ? 'Deixe em branco para não alterar'
                : 'Mínimo de 6 caracteres'
            }
            required={!user}
            margin="normal"
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
          <Button
            type="submit"
            variant="contained"
            loading={loading}
            disabled={loading || (touched.name && touched.email && touched.password && hasErrors())}
          >
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
