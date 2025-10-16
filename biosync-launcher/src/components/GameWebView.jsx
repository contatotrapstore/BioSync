import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, IconButton, Tooltip, Alert, Typography, Fade } from '@mui/material';
import { Close, Fullscreen, FullscreenExit } from '@mui/icons-material';

function GameWebView({ gamePath, onExit }) {
  const webviewRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);
  const [showEscHint, setShowEscHint] = useState(false);
  const mouseTimerRef = useRef(null);

  const applyViewportFixes = useCallback((webview) => {
    if (!webview) {
      return;
    }

    try {
      if (typeof webview.setZoomFactor === 'function') {
        webview.setZoomFactor(1);
      }
    } catch (zoomError) {
      console.warn('[GameWebView] Failed to set zoom factor:', zoomError);
    }

    const injectedCss = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
        background: #000 !important;
      }

      canvas, iframe, object, embed,
      #gameContainer, #game-container, #unityContainer,
      #canvas, #game, #wrapper {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
      }
    `;

    const viewportScript = `
      (() => {
        const ensureMetaViewport = () => {
          if (!document.querySelector('meta[name="viewport"]')) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
            document.head.appendChild(meta);
          }
        };

        const stretch = () => {
          document.documentElement.style.width = '100%';
          document.documentElement.style.height = '100%';
          document.body.style.width = '100%';
          document.body.style.height = '100%';
          document.body.style.margin = '0';
          document.body.style.padding = '0';
        };

        const expandTargets = () => {
          const nodes = document.querySelectorAll('canvas, #game, #unityContainer, #canvas, #gameContainer');
          nodes.forEach((node) => {
            node.style.width = '100%';
            node.style.height = '100%';
            node.style.maxWidth = 'none';
            node.style.maxHeight = 'none';
          });
        };

        // Listener SUPER AGRESSIVO para ESC dentro do jogo
        // Múltiplos níveis de captura para garantir que funcione
        const escapeHandler = (e) => {
          if (e.key === 'Escape' || e.keyCode === 27) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('[Game] ESC captured in game, but will be handled by main process');
            return false;
          }
        };

        // Capturar em TODOS os níveis possíveis
        document.addEventListener('keydown', escapeHandler, true); // Capture phase
        document.addEventListener('keydown', escapeHandler, false); // Bubble phase
        window.addEventListener('keydown', escapeHandler, true); // Window level

        // Também capturar keyup para prevenir ações
        document.addEventListener('keyup', escapeHandler, true);
        window.addEventListener('keyup', escapeHandler, true);

        ensureMetaViewport();
        stretch();
        expandTargets();

        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(() => {
            stretch();
            expandTargets();
          });
          observer.observe(document.body);
        }
      })();
    `;

    if (typeof webview.insertCSS === 'function') {
      webview.insertCSS(injectedCss).catch(() => {});
    }

    if (typeof webview.executeJavaScript === 'function') {
      webview.executeJavaScript(viewportScript, false).catch(() => {});
    }
  }, []);
  // Mouse movement handler for auto-hide overlay in fullscreen
  const handleMouseMove = useCallback(() => {
    if (isFullscreen) {
      setShowOverlay(true);

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }

      mouseTimerRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, 3000);
    }
  }, [isFullscreen]);

  // Notificar main process sobre estado do jogo
  useEffect(() => {
    // Notificar que jogo iniciou
    window.electronAPI.game.notifyStarted();
    console.log('[GameWebView] Notified main process: game started');

    // Registrar listener para force exit
    const handleForceExit = () => {
      console.log('[GameWebView] Received force exit signal from main process');
      onExit();
    };

    const unsubscribeForceExit = window.electronAPI.game.onForceExit(handleForceExit);

    return () => {
      // Cleanup ao desmontar
      window.electronAPI.game.notifyStopped();
      console.log('[GameWebView] Notified main process: game stopped');
      unsubscribeForceExit();
    };
  }, [onExit]);

  useEffect(() => {
    const webview = webviewRef.current;

    if (!webview) {
      return undefined;
    }

    const handleFailLoad = (event) => {
      console.error('Webview failed to load:', event);
      setError(`Failed to load game: ${event.errorDescription}`);
    };

    const handleStartLoading = () => {
      setError('');
    };

    const handleConsoleMessage = (event) => {
      console.log(`Game console [${event.level}]:`, event.message);
    };

    const handleDomReady = () => {
      applyViewportFixes(webview);
    };

    const handleKeyDown = (event) => {
      // ESC para sair do jogo - capturado em TODOS os níveis
      if (event.key === 'Escape' || event.keyCode === 27) {
        event.preventDefault();
        event.stopPropagation();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        handleExit();
      }
      // F11 para toggle fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        handleFullscreenToggle();
      }
    };

    webview.addEventListener('did-fail-load', handleFailLoad);
    webview.addEventListener('did-start-loading', handleStartLoading);
    webview.addEventListener('console-message', handleConsoleMessage);
    webview.addEventListener('dom-ready', handleDomReady);

    // Adicionar listener em window com capture=true para garantir captura antes do webview
    window.addEventListener('keydown', handleKeyDown, true);

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      // Mostrar hint de ESC ao entrar em fullscreen
      if (isNowFullscreen) {
        setShowEscHint(true);
        setTimeout(() => setShowEscHint(false), 4000);
        setShowOverlay(true);

        // Iniciar timer de auto-hide
        if (mouseTimerRef.current) {
          clearTimeout(mouseTimerRef.current);
        }
        mouseTimerRef.current = setTimeout(() => {
          setShowOverlay(false);
        }, 3000);
      } else {
        setShowOverlay(true);
        if (mouseTimerRef.current) {
          clearTimeout(mouseTimerRef.current);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      webview.removeEventListener('did-fail-load', handleFailLoad);
      webview.removeEventListener('did-start-loading', handleStartLoading);
      webview.removeEventListener('console-message', handleConsoleMessage);
      webview.removeEventListener('dom-ready', handleDomReady);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }
    };
  }, [applyViewportFixes, gamePath, isFullscreen, handleMouseMove]);


  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      webviewRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onExit();
  };

  return (
    <Box
      onMouseMove={handleMouseMove}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        bgcolor: 'black',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Botão de emergência SEMPRE visível */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 2147483647,
          display: 'flex',
          gap: 1
        }}
      >
        <Tooltip title="Sair do Jogo (ESC)">
          <IconButton
            onClick={handleExit}
            sx={{
              color: 'white',
              bgcolor: 'rgba(220,38,38,0.95)',
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: 'rgba(220,38,38,1)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            <Close sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title={isFullscreen ? 'Sair Fullscreen (F11)' : 'Fullscreen (F11)'}>
          <IconButton
            onClick={handleFullscreenToggle}
            sx={{
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.95)',
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,1)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            {isFullscreen ? <FullscreenExit sx={{ fontSize: 24 }} /> : <Fullscreen sx={{ fontSize: 24 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ESC Hint - aparece ao entrar em fullscreen */}
      <Fade in={showEscHint} timeout={500}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2147483646,
            bgcolor: 'rgba(0,0,0,0.9)',
            color: 'white',
            px: 3,
            py: 2,
            borderRadius: 2,
            border: '2px solid rgba(255,255,255,0.3)',
            pointerEvents: 'none'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
            Pressione ESC para sair • F11 para fullscreen
          </Typography>
        </Box>
      </Fade>


      {/* Error message */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            width: '80%',
            maxWidth: 600
          }}
        >
          <Alert severity="error" onClose={handleExit}>
            {error}
          </Alert>
        </Box>
      )}

      {/* WebView for game - usando display inline-flex conforme docs Electron */}
      <webview
        ref={webviewRef}
        src={gamePath}
        style={{
          display: error ? 'none' : 'inline-flex',
          width: '100%',
          height: '100%',
          border: 'none',
          flex: 1
        }}
        webpreferences="contextIsolation=yes, autoplayPolicy=no-user-gesture-required, nodeIntegration=no"
      />
    </Box>
  );
}

export default GameWebView;

