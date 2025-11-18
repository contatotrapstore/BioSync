import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Person,
  Settings,
  Dashboard,
  Psychology,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useThemeMode } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../atoms/ThemeToggle';
import logoNeuroOnePreta from '../../assets/logo-neuroone.png';
import logoNeuroOneBranca from '../../assets/logo-neuroone-branca.png';

/**
 * AppHeader - Cabeçalho principal da aplicação
 *
 * Features:
 * - Logo com navegação para home
 * - Navegação role-based
 * - Theme toggle
 * - Avatar com dropdown do usuário
 * - Responsivo (mobile: hamburger menu)
 *
 * @param {Object} props
 * @param {Function} props.onMenuClick - Callback para abrir sidebar (opcional)
 * @param {boolean} props.showMenuButton - Mostrar botão de menu (default: false)
 */
export default function AppHeader({ onMenuClick, showMenuButton = false }) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Seleciona a logo baseada no tema
  const logoNeuroOne = mode === 'dark' ? logoNeuroOneBranca : logoNeuroOnePreta;

  // Navegação baseada na role
  const getHomeRoute = () => {
    if (!user) return '/login';
    if (user.user_role === 'direcao' || user.user_role === 'direção') return '/admin';
    if (user.user_role === 'professor') return '/teacher';
    if (user.user_role === 'aluno') return '/student';
    return '/';
  };

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleClose();
    // TODO: Implementar página de perfil
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleClose();
    if (user.user_role === 'aluno') {
      navigate('/student/settings');
    }
  };

  const handleLogout = async () => {
    handleClose();
    await signOut();
    navigate('/login');
  };

  const handleLogoClick = () => {
    navigate(getHomeRoute());
  };

  // Iniciais do usuário para avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Cor do avatar baseada na role
  const getRoleColor = () => {
    if (user.user_role === 'direcao' || user.user_role === 'direção') return theme.palette.error.main;
    if (user.user_role === 'professor') return theme.palette.primary.main;
    if (user.user_role === 'aluno') return theme.palette.info.main;
    return theme.palette.grey[500];
  };

  return (
    <AppBar
      position="sticky"
      elevation={2}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 56, sm: 64 },
            py: { xs: 0.5, sm: 1 },
          }}
        >
          {/* Menu Button (opcional, para sidebar) */}
          {showMenuButton && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open menu"
              onClick={onMenuClick}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo + Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              mr: { xs: 'auto', md: 4 },
            }}
            onClick={handleLogoClick}
          >
            <Box
              component="img"
              src={logoNeuroOne}
              alt="NeuroOne"
              sx={{
                height: { xs: 32, sm: 40 },
                width: 'auto',
              }}
            />
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar + Menu */}
          {user && (
            <>
              <IconButton
                onClick={handleAvatarClick}
                sx={{ ml: 1, p: 0.5 }}
                aria-label="user menu"
                aria-controls={open ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar
                  sx={{
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    bgcolor: getRoleColor(),
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 600,
                  }}
                  src={user.avatar_url}
                >
                  {getInitials(user.name)}
                </Avatar>
              </IconButton>

              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 8,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
              >
                {/* User Info */}
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: 'action.selected',
                      color: 'text.secondary',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      width: 'fit-content',
                    }}
                  >
                    {user.user_role}
                  </Typography>
                </Box>

                <Divider />

                {/* Menu Items */}
                {(user.user_role === 'professor' || user.user_role === 'aluno') && (
                  <MenuItem onClick={handleProfileClick}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Meu Perfil</ListItemText>
                  </MenuItem>
                )}

                {user.user_role === 'aluno' && (
                  <MenuItem onClick={handleSettingsClick}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Configurações</ListItemText>
                  </MenuItem>
                )}

                <Divider />

                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>
                    <Typography color="error">Sair</Typography>
                  </ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
