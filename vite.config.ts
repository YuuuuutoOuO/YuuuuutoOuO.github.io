import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Using relative base './' ensures the site works seamlessly on both
// https://<username>.github.io/ and https://<username>.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: './',
});
