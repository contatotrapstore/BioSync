/**
 * Script para adicionar proteção aos jogos existentes
 *
 * USO: node protect-games.js [caminho-dos-jogos]
 *
 * Este script injeta o código de proteção em todos os index.html dos jogos
 */

const fs = require('fs');
const path = require('path');

const PROTECTION_MARKER = '<!-- NEUROGAME_PROTECTION_INJECTED -->';

const getProtectionScript = (gameId) => {
  return `
${PROTECTION_MARKER}
<script>
(function() {
  const GAME_ID = '${gameId}';
  const SESSION_KEY = 'neurogame_game_session';

  window.addEventListener('DOMContentLoaded', function() {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);

      if (!sessionStr) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>🔒 Acesso Negado</h1><p>Este jogo deve ser aberto através do NeuroGame Launcher.</p><p style="color:#666;font-size:12px;margin-top:20px;">Código de erro: NO_SESSION</p></div>';
        return;
      }

      const session = JSON.parse(sessionStr);

      if (Date.now() > session.expiresAt) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>⏱️ Sessão Expirada</h1><p>Por favor, abra o jogo novamente através do NeuroGame Launcher.</p><p style="color:#666;font-size:12px;margin-top:20px;">Código de erro: SESSION_EXPIRED</p></div>';
        localStorage.removeItem(SESSION_KEY);
        return;
      }

      if (session.gameId !== GAME_ID) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>🚫 Token Inválido</h1><p>Este jogo não corresponde à sessão atual.</p><p style="color:#666;font-size:12px;margin-top:20px;">Código de erro: INVALID_GAME</p></div>';
        return;
      }

      localStorage.removeItem(SESSION_KEY);
      console.log('✅ Jogo autorizado pelo NeuroGame Launcher');
    } catch (error) {
      console.error('Erro na validação:', error);
      document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>❌ Erro de Validação</h1><p>Não foi possível validar o acesso ao jogo.</p><p style="color:#666;font-size:12px;margin-top:20px;">Código de erro: VALIDATION_ERROR</p></div>';
    }
  });

  if (window.opener || window.parent !== window) {
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;flex-direction:column;"><h1>🔒 Acesso Negado</h1><p>Este jogo deve ser aberto através do NeuroGame Launcher.</p><p style="color:#666;font-size:12px;margin-top:20px;">Código de erro: INVALID_CONTEXT</p></div>';
  }
})();
</script>
  `;
};

function injectProtection(indexPath, gameId) {
  try {
    let content = fs.readFileSync(indexPath, 'utf8');

    // Verifica se já está protegido
    if (content.includes(PROTECTION_MARKER)) {
      console.log(`⏭️  Pulando ${indexPath} (já protegido)`);
      return false;
    }

    // Injeta o script antes do </head> ou no início do <body>
    const protectionScript = getProtectionScript(gameId);

    if (content.includes('</head>')) {
      content = content.replace('</head>', `${protectionScript}\n</head>`);
    } else if (content.includes('<body>')) {
      content = content.replace('<body>', `<body>\n${protectionScript}`);
    } else {
      // Se não encontrar head ou body, adiciona no início
      content = protectionScript + '\n' + content;
    }

    fs.writeFileSync(indexPath, content, 'utf8');
    console.log(`✅ Proteção adicionada: ${indexPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar ${indexPath}:`, error.message);
    return false;
  }
}

function protectGamesInDirectory(gamesDir) {
  if (!fs.existsSync(gamesDir)) {
    console.error(`❌ Diretório não encontrado: ${gamesDir}`);
    process.exit(1);
  }

  const folders = fs.readdirSync(gamesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let protected = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`\n🔐 Iniciando proteção de jogos em: ${gamesDir}\n`);
  console.log(`📁 ${folders.length} pasta(s) encontrada(s)\n`);

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
      console.log(`⚠️  index.html não encontrado em: ${folder}`);
      errors++;
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Protegidos: ${protected}`);
  console.log(`   ⏭️  Pulados: ${skipped}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`\n✨ Processo concluído!\n`);
}

// Execução
const args = process.argv.slice(2);
const gamesPath = args[0] || path.join(__dirname, 'src', 'assets', 'games');

protectGamesInDirectory(gamesPath);
