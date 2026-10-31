const path = require('node:path');
const { prepareAssets } = require('./local-assets.cjs');
const root = path.resolve(__dirname, '..');
try {
  prepareAssets(root, root);
  console.log('OCR e PDF prontos nesta pasta, sem depender de Simulator/ ou da PR.');
  console.log('Use o Live Server em http://127.0.0.1:5501. Salve e atualize a página; não é necessário build a cada alteração.');
} catch (error) {
  console.error('Não foi possível preparar as bibliotecas locais. Execute npm ci e depois npm run setup:local.');
  console.error(error.message);
  process.exitCode = 1;
}
