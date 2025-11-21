import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Collapse,
  Alert,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

/**
 * Error Fallback Component
 * User-friendly error screen shown when ErrorBoundary catches an error
 */
const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleReload = () => {
    // Full page reload
    window.location.reload();
  };

  const handleGoHome = () => {
    // Navigate to home
    window.location.href = '/';
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Error Icon */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ErrorIcon sx={{ fontSize: 48, color: 'error.dark' }} />
            </Box>
          </Box>

          {/* Title */}
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Ops! Algo deu errado
          </Typography>

          {/* Description */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Um erro inesperado ocorreu na aplicação. Tente recarregar a página ou voltar para a página inicial.
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleReload}
              size="large"
            >
              Recarregar Página
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleGoHome}
              size="large"
            >
              Ir para Início
            </Button>
          </Box>

          {/* Show/Hide Details Button */}
          {(error || errorInfo) && (
            <>
              <Button
                variant="text"
                size="small"
                endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowDetails(!showDetails)}
                sx={{ mb: 2 }}
              >
                {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes Técnicos
              </Button>

              {/* Error Details (Collapsed) */}
              <Collapse in={showDetails}>
                <Alert severity="error" sx={{ textAlign: 'left', mt: 2 }}>
                  {error && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Erro:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                        }}
                      >
                        {error.toString()}
                      </Typography>
                    </Box>
                  )}

                  {errorInfo && errorInfo.componentStack && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Stack Trace:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          maxHeight: 300,
                          overflow: 'auto',
                        }}
                      >
                        {errorInfo.componentStack}
                      </Typography>
                    </Box>
                  )}
                </Alert>

                {/* Help Text */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  💡 Se o erro persistir, entre em contato com o suporte técnico com os detalhes acima.
                </Typography>
              </Collapse>
            </>
          )}
        </Paper>

        {/* Footer Note */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
          NeuroOne - Sistema de Neurofeedback
        </Typography>
      </Box>
    </Container>
  );
};

export default ErrorFallback;
