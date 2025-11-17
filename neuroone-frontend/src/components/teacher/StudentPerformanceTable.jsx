import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  Box,
} from '@mui/material';
import { Card } from '../atoms/Card';

export function StudentPerformanceTable({ students = [] }) {
  const [orderBy, setOrderBy] = useState('avg_attention');
  const [order, setOrder] = useState('desc');

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedStudents = [...students].sort((a, b) => {
    const aValue = a[orderBy] ?? 0;
    const bValue = b[orderBy] ?? 0;
    return order === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}º`;
  };

  const getAttentionColor = (attention) => {
    if (attention >= 70) return 'success';
    if (attention >= 40) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Aluno
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'avg_attention'}
                  direction={orderBy === 'avg_attention' ? order : 'asc'}
                  onClick={() => handleSort('avg_attention')}
                >
                  Atenção Média
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'avg_relaxation'}
                  direction={orderBy === 'avg_relaxation' ? order : 'asc'}
                  onClick={() => handleSort('avg_relaxation')}
                >
                  Relaxamento
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Tempo Conectado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStudents.map((student, index) => (
              <TableRow key={student.id} hover>
                <TableCell>
                  <Box sx={{ fontSize: '1.1rem' }}>{getMedal(index)}</Box>
                </TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${student.avg_attention?.toFixed(1) || 0}%`}
                    color={getAttentionColor(student.avg_attention || 0)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {student.avg_relaxation?.toFixed(1) || 0}%
                </TableCell>
                <TableCell align="right">
                  {student.duration_minutes || 0} min
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
