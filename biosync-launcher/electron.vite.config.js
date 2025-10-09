// Optional: Electron-vite configuration for better development experience
// This file is optional and can be removed if not using electron-vite

export default {
  main: {
    // Main process source code path
    entry: 'main.js'
  },
  preload: {
    // Preload script source code path
    entry: 'preload.js'
  },
  renderer: {
    // Renderer process handled by Vite
  }
};
