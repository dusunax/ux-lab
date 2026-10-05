import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    build: {
      rollupOptions: {
        input: {
          device: resolve(__dirname, 'src/renderer/device/index.html'),
          console: resolve(__dirname, 'src/renderer/console/index.html'),
        },
      },
    },
  },
});
