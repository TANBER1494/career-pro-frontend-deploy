const { resolve } = require('path');
const { defineConfig } = require('vite');
const fs = require('fs');
const path = require('path');

function getHtmlEntries(dir, entries = {}) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getHtmlEntries(fullPath, entries);
    } else if (file.endsWith('.html')) {
      const name = path
        .relative(__dirname, fullPath)
        .replace(/\\/g, '/')
        .replace(/\.html$/, '');
      entries[name] = fullPath;
    }
  }
  return entries;
}

function vercelRewritesPlugin() {
  const vercelConfigPath = resolve(__dirname, 'vercel.json');
  let rewrites = [];
  
  if (fs.existsSync(vercelConfigPath)) {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));
    rewrites = vercelConfig.rewrites || [];
  }

  return {
    name: 'vercel-rewrites',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url) {
          const [pathname, search] = req.url.split('?');
          
          if (pathname.startsWith('/js/') || pathname.startsWith('/css/')) {
            req.url = '/src' + pathname + (search ? `?${search}` : '');
            return next();
          }
          
          const rewrite = rewrites.find(r => r.source === pathname);
          if (rewrite) {
            req.url = rewrite.destination + (search ? `?${search}` : '');
          }
        }
        next();
      });
    }
  };
}

module.exports = defineConfig({
  plugins: [vercelRewritesPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...getHtmlEntries(resolve(__dirname, 'src'))
      }
    }
  }
});