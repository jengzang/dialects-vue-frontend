import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import http from 'http';

const mpaEntryRoots = ['auth', 'menu', 'intro', 'explore', 'villagesML'];
const localePrefixPattern = /^\/(zh-CN|zh-Hant|en)(?=\/|$)/;
const localeAwareEntryRoots = new Set(['auth', 'menu', 'explore']);

function rewriteDevMpaRequest(req) {
  if (!req?.url || !req.headers?.accept?.includes('text/html')) {
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const localeMatch = localePrefixPattern.exec(url.pathname);
  const pathnameWithoutLocale = localeMatch
    ? url.pathname.slice(localeMatch[0].length) || '/'
    : url.pathname;
  const pathname = pathnameWithoutLocale.replace(/\/+$/, '') || '/';
  const matchedRoot = mpaEntryRoots.find(
    (root) => pathname === `/${root}` || pathname.startsWith(`/${root}/`)
  );

  if (matchedRoot && !path.extname(pathname)) {
    if (!localeMatch && localeAwareEntryRoots.has(matchedRoot)) {
      url.pathname = '/index.html';
      req.url = `${url.pathname}${url.search}`;
      return;
    }

    url.pathname = `${localeMatch ? localeMatch[0] : ''}/${matchedRoot}/index.html`.replace(/\/+/g, '/');
    req.url = `${url.pathname}${url.search}`;
    return;
  }

  if (!localeMatch || path.extname(pathname)) {
    return;
  }

  url.pathname = '/index.html';
  req.url = `${url.pathname}${url.search}`;
}

function devMpaRewritePlugin() {
  return {
    name: 'dev-mpa-rewrite',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewriteDevMpaRequest(req);
        next();
      });
    },
  };
}

function pingPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/__ping`, { timeout: 150 }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const cleaned = data.trim().replace(/^"|"$/g, '');
        if (cleaned === 'ok!!') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function detectBackendPort() {
  console.log('[Vite] Detecting backend port (pinging 127.0.0.1:5000-5049 /__ping)...');
  let attempts = 0;
  while (true) {
    const promises = [];
    for (let port = 5000; port <= 5049; port++) {
      promises.push(pingPort(port).then((success) => (success ? port : null)));
    }

    const results = await Promise.all(promises);
    const foundPort = results.find((port) => port !== null);

    if (foundPort !== undefined) {
      console.log(`[Vite] Backend detected successfully on port: ${foundPort}`);
      return foundPort;
    }

    attempts++;
    if (attempts === 1 || attempts % 5 === 0) {
      console.log(
        '[Vite] Backend not detected on ports 5000-5049. Waiting for backend to start (press Ctrl+C to abort)...'
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  let webBase;
  if (mode === 'web') {
    webBase = '';
  } else if (mode === 'development') {
    if (env.VITE_WEB_BASE) {
      webBase = env.VITE_WEB_BASE;
    } else {
      const port = await detectBackendPort();
      webBase = `http://127.0.0.1:${port}`;
    }
  } else {
    webBase = env.VITE_WEB_BASE || 'https://dialects.yzup.top';
  }

  console.log(`[Vite] Mode: ${mode}, WEB_BASE: ${webBase}`);

  return {
    plugins: [vue(), devMpaRewritePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      __WEB_BASE__: JSON.stringify(webBase),
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/global/mixins" as *;\n`,
        },
      },
    },
    server: {
      proxy: {
        '^/(api|user|logs|sql|upload|download|static|files)(?:/|$)': {
          target: 'https://dialects.yzup.top',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          auth: path.resolve(__dirname, 'auth/index.html'),
          menu: path.resolve(__dirname, 'menu/index.html'),
          intro: path.resolve(__dirname, 'intro/index.html'),
          explore: path.resolve(__dirname, 'explore/index.html'),
          villagesML: path.resolve(__dirname, 'villagesML/index.html'),
        },
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks(id) {
            if (id.includes('/api/logs/')) {
              return 'logs';
            }
            if (id.includes('/src/i18n/')) {
              return 'i18n';
            }
            if (id.includes('echarts')) {
              return 'echarts';
            }
            if (id.includes('maplibre-gl')) {
              return 'maplibre';
            }
            if (id.includes('xlsx')) {
              return 'xlsx';
            }
            if (id.includes('wavesurfer')) {
              return 'wavesurfer';
            }
            if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router')) {
              return 'vue-vendor';
            }
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      esbuild: {
        drop: ['console', 'debugger'],
      },
    },
  };
});
