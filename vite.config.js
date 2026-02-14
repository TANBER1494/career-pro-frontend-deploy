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
      const name = path.relative(__dirname, fullPath).replace(/\\/g, '/').replace(/\.html$/, '');
      entries[name] = fullPath;
    }
  }
  return entries;
}

module.exports = defineConfig({
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