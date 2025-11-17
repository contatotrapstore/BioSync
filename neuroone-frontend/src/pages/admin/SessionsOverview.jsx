import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { SessionFilterBar } from '../../components/direction/SessionFilterBar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function SessionsOverview() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    teacherId: '',
    classId: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
  });

  // Stats
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === 'active').length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const avgAttention = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + (s.avg_attention || 0), 0) / sessions.length).toFixed(1)
    : 0;

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, sessions]);

  async function fetchSessions() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar sessões');
      }

      setSessions(result.data || []);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...sessions];

    // Filtro por Professor
    if (filters.teacherId) {
      filtered = filtered.filter((s) => s.teacher_id === filters.teacherId);
    }

    // Filtro por Turma
    if (filters.classId) {
      filtered = filtered.filter((s) => s.class_id === filters.classId);
    }

    // Filtro por Status
    if (filters.status !== 'all') {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    // Filtro por Data De
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (s) => new Date(s.start_time) >= new Date(filters.dateFrom)
      );
    }

    // Filtro por Data Até
    if (filters.dateTo) {
      const dateToEnd = new Date(filters.dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (s) => new Date(s.start_time) <= dateToEnd
      );
    }

    setFilteredSessions(filtered);
  }

  function handleFiltersChange(newFilters) {
    setFilters(newFilters);
  }

  function exportToCSV() {
    if (filteredSessions.length === 0) {
      alert('Nenhuma sessão para exportar');
      return;
    }

    // Cabeçalho CSV
    const headers = [
      'ID',
      'Título',
      'Turma',
      'Professor',
      'Data/Hora Início',
      'Data/Hora Fim',
      'Status',
      'Nº Alunos',
      'Atenção Média (%)',
    ];

    // Linhas CSV
    const rows = filteredSessions.map((session) => [
      session.id,
      session.title || 'Sem título',
      session.class_name,
      session.teacher_name,
      new Date(session.start_time).toLocaleString('pt-BR'),
      session.end_time ? new Date(session.end_time).toLocaleString('pt-BR') : 'Em andamento',
      session.status === 'active' ? 'Ativa' : 'Finalizada',
      session.participants_count,
      session.avg_attention.toFixed(1),
    ]);

    // Gerar CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sessoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function getStatusColor(status) {
    return status === 'active' ? 'success' : 'default';
  }

  function getStatusLabel(status) {
    return status === 'active' ? 'Ativa' : 'Finalizada';
  }

  function calculateDuration(startTime, endTime) {
    if (!endTime) return 'Em andamento';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min`;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="text"
            onClick={() => navigate('/admin')}
            sx={{ mb: 2 }}
            startIcon={<ArrowBackIcon />}
          >
            Voltar ao Dashboard
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h1">Monitoramento de Sessões</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                Visualização global de todas as sessões de aula
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                Total de Sessões
              </Typography>
              <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700 }}>
                {totalSessions}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                Sessões Ativas
              </Typography>
              <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700, color: 'success.main' }}>
                {activeSessions}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                Sessões Finalizadas
              </Typography>
              <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700, color: 'text.secondary' }}>
                {completedSessions}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                Atenção Média Geral
              </Typography>
              <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700, color: 'primary.main' }}>
                {avgAttention}%
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom>
            Filtros
          </Typography>
          <SessionFilterBar filters={filters} onFiltersChange={handleFiltersChange} />
        </Card>

        {/* Actions */}
        <Card sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Exibindo <strong>{filteredSessions.length}</strong> de <strong>{totalSessions}</strong> sessão(ões)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
              disabled={filteredSessions.length === 0}
            >
              Exportar CSV
            </Button>
          </Stack>
        </Card>

        {/* Table */}
        {filteredSessions.length === 0 ? (
          <Card>
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ mb: 2, color: 'text.secondary' }}>
                📊 Nenhuma sessão encontrada
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {totalSessions === 0
                  ? 'Ainda não há sessões cadastradas no sistema'
                  : 'Ajuste os filtros para visualizar sessões'}
              </Typography>
            </Box>
          </Card>
        ) : (
          <TableContainer component={Card}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Turma</TableCell>
                  <TableCell>Professor</TableCell>
                  <TableCell>Data/Hora Início</TableCell>
                  <TableCell>Duração</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Nº Alunos</TableCell>
                  <TableCell>Atenção Média</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow
                    key={session.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {session.title || 'Sem título'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{session.class_name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{session.teacher_name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {new Date(session.start_time).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {calculateDuration(session.start_time, session.end_time)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getStatusLabel(session.status)}
                        color={getStatusColor(session.status)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{session.participants_count}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {session.avg_attention.toFixed(1)}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}
