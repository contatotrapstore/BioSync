/**
 * Sistema de Protecao de Jogos
 * Garante que os jogos sejam iniciados apenas pelo launcher autenticado.
 */

const GAME_SESSION_KEY = 'biosync_game_session';
const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Gera um token de sessao temporario para abrir um jogo
 */
export const generateGameSessionToken = async (gameId, userId) => {
  const sessionData = {
    gameId,
    userId,
    timestamp: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
    nonce: crypto.randomUUID(),
  };

  localStorage.setItem(GAME_SESSION_KEY, JSON.stringify(sessionData));
  return sessionData;
};

/**
 * Valida um token de sessao salvo
 */
export const validateGameSession = (gameId) => {
  try {
    const sessionStr = localStorage.getItem(GAME_SESSION_KEY);

    if (!sessionStr) {
      throw new Error('Sessao nao encontrada. Abra o jogo pelo launcher.');
    }

    const session = JSON.parse(sessionStr);

    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(GAME_SESSION_KEY);
      throw new Error('Sessao expirada. Abra o jogo novamente pelo launcher.');
    }

    if (session.gameId !== gameId) {
      throw new Error('Token invalido para este jogo.');
    }

    return {
      valid: true,
      userId: session.userId,
      gameId: session.gameId,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

/**
 * Limpa o token de sessao apos o jogo ser carregado
 */
export const clearGameSession = () => {
  localStorage.removeItem(GAME_SESSION_KEY);
};

/**
 * Gera script que valida a origem do jogo dentro do HTML do game
 */
export const getProtectionScript = (gameId) => `
<script>
(function() {
  const GAME_ID = '${gameId}';
  const SESSION_KEY = 'biosync_game_session';

  const renderErrorScreen = (title, message, code) => {
    document.body.innerHTML =
      '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;text-align:center;padding:24px;">' +
      '<h1 style="margin-bottom:16px;">' + title + '</h1>' +
      '<p style="margin-bottom:12px;">' + message + '</p>' +
      '<p style="color:#888;font-size:12px;">Codigo: ' + code + '</p>' +
      '</div>';
  };

  window.addEventListener('DOMContentLoaded', () => {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) {
        renderErrorScreen('Acesso negado', 'Este jogo deve ser iniciado pelo biosync Launcher.', 'NO_SESSION');
        alert('Erro: este jogo deve ser iniciado pelo biosync Launcher.');
        return;
      }

      const session = JSON.parse(sessionStr);

      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        renderErrorScreen('Sessao expirada', 'Abra o jogo novamente pelo launcher para gerar uma nova sessao.', 'SESSION_EXPIRED');
        alert('Erro: sessao expirada. Abra o jogo novamente pelo launcher.');
        return;
      }

      if (session.gameId !== GAME_ID) {
        renderErrorScreen('Token invalido', 'Este jogo nao corresponde a sessao de acesso atual.', 'INVALID_GAME');
        alert('Erro: token invalido para este jogo.');
        return;
      }

      localStorage.removeItem(SESSION_KEY);
      console.log('[Launcher] Jogo autorizado pelo biosync Launcher');
    } catch (error) {
      console.error('Erro na validacao da sessao do jogo:', error);
      renderErrorScreen('Erro de validacao', 'Nao foi possivel validar o acesso ao jogo.', 'VALIDATION_ERROR');
      alert('Erro: falha na validacao do jogo.');
    }
  });

  if (window.opener || window.parent !== window) {
    renderErrorScreen('Acesso negado', 'Este jogo deve ser aberto diretamente pelo biosync Launcher.', 'INVALID_CONTEXT');
  }
})();
</script>
`;
