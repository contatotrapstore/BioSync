import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import { Button } from '../atoms/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function SessionFilterBar({ filters, onFiltersChange }) {
  const [professors, setProfessors] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchProfessors();
    fetchClasses();
  }, []);

  async function fetchProfessors() {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar professores');
      }

      // Filtrar apenas professores ativos
      const activeProfessors = (result.data || [])
        .filter(user => user.user_role === 'professor' && user.active)
        .sort((a, b) => a.name.localeCompare(b.name));

      setProfessors(activeProfessors);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
    }
  }

  async function fetchClasses() {
    try {
      const response = await fetch(`${API_URL}/api/classes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar turmas');
      }

      // Filtrar apenas turmas ativas
      const activeClasses = (result.data || [])
        .filter(cls => cls.active)
        .sort((a, b) => a.name.localeCompare(b.name));

      setClasses(activeClasses);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
    }
  }

  function handleFilterChange(field) {
    return (event) => {
      onFiltersChange({
        ...filters,
        [field]: event.target.value,
      });
    };
  }

  function handleClearFilters() {
    onFiltersChange({
      teacherId: '',
      classId: '',
      dateFrom: '',
      dateTo: '',
      status: 'all',
    });
  }

  const hasActiveFilters =
    filters.teacherId ||
    filters.classId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.status !== 'all';

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Professor */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            label="Professor"
            value={filters.teacherId}
            onChange={handleFilterChange('teacherId')}
            fullWidth
            size="small"
          >
            <MenuItem value="">Todos</MenuItem>
            {professors.map((prof) => (
              <MenuItem key={prof.id} value={prof.id}>
                {prof.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Turma */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            label="Turma"
            value={filters.classId}
            onChange={handleFilterChange('classId')}
            fullWidth
            size="small"
          >
            <MenuItem value="">Todas</MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Status */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            label="Status"
            value={filters.status}
            onChange={handleFilterChange('status')}
            fullWidth
            size="small"
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="active">Ativas</MenuItem>
            <MenuItem value="completed">Finalizadas</MenuItem>
          </TextField>
        </Grid>

        {/* Data De */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            type="date"
            label="Data De"
            value={filters.dateFrom}
            onChange={handleFilterChange('dateFrom')}
            fullWidth
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        {/* Data Até */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            type="date"
            label="Data Até"
            value={filters.dateTo}
            onChange={handleFilterChange('dateTo')}
            fullWidth
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
      </Grid>

      {/* Botão Limpar Filtros */}
      {hasActiveFilters && (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="outlined" size="small" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
        </Stack>
      )}
    </Box>
  );
}
