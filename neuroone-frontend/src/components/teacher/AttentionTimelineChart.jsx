import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box, useTheme, useMediaQuery, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/**
 * Gráfico de linha mostrando evolução da atenção ao longo da sessão
 * Com suporte a theme claro/escuro e responsividade avançada
 * @param {Array} timelineData - Array de { timestamp, avgAttention, minAttention, maxAttention }
 * @param {Object} thresholds - { low, high }
 * @param {number} height - Altura do gráfico em px
 */
export function AttentionTimelineChart({ timelineData = [], thresholds = { low: 40, high: 70 }, height = 300 }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Cores do theme MUI adaptadas ao modo claro/escuro
  const isDark = theme.palette.mode === 'dark';
  const colors = {
    primary: theme.palette.primary.main,
    error: theme.palette.error.main,
    success: theme.palette.success.main,
    text: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    tooltip: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)',
    primaryAlpha: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
  };

  // Formatar dados para o Chart.js
  const labels = timelineData.map((point) => {
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });

  const avgAttentionData = timelineData.map((point) => point.avgAttention || point.avg_attention);
  const minAttentionData = timelineData.map((point) => point.minAttention || point.min_attention);
  const maxAttentionData = timelineData.map((point) => point.maxAttention || point.max_attention);

  const chartData = {
    labels,
    datasets: [
      // Atenção média (linha principal)
      {
        label: 'Atenção Média',
        data: avgAttentionData,
        borderColor: colors.primary,
        backgroundColor: colors.primaryAlpha,
        fill: true,
        tension: 0.4,
        borderWidth: isMobile ? 2 : 3,
        pointRadius: isMobile ? 3 : 4,
        pointHoverRadius: isMobile ? 5 : 6,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      // Mínimo (linha tracejada)
      {
        label: 'Mínimo',
        data: minAttentionData,
        borderColor: colors.error,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        borderWidth: isMobile ? 1.5 : 2,
        pointRadius: isMobile ? 1.5 : 2,
        pointHoverRadius: isMobile ? 3 : 4,
        pointBackgroundColor: colors.error,
      },
      // Máximo (linha tracejada)
      {
        label: 'Máximo',
        data: maxAttentionData,
        borderColor: colors.success,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        borderWidth: isMobile ? 1.5 : 2,
        pointRadius: isMobile ? 1.5 : 2,
        pointHoverRadius: isMobile ? 3 : 4,
        pointBackgroundColor: colors.success,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: isMobile ? 'bottom' : 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: isMobile ? 10 : 15,
          font: {
            size: isMobile ? 10 : (isTablet ? 11 : 12),
            family: theme.typography.fontFamily,
          },
          color: colors.text,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: colors.tooltip,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        titleFont: {
          size: isMobile ? 12 : 13,
          family: theme.typography.fontFamily,
        },
        bodyFont: {
          size: isMobile ? 11 : 12,
          family: theme.typography.fontFamily,
        },
        padding: isMobile ? 10 : 12,
        cornerRadius: 4,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
      title: {
        display: true,
        text: 'Evolução da Atenção Durante a Sessão',
        font: {
          size: isMobile ? 14 : (isTablet ? 15 : 16),
          weight: 'bold',
          family: theme.typography.fontFamily,
        },
        padding: {
          bottom: isMobile ? 15 : 20,
        },
        color: colors.text,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + '%';
          },
          font: {
            size: isMobile ? 10 : 11,
            family: theme.typography.fontFamily,
          },
          color: colors.textSecondary,
          stepSize: 20,
        },
        grid: {
          color: colors.grid,
          drawBorder: false,
        },
        border: {
          color: colors.grid,
        },
        title: {
          display: !isMobile,
          text: 'Nível de Atenção (%)',
          font: {
            size: isMobile ? 11 : 12,
            family: theme.typography.fontFamily,
          },
          color: colors.textSecondary,
        },
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 9 : 11,
            family: theme.typography.fontFamily,
          },
          color: colors.textSecondary,
          maxRotation: isMobile ? 45 : 45,
          minRotation: isMobile ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: isMobile ? 6 : (isTablet ? 10 : 15),
        },
        grid: {
          display: false,
        },
        border: {
          color: colors.grid,
        },
        title: {
          display: !isMobile,
          text: 'Tempo',
          font: {
            size: isMobile ? 11 : 12,
            family: theme.typography.fontFamily,
          },
          color: colors.textSecondary,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  if (timelineData.length === 0) {
    return (
      <Box
        sx={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Sem dados para exibir
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: `${height}px`, width: '100%' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}
