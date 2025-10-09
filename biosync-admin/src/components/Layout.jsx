import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Toolbar, useTheme } from '@mui/material'
import Header from './Header'
import Sidebar from './Sidebar'

const DRAWER_WIDTH = 260

const Layout = () => {
  const theme = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        backgroundImage:
          'radial-gradient(circle at 15% 20%, rgba(15,41,22,0.12), transparent 42%), radial-gradient(circle at 85% 10%, rgba(71,179,107,0.16), transparent 45%)',
      }}
    >
      <Header onMenuClick={handleDrawerToggle} drawerWidth={DRAWER_WIDTH} />
      <Sidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        drawerWidth={DRAWER_WIDTH}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 3, md: 4 },
          pb: { xs: 4, md: 6 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(241,246,243,0.9) 40%, rgba(241,246,243,0.6) 100%)',
            zIndex: 0,
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1200px',
            mx: 'auto',
            width: '100%',
            mt: 4,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
