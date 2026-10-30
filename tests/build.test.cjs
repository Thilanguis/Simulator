const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  { execFileSync } = require('node:child_process');
test('production build injects complete offline shell and local OCR assets', () => {
  const root = path.resolve(__dirname, '..');
  execFileSync(process.execPath, ['scripts/build.cjs'], { cwd: root, stdio: 'pipe' });
  const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8'),
    worker = fs.readFileSync(path.join(root, 'dist/service-worker.js'), 'utf8');
  assert.ok(!worker.includes('__BUILD_VERSION__'));
  assert.ok(!worker.includes('__PRECACHE__'));
  const assets = JSON.parse(worker.match(/const ASSETS\s*=\s*(\[[\s\S]*?\]);/)[1]);
  assert.ok(assets.includes('index.html'));
  for (const match of html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)) assert.ok(assets.includes(match[1]), match[1] + ' missing from offline cache');
  for (const asset of ['vendor/lang/por.traineddata.gz', 'vendor/lang/eng.traineddata.gz', 'vendor/pdf/pdf.mjs', 'vendor/pdf/pdf.worker.mjs', 'vendor/tesseract/worker.min.js']) assert.ok(assets.includes(asset));
  for (const asset of assets) assert.ok(fs.existsSync(path.join(root, 'dist', asset)), 'missing asset ' + asset);
});
