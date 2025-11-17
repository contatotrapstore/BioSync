import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Box } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Gráfico de pizza mostrando distribuição de alunos por nível de atenção
 * @param {Object} distribution - { low: number, medium: number, high: number }
 * @param {number} height - Altura do gráfico
 */
export function AttentionDistributionChart({ distribution = { low: 0, medium: 0, high: 0 }, height = 300 }) {
  const chartData = {
    labels: [
      `Baixa (< 40%)`,
      `Média (40-70%)`,
      `Alta (≥ 70%)`,
    ],
    datasets: [
      {
        data: [distribution.low, distribution.medium, distribution.high],
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
        borderColor: ['#DC2626', '#D97706', '#059669'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
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
        font: { size: 16, weight: 'bold' },
        padding: { bottom: 20 },
      },
    },
  };

  return (
    <Box sx={{ height: `${height}px`, width: '100%' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
}
