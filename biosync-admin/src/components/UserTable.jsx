import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const UserTable = ({ users, onEdit, onDelete }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const renderSubscription = (user) => {
    if (!user.subscription) {
      return <Chip label="Nenhuma" size="small" variant="outlined" />;
    }

    return (
      <Chip
        label={`${user.subscription.planName}`}
        size="small"
        color={user.subscription.isActive ? 'success' : 'default'}
      />
    );
  };

  return (
    <>
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 0 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nome completo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Função</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Assinatura</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.email || '—'}</TableCell>
                  <TableCell>{user.fullName || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isAdmin ? 'Admin' : 'Usuário'}
                      size="small"
                      color={user.isAdmin ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Ativo' : 'Inativo'}
                      size="small"
                      color={user.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{renderSubscription(user)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEdit(user)}
                        title="Editar Usuário"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(user.id)}
                        title="Excluir Usuário"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </>
  );
};

export default UserTable;
