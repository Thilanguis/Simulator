const fs = require('node:fs');
const path = require('node:path');

function copy(from, to) {
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) copy(path.join(from, name), path.join(to, name));
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function prepareAssets(root, output) {
  const vendor = path.join(output, 'vendor');
  for (const name of ['tesseract.min.js', 'worker.min.js']) copy(path.join(root, 'node_modules/tesseract.js/dist', name), path.join(vendor, 'tesseract', name));
  for (const name of fs.readdirSync(path.join(root, 'node_modules/tesseract.js-core')).filter((name) => /\.wasm(?:\.js)?$/.test(name))) copy(path.join(root, 'node_modules/tesseract.js-core', name), path.join(vendor, 'core', name));
  for (const name of ['pdf.mjs', 'pdf.worker.mjs']) copy(path.join(root, 'node_modules/pdfjs-dist/build', name), path.join(vendor, 'pdf', name));
  for (const lang of ['por', 'eng']) copy(path.join(root, 'node_modules/@tesseract.js-data', lang, '4.0.0', lang + '.traineddata.gz'), path.join(vendor, 'lang', lang + '.traineddata.gz'));
  for (const name of ['tesseract.js', 'tesseract.js-core', 'pdfjs-dist', '@tesseract.js-data/por', '@tesseract.js-data/eng']) {
    const packageRoot = path.join(root, 'node_modules', name);
    const license = fs.readdirSync(packageRoot).find((file) => /^license/i.test(file));
    if (license) copy(path.join(packageRoot, license), path.join(vendor, 'licenses', name.replaceAll('/', '-') + '-' + license));
  }
}

module.exports = { copy, prepareAssets };
