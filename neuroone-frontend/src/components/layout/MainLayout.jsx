import { Box, Container } from '@mui/material';
import AppHeader from './AppHeader';

/**
 * MainLayout - Layout principal da aplicação
 *
 * Features:
 * - AppHeader fixo no topo
 * - Container responsivo para conteúdo
 * - Padding e spacing adequados
 * - Scroll automático no conteúdo
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo da página
 * @param {string} props.maxWidth - Max width do container (default: 'lg')
 * @param {boolean} props.disablePadding - Remove padding do container
 * @param {boolean} props.showHeader - Mostrar header (default: true)
 */
export default function MainLayout({
  children,
  maxWidth = 'lg',
  disablePadding = false,
  showHeader = true,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* Header */}
      {showHeader && <AppHeader />}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container
          maxWidth={maxWidth}
          sx={{
            flexGrow: 1,
            py: disablePadding ? 0 : { xs: 2, sm: 3, md: 4 },
            px: disablePadding ? 0 : { xs: 2, sm: 3 },
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
