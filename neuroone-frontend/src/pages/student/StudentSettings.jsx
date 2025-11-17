import React from 'react';
import { Container, Box, Typography, Alert, Stack } from '@mui/material';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { useNavigate } from 'react-router-dom';
import BluetoothIcon from '@mui/icons-material/Bluetooth';

export function StudentSettings() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Configurações
        </Typography>

        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Dispositivo EEG
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Dispositivo Recomendado: Neurosky TGAM
            </Typography>
            <Typography variant="body2">
              O sistema NeuroOne funciona melhor com dispositivos compatíveis com o protocolo ThinkGear.
              <br />
              <br />
              <strong>Como conectar:</strong>
              <br />
              1. Ligue o headset EEG
              <br />
              2. Habilite Bluetooth no seu dispositivo
              <br />
              3. Procure por "Neurosky" ou "MindWave"
              <br />
              4. Conecte durante uma sessão ativa
            </Typography>
          </Alert>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<BluetoothIcon />} disabled>
              Testar Conexão (Em breve)
            </Button>
            <Button variant="outlined" onClick={() => navigate('/student')}>
              Voltar
            </Button>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Informações do Sistema
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            <strong>Versão:</strong> 1.0.0
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            <strong>Modo:</strong> PWA (Progressive Web App)
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <strong>Suporte:</strong> Navegadores modernos (Chrome, Edge, Safari)
          </Typography>
        </Card>
      </Box>
    </Container>
  );
}
