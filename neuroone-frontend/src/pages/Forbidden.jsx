import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography } from '@mui/material';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';

export function Forbidden() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Card sx={{ width: '100%', textAlign: 'center' }}>
          <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
            🚫
          </Typography>

          <Typography variant="h2" gutterBottom>
            Acesso Negado
          </Typography>

          <Typography variant="body1" sx={{ mt: 2, mb: 4, color: 'text.secondary' }}>
            Você não tem permissão para acessar esta página.
            <br />
            Verifique suas credenciais ou entre em contato com o administrador.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => navigate('/')}>
              Voltar para Início
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}
