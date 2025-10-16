/**
 * Validação rigorosa de URLs de imagens
 * Rejeita caminhos locais e aceita apenas URLs completas
 *
 * @param {string} imageUrl - URL da imagem para validar
 * @returns {string|null} - URL válida ou null se inválida
 */
export const getGameImage = (imageUrl) => {
  // Se não tem URL, retornar null
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return null
  }

  const url = imageUrl.trim()

  // Rejeitar caminhos locais inválidos
  if (url.startsWith('/') || url.startsWith('C:') || url.startsWith('c:') || url.startsWith('file://')) {
    console.warn('[placeholders] Caminho local inválido rejeitado:', url);
    return null
  }

  // Rejeitar caminhos relativos
  if (url.startsWith('./') || url.startsWith('../') || url.startsWith('.\\') || url.startsWith('..\\')) {
    console.warn('[placeholders] Caminho relativo inválido rejeitado:', url);
    return null
  }

  // Aceitar apenas URLs completas (http:// ou https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Qualquer outro formato é inválido
  console.warn('[placeholders] Formato de URL inválido:', url);
  return null
}

/**
 * Gera um placeholder SVG com gradiente e texto personalizado
 *
 * @param {string} name - Nome do jogo para exibir no placeholder
 * @param {number} width - Largura do placeholder
 * @param {number} height - Altura do placeholder
 * @returns {string} - Data URL do SVG gerado
 */
export const buildGamePlaceholder = (name = 'NeuroOne', width = 600, height = 320) => {
  const label = (name || 'NeuroOne').toUpperCase().slice(0, 22)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#c7a300" />
          <stop offset="100%" stop-color="#ffd913" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="24" fill="url(#gradient)" />
      <text
        x="50%"
        y="50%"
        fill="#130f00"
        font-family="'Segoe UI', Arial, sans-serif"
        font-size="${Math.max(24, Math.min(width, height) * 0.12)}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-weight="600"
        letter-spacing="4"
      >${label}</text>
    </svg>
  `

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}

