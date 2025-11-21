import React from 'react';
import { Box, Typography, Divider, Stack, Chip } from '@mui/material';
import { Card } from '../atoms/Card';
import { AttentionIndicator } from './AttentionIndicator';
import { EEGChart } from './EEGChart';
// MUI Icons
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/**
 * Card individual de aluno mostrando dados EEG em tempo real
 * @param {Object} student - Dados do aluno
 * @param {Object} eegData - Dados EEG em tempo real { attention, relaxation, delta, theta, alpha, beta, gamma }
 * @param {Object} thresholds - { low, high } para classificação de atenção
 * @param {boolean} connected - Se o aluno está conectado
 * @param {boolean} dataStale - Se os dados estão desatualizados
 */
export function StudentCard({ student, eegData = null, thresholds = { low: 40, high: 70 }, connected = false, dataStale = false }) {
  const hasData = connected && eegData && eegData.attention !== null && eegData.attention !== undefined;

  const getSignalQualityColor = (quality) => {
    // signal_quality: 0 = excellent, 200 = poor
    if (quality === undefined || quality === null) return 'text.disabled';
    if (quality < 50) return 'success.main';
    if (quality < 100) return 'warning.main';
    return 'error.main';
  };

  const getSignalQualityLabel = (quality) => {
    if (quality === undefined || quality === null) return 'Sem dados';
    if (quality < 50) return 'Ótima';
    if (quality < 100) return 'Boa';
    if (quality < 150) return 'Razoável';
    return 'Ruim';
  };

  return (
    <Card
      sx={{
        opacity: connected ? 1 : 0.5,
        transition: 'all 0.3s ease',
        border: '2px solid',
        borderColor: dataStale ? 'warning.main' : (connected ? 'divider' : 'transparent'),
        '&:hover': {
          borderColor: dataStale ? 'warning.dark' : (connected ? 'primary.main' : 'divider'),
        },
      }}
    >
      <Stack spacing={2}>
        {/* Header: Nome e Indicador */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {student.name}
            </Typography>
            {dataStale && (
              <Chip
                icon={<WarningAmberIcon />}
                label="Dados desatualizados"
                color="warning"
                size="small"
                sx={{ fontSize: '0.65rem', height: '20px' }}
              />
            )}
          </Box>
          <AttentionIndicator
            attention={hasData ? eegData.attention : null}
            thresholds={thresholds}
            connected={connected}
            size={20}
          />
        </Box>

        <Divider />

        {/* Corpo: Dados ou Mensagem de Offline */}
        {!connected ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <CloudOffIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>
              Offline
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Aguardando conexão...
            </Typography>
          </Box>
        ) : !hasData ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <CloudDoneIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>
              Conectado
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Aguardando dados EEG...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Métricas Principais */}
            <Stack spacing={1}>
              {/* Atenção */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Atenção
                </Typography>
                <Typography variant="h4" sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'primary.main' }}>
                  {eegData.attention}%
                </Typography>
              </Box>

              {/* Relaxamento */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Relaxamento
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {eegData.relaxation}%
                </Typography>
              </Box>

              {/* Qualidade do Sinal */}
              {eegData.signalQuality !== undefined && eegData.signalQuality !== null && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SignalCellularAltIcon sx={{ fontSize: 14, color: getSignalQualityColor(eegData.signalQuality) }} />
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      Sinal
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: getSignalQualityColor(eegData.signalQuality),
                      fontWeight: 600,
                    }}
                  >
                    {getSignalQualityLabel(eegData.signalQuality)}
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* Gráfico EEG Compacto */}
            {eegData.delta !== undefined && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1, display: 'block' }}>
                    Ondas Cerebrais
                  </Typography>
                  <EEGChart eegData={eegData} compact={true} height={100} />
                </Box>
              </>
            )}

            {/* Timestamp */}
            {eegData.timestamp && (
              <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', display: 'block' }}>
                Última atualização: {new Date(eegData.timestamp).toLocaleTimeString('pt-BR')}
              </Typography>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}
