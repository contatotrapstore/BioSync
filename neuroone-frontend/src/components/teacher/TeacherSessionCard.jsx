import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';

export function TeacherSessionCard({ session, onViewReport }) {
  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Ativa' : 'Finalizada';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startTime, endTime) => {
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
  };

  const avgAttention = session.avg_attention || 0;
  const className = session.class_name || 'Turma não especificada';

  return (
    <Card
      sx={{
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontSize: '1rem', mb: 0.5 }}>
              {session.title || 'Sessão sem título'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {formatDate(session.start_time)}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(session.status)}
            color={getStatusColor(session.status)}
            size="small"
          />
        </Box>

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {className}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {calculateDuration(session.start_time, session.end_time)}
            </Typography>
          </Box>

          {session.status === 'completed' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                Atenção média: {avgAttention.toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Stack>

        {session.status === 'completed' && (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={() => onViewReport(session)}
          >
            Ver Relatório
          </Button>
        )}

        {session.status === 'active' && (
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={() => onViewReport(session)}
          >
            Entrar na Sessão
          </Button>
        )}
      </Box>
    </Card>
  );
}
