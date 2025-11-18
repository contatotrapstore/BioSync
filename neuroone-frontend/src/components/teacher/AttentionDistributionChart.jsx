import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Gráfico de pizza mostrando distribuição de alunos por nível de atenção
 * Com suporte a theme claro/escuro e responsividade avançada
 * @param {Object} distribution - { low: number, medium: number, high: number }
 * @param {number} height - Altura do gráfico
 */
export function AttentionDistributionChart({ distribution = { low: 0, medium: 0, high: 0 }, height = 300 }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Cores do theme MUI adaptadas ao modo claro/escuro
  const isDark = theme.palette.mode === 'dark';
  const colors = {
    low: theme.palette.error.main,
    lowBorder: theme.palette.error.dark,
    medium: theme.palette.warning.main,
    mediumBorder: theme.palette.warning.dark,
    high: theme.palette.success.main,
    highBorder: theme.palette.success.dark,
    text: theme.palette.text.primary,
    tooltip: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)',
  };

  const chartData = {
    labels: [
      `Baixa (< 40%)`,
      `Média (40-70%)`,
      `Alta (≥ 70%)`,
    ],
    datasets: [
      {
        data: [distribution.low, distribution.medium, distribution.high],
        backgroundColor: [colors.low, colors.medium, colors.high],
        borderColor: [colors.lowBorder, colors.mediumBorder, colors.highBorder],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'bottom',
        labels: {
          padding: isMobile ? 10 : 15,
          font: {
            size: isMobile ? 11 : (isTablet ? 12 : 13),
            family: theme.typography.fontFamily,
          },
          usePointStyle: true,
          pointStyle: 'circle',
          color: colors.text,
        },
      },
      tooltip: {
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
          label: (context) => {
            const total = distribution.low + distribution.medium + distribution.high;
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} alunos (${percentage}%)`;
          },
        },
      },
      title: {
        display: true,
        text: 'Distribuição de Atenção',
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
  };

  return (
    <Box sx={{ height: `${height}px`, width: '100%' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
}
