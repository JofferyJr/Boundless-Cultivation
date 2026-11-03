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
  const parserProbe = await page.evaluate(async () => {
    const url = '/Boundless-Cultivation/assets/page-B87MruAb.js?parser-probe';
    const source = await (await fetch(url)).text();
    let script = source.replace(/\bimport\s*\{[^}]*\}\s*from\s*["'][^"']+["']\s*;?/g, '');
    script = script.replace(/export\s*\{[\s\S]*?\};?\s*$/, '');
    script = script.replace(/import\.meta\.url/g, '"https://example.invalid/module.js"');
    try {
      new Function(script);
      return { ok: true, length: script.length };
    } catch (error) {
      return { ok: false, name: error.name, message: error.message, stack: error.stack, length: script.length };
    }
  });
  console.log('[DIAG parser-probe]', JSON.stringify(parserProbe));
  const dependencyImports = await page.evaluate(async () => {
    const paths = [
      '/Boundless-Cultivation/assets/rolldown-runtime-S-ySWqyJ.js?diagnostic-runtime',
      '/Boundless-Cultivation/assets/framework-CXnKph_e.js?diagnostic-framework',
      '/Boundless-Cultivation/assets/layout-segment-context-fHC_j0UX.js?diagnostic-layout'
    ];
    const results = [];
    for (const path of paths) {
      try {
        const module = await import(path);
        results.push({ path, ok: true, exports: Object.keys(module).slice(0, 8) });
      } catch (error) {
        results.push({ path, ok: false, name: error?.name, message: error?.message, stack: error?.stack });
      }
    }
    return results;
  });
  console.log('[DIAG dependency-imports]', JSON.stringify(dependencyImports));
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
