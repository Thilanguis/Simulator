const { defineConfig } = require('@playwright/test');
const port = Number(process.env.FINDOM_TEST_PORT || 4174);
const baseURL = `http://127.0.0.1:${port}`;
module.exports = defineConfig({
  testDir: 'tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: { baseURL, headless: true, screenshot: 'only-on-failure' },
  webServer: { command: 'npm run start', url: baseURL, env: { PORT: String(port) }, reuseExistingServer: false, timeout: 30000 },
});
