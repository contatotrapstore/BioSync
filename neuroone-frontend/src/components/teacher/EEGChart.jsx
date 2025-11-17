import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box } from '@mui/material';
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
 * @param {Object} eegData - { delta, theta, alpha, beta, gamma }
 * @param {boolean} compact - Modo compacto (sem legenda, menor altura)
 * @param {number} height - Altura do gráfico em px
 */
export function EEGChart({ eegData = {}, compact = false, height = 120 }) {
  const { delta = 0, theta = 0, alpha = 0, beta = 0, gamma = 0 } = eegData;

  // Dados do gráfico
  const chartData = {
    labels: ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'],
    datasets: [
      {
        label: 'Ondas Cerebrais',
        data: [delta, theta, alpha, beta, gamma],
        backgroundColor: [
          '#EF4444', // Vermelho - Delta (sono profundo)
          '#F59E0B', // Laranja - Theta (relaxamento, sonolência)
          '#10B981', // Verde - Alpha (alerta relaxado)
          '#3B82F6', // Azul - Beta (atenção ativa)
          '#8B5CF6', // Roxo - Gamma (alta cognição)
        ],
        borderRadius: 4,
        barThickness: compact ? 12 : 20,
      },
    ],
  };

  // Opções do gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !compact,
        position: 'bottom',
        labels: {
          font: {
            size: 10,
          },
          padding: 8,
        },
      },
      tooltip: {
        enabled: true,
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
          size: 12,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          display: !compact,
          font: {
            size: 9,
          },
        },
        grid: {
          display: !compact,
        },
      },
      x: {
        ticks: {
          font: {
            size: compact ? 9 : 11,
          },
        },
        grid: {
          display: false,
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
