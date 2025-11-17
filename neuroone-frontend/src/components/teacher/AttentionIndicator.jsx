import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { keyframes } from '@mui/system';

// Animação de pulso
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

/**
 * Indicador visual de nível de atenção com cores
 * @param {number} attention - Valor de atenção (0-100)
 * @param {Object} thresholds - { low, high }
 * @param {boolean} connected - Se o aluno está conectado
 * @param {number} size - Tamanho do indicador em px
 */
export function AttentionIndicator({ attention, thresholds = { low: 40, high: 70 }, connected = true, size = 16 }) {
  const getLevel = () => {
    if (!connected) return 'disconnected';
    if (attention === null || attention === undefined) return 'unknown';
    if (attention < thresholds.low) return 'low';
    if (attention >= thresholds.high) return 'high';
    return 'medium';
  };

  const getColor = (level) => {
    switch (level) {
      case 'high':
        return '#10B981'; // Verde
      case 'medium':
        return '#F59E0B'; // Amarelo/Laranja
      case 'low':
        return '#EF4444'; // Vermelho
      case 'disconnected':
        return '#6B7280'; // Cinza
      case 'unknown':
        return '#9CA3AF'; // Cinza claro
      default:
        return '#9CA3AF';
    }
  };

  const getLabel = (level) => {
    switch (level) {
      case 'high':
        return 'Alta atenção';
      case 'medium':
        return 'Atenção moderada';
      case 'low':
        return 'Baixa atenção - requer atenção';
      case 'disconnected':
        return 'Offline';
      case 'unknown':
        return 'Aguardando dados...';
      default:
        return 'Desconhecido';
    }
  };

  const level = getLevel();
  const color = getColor(level);
  const label = getLabel(level);

  return (
    <Tooltip title={`${label}${attention !== null && attention !== undefined ? ` (${attention}%)` : ''}`} arrow>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          animation: connected && level !== 'unknown' ? `${pulse} 2s ease-in-out infinite` : 'none',
          transition: 'background-color 0.3s ease',
          boxShadow: connected ? `0 0 ${size / 2}px ${color}40` : 'none',
        }}
        aria-label={label}
      />
    </Tooltip>
  );
}
