const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: "bash -c 'rm -rf .preview && mkdir -p .preview/Cultivation .preview/assets && cp -a site/. .preview/Boundless-Cultivation/ && cp -a site/assets/. .preview/assets/ && python -m http.server 4173 --directory .preview'",
    port: 4173,
    reuseExistingServer: false,
    timeout: 30000
  }
});
