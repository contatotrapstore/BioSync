import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { usersAPI } from '../services/api';
import UserTable from '../components/UserTable';
import UserForm from '../components/UserForm';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) => {
      return (
        user.email.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query)
      );
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const { users: fetchedUsers } = await usersAPI.getAll({ limit: 500 });
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || err.message || 'Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (user = null) => {
    setEditingUser(user);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        const updatedUser = await usersAPI.update(editingUser.id, userData);
        setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
        showSnackbar('Usuário atualizado com sucesso', 'success');
      } else {
        const newUser = await usersAPI.create(userData);
        setUsers((prev) => [...prev, newUser]);
        showSnackbar('Usuário criado com sucesso', 'success');
      }
      handleCloseForm();
    } catch (err) {
      console.error('Error saving user:', err);
      showSnackbar(err.response?.data?.message || err.message || 'Falha ao salvar usuário', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      showSnackbar('Usuário excluído com sucesso', 'success');
    } catch (err) {
      console.error('Error deleting user:', err);
      showSnackbar(err.response?.data?.message || err.message || 'Falha ao excluir usuário', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Gerenciamento de Usuários
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie todos os usuários do sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          size="large"
        >
          Adicionar Usuário
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Buscar usuários por email ou nome..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <UserTable
          users={filteredUsers}
          onEdit={handleOpenForm}
          onDelete={handleDeleteUser}
        />
      )}

      <UserForm
        open={openForm}
        onClose={handleCloseForm}
        onSave={handleSaveUser}
        user={editingUser}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 0 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
