import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';

export function TeacherClassCard({ classData, onViewDetails }) {
  const studentCount = classData.student_count || 0;
  const lastSession = classData.last_session_date
    ? new Date(classData.last_session_date).toLocaleDateString('pt-BR')
    : 'Nenhuma sessão';

  return (
    <Card
      sx={{
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
            {classData.name}
          </Typography>
          <Chip
            label={classData.school_year || 'Sem ano'}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {classData.description && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {classData.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {studentCount} {studentCount === 1 ? 'aluno' : 'alunos'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {lastSession}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          fullWidth
          onClick={() => onViewDetails(classData)}
        >
          Ver Detalhes
        </Button>
      </Box>
    </Card>
  );
}
