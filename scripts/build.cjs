const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'),
  dest = path.join(root, 'dist');
fs.mkdirSync(dest, { recursive: true });
const copy = (from, to) => {
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) copy(path.join(from, name), path.join(to, name));
  } else {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
};
for (const name of ['index.html', 'manifest.json', 'css', 'js', 'icon-192.png', 'icon-512.jpg', '💎 Contrato de Submissão e Resgate de Saldo.pdf']) copy(path.join(root, name), path.join(dest, name));
const vendor = path.join(dest, 'vendor');
for (const name of ['tesseract.min.js', 'worker.min.js']) copy(path.join(root, 'node_modules/tesseract.js/dist', name), path.join(vendor, 'tesseract', name));
for (const name of fs.readdirSync(path.join(root, 'node_modules/tesseract.js-core')).filter((n) => /\.wasm(?:\.js)?$/.test(n))) copy(path.join(root, 'node_modules/tesseract.js-core', name), path.join(vendor, 'core', name));
for (const name of ['pdf.mjs', 'pdf.worker.mjs']) copy(path.join(root, 'node_modules/pdfjs-dist/build', name), path.join(vendor, 'pdf', name));
for (const lang of ['por', 'eng']) copy(path.join(root, 'node_modules/@tesseract.js-data', lang, '4.0.0', lang + '.traineddata.gz'), path.join(vendor, 'lang', lang + '.traineddata.gz'));
for (const name of ['tesseract.js', 'tesseract.js-core', 'pdfjs-dist', '@tesseract.js-data/por', '@tesseract.js-data/eng']) {
  const packageRoot = path.join(root, 'node_modules', name);
  const license = fs.readdirSync(packageRoot).find((n) => /^license/i.test(n));
  if (license) copy(path.join(packageRoot, license), path.join(vendor, 'licenses', name.replaceAll('/', '-') + '-' + license));
}
const files = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else files.push(path.relative(dest, p).replaceAll('\\', '/'));
  }
}
walk(dest);
const assets = files.filter((n) => !['service-worker.js', 'version.json'].includes(n));
const digest = crypto.createHash('sha256');
for (const name of [...assets, 'service-worker.js']) {
  digest.update(name);
  digest.update(fs.readFileSync(name === 'service-worker.js' ? path.join(root, name) : path.join(dest, name)));
}
const version = '2.0.0-' + digest.digest('hex').slice(0, 10);
const workerTemplate = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
if (!workerTemplate.includes('__BUILD_VERSION__') || !/\/\*__PRECACHE__\*\/\s*\[\]/.test(workerTemplate)) throw new Error('Missing service worker build markers.');
const sw = workerTemplate.replace('__BUILD_VERSION__', version).replace(/\/\*__PRECACHE__\*\/\s*\[\]/, JSON.stringify(assets));
fs.writeFileSync(path.join(dest, 'service-worker.js'), sw);
fs.writeFileSync(path.join(dest, 'version.json'), JSON.stringify({ version }));
console.log('Build completo: dist/ · ' + version + ' · ' + assets.length + ' arquivos locais.');
