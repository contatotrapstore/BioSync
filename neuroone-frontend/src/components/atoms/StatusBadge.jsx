import { Chip } from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Cancel,
  Info,
} from '@mui/icons-material';

/**
 * StatusBadge - Badge de status colorido
 *
 * Status pré-definidos:
 * - success: Verde (concluído, ativo, sucesso)
 * - error: Vermelho (erro, falha, cancelado)
 * - warning: Amarelo/Laranja (atenção, pendente)
 * - info: Azul (informação, em andamento)
 * - default: Cinza (padrão, inativo)
 *
 * @param {Object} props
 * @param {string} props.status - 'success' | 'error' | 'warning' | 'info' | 'default'
 * @param {string} props.label - Texto do badge
 * @param {boolean} props.showIcon - Mostrar ícone (default: true)
 * @param {string} props.size - 'small' | 'medium'
 * @param {string} props.variant - 'filled' | 'outlined'
 */
export default function StatusBadge({
  status = 'default',
  label,
  showIcon = true,
  size = 'small',
  variant = 'filled',
}) {
  // Mapeamento de status para cor e ícone
  const statusConfig = {
    success: {
      color: 'success',
      icon: <CheckCircle />,
    },
    error: {
      color: 'error',
      icon: <Error />,
    },
    warning: {
      color: 'warning',
      icon: <Warning />,
    },
    info: {
      color: 'info',
      icon: <Schedule />,
    },
    cancelled: {
      color: 'default',
      icon: <Cancel />,
    },
    default: {
      color: 'default',
      icon: <Info />,
    },
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <Chip
      label={label}
      color={config.color}
      size={size}
      variant={variant}
      icon={showIcon ? config.icon : undefined}
      sx={{
        fontWeight: 500,
        borderRadius: 1.5,
        ...(variant === 'outlined' && {
          borderWidth: 1.5,
        }),
      }}
    />
  );
}
