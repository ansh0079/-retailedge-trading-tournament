const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_VENDOR = path.join(ROOT, 'dist', 'vendor');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  // React UMD builds exist inside node_modules/*/umd/
  const reactUmd = path.join(ROOT, 'node_modules', 'react', 'umd', 'react.production.min.js');
  const reactDomUmd = path.join(ROOT, 'node_modules', 'react-dom', 'umd', 'react-dom.production.min.js');

  // Lightweight Charts dist file
  const lwc = path.join(ROOT, 'node_modules', 'lightweight-charts', 'dist', 'lightweight-charts.standalone.production.js');

  if (!fs.existsSync(reactUmd)) throw new Error(`Missing ${reactUmd}. Did you run npm install?`);
  if (!fs.existsSync(reactDomUmd)) throw new Error(`Missing ${reactDomUmd}. Did you run npm install?`);
  if (!fs.existsSync(lwc)) throw new Error(`Missing ${lwc}. Did you install lightweight-charts@4.x?`);

  fs.mkdirSync(DIST_VENDOR, { recursive: true });

  copyFile(reactUmd, path.join(DIST_VENDOR, 'react.production.min.js'));
  copyFile(reactDomUmd, path.join(DIST_VENDOR, 'react-dom.production.min.js'));
  copyFile(lwc, path.join(DIST_VENDOR, 'lightweight-charts.standalone.production.js'));

  console.log('✅ Vendored React, ReactDOM, and Lightweight Charts into dist/vendor');
}

main();
