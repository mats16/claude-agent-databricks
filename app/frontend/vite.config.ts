import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file from parent directory (app/.env)
  const env = loadEnv(mode, '../', '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          ws: true,
          rewriteWsOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              // Inject Databricks headers for local development
              const token = env.DATABRICKS_TOKEN;
              const userName = env.DATABRICKS_USER_NAME;
              const userId = env.DATABRICKS_USER_ID;
              const userEmail = env.DATABRICKS_USER_EMAIL;

              if (token) {
                proxyReq.setHeader('x-forwarded-access-token', token);
              }
              if (userName) {
                proxyReq.setHeader('X-Forwarded-Preferred-Username', userName);
              }
              if (userId) {
                proxyReq.setHeader('X-Forwarded-User', userId);
              }
              if (userEmail) {
                proxyReq.setHeader('X-Forwarded-Email', userEmail);
              }
            });
          },
        },
      },
    },
  };
});
