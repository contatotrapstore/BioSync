import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Paper, Slide, Stack } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/**
 * Banner para promover a instalação do PWA
 *
 * Aparece quando:
 * - O PWA é instalável
 * - O usuário não dispensou recentemente
 * - O PWA não está instalado
 *
 * @param {Object} props
 * @param {boolean} props.autoShow - Mostrar automaticamente quando disponível (default: true)
 * @param {number} props.delaySeconds - Atraso antes de mostrar (default: 3)
 */
export function InstallPWABanner({ autoShow = true, delaySeconds = 3 }) {
  const {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
    wasRecentlyDismissed,
  } = useInstallPrompt();

  const [show, setShow] = useState(false);

  useEffect(() => {
    // Não mostrar se já está instalado
    if (isInstalled) {
      setShow(false);
      return;
    }

    // Não mostrar se foi dispensado recentemente (últimas 24h)
    if (wasRecentlyDismissed(24)) {
      setShow(false);
      return;
    }

    // Mostrar se for instalável
    if (isInstallable && autoShow) {
      // Pequeno delay para não ser intrusivo
      const timer = setTimeout(() => {
        setShow(true);
      }, delaySeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, autoShow, delaySeconds, wasRecentlyDismissed]);

  const handleInstall = async () => {
    const result = await promptInstall();

    if (result === 'accepted') {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setShow(false);
  };

  // Não renderizar se não deve mostrar
  if (!show || isInstalled) {
    return null;
  }

  return (
    <Slide direction="up" in={show} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          right: 16,
          maxWidth: 500,
          mx: 'auto',
          p: 2,
          zIndex: 1300,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a237e 0%, #00D9FF 100%)'
              : 'linear-gradient(135deg, #00D9FF 0%, #1976d2 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Icon */}
          <PhoneIphoneIcon sx={{ fontSize: 40, flexShrink: 0 }} />

          {/* Content */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Instalar NeuroOne
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Acesse mais rápido e use como um app nativo no seu celular!
            </Typography>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<GetAppIcon />}
              onClick={handleInstall}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Instalar
            </Button>

            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>
    </Slide>
  );
}
