import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout as LogoutIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material'
import { getUser, clearAuth } from '../utils/auth'
import { AuthContext } from '../contexts/AuthContext'

const Header = ({ onMenuClick, drawerWidth }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, setUser } = useContext(AuthContext)
  const currentUser = user || getUser()

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    navigate('/login')
  }

  const gradient =
    theme.palette?.gradient?.primary ||
    'linear-gradient(135deg, #1c1400 0%, #d4a100 55%, #ffd913 100%)'

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundImage: gradient,
        color: 'common.white',
        borderBottom: 'none',
        boxShadow: 'none'
      }}
    >
      <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 4 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
          <img src="/logo-neuroone.png" alt="NeuroOne" style={{ height: 42, display: 'block' }} />
          <Box sx={{ lineHeight: 1.2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              NeuroOne Admin
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: alpha('#ffffff', 0.8), letterSpacing: '0.04em' }}
            >
              Controle total da plataforma educacional
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Ajuda">
            <IconButton size="small" color="inherit">
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>
            {currentUser?.email || 'Admin'}
          </Typography>
          <IconButton size="large" onClick={handleMenu} sx={{ p: 0 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                borderRadius: 0,
                bgcolor: alpha('#ffffff', 0.2),
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)'
              }}
            >
              {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          onClick={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              borderRadius: 0
            }
          }}
        >
          <MenuItem disabled>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            {currentUser?.email || 'Admin'}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Header
