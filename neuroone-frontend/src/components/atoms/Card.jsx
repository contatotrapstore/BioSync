import React from 'react';
import { Card as MuiCard, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(MuiCard)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  transition: 'box-shadow 0.3s ease',

  '&:hover': {
    boxShadow: theme.shadows[2],
  },
}));

export function Card({ children, sx, ...props }) {
  return (
    <StyledCard sx={sx} {...props}>
      <CardContent>{children}</CardContent>
    </StyledCard>
  );
}
