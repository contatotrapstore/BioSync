import React from 'react';
import { Button as MuiButton } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme, variant }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',

  // Variant contained (primary)
  ...(variant === 'contained' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: theme.shadows[2],
    },
  }),

  // Variant outlined (secondary)
  ...(variant === 'outlined' && {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'light'
        ? theme.palette.primary.light + '20'  // 20% opacity
        : theme.palette.primary.dark + '20',
    },
  }),

  // Variant text
  ...(variant === 'text' && {
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'light'
        ? theme.palette.primary.light + '15'
        : theme.palette.primary.dark + '15',
    },
  }),
}));

export function Button({ children, ...props }) {
  return <StyledButton {...props}>{children}</StyledButton>;
}
