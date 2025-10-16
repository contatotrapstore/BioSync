/**
 * Script para adicionar proteÃ§Ã£o aos jogos existentes
 *
 * USO: node protect-games.js [caminho-dos-jogos]
 *
 * Este script injeta o cÃ³digo de proteÃ§Ã£o em todos os index.html dos jogos
 */

const fs = require('fs');
const path = require('path');

const PROTECTION_MARKER = '<!-- neuroone_PROTECTION_INJECTED -->';

const getProtectionScript = (gameId) => {
  return `
${PROTECTION_MARKER}
<script>
(function() {
  const GAME_ID = '${gameId}';
  const SESSION_KEY = 'neuroone_game_session';

  window.addEventListener('DOMContentLoaded', function() {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);

      if (!sessionStr) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>ðŸ”’ Acesso Negado</h1><p>Este jogo deve ser aberto atravÃ©s do NeuroOne Launcher.</p><p style="color:#666;font-size:12px;margin-top:20px;">CÃ³digo de erro: NO_SESSION</p></div>';
        return;
      }

      const session = JSON.parse(sessionStr);

      if (Date.now() > session.expiresAt) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>â±ï¸ SessÃ£o Expirada</h1><p>Por favor, abra o jogo novamente atravÃ©s do NeuroOne Launcher.</p><p style="color:#666;font-size:12px;margin-top:20px;">CÃ³digo de erro: SESSION_EXPIRED</p></div>';
        localStorage.removeItem(SESSION_KEY);
        return;
      }

      if (session.gameId !== GAME_ID) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>ðŸš« Token InvÃ¡lido</h1><p>Este jogo nÃ£o corresponde Ã  sessÃ£o atual.</p><p style="color:#666;font-size:12px;margin-top:20px;">CÃ³digo de erro: INVALID_GAME</p></div>';
        return;
      }

      localStorage.removeItem(SESSION_KEY);
      console.log('âœ… Jogo autorizado pelo NeuroOne Launcher');
    } catch (error) {
      console.error('Erro na validaÃ§Ã£o:', error);
      document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>âŒ Erro de ValidaÃ§Ã£o</h1><p>NÃ£o foi possÃ­vel validar o acesso ao jogo.</p><p style="color:#666;font-size:12px;margin-top:20px;">CÃ³digo de erro: VALIDATION_ERROR</p></div>';
    }
  });

  if (window.opener || window.parent !== window) {
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>ðŸ”’ Acesso Negado</h1><p>Este jogo deve ser aberto atravÃ©s do NeuroOne Launcher.</p><p style="color:#666;font-size:12px;margin-top:20px;">CÃ³digo de erro: INVALID_CONTEXT</p></div>';
  }
})();
</script>
  `;
};

function injectProtection(indexPath, gameId) {
  try {
    let content = fs.readFileSync(indexPath, 'utf8');

    // Verifica se jÃ¡ estÃ¡ protegido
    if (content.includes(PROTECTION_MARKER)) {
      console.log(`â­ï¸  Pulando ${indexPath} (jÃ¡ protegido)`);
      return false;
    }

    // Injeta o script antes do </head> ou no inÃ­cio do <body>
    const protectionScript = getProtectionScript(gameId);

    if (content.includes('</head>')) {
      content = content.replace('</head>', `${protectionScript}\n</head>`);
    } else if (content.includes('<body>')) {
      content = content.replace('<body>', `<body>\n${protectionScript}`);
    } else {
      // Se nÃ£o encontrar head ou body, adiciona no inÃ­cio
      content = protectionScript + '\n' + content;
    }

    fs.writeFileSync(indexPath, content, 'utf8');
    console.log(`âœ… ProteÃ§Ã£o adicionada: ${indexPath}`);
    return true;
  } catch (error) {
    console.error(`âŒ Erro ao processar ${indexPath}:`, error.message);
    return false;
  }
}

function protectGamesInDirectory(gamesDir) {
  if (!fs.existsSync(gamesDir)) {
    console.error(`âŒ DiretÃ³rio nÃ£o encontrado: ${gamesDir}`);
    process.exit(1);
  }

  const folders = fs.readdirSync(gamesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let protected = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`\nðŸ” Iniciando proteÃ§Ã£o de jogos em: ${gamesDir}\n`);
  console.log(`ðŸ“ ${folders.length} pasta(s) encontrada(s)\n`);

  for (const folder of folders) {
    const indexPath = path.join(gamesDir, folder, 'index.html');

    if (fs.existsSync(indexPath)) {
      // Usa o nome da pasta como gameId
      const gameId = folder;
      const result = injectProtection(indexPath, gameId);

      if (result) {
        protected++;
      } else {
        skipped++;
      }
    } else {
      console.log(`âš ï¸  index.html nÃ£o encontrado em: ${folder}`);
      errors++;
    }
  }

  console.log(`\nðŸ“Š Resumo:`);
  console.log(`   âœ… Protegidos: ${protected}`);
  console.log(`   â­ï¸  Pulados: ${skipped}`);
  console.log(`   âŒ Erros: ${errors}`);
  console.log(`\nâœ¨ Processo concluÃ­do!\n`);
}

// ExecuÃ§Ã£o
const args = process.argv.slice(2);
const gamesPath = args[0] || path.join(__dirname, 'src', 'assets', 'games');

protectGamesInDirectory(gamesPath);
