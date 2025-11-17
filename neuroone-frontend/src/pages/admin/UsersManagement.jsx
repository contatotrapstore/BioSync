import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { Button } from '../../components/atoms/Button';
import { Card } from '../../components/atoms/Card';
import { UserTable } from '../../components/direction/UserTable';
import { UserForm } from '../../components/direction/UserForm';
import { ThemeToggle } from '../../components/atoms/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function UsersManagement() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Filtro por busca (nome ou email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo de usuário
    if (filters.role !== 'all') {
      filtered = filtered.filter((user) => user.user_role === filters.role);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja desativar este usuário?'))
      return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      alert('Usuário desativado com sucesso!');
      fetchUsers();
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      alert('Erro ao desativar usuário: ' + error.message);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h1">Gestão de Usuários</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              Gerencie professores e alunos do sistema
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => navigate('/admin')}>
              Voltar
            </Button>
            <ThemeToggle />
            <Button variant="outlined" onClick={handleSignOut}>
              Sair
            </Button>
          </Stack>
        </Box>

        {/* Stats Summary */}
        <Card sx={{ mb: 3 }}>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total de Usuários
              </Typography>
              <Typography variant="h3">{users.length}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Professores
              </Typography>
              <Typography variant="h3">
                {users.filter((u) => u.user_role === 'professor').length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Alunos
              </Typography>
              <Typography variant="h3">
                {users.filter((u) => u.user_role === 'aluno').length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Ativos
              </Typography>
              <Typography variant="h3">
                {users.filter((u) => u.active).length}
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Filters and Actions */}
        <Card sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Buscar por nome ou email..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              sx={{ flex: 1 }}
              size="small"
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.role}
                onChange={(e) =>
                  setFilters({ ...filters, role: e.target.value })
                }
                label="Tipo"
              >
                <MenuItem value="all">Todos os Tipos</MenuItem>
                <MenuItem value="direcao">Direção</MenuItem>
                <MenuItem value="professor">Professor</MenuItem>
                <MenuItem value="aluno">Aluno</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" onClick={handleCreateUser}>
              + Novo Usuário
            </Button>
          </Stack>
        </Card>

        {/* Results Count */}
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Mostrando {filteredUsers.length} de {users.length} usuários
        </Typography>

        {/* Users Table */}
        <UserTable
          users={filteredUsers}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />

        {/* User Form Modal */}
        <UserForm
          user={editingUser}
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      </Box>
    </Container>
  );
}
