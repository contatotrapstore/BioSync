import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { Close as CloseIcon, Fullscreen as FullscreenIcon } from '@mui/icons-material';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { Game } from '@/types';
import { filesystem } from '@cap/filesystem';
import { useNavigate } from 'react-router-dom';

/**
 * GameWebView - Componente para renderizar jogos HTML5
 *
 * CRÍTICO: Este componente usa iframe para carregar jogos locais
 * - Carrega arquivos do Capacitor Filesystem
 * - Fullscreen nativo
 * - Controles overlay
 * - Touch events
 * - Back button handling
 */

export interface GameWebViewProps {
  game: Game;
  onExit?: () => void;
}

export const GameWebView: React.FC<GameWebViewProps> = ({ game, onExit }) => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const backButtonListenerRef = useRef<PluginListenerHandle | null>(null);
  const [gameUri, setGameUri] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const title = game.title || game.name || 'Jogo';

  useEffect(() => {
    loadGame();
    setupBackButton();
    hideStatusBar();

    return () => {
      showStatusBar();
      removeBackButton();
    };
  }, [game.id]);

  // Auto-hide controls após 3s
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  const loadGame = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[GameWebView] Loading game: ${game.id}`);

      // Obter URI do jogo instalado
      const gameFolderPath = (game as any).folder_path || game.id;
      const uri = await filesystem.getGameUri(gameFolderPath, 'index.html');

      console.log(`[GameWebView] Game URI: ${uri}`);

      const normalizedUri = Capacitor.convertFileSrc(uri);

      setGameUri(normalizedUri);
    } catch (err: any) {
      console.error('[GameWebView] Error loading game:', err);
      setError('Erro ao carregar jogo. Verifique se está instalado.');
    } finally {
      setLoading(false);
    }
  };

  const setupBackButton = async () => {
    // Capturar back button do Android - armazenar listener específico
    backButtonListenerRef.current = await CapacitorApp.addListener('backButton', handleBackButton);
    console.log('[GameWebView] Back button listener registered');
  };

  const removeBackButton = () => {
    // Remover apenas o listener deste componente
    if (backButtonListenerRef.current) {
      backButtonListenerRef.current.remove();
      backButtonListenerRef.current = null;
      console.log('[GameWebView] Back button listener removed');
    }
  };

  const handleBackButton = (event: any) => {
    // Confirmar saída do jogo
    event.detail.register(10, () => {
      setShowControls(true);
      setExitDialogOpen(true);
    });
  };

  const hideStatusBar = async () => {
    try {
      await StatusBar.hide();
    } catch (error) {
      console.warn('[GameWebView] Could not hide status bar:', error);
    }
  };

  const showStatusBar = async () => {
    try {
      await StatusBar.show();
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (error) {
      console.warn('[GameWebView] Could not show status bar:', error);
    }
  };

  const exitGame = () => {
    if (onExit) {
      onExit();
    } else {
      navigate(-1);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await iframeRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('[GameWebView] Fullscreen error:', error);
    }
  };

  const handleIframeLoad = () => {
    console.log('[GameWebView] Game loaded successfully');
    setLoading(false);

    // Tentar injetar touch handler se necessário
    try {
      injectTouchHandler();
    } catch (error) {
      console.warn('[GameWebView] Could not inject touch handler:', error);
    }
  };

  const handleIframeError = () => {
    console.error('[GameWebView] Iframe load error');
    setError('Erro ao carregar jogo');
    setLoading(false);
  };

  const injectTouchHandler = () => {
    // Injetar script para converter touch events em mouse events
    // para jogos que usam apenas mouse
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      // Tentar acessar contentDocument (pode falhar por CORS)
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        console.warn('[GameWebView] Cannot access iframe document (CORS)');
        return;
      }

      // Criar elemento script
      const scriptElement = doc.createElement('script');
      scriptElement.textContent = `
        (function() {
          console.log('[TouchHandler] Initializing touch-to-mouse conversion');
          let lastTouch = null;

          document.addEventListener('touchstart', function(e) {
            lastTouch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: lastTouch.clientX,
              clientY: lastTouch.clientY,
              bubbles: true
            });
            e.target.dispatchEvent(mouseEvent);
          }, { passive: false });

          document.addEventListener('touchmove', function(e) {
            if (!lastTouch) return;
            lastTouch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
              clientX: lastTouch.clientX,
              clientY: lastTouch.clientY,
              bubbles: true
            });
            e.target.dispatchEvent(mouseEvent);
          }, { passive: false });

          document.addEventListener('touchend', function(e) {
            if (!lastTouch) return;
            const mouseEvent = new MouseEvent('mouseup', {
              clientX: lastTouch.clientX,
              clientY: lastTouch.clientY,
              bubbles: true
            });
            e.target.dispatchEvent(mouseEvent);
            lastTouch = null;
          }, { passive: false });

          console.log('[TouchHandler] Touch-to-mouse conversion active');
        })();
      `;

      // Adicionar script ao document
      doc.head.appendChild(scriptElement);
      console.log('[GameWebView] Touch handler injected successfully');
    } catch (error) {
      console.warn('[GameWebView] Could not inject touch handler (CORS or security restriction):', error);
      // Não é crítico - muitos jogos HTML5 já suportam touch nativamente
    }
  };

  const handleContainerTap = () => {
    setShowControls((prev) => !prev);
  };

  const handleExitConfirm = () => {
    setExitDialogOpen(false);
    exitGame();
  };

  const handleExitCancel = () => {
    setExitDialogOpen(false);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
      onClick={handleContainerTap}
    >
      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(10,13,26,0.95)',
            zIndex: 10
          }}
        >
          <Box textAlign="center">
            <CircularProgress size={48} />
            <Box sx={{ mt: 2, color: 'primary.main', fontSize: '0.9rem' }}>
              Carregando {title}...
            </Box>
          </Box>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(10,13,26,0.95)',
            zIndex: 10,
            p: 3
          }}
        >
          <Alert severity="error" onClose={exitGame}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Game Iframe */}
      {gameUri && (
        <iframe
          ref={iframeRef}
          src={gameUri}
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="accelerometer; gyroscope; fullscreen"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000'
          }}
        />
      )}

      {/* Overlay Controls */}
      {showControls && !loading && !error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            p: 1,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 5
          }}
        >
          <Box sx={{ color: '#fff', pl: 1, fontSize: '0.9rem', fontWeight: 600 }}>
            {title}
          </Box>

          <Box>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              sx={{ color: '#fff' }}
            >
              <FullscreenIcon />
            </IconButton>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                exitGame();
              }}
              sx={{ color: '#fff' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Tap to show controls hint */}
      {!showControls && !loading && !error && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: '#fff',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.75rem',
            opacity: 0.6,
            pointerEvents: 'none'
          }}
        >
          Toque para mostrar controles
        </Box>
      )}

      <Dialog
        open={exitDialogOpen}
        onClose={handleExitCancel}
        aria-labelledby="exit-game-dialog-title"
      >
        <DialogTitle id="exit-game-dialog-title">Sair do jogo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ao sair, você voltará para os detalhes do jogo. Deseja continuar jogando?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExitCancel} color="primary">
            Continuar jogando
          </Button>
          <Button onClick={handleExitConfirm} color="error" variant="contained">
            Sair
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameWebView;
