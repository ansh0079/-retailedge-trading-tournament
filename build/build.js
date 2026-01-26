const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');
const SRC_HTML = path.join(ROOT, 'src', 'index.source.html');
const DIST_DIR = path.join(ROOT, 'dist');

function extractBabelScript(html) {
  const startTag = '<script type="text/babel">';
  const start = html.indexOf(startTag);
  if (start === -1) throw new Error('Could not find <script type="text/babel"> in src/index_ultimate.html');

  const afterStart = start + startTag.length;
  const end = html.indexOf('</script>', afterStart);
  if (end === -1) throw new Error('Could not find closing </script> for the Babel script');

  const code = html.slice(afterStart, end);
  return { code, start, end: end + '</script>'.length };
}

function buildAppJs(babelCode) {
  const result = babel.transformSync(babelCode, {
    babelrc: false,
    configFile: false,
    presets: [
      ['@babel/preset-env', { targets: '>0.25%, not dead' }],
      ['@babel/preset-react', { runtime: 'classic' }],
    ],
    sourceMaps: false,
    comments: false,
    compact: true,
  });

  if (!result || !result.code) throw new Error('Babel transform produced no output');
  return result.code;
}

function buildDistHtml(sourceHtml) {
  let html = sourceHtml;

  // Tailwind CDN -> built CSS
  html = html.replace(
    /<script\s+src="https:\/\/cdn\.tailwindcss\.com"\s*>\s*<\/script>/i,
    '<link rel="stylesheet" href="./tailwind.css">'
  );

  // Replace CDN React/ReactDOM with local vendored copies
  html = html.replace(
    /<script\s+src="https:\/\/unpkg\.com\/react@18\/umd\/react\.production\.min\.js"\s*>\s*<\/script>/i,
    '<script src="./vendor/react.production.min.js"></script>'
  );
  html = html.replace(
    /<script\s+src="https:\/\/unpkg\.com\/react-dom@18\/umd\/react-dom\.production\.min\.js"\s*>\s*<\/script>/i,
    '<script src="./vendor/react-dom.production.min.js"></script>'
  );

  // Pin Lightweight Charts to local vendored v4.x (supports addCandlestickSeries)
  html = html.replace(
    /https:\/\/unpkg\.com\/lightweight-charts(?:@[^\/]*)?\/dist\/lightweight-charts\.standalone\.production\.js/gi,
    './vendor/lightweight-charts.standalone.production.js'
  );

  // Remove in-browser Babel standalone
  html = html.replace(
    /<script\s+src="https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"\s*>\s*<\/script>\s*/i,
    ''
  );

  // Replace the inline Babel script with a reference to dist app.js
  html = html.replace(
    /<script\s+type="text\/babel"\s*>[\s\S]*?<\/script>/i,
    '<script src="./app.js"></script>'
  );

  return html;
}

function main() {
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const sourceHtml = fs.readFileSync(SRC_HTML, 'utf8');
  const { code: babelCode } = extractBabelScript(sourceHtml);

  const appJs = buildAppJs(babelCode);
  fs.writeFileSync(path.join(DIST_DIR, 'app.js'), appJs, 'utf8');

  const distHtml = buildDistHtml(sourceHtml);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), distHtml, 'utf8');

  // A tiny sanity check so users don't accidentally open the source file.
  console.log('✅ Built dist/app.js and dist/index.html');
}

main();
