import React from 'react';
import { Box, Typography } from '@mui/material';
import { Card } from '../atoms/Card';

export function StatsCard({ title, value, icon, color = 'primary' }) {
  const colorMap = {
    primary: '#FFD700',  // Gold
    blue: '#3B82F6',
    green: '#10B981',
    orange: '#F59E0B',
    purple: '#8B5CF6',
  };

  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderLeft: `4px solid ${colorMap[color] || colorMap.primary}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          fontSize: '2.5rem',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.875rem',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Card>
  );
}
