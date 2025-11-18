import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

/**
 * LoadingOverlay - Overlay de carregamento
 *
 * Variantes:
 * - fullscreen: Cobre toda a tela (usa Backdrop)
 * - section: Cobre apenas a seção parent (absoluto)
 * - inline: Componente inline sem overlay
 *
 * @param {Object} props
 * @param {boolean} props.open - Mostrar loading (default: true)
 * @param {string} props.variant - 'fullscreen' | 'section' | 'inline'
 * @param {string} props.message - Mensagem de loading
 * @param {number} props.size - Tamanho do spinner (default: 40)
 */
export default function LoadingOverlay({
  open = true,
  variant = 'section',
  message,
  size = 40,
}) {
  if (!open) return null;

  // Conteúdo do loading
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={size} thickness={4} />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  // Fullscreen variant (Backdrop)
  if (variant === 'fullscreen') {
    return (
      <Backdrop
        open={open}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
      >
        {content}
      </Backdrop>
    );
  }

  // Inline variant (no overlay)
  if (variant === 'inline') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        {content}
      </Box>
    );
  }

  // Section variant (absolute overlay)
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(2px)',
        zIndex: 10,
        borderRadius: 'inherit',
      }}
    >
      {content}
    </Box>
  );
}
