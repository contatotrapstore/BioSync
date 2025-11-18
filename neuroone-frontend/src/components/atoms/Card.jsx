import React from 'react';
import { Card as MuiCard, CardContent, Skeleton, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

/**
 * Enhanced Card Component
 *
 * Features:
 * - Multiple variants: elevated (default), outlined, flat
 * - Loading skeleton state
 * - Clickable variant with hover effects
 * - Padding variations: none, small, medium, large
 * - Responsive
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - 'elevated' | 'outlined' | 'flat'
 * @param {boolean} props.loading - Show loading skeleton
 * @param {boolean} props.clickable - Add hover effects for clickable cards
 * @param {string} props.padding - 'none' | 'small' | 'medium' | 'large'
 * @param {Function} props.onClick - Click handler
 */

const StyledCard = styled(MuiCard)(({ theme, variant, clickable }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 1.5,
  transition: 'all 0.2s ease-in-out',
  position: 'relative',

  // Variant: elevated (default)
  ...(variant === 'elevated' && {
    boxShadow: theme.shadows[2],
    border: 'none',
  }),

  // Variant: outlined
  ...(variant === 'outlined' && {
    boxShadow: 'none',
    border: `1px solid ${theme.palette.divider}`,
  }),

  // Variant: flat
  ...(variant === 'flat' && {
    boxShadow: 'none',
    border: 'none',
  }),

  // Clickable hover effects
  ...(clickable && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
      borderColor: theme.palette.primary.main,
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  }),

  // Non-clickable subtle hover
  ...(!clickable && {
    '&:hover': {
      boxShadow: variant === 'elevated' ? theme.shadows[4] : theme.shadows[1],
    },
  }),
}));

const paddingMap = {
  none: 0,
  small: 2,
  medium: 3,
  large: 4,
};

export function Card({
  children,
  variant = 'elevated',
  loading = false,
  clickable = false,
  padding = 'medium',
  onClick,
  sx,
  ...props
}) {
  const paddingValue = paddingMap[padding] || paddingMap.medium;

  // Loading state
  if (loading) {
    return (
      <StyledCard variant={variant} sx={sx} {...props}>
        <CardContent sx={{ p: paddingValue }}>
          <Box>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ width: '100%' }}
    >
      <StyledCard
        variant={variant}
        clickable={clickable ? 1 : 0}
        onClick={onClick}
        sx={sx}
        {...props}
      >
        <CardContent
          sx={{
            p: paddingValue,
            '&:last-child': {
              pb: paddingValue,
            },
          }}
        >
          {children}
        </CardContent>
      </StyledCard>
    </motion.div>
  );
}

export default Card;
