import { Box, Container, Typography, Breadcrumbs, Link, useTheme, useMediaQuery } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import AppHeader from './AppHeader';

/**
 * DashboardLayout - Layout específico para dashboards
 *
 * Features:
 * - AppHeader fixo
 * - Breadcrumbs navegação
 * - Page header com título e ações
 * - Container responsivo
 * - Espaçamento otimizado
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo da página
 * @param {string} props.title - Título da página
 * @param {string} props.subtitle - Subtítulo opcional
 * @param {React.ReactNode} props.actions - Botões de ação no header
 * @param {Array} props.breadcrumbs - Array de breadcrumbs [{label, path}]
 * @param {string} props.maxWidth - Max width do container (default: 'xl')
 * @param {boolean} props.disableGutters - Remove padding lateral
 */
export default function DashboardLayout({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs = [],
  maxWidth = 'xl',
  disableGutters = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      <AppHeader />

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
          disableGutters={disableGutters}
          sx={{
            flexGrow: 1,
            py: { xs: 2, sm: 3, md: 4 },
            px: disableGutters ? 0 : { xs: 2, sm: 3 },
          }}
        >
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && !isMobile && (
            <Breadcrumbs
              separator={<NavigateNext fontSize="small" />}
              aria-label="breadcrumb"
              sx={{
                mb: 2,
                '& .MuiBreadcrumbs-separator': {
                  mx: 0.5,
                },
              }}
            >
              <Link
                component={RouterLink}
                to="/"
                underline="hover"
                color="inherit"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                <Home fontSize="small" />
                Início
              </Link>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return isLast ? (
                  <Typography
                    key={index}
                    color="text.primary"
                    fontSize="0.875rem"
                    fontWeight={500}
                  >
                    {crumb.label}
                  </Typography>
                ) : (
                  <Link
                    key={index}
                    component={RouterLink}
                    to={crumb.path}
                    underline="hover"
                    color="inherit"
                    sx={{
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {crumb.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}

          {/* Page Header */}
          {(title || actions) && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                mb: 3,
              }}
            >
              {/* Title Section */}
              {title && (
                <Box>
                  <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      color: 'text.primary',
                      mb: subtitle ? 0.5 : 0,
                    }}
                  >
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Actions Section */}
              {actions && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  {actions}
                </Box>
              )}
            </Box>
          )}

          {/* Page Content */}
          <Box sx={{ flexGrow: 1 }}>{children}</Box>
        </Container>
      </Box>

      {/* Optional Footer */}
      {/* <Box
        component="footer"
        sx={{
          py: 2,
          px: 3,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth={maxWidth}>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 NeuroOne. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box> */}
    </Box>
  );
}
