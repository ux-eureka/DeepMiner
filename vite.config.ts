import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.NEXT_PUBLIC_API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
  const baseUrl = env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
  
  return {
    build: {
      sourcemap: 'hidden',
    },
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.NEXT_PUBLIC_API_KEY': JSON.stringify(apiKey),
      'process.env.NEXT_PUBLIC_BASE_URL': JSON.stringify(baseUrl),
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
    plugins: [
      {
        name: 'deepminer-llm-proxy',
        configureServer(server) {
          server.middlewares.use('/__dm_llm_proxy', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            const endpointHeader = req.headers['x-dm-endpoint'];
            const endpointRaw = Array.isArray(endpointHeader) ? endpointHeader[0] : endpointHeader;
            const endpoint = typeof endpointRaw === 'string' ? endpointRaw : '';
            if (!endpoint) {
              res.statusCode = 400;
              res.end('Missing x-dm-endpoint');
              return;
            }
            if (!/^https?:\/\//i.test(endpoint)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid endpoint', endpoint }));
              return;
            }

            const authorizationRaw = req.headers['authorization'];
            const authorization = Array.isArray(authorizationRaw) ? authorizationRaw[0] : authorizationRaw;
            const contentTypeRaw = req.headers['content-type'];
            const contentType = Array.isArray(contentTypeRaw) ? contentTypeRaw[0] : contentTypeRaw;

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const upstream = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': typeof contentType === 'string' ? contentType : 'application/json',
                    Authorization: typeof authorization === 'string' ? authorization : '',
                  },
                  body,
                });

                res.statusCode = upstream.status;
                upstream.headers.forEach((value, key) => {
                  if (key.toLowerCase() === 'content-encoding') return;
                  res.setHeader(key, value);
                });

                const buf = Buffer.from(await upstream.arrayBuffer());
                res.end(buf);
              } catch (err) {
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Bad Gateway', message: String(err), endpoint }));
              }
            });
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use('/__dm_llm_proxy', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            const endpointHeader = req.headers['x-dm-endpoint'];
            const endpointRaw = Array.isArray(endpointHeader) ? endpointHeader[0] : endpointHeader;
            const endpoint = typeof endpointRaw === 'string' ? endpointRaw : '';
            if (!endpoint) {
              res.statusCode = 400;
              res.end('Missing x-dm-endpoint');
              return;
            }
            if (!/^https?:\/\//i.test(endpoint)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid endpoint', endpoint }));
              return;
            }

            const authorizationRaw = req.headers['authorization'];
            const authorization = Array.isArray(authorizationRaw) ? authorizationRaw[0] : authorizationRaw;
            const contentTypeRaw = req.headers['content-type'];
            const contentType = Array.isArray(contentTypeRaw) ? contentTypeRaw[0] : contentTypeRaw;

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const upstream = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': typeof contentType === 'string' ? contentType : 'application/json',
                    Authorization: typeof authorization === 'string' ? authorization : '',
                  },
                  body,
                });

                res.statusCode = upstream.status;
                upstream.headers.forEach((value, key) => {
                  if (key.toLowerCase() === 'content-encoding') return;
                  res.setHeader(key, value);
                });

                const buf = Buffer.from(await upstream.arrayBuffer());
                res.end(buf);
              } catch (err) {
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Bad Gateway', message: String(err), endpoint }));
              }
            });
          });
        },
      },
      react({
        babel: {
          plugins: [
            'react-dev-locator',
          ],
        },
      }),
      traeBadgePlugin({
        variant: 'dark',
        position: 'bottom-right',
        prodOnly: true,
        clickable: true,
        clickUrl: 'https://www.trae.ai/solo?showJoin=1',
        autoTheme: true,
        autoThemeTarget: '#root'
      }), 
      tsconfigPaths()
    ],
  }
})
