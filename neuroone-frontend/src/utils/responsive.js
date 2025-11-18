import { useTheme, useMediaQuery } from '@mui/material';

/**
 * Hook personalizado para responsividade
 *
 * Retorna booleans para cada breakpoint
 * Facilita a lógica condicional de renderização
 *
 * @returns {Object} - { isMobile, isTablet, isDesktop, isLarge }
 *
 * @example
 * const { isMobile, isDesktop } = useResponsive();
 *
 * if (isMobile) {
 *   return <MobileView />;
 * }
 * return <DesktopView />;
 */
export function useResponsive() {
  const theme = useTheme();

  // Breakpoints MUI padrão:
  // xs: 0px
  // sm: 600px
  // md: 900px
  // lg: 1200px
  // xl: 1536px

  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-899px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 900px
  const isLarge = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px
  const isXLarge = useMediaQuery(theme.breakpoints.up('xl')); // >= 1536px

  // Helpers específicos
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // < 900px
  const isMediumUp = useMediaQuery(theme.breakpoints.up('sm')); // >= 600px

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    isXLarge,
    isSmallScreen,
    isMediumUp,
    // Aliases
    xs: isMobile,
    sm: isTablet,
    md: isDesktop,
    lg: isLarge,
    xl: isXLarge,
  };
}

/**
 * Helper para colunas responsivas em Grid
 *
 * @param {Object} config - Configuração de colunas por breakpoint
 * @returns {Object} - Props do Grid item
 *
 * @example
 * <Grid item {...gridColumns({ xs: 12, sm: 6, md: 4, lg: 3 })}>
 *   <Card />
 * </Grid>
 */
export function gridColumns(config) {
  return {
    xs: config.xs || 12,
    sm: config.sm || config.xs || 12,
    md: config.md || config.sm || config.xs || 12,
    lg: config.lg || config.md || config.sm || config.xs || 12,
    xl: config.xl || config.lg || config.md || config.sm || config.xs || 12,
  };
}

/**
 * Helper para spacing responsivo
 *
 * @param {Object} config - Spacing por breakpoint
 * @returns {Object} - Spacing responsivo para sx
 *
 * @example
 * <Box sx={{ p: responsiveSpacing({ xs: 2, md: 4 }) }}>
 */
export function responsiveSpacing(config) {
  return {
    xs: config.xs || config.base || 2,
    sm: config.sm || config.xs || config.base || 2,
    md: config.md || config.sm || config.xs || config.base || 2,
    lg: config.lg || config.md || config.sm || config.xs || config.base || 2,
    xl: config.xl || config.lg || config.md || config.sm || config.xs || config.base || 2,
  };
}
