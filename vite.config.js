import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Project-pages base so assets resolve on GitHub Pages.
  base: process.env.GITHUB_PAGES ? '/typing-terminal-code/' : '/',
})
