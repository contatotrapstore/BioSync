import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { Card } from './Card';

/**
 * Skeleton loading para Cards
 * Usado em dashboards enquanto dados carregam
 * @param {number} rows - Número de linhas de conteúdo
 * @param {boolean} hasHeader - Se tem cabeçalho
 * @param {boolean} hasActions - Se tem ações no rodapé
 */
export function CardSkeleton({ rows = 3, hasHeader = false, hasActions = false }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <Stack spacing={2}>
          {/* Header opcional */}
          {hasHeader && (
            <>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={20} />
            </>
          )}

          {/* Conteúdo principal */}
          <Stack spacing={1.5}>
            {Array.from({ length: rows }).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Stack>
              </Box>
            ))}
          </Stack>

          {/* Actions opcional */}
          {hasActions && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
            </Box>
          )}
        </Stack>
      </Card>
    </motion.div>
  );
}
