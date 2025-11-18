import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Gráfico de barras para ondas cerebrais EEG
 * Com suporte a theme claro/escuro e responsividade avançada
 * @param {Object} eegData - { delta, theta, alpha, beta, gamma }
 * @param {boolean} compact - Modo compacto (sem legenda, menor altura)
 * @param {number} height - Altura do gráfico em px
 */
export function EEGChart({ eegData = {}, compact = false, height = 120 }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { delta = 0, theta = 0, alpha = 0, beta = 0, gamma = 0 } = eegData;

  // Cores do theme MUI adaptadas ao modo claro/escuro
  const isDark = theme.palette.mode === 'dark';
  const colors = {
    delta: theme.palette.error.main,       // Vermelho - Delta (sono profundo)
    theta: theme.palette.warning.main,     // Laranja - Theta (relaxamento)
    alpha: theme.palette.success.main,     // Verde - Alpha (alerta relaxado)
    beta: theme.palette.primary.main,      // Azul - Beta (atenção ativa)
    gamma: theme.palette.secondary.main,   // Roxo - Gamma (alta cognição)
    text: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    tooltip: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)',
  };

  // Dados do gráfico
  const chartData = {
    labels: ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'],
    datasets: [
      {
        label: 'Ondas Cerebrais',
        data: [delta, theta, alpha, beta, gamma],
        backgroundColor: [
          colors.delta,
          colors.theta,
          colors.alpha,
          colors.beta,
          colors.gamma,
        ],
        borderRadius: 4,
        barThickness: compact ? (isMobile ? 10 : 12) : (isMobile ? 16 : 20),
      },
    ],
  };

  // Opções do gráfico adaptadas ao theme e responsividade
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !compact,
        position: 'bottom',
        labels: {
          font: {
            size: isMobile ? 9 : 10,
            family: theme.typography.fontFamily,
          },
          padding: isMobile ? 6 : 8,
          color: colors.text,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: colors.tooltip,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        titleFont: {
          size: isMobile ? 11 : 13,
          family: theme.typography.fontFamily,
        },
        bodyFont: {
          size: isMobile ? 10 : 12,
          family: theme.typography.fontFamily,
        },
        padding: isMobile ? 8 : 10,
        cornerRadius: 4,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
      title: {
        display: !compact,
        text: 'Ondas Cerebrais (EEG)',
        font: {
          size: isMobile ? 11 : 12,
          family: theme.typography.fontFamily,
          weight: '600',
        },
        color: colors.text,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          display: !compact,
          font: {
            size: isMobile ? 8 : 9,
            family: theme.typography.fontFamily,
          },
          color: colors.textSecondary,
        },
        grid: {
          display: !compact,
          color: colors.grid,
        },
        border: {
          color: colors.grid,
        },
      },
      x: {
        ticks: {
          font: {
            size: compact ? (isMobile ? 8 : 9) : (isMobile ? 10 : 11),
            family: theme.typography.fontFamily,
          },
          color: colors.textSecondary,
        },
        grid: {
          display: false,
        },
        border: {
          color: colors.grid,
        },
      },
    },
  };

  return (
    <Box sx={{ height: `${height}px`, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
}
