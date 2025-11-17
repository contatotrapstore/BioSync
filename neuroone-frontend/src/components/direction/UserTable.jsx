import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Card } from '../atoms/Card';

export function UserTable({ users, onEdit, onDelete }) {
  const getRoleName = (role) => {
    const roles = {
      direcao: 'Direção',
      professor: 'Professor',
      aluno: 'Aluno',
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      direcao: 'error',
      professor: 'primary',
      aluno: 'success',
    };
    return colors[role] || 'default';
  };

  if (users.length === 0) {
    return (
      <Card>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h3" color="text.secondary" gutterBottom>
            Nenhum usuário encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Clique em "Novo Usuário" para adicionar o primeiro usuário
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <TableContainer component={Card}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Nome</strong></TableCell>
            <TableCell><strong>Email</strong></TableCell>
            <TableCell><strong>Tipo</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Criado em</strong></TableCell>
            <TableCell align="right"><strong>Ações</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip
                  label={getRoleName(user.user_role)}
                  color={getRoleColor(user.user_role)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={user.active ? 'Ativo' : 'Inativo'}
                  color={user.active ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => onEdit(user)}
                  color="primary"
                  title="Editar"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDelete(user.id)}
                  color="error"
                  title="Desativar"
                  disabled={!user.active}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
