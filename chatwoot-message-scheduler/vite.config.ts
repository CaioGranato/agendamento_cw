import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'https://apiag.odmax.com.br/api'),
        'process.env.N8N_ALERT_WEBHOOK_URL': JSON.stringify(env.N8N_ALERT_WEBHOOK_URL),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
