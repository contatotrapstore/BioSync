import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import { Card } from '../atoms/Card';

export function ClassTable({ classes, onEdit, onDelete }) {
  if (!classes || classes.length === 0) {
    return (
      <Card>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 2, color: 'text.secondary' }}>
            📚 Nenhuma turma encontrada
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Clique em "Nova Turma" para criar a primeira turma
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
            <TableCell>Nome da Turma</TableCell>
            <TableCell>Ano Letivo</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Alunos</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Criado em</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {classes.map((classItem) => (
            <TableRow
              key={classItem.id}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <TableCell>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {classItem.name}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  {classItem.school_year || '-'}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {classItem.description || '-'}
                </Typography>
              </TableCell>

              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="body2">
                    {classItem.student_count || 0}
                  </Typography>
                </Box>
              </TableCell>

              <TableCell>
                <Chip
                  label={classItem.active ? 'Ativa' : 'Inativa'}
                  color={classItem.active ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>

              <TableCell>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {new Date(classItem.created_at).toLocaleDateString('pt-BR')}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => onEdit(classItem)}
                  sx={{ mr: 1 }}
                  title="Editar turma"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDelete(classItem.id)}
                  disabled={!classItem.active}
                  color="error"
                  title={classItem.active ? 'Desativar turma' : 'Turma já desativada'}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
