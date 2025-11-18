import { Box, Typography, Button } from '@mui/material';
import {
  FolderOpen,
  Search,
  Error,
  Lock,
  Inbox,
  CloudOff,
} from '@mui/icons-material';

/**
 * EmptyState - Componente para estados vazios padronizados
 *
 * Variants:
 * - noData: Sem dados disponíveis
 * - noResults: Busca sem resultados
 * - error: Erro ao carregar
 * - noPermission: Sem permissão
 * - offline: Sem conexão
 * - custom: Personalizado
 *
 * @param {Object} props
 * @param {string} props.variant - Tipo de empty state (default: 'noData')
 * @param {string} props.title - Título customizado
 * @param {string} props.description - Descrição customizada
 * @param {React.ReactNode} props.icon - Ícone customizado
 * @param {string} props.actionLabel - Texto do botão de ação
 * @param {Function} props.onAction - Callback do botão de ação
 * @param {string} props.secondaryActionLabel - Texto do botão secundário
 * @param {Function} props.onSecondaryAction - Callback do botão secundário
 */
export default function EmptyState({
  variant = 'noData',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  // Configurações padrão por variant
  const variants = {
    noData: {
      icon: <FolderOpen sx={{ fontSize: 80 }} />,
      title: 'Nenhum dado encontrado',
      description: 'Ainda não há dados para exibir aqui.',
    },
    noResults: {
      icon: <Search sx={{ fontSize: 80 }} />,
      title: 'Nenhum resultado encontrado',
      description: 'Tente ajustar seus filtros ou termos de busca.',
    },
    error: {
      icon: <Error sx={{ fontSize: 80 }} />,
      title: 'Erro ao carregar',
      description: 'Ocorreu um erro ao tentar carregar os dados.',
    },
    noPermission: {
      icon: <Lock sx={{ fontSize: 80 }} />,
      title: 'Acesso negado',
      description: 'Você não tem permissão para acessar este recurso.',
    },
    offline: {
      icon: <CloudOff sx={{ fontSize: 80 }} />,
      title: 'Sem conexão',
      description: 'Verifique sua conexão com a internet e tente novamente.',
    },
    inbox: {
      icon: <Inbox sx={{ fontSize: 80 }} />,
      title: 'Nada por aqui ainda',
      description: 'Comece criando um novo item.',
    },
  };

  const config = variants[variant] || variants.noData;

  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: { xs: 6, sm: 8, md: 10 },
        px: 3,
        minHeight: 300,
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          color: 'text.disabled',
          mb: 3,
          opacity: 0.6,
          '& > svg': {
            fontSize: { xs: 60, sm: 80 },
          },
        }}
      >
        {displayIcon}
      </Box>

      {/* Title */}
      <Typography
        variant="h6"
        component="h3"
        fontWeight={600}
        color="text.primary"
        sx={{
          mb: 1,
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
        }}
      >
        {displayTitle}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 3,
          maxWidth: 400,
          fontSize: { xs: '0.875rem', sm: '1rem' },
        }}
      >
        {displayDescription}
      </Typography>

      {/* Actions */}
      {(onAction || onSecondaryAction) && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: 300, sm: 'none' },
          }}
        >
          {onSecondaryAction && secondaryActionLabel && (
            <Button
              variant="outlined"
              onClick={onSecondaryAction}
              sx={{
                minWidth: { sm: 120 },
              }}
            >
              {secondaryActionLabel}
            </Button>
          )}
          {onAction && actionLabel && (
            <Button
              variant="contained"
              onClick={onAction}
              sx={{
                minWidth: { sm: 120 },
              }}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
