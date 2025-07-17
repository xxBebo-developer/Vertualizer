import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set the base path for GitHub Pages deployment
  base: 'https://github.com.io/xxBebo-developer/Vertualizer', // <-- IMPORTANT: Replace 'your-repo-name' with your repository's name
  define: {
    // This makes the environment variable available in your client-side code during build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
