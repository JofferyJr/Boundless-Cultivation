const { test } = require('@playwright/test');

test('diagnose Boundless lazy page module import', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[DIAG console]', msg.text());
  });
  page.on('pageerror', error => {
    console.log('[DIAG pageerror]', error.name, error.message, error.stack || '');
  });
  page.on('requestfailed', request => {
    console.log('[DIAG requestfailed]', request.url(), request.failure()?.errorText || '');
  });
  page.on('response', async response => {
    if (response.url().includes('page-B87MruAb.js')) {
      const body = await response.text().catch(error => 'BODY_READ_ERROR: ' + error.message);
      console.log('[DIAG page-module-response]', JSON.stringify({
        url: response.url(), status: response.status(),
        contentType: response.headers()['content-type'],
        length: body.length, prefix: body.slice(0, 240), suffix: body.slice(-240)
      }));
    }
  });
  await page.addInitScript(() => {
    addEventListener('vite:preloadError', event => {
      console.error('[DIAG vite:preloadError]', event.payload?.name, event.payload?.message, event.payload?.stack);
    });
    addEventListener('unhandledrejection', event => {
      console.error('[DIAG unhandledrejection]', event.reason?.name, event.reason?.message, event.reason?.stack);
    });
  });
  await page.goto('/Boundless-Cultivation/', { waitUntil: 'domcontentloaded' });
  const directImport = await page.evaluate(async () => {
    try {
      const module = await import('/Boundless-Cultivation/assets/page-B87MruAb.js?diagnostic-direct-import');
      return { ok: true, exports: Object.keys(module).slice(0, 20), count: Object.keys(module).length };
    } catch (error) {
      return { ok: false, name: error?.name, message: error?.message, stack: error?.stack };
    }
  });
  console.log('[DIAG direct-import]', JSON.stringify(directImport));
  console.log('[DIAG document]', JSON.stringify(await page.evaluate(() => ({
    title: document.title, pathname: location.pathname,
    bodyText: document.body.innerText.slice(0, 500)
  }))));
});
