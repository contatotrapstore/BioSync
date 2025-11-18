import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Stack,
  InputAdornment,
  Chip,
  Typography,
  Divider,
} from '@mui/material';
import { Button } from '../atoms/Button';
// Icons
import PersonIcon from '@mui/icons-material/Person';
import ClassIcon from '@mui/icons-material/Class';
import FilterListIcon from '@mui/icons-material/FilterList';
import EventIcon from '@mui/icons-material/Event';
import ClearIcon from '@mui/icons-material/Clear';

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

  // Count active filters
  const activeFiltersCount = [
    filters.teacherId,
    filters.classId,
    filters.dateFrom,
    filters.dateTo,
    filters.status !== 'all' ? filters.status : null,
  ].filter(Boolean).length;

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <FilterListIcon sx={{ color: 'text.secondary' }} />
        <Typography variant="h6" sx={{ flex: 1 }}>
          Filtros de Pesquisa
        </Typography>
        {activeFiltersCount > 0 && (
          <Chip
            label={`${activeFiltersCount} filtro(s) ativo(s)`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Stack>

      <Grid container spacing={3}>
        {/* Professor */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            label="Professor"
            value={filters.teacherId}
            onChange={handleFilterChange('teacherId')}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Todos os professores</em>
            </MenuItem>
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ClassIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Todas as turmas</em>
            </MenuItem>
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
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            placeholder="dd/mm/aaaa"
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
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            placeholder="dd/mm/aaaa"
          />
        </Grid>
      </Grid>

      {/* Botão Limpar Filtros */}
      {hasActiveFilters && (
        <>
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
            >
              Limpar Filtros
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}
