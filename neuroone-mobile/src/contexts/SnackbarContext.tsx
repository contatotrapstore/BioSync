import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import errorHandler, { type ErrorContext } from '@services/errorHandler';

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: AlertColor) => void;
  showError: (message: string | any, context?: ErrorContext) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  handleError: (error: any, context?: ErrorContext) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showSnackbar = (msg: string, sev: AlertColor = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const showError = (msg: string | any, context?: ErrorContext) => {
    // Se receber um erro (objeto), processar com errorHandler
    if (typeof msg === 'object' && msg !== null) {
      const userMessage = errorHandler.getUserMessage(msg);
      errorHandler.handleError(msg, context);
      showSnackbar(userMessage, 'error');
    } else {
      // String simples
      showSnackbar(msg, 'error');
    }
  };

  const handleError = (error: any, context?: ErrorContext) => {
    const userMessage = errorHandler.getUserMessage(error);
    errorHandler.handleError(error, context);
    showSnackbar(userMessage, 'error');
  };

  const showSuccess = (msg: string) => showSnackbar(msg, 'success');
  const showWarning = (msg: string) => showSnackbar(msg, 'warning');
  const showInfo = (msg: string) => showSnackbar(msg, 'info');

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        handleError
      }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export default SnackbarProvider;
