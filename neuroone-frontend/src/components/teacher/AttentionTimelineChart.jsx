import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box } from '@mui/material';
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
 * @param {Array} timelineData - Array de { timestamp, avgAttention, minAttention, maxAttention }
 * @param {Object} thresholds - { low, high }
 * @param {number} height - Altura do gráfico em px
 */
export function AttentionTimelineChart({ timelineData = [], thresholds = { low: 40, high: 70 }, height = 300 }) {
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
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      // Mínimo (linha tracejada)
      {
        label: 'Mínimo',
        data: minAttentionData,
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      // Máximo (linha tracejada)
      {
        label: 'Máximo',
        data: maxAttentionData,
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
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
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
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
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Nível de Atenção (%)',
          font: {
            size: 12,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Tempo',
          font: {
            size: 12,
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    // Linhas de referência para thresholds
    annotation: {
      annotations: {
        lowLine: {
          type: 'line',
          yMin: thresholds.low,
          yMax: thresholds.low,
          borderColor: '#EF4444',
          borderWidth: 2,
          borderDash: [10, 5],
          label: {
            content: `Baixa (${thresholds.low}%)`,
            enabled: true,
            position: 'start',
          },
        },
        highLine: {
          type: 'line',
          yMin: thresholds.high,
          yMax: thresholds.high,
          borderColor: '#10B981',
          borderWidth: 2,
          borderDash: [10, 5],
          label: {
            content: `Alta (${thresholds.high}%)`,
            enabled: true,
            position: 'start',
          },
        },
      },
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
        <span style={{ color: '#9CA3AF' }}>Sem dados para exibir</span>
      </Box>
    );
  }

  return (
    <Box sx={{ height: `${height}px`, width: '100%' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}
