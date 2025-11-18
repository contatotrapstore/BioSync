import React from 'react';
import { Box, Typography, Skeleton, alpha } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { Card } from '../atoms/Card';

/**
 * StatsCard - Card de estatísticas aprimorado
 *
 * Features:
 * - Ícones MUI (não mais emojis)
 * - Trend indicator (↑ +15% ou ↓ -5%)
 * - Loading skeleton state
 * - Gradient background opcional
 * - Tamanhos responsivos
 * - Hover effects profissionais
 *
 * @param {Object} props
 * @param {string} props.title - Título do card
 * @param {string|number} props.value - Valor principal
 * @param {React.ReactNode} props.icon - Ícone MUI component
 * @param {string} props.color - Cor do tema: primary, secondary, success, error, info, warning
 * @param {number} props.trend - Percentual de mudança (ex: 15.5 ou -8.2)
 * @param {string} props.trendLabel - Label do trend (ex: "vs mês passado")
 * @param {boolean} props.loading - Mostrar skeleton
 * @param {boolean} props.gradient - Usar background gradient
 */
export function StatsCard({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  trendLabel = 'vs anterior',
  loading = false,
  gradient = false,
}) {
  // Mapeamento de cores
  const getColor = (theme) => {
    const colorMap = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      success: theme.palette.success.main,
      error: theme.palette.error.main,
      info: theme.palette.info.main,
      warning: theme.palette.warning.main,
    };
    return colorMap[color] || colorMap.primary;
  };

  // Trend positivo ou negativo
  const trendPositive = trend && trend > 0;
  const trendNegative = trend && trend < 0;

  if (loading) {
    return (
      <Card variant="elevated">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="circular" width={56} height={56} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={36} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      </Card>
    );
  }

  return (
    <Card
      variant="elevated"
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        borderLeft: `4px solid ${getColor(theme)}`,

        // Gradient background opcional
        ...(gradient && {
          background: `linear-gradient(135deg, ${alpha(getColor(theme), 0.08)} 0%, ${alpha(getColor(theme), 0.02)} 100%)`,
        }),

        // Hover effect
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Icon Circle */}
        <Box
          sx={(theme) => ({
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(getColor(theme), 0.1),
            color: getColor(theme),
            flexShrink: 0,
            '& > svg': {
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
            },
          })}
        >
          {icon}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 500,
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>

            {/* Trend Indicator */}
            {trend !== undefined && trend !== null && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  backgroundColor: trendPositive
                    ? alpha('#10B981', 0.1)
                    : trendNegative
                    ? alpha('#EF4444', 0.1)
                    : alpha('#6B7280', 0.1),
                }}
              >
                {trendPositive && (
                  <TrendingUp sx={{ fontSize: '1rem', color: '#10B981' }} />
                )}
                {trendNegative && (
                  <TrendingDown sx={{ fontSize: '1rem', color: '#EF4444' }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: trendPositive ? '#10B981' : trendNegative ? '#EF4444' : '#6B7280',
                    fontSize: '0.75rem',
                  }}
                >
                  {trendPositive ? '+' : ''}
                  {trend.toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>

          {/* Trend Label */}
          {trend !== undefined && trend !== null && trendLabel && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.6875rem',
                mt: 0.5,
                display: 'block',
              }}
            >
              {trendLabel}
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
}

export default StatsCard;
