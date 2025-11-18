import React from 'react';
import { Chip, Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import DataTable from '../molecules/DataTable';

/**
 * ClassTable - Tabela de turmas usando DataTable universal
 *
 * @param {Object} props
 * @param {Array} props.classes - Lista de turmas
 * @param {Function} props.onEdit - Callback ao editar turma
 * @param {Function} props.onDelete - Callback ao deletar turma
 * @param {boolean} props.loading - Estado de loading
 */
export function ClassTable({ classes = [], onEdit, onDelete, loading = false }) {
  // Configuração de colunas
  const columns = [
    {
      id: 'name',
      label: 'Nome da Turma',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'school_year',
      label: 'Ano Letivo',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      id: 'description',
      label: 'Descrição',
      render: (value) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={value || '-'}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'student_count',
      label: 'Alunos',
      sortable: true,
      render: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2">{value || 0}</Typography>
        </Box>
      ),
    },
    {
      id: 'active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Chip
          label={value ? 'Ativa' : 'Inativa'}
          color={value ? 'success' : 'default'}
          size="small"
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
      label: 'Editar turma',
      color: 'primary',
    },
    {
      icon: <DeleteIcon />,
      onClick: (classItem) => onDelete(classItem.id),
      label: 'Desativar turma',
      color: 'error',
      disabled: (classItem) => !classItem.active,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={classes}
      actions={actions}
      loading={loading}
      emptyState={{
        icon: <ClassIcon sx={{ fontSize: 64 }} />,
        title: 'Nenhuma turma encontrada',
        description: 'Clique em "Nova Turma" para criar a primeira turma',
      }}
      pagination={true}
      searchable={true}
      searchPlaceholder="Buscar por nome da turma..."
      defaultSortBy="name"
      defaultSortOrder="asc"
    />
  );
}
