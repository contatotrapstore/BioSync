import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

const ScoreChart = ({ scores }) => {
  const theme = useTheme();

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    if (!scores || scores.length === 0) return [];

    // Ordenar por data (mais antigo primeiro)
    const sortedScores = [...scores].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    // Limitar a 30 sessões mais recentes para não poluir o gráfico
    const recentScores = sortedScores.slice(-30);

    // Formatar para o gráfico
    return recentScores.map((score, index) => {
      const date = new Date(score.created_at);
      const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        session: `Sessão ${index + 1}`,
        date: formattedDate,
        score: score.score,
        game: score.games?.name || 'Jogo',
        fullDate: score.created_at
      };
    });
  }, [scores]);

  if (!chartData || chartData.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Nenhuma pontuação disponível para exibir gráfico
        </Typography>
      </Box>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {data.session}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {data.date}
          </Typography>
          <Typography variant="body2" color="primary.main" fontWeight="bold">
            Pontuação: {data.score}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data.game}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="session"
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            label={{
              value: 'Pontuação',
              angle: -90,
              position: 'insideLeft',
              style: { fill: theme.palette.text.secondary }
            }}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 14 }} />
          <Line
            type="monotone"
            dataKey="score"
            name="Pontuação"
            stroke={theme.palette.primary.main}
            strokeWidth={3}
            dot={{ r: 4, fill: theme.palette.primary.main }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        Mostrando as {chartData.length} sessões mais recentes
      </Typography>
    </Box>
  );
};

export default ScoreChart;
