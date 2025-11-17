import React from 'react';
import { Container, Box, Typography, Stack } from '@mui/material';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Input } from '../components/atoms/Input';

export function DesignSystemTest() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h1" gutterBottom>
          Design System - NeuroOne
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          Demonstração de todos os componentes base do sistema
        </Typography>

        {/* Botões */}
        <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
          Botões
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          <Button variant="contained">Primary</Button>
          <Button variant="outlined">Secondary</Button>
          <Button variant="text">Text</Button>
        </Stack>

        {/* Cards */}
        <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
          Cards
        </Typography>
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Card>
            <Typography variant="h3">Exemplo de Card</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Este é um card do Design System NeuroOne com hover effect e sombras.
            </Typography>
          </Card>

          <Card>
            <Typography variant="h3">Outro Card</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Cards adaptam cores automaticamente entre light e dark mode.
            </Typography>
          </Card>
        </Stack>

        {/* Inputs */}
        <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
          Inputs
        </Typography>
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Input label="Email" type="email" />
          <Input label="Senha" type="password" />
          <Input label="Nome Completo" />
        </Stack>

        {/* Tipografia */}
        <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
          Tipografia
        </Typography>
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Typography variant="h1">Heading 1 - 2rem</Typography>
          <Typography variant="h2">Heading 2 - 1.5rem</Typography>
          <Typography variant="h3">Heading 3 - 1.25rem</Typography>
          <Typography variant="body1">Body 1 - 1rem (padrão)</Typography>
          <Typography variant="body2">Body 2 - 0.875rem</Typography>
        </Stack>

        {/* Cores */}
        <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
          Paleta de Cores
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ width: 80, height: 80, bgcolor: 'primary.main', borderRadius: 1, border: 1, borderColor: 'divider' }} />
          <Box sx={{ width: 80, height: 80, bgcolor: 'primary.light', borderRadius: 1, border: 1, borderColor: 'divider' }} />
          <Box sx={{ width: 80, height: 80, bgcolor: 'primary.dark', borderRadius: 1, border: 1, borderColor: 'divider' }} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Box sx={{ width: 80, height: 80, bgcolor: 'secondary.main', borderRadius: 1, border: 1, borderColor: 'divider' }} />
          <Box sx={{ width: 80, height: 80, bgcolor: 'secondary.light', borderRadius: 1, border: 1, borderColor: 'divider' }} />
          <Box sx={{ width: 80, height: 80, bgcolor: 'secondary.dark', borderRadius: 1, border: 1, borderColor: 'divider' }} />
        </Stack>
      </Box>
    </Container>
  );
}
