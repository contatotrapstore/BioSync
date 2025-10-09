import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  ArrowBack,
  Refresh,
  MoreVert,
} from '@mui/icons-material';
import { getStoredUser } from '../services/storage';
import { logout } from '../utils/auth';
import logoUrl from '../assets/logo-azul.png';

const NAV_LINKS = [
  { label: 'BIBLIOTECA', path: '/library', disabled: false }
  // Loja, Comunidade e Configurações removidos
];

function Header({ onLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [navAnchorEl, setNavAnchorEl] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await getStoredUser();
    setUser(userData);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    onLogout();
    navigate('/login');
  };

  const handleBackToLibrary = () => {
    navigate('/library');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleNavClick = (link) => {
    if (link.disabled) return;
    navigate(link.path);
    setNavAnchorEl(null);
  };

  const isGamePage = location.pathname.startsWith('/game/');

  const gradient = theme.palette?.gradient?.primary || 'linear-gradient(120deg, #0a1d14 0%, #103822 45%, #1f8a4c 100%)';

  const isActivePath = (link) => {
    if (link.path === '/library') {
      return location.pathname === '/' || location.pathname.startsWith('/library');
    }
    return location.pathname.startsWith(link.path);
  };

  return (
    <AppBar position="static" sx={{ backgroundImage: gradient, borderBottom: '1px solid rgba(71,179,107,0.25)' }}>
      <Toolbar sx={{ minHeight: 68, px: { xs: 2, md: 4 }, display: 'flex', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src={logoUrl}
            alt="BioSync Logo"
            sx={{ height: 40, width: 'auto' }}
          />
        </Box>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            flexGrow: 1,
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = isActivePath(link);
            return (
              <Button
                key={link.label}
                color="inherit"
                size="small"
                disabled={link.disabled}
                onClick={() => handleNavClick(link)}
                sx={{
                  opacity: link.disabled ? 0.35 : 0.92,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  borderRadius: 10,
                  px: 2.6,
                  backgroundColor: active ? alpha('#ffffff', 0.16) : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha('#ffffff', 0.18)
                  }
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1 }}>
          <IconButton color="inherit" onClick={(event) => setNavAnchorEl(event.currentTarget)}>
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={navAnchorEl}
            open={Boolean(navAnchorEl)}
            onClose={() => setNavAnchorEl(null)}
          >
            {NAV_LINKS.map((link) => (
              <MenuItem
                key={link.label}
                disabled={link.disabled}
                selected={isActivePath(link)}
                onClick={() => handleNavClick(link)}
              >
                {link.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isGamePage ? (
            <Button
              color="inherit"
              startIcon={<ArrowBack />}
              onClick={handleBackToLibrary}
              sx={{
                borderRadius: 999,
                backgroundColor: alpha('#ffffff', 0.12),
                '&:hover': { backgroundColor: alpha('#ffffff', 0.2) }
              }}
            >
              Biblioteca
            </Button>
          ) : (
            <IconButton color="inherit" onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          )}

          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.name || user?.email || 'Jogador'}
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen} aria-label="account menu">
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: alpha('#ffffff', 0.22),
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.22)'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <AccountCircle />}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              border: '1px solid rgba(55,126,86,0.25)'
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" noWrap>
              {user?.name || 'Jogador'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || ''}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: alpha('#ffffff', 0.08) }} />
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1, fontSize: 20 }} />
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
