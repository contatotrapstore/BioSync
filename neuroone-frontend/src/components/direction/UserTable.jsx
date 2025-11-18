import React from 'react';
import { Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DataTable from '../molecules/DataTable';

/**
 * UserTable - Tabela de usuários usando DataTable universal
 *
 * @param {Object} props
 * @param {Array} props.users - Lista de usuários
 * @param {Function} props.onEdit - Callback ao editar usuário
 * @param {Function} props.onDelete - Callback ao deletar usuário
 * @param {boolean} props.loading - Estado de loading
 */
export function UserTable({ users = [], onEdit, onDelete, loading = false }) {
  // Mapear roles para nomes amigáveis
  const getRoleName = (role) => {
    const roles = {
      direcao: 'Direção',
      professor: 'Professor',
      aluno: 'Aluno',
    };
    return roles[role] || role;
  };

  // Mapear roles para cores
  const getRoleColor = (role) => {
    const colors = {
      direcao: 'error',
      professor: 'primary',
      aluno: 'success',
    };
    return colors[role] || 'default';
  };

  // Configuração de colunas
  const columns = [
    {
      id: 'name',
      label: 'Nome',
      sortable: true,
    },
    {
      id: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      id: 'user_role',
      label: 'Tipo',
      sortable: true,
      render: (value) => (
        <Chip
          label={getRoleName(value)}
          color={getRoleColor(value)}
          size="small"
        />
      ),
    },
    {
      id: 'active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Chip
          label={value ? 'Ativo' : 'Inativo'}
          color={value ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'created_at',
      label: 'Criado em',
      sortable: true,
      format: 'date',
    },
  ];

  // Configuração de ações
  const actions = [
    {
      icon: <EditIcon />,
      onClick: onEdit,
      label: 'Editar usuário',
      color: 'primary',
    },
    {
      icon: <DeleteIcon />,
      onClick: (user) => onDelete(user.id),
      label: 'Desativar usuário',
      color: 'error',
      disabled: (user) => !user.active,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      actions={actions}
      loading={loading}
      emptyState={{
        icon: <PersonAddIcon sx={{ fontSize: 64 }} />,
        title: 'Nenhum usuário encontrado',
        description: 'Clique em "Novo Usuário" para adicionar o primeiro usuário',
      }}
      pagination={true}
      searchable={true}
      searchPlaceholder="Buscar por nome ou email..."
      defaultSortBy="name"
      defaultSortOrder="asc"
    />
  );
}
