import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Collapse,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { authService } from '@services/auth';

/**
 * Alert de assinatura próxima de expirar
 * Aparece quando faltam menos de 7 dias para expirar
 */

interface PaymentAlertProps {
  onDismiss?: () => void;
}

export const PaymentAlert: React.FC<PaymentAlertProps> = ({ onDismiss }) => {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        setShow(false);
        return;
      }

      setHasActiveSubscription(Boolean(user.hasActiveSubscription));

      if (!user.subscriptionExpiresAt) {
        setShow(false);
        return;
      }

      // Verificar se foi dismissado recentemente (localStorage)
      const dismissedUntil = localStorage.getItem('payment_alert_dismissed');
      if (dismissedUntil) {
        const dismissedDate = new Date(dismissedUntil);
        if (dismissedDate > new Date()) {
          setShow(false);
          return;
        }
      }

      const endDate = new Date(user.subscriptionExpiresAt);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setSubscriptionEndDate(endDate);
      setDaysRemaining(diffDays);

      // Mostrar alert se:
      // - Faltam 7 dias ou menos
      // - Ou já expirou (dias negativos)
      setShow(true);
    } catch (error) {
      console.error('[PaymentAlert] Error checking subscription:', error);
      setShow(false);
    }
  }, []); // Empty dependencies - function doesn't depend on any props or state

  useEffect(() => {
    checkSubscriptionStatus();

    // Verificar a cada hora
    const interval = setInterval(checkSubscriptionStatus, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkSubscriptionStatus]);

  const handleDismiss = () => {
    // Dismissar por 24 horas
    const dismissUntil = new Date();
    dismissUntil.setHours(dismissUntil.getHours() + 24);
    localStorage.setItem('payment_alert_dismissed', dismissUntil.toISOString());

    setShow(false);
    onDismiss?.();
  };

  const handleRenew = () => {
    navigate('/renew-payment');
  };

  const status = (() => {
    if (!hasActiveSubscription || daysRemaining <= 0) return 'expired';
    if (daysRemaining <= 3) return 'critical';
    if (daysRemaining <= 7) return 'warning';
    return 'active';
  })();

  if (!show && status !== 'active') return null;

  const primaryColor = '#FFD913';
  const formattedEndDate = subscriptionEndDate?.toLocaleDateString('pt-BR') ?? 'data não disponível';

  const paletteByStatus: Record<string, { border: string; background: string; accent: string; title: string; description: string; icon: React.ReactNode }> = {
    expired: {
      border: 'rgba(255, 80, 115, 0.45)',
      background: 'linear-gradient(140deg, rgba(255,80,115,0.18) 0%, rgba(12,13,22,0.9) 80%)',
      accent: '#FF5073',
      title: 'Sua assinatura expirou',
      description: `Renove agora para continuar com acesso completo. Expirou em ${formattedEndDate}.`,
      icon: <WarningIcon sx={{ color: '#FF7A93' }} />
    },
    critical: {
      border: 'rgba(255,160,67,0.45)',
      background: 'linear-gradient(140deg, rgba(255,160,67,0.2) 0%, rgba(12,13,22,0.9) 80%)',
      accent: '#FFAE4D',
      title: `Sua assinatura expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
      description: `Renove para continuar após ${formattedEndDate}.`,
      icon: <WarningIcon sx={{ color: '#FFAE4D' }} />
    },
    warning: {
      border: 'rgba(255,217,19,0.45)',
      background: 'linear-gradient(140deg, rgba(255,217,19,0.18) 0%, rgba(12,13,22,0.9) 80%)',
      accent: primaryColor,
      title: `Assinatura ativa por ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
      description: `Garanta a continuidade após ${formattedEndDate}.`,
      icon: <WarningIcon sx={{ color: primaryColor }} />
    },
    active: {
      border: 'rgba(102,230,185,0.35)',
      background: 'linear-gradient(140deg, rgba(102,230,185,0.18) 0%, rgba(12,13,22,0.9) 80%)',
      accent: '#66E6B9',
      title: 'Assinatura ativa',
      description: `Seu acesso está garantido até ${formattedEndDate}.`,
      icon: <CheckCircleIcon sx={{ color: '#66E6B9' }} />
    }
  };
  const current = paletteByStatus[status];

  return (
    <Collapse in={show}>
      <Box
        sx={{
          mb: 3,
          borderRadius: 4,
          border: `1px solid ${current.border}`,
          background: current.background,
          px: 3,
          py: 2.5,
          position: 'relative',
          boxShadow: '0 18px 35px rgba(0,0,0,0.25)'
        }}
      >
        <Stack direction="row" spacing={2.5} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              minWidth: 44,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.18)'
            }}
          >
            {current.icon}
          </Box>

          <Stack spacing={1} flex={1} pr={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: current.accent }}>
              {current.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {current.description}
            </Typography>

            {status !== 'active' && daysRemaining > 0 && (
              <Box sx={{ mt: 1, position: 'relative', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${((7 - Math.min(daysRemaining, 7)) / 7) * 100}%`,
                    background: current.accent,
                    transition: 'width 0.4s ease'
                  }}
                />
              </Box>
            )}
          </Stack>

          <Stack spacing={1} alignItems="flex-end">
            {status !== 'active' && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleRenew}
                sx={{
                  borderColor: current.accent,
                  color: current.accent,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: current.accent,
                    backgroundColor: 'rgba(255,255,255,0.05)'
                  }
                }}
              >
                Renovar agora
              </Button>
            )}
            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </Collapse>
  );
};

export default PaymentAlert;
