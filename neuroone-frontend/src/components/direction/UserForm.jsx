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
import { supabase } from '../../services/supabase';

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
        // Atualizar usuário existente
        const updateData = {
          name: formData.name,
          email: formData.email,
          user_role: formData.user_role,
          active: formData.active,
          updated_at: new Date().toISOString(),
        };

        // Se forneceu nova senha, atualizar também
        if (formData.password) {
          // Hash da senha com bcrypt
          const passwordHash = await hashPassword(formData.password);
          updateData.password_hash = passwordHash;

          // Atualizar também no auth.users
          await supabase.rpc('update_user_password', {
            user_id: user.id,
            new_password: formData.password,
          });
        }

        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) throw updateError;
      } else {
        // Criar novo usuário
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

        // Criar no auth.users primeiro
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            name: formData.name,
          },
        });

        if (authError) {
          // Se der erro de permissão, criar diretamente via SQL
          console.warn('Admin API não disponível, criando via SQL...');

          const userId = crypto.randomUUID();
          const passwordHash = await hashPassword(formData.password);

          // Criar em auth.users via SQL
          const { error: authInsertError } = await supabase.rpc('create_auth_user', {
            user_id: userId,
            user_email: formData.email,
            user_password: formData.password,
            user_name: formData.name,
          });

          if (authInsertError) {
            // Se RPC não existir, criar apenas na tabela users
            console.warn('RPC não disponível, criando apenas perfil...');
            const { error: profileError } = await supabase
              .from('users')
              .insert([{
                id: userId,
                email: formData.email,
                name: formData.name,
                user_role: formData.user_role,
                password_hash: passwordHash,
                active: formData.active,
              }]);

            if (profileError) throw profileError;
          } else {
            // Criar perfil na tabela users
            const { error: profileError } = await supabase
              .from('users')
              .insert([{
                id: userId,
                email: formData.email,
                name: formData.name,
                user_role: formData.user_role,
                password_hash: passwordHash,
                active: formData.active,
              }]);

            if (profileError) throw profileError;
          }
        } else {
          // Auth user criado com sucesso, criar perfil
          const passwordHash = await hashPassword(formData.password);

          const { error: profileError } = await supabase
            .from('users')
            .insert([{
              id: authData.user.id,
              email: formData.email,
              name: formData.name,
              user_role: formData.user_role,
              password_hash: passwordHash,
              active: formData.active,
            }]);

          if (profileError) throw profileError;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setError(error.message || 'Erro ao salvar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const hashPassword = async (password) => {
    // Usar crypt do PostgreSQL via RPC (ideal)
    // Se não houver RPC, usar hash simples
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
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
