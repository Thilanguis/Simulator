const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests/live',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: { baseURL: 'http://127.0.0.1:5501', headless: true, screenshot: 'only-on-failure' },
});
