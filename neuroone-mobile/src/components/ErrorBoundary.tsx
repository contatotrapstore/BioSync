import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';
import errorHandler from '@services/errorHandler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar erros em toda a aplicação
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);

    // Log com errorHandler
    errorHandler.handleError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      extra: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
            Ops! Algo deu errado
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </Typography>

          {this.state.error && (
            <Typography
              variant="body2"
              sx={{
                mb: 4,
                p: 2,
                bgcolor: 'error.light',
                color: 'error.contrastText',
                borderRadius: 1,
                fontFamily: 'monospace',
                maxWidth: 600,
                overflow: 'auto'
              }}
            >
              {this.state.error.message}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={this.handleReset}>
              Tentar Novamente
            </Button>
            <Button variant="outlined" onClick={this.handleReload}>
              Recarregar Aplicativo
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
