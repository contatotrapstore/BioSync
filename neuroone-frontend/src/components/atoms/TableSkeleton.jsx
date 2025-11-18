import React from 'react';
import { Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { motion } from 'framer-motion';
import { Card } from './Card';

/**
 * Skeleton loading para Tabelas
 * Usado em UserTable, ClassTable, etc enquanto dados carregam
 * @param {number} rows - Número de linhas
 * @param {number} columns - Número de colunas
 * @param {boolean} hasActions - Se tem coluna de ações
 */
export function TableSkeleton({ rows = 5, columns = 4, hasActions = true }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableCell key={`header-${index}`}>
                  <Skeleton variant="text" width="80%" height={20} />
                </TableCell>
              ))}
              {hasActions && (
                <TableCell>
                  <Skeleton variant="text" width="60px" height={20} />
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                    {colIndex === 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="text" width="120px" height={20} />
                      </Box>
                    ) : (
                      <Skeleton variant="text" width="90%" height={20} />
                    )}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </motion.div>
  );
}
