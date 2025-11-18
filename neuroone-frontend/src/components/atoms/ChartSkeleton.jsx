import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * Skeleton loading para Gráficos
 * Usado em charts enquanto dados carregam
 * @param {number} height - Altura do gráfico
 * @param {string} variant - Tipo de gráfico ('bar', 'line', 'pie')
 */
export function ChartSkeleton({ height = 300, variant = 'line' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ width: '100%' }}>
        {/* Título */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="40%" height={28} />
        </Box>

        {/* Gráfico simulado */}
        <Box
          sx={{
            height: `${height}px`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            gap: 1,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 2,
          }}
        >
          {variant === 'bar' && (
            <>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  width="15%"
                  height={`${Math.random() * 60 + 40}%`}
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </>
          )}

          {variant === 'line' && (
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                sx={{ borderRadius: 2 }}
              />
            </Box>
          )}

          {variant === 'pie' && (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Skeleton variant="circular" width="70%" height="70%" />
            </Box>
          )}
        </Box>

        {/* Legenda */}
        <Stack direction="row" spacing={3} sx={{ mt: 2, justifyContent: 'center' }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="circular" width={12} height={12} />
              <Skeleton variant="text" width={60} height={16} />
            </Box>
          ))}
        </Stack>
      </Box>
    </motion.div>
  );
}
