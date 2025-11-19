import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

/**
 * Enhanced Button Component
 *
 * Features:
 * - Multiple sizes: small, medium (default), large
 * - Loading state with spinner
 * - Icon support (startIcon, endIcon)
 * - Color variants: primary, secondary, error, success, info, warning
 * - Responsive sizing
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button text/content
 * @param {boolean} props.loading - Show loading spinner
 * @param {string} props.size - Button size: 'small' | 'medium' | 'large'
 * @param {string} props.variant - Button variant: 'contained' | 'outlined' | 'text'
 * @param {string} props.color - Button color: 'primary' | 'secondary' | 'error' | etc
 * @param {React.ReactNode} props.startIcon - Icon before text
 * @param {React.ReactNode} props.endIcon - Icon after text
 * @param {boolean} props.fullWidth - Full width button
 * @param {boolean} props.disabled - Disabled state
 */

const StyledButton = styled(MuiButton)(({ theme, size }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  position: 'relative',

  // Size variations
  ...(size === 'small' && {
    padding: '6px 16px',
    fontSize: '0.875rem',
    minHeight: 32,
  }),

  ...(size === 'medium' && {
    padding: '10px 20px',
    fontSize: '1rem',
    minHeight: 40,
  }),

  ...(size === 'large' && {
    padding: '12px 28px',
    fontSize: '1.125rem',
    minHeight: 48,
  }),

  // Hover effects
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[4],
  },

  '&:active': {
    transform: 'translateY(0)',
  },

  // Disabled state
  '&.Mui-disabled': {
    cursor: 'not-allowed',
    pointerEvents: 'all',
  },

  // Icon spacing
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1),
  },

  '& .MuiButton-endIcon': {
    marginLeft: theme.spacing(1),
  },
}));

const MotionButton = motion.create(StyledButton);

export function Button({
  children,
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  size = 'medium',
  ...props
}) {
  return (
    <MotionButton
      {...props}
      size={size}
      disabled={disabled || loading}
      startIcon={!loading && startIcon}
      endIcon={!loading && endIcon}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      transition={{ duration: 0.15 }}
    >
      {loading ? (
        <>
          <CircularProgress
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            sx={{
              color: 'inherit',
              marginRight: 1,
            }}
          />
          {children}
        </>
      ) : (
        children
      )}
    </MotionButton>
  );
}

export default Button;
