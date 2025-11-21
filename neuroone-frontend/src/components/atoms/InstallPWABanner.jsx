import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Paper, Slide, Stack, useMediaQuery, useTheme } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import TabletIcon from '@mui/icons-material/Tablet';
import ComputerIcon from '@mui/icons-material/Computer';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/**
 * Banner para promover a instalação do PWA
 *
 * Aparece quando:
 * - O PWA é instalável (Chrome/Edge)
 * - Safari iOS (com instruções manuais)
 * - O usuário não dispensou hoje
 * - O PWA não está instalado
 *
 * @param {Object} props
 * @param {boolean} props.autoShow - Mostrar automaticamente quando disponível (default: true)
 * @param {number} props.delaySeconds - Atraso antes de mostrar (default: 3)
 */
export function InstallPWABanner({ autoShow = true, delaySeconds = 3 }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // > 900px

  const {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
    wasDismissedToday,
  } = useInstallPrompt();

  const [show, setShow] = useState(false);

  // Detectar Safari iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOSSafari = isIOS && isSafari;

  // Determine icon and text based on device type
  let DeviceIcon = PhoneIphoneIcon;
  let deviceText = 'celular';

  if (isTablet) {
    DeviceIcon = TabletIcon;
    deviceText = 'tablet';
  } else if (isDesktop && !isMobile) {
    DeviceIcon = ComputerIcon;
    deviceText = 'computador';
  }

  useEffect(() => {
    // Não mostrar se já está instalado
    if (isInstalled) {
      setShow(false);
      return;
    }

    // Não mostrar se foi dispensado hoje (reseta à meia-noite)
    if (wasDismissedToday()) {
      setShow(false);
      return;
    }

    // Mostrar para Safari iOS (sempre, pois não tem beforeinstallprompt)
    // OU quando for instalável via beforeinstallprompt (Chrome/Edge)
    if ((isIOSSafari || isInstallable) && autoShow) {
      // Pequeno delay para não ser intrusivo
      const timer = setTimeout(() => {
        setShow(true);
      }, delaySeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, autoShow, delaySeconds, wasDismissedToday, isIOSSafari]);

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
              ? 'linear-gradient(135deg, #1A1A1A 0%, #CDA434 100%)'
              : 'linear-gradient(135deg, #CDA434 0%, #8B6C42 100%)',
          color: 'white',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(205, 164, 52, 0.4)',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Icon */}
          <DeviceIcon sx={{ fontSize: 40, flexShrink: 0 }} />

          {/* Content */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Instalar NeuroOne
            </Typography>

            {isIOSSafari ? (
              <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '0.85rem' }}>
                Toque em <IosShareIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.3 }} /> →
                <AddBoxIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.3 }} />
                "Adicionar à Tela de Início"
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                Acesse mais rápido e use como um app nativo no seu {deviceText}!
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {!isIOSSafari && (
              <Button
                variant="contained"
                size="small"
                startIcon={<GetAppIcon />}
                onClick={handleInstall}
                sx={{
                  bgcolor: 'white',
                  color: '#8B6C42',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#FFF8E7',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                Instalar
              </Button>
            )}

            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
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
