export const buildGamePlaceholder = (name = 'BioSync', width = 600, height = 320) => {
  const label = (name || 'BioSync').toUpperCase().slice(0, 22)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0D1BA6" />
          <stop offset="100%" stop-color="#4A6EF2" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="24" fill="url(#gradient)" />
      <text
        x="50%"
        y="50%"
        fill="#E6EEFF"
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
