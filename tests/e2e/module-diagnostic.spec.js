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
  const statementProbe = await page.evaluate(async () => {
    const source = await (await fetch('/Boundless-Cultivation/assets/page-B87MruAb.js?statement-probe')).text();
    let code = source.replace(/\\bimport\\s*\\{[^}]*\\}\\s*from\\s*["'][^"']+["']\\s*;?/g, '');
    code = code.replace(/export\\s*\\{[\\s\\S]*?\\};?\\s*$/, '');
    code = code.replace(/import\\.meta\\.url/g, '"https://example.invalid/module.js"');
    const parts = [];
    let start = 0, quote = '', escaped = false, lineComment = false, blockComment = false;
    let paren = 0, bracket = 0, brace = 0, templateExpr = 0;
    for (let i = 0; i < code.length; i++) {
      const c = code[i], n = code[i + 1];
      if (lineComment) { if (c === '\\n') lineComment = false; continue; }
      if (blockComment) { if (c === '*' && n === '/') { blockComment = false; i++; } continue; }
      if (quote) {
        if (escaped) { escaped = false; continue; }
        if (c === '\\\\') { escaped = true; continue; }
        if (c === quote) quote = '';
        continue;
      }
      if (c === '/' && n === '/') { lineComment = true; i++; continue; }
      if (c === '/' && n === '*') { blockComment = true; i++; continue; }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '(') paren++; else if (c === ')') paren--;
      else if (c === '[') bracket++; else if (c === ']') bracket--;
      else if (c === '{') brace++; else if (c === '}') brace--;
      else if (c === ';' && paren === 0 && bracket === 0 && brace === 0) {
        parts.push({ start, end: i + 1, code: code.slice(start, i + 1) });
        start = i + 1;
      }
    }
    if (start < code.length) parts.push({ start, end: code.length, code: code.slice(start) });
    const failures = [];
    for (const part of parts) {
      if (!part.code.trim()) continue;
      try { new Function(part.code); }
      catch (error) {
        failures.push({ offset: part.start, length: part.code.length, message: error.message,
          snippet: part.code.slice(0, 500), tail: part.code.slice(-500) });
        if (failures.length >= 5) break;
      }
    }
    return { totalStatements: parts.length, failures };
  });
  console.log('[DIAG statement-probe]', JSON.stringify(statementProbe));
  const declaratorProbe = await page.evaluate(async () => {
    const source = await (await fetch('/Boundless-Cultivation/assets/page-B87MruAb.js?declarator-probe')).text();
    let code = source.replace(/\\bimport\\s*\\{[^}]*\\}\\s*from\\s*["'][^"']+["']\\s*;?/g, '');
    code = code.replace(/export\\s*\\{[\\s\\S]*?\\};?\\s*$/, '');
    code = code.replace(/import\\.meta\\.url/g, '"https://example.invalid/module.js"');
    const target = code.slice(339870, 361697).trim();
    const declaration = target.replace(/^var\\s+/, '');
    const parts = []; let start = 0, quote = '', escaped = false, line = false, block = false;
    let p = 0, b = 0, c = 0;
    for (let i = 0; i < declaration.length; i++) {
      const x = declaration[i], n = declaration[i+1];
      if (line) { if (x === '\\n') line = false; continue; }
      if (block) { if (x === '*' && n === '/') { block = false; i++; } continue; }
      if (quote) { if (escaped) { escaped = false; continue; } if (x === '\\\\') { escaped = true; continue; } if (x === quote) quote = ''; continue; }
      if (x === '/' && n === '/') { line = true; i++; continue; }
      if (x === '/' && n === '*') { block = true; i++; continue; }
      if (x === '"' || x === "'" || x === '`') { quote = x; continue; }
      if (x === '(') p++; else if (x === ')') p--;
      else if (x === '[') b++; else if (x === ']') b--;
      else if (x === '{') c++; else if (x === '}') c--;
      else if (x === ',' && p === 0 && b === 0 && c === 0) { parts.push({start,end:i,code:declaration.slice(start,i)}); start=i+1; }
    }
    parts.push({start,end:declaration.length,code:declaration.slice(start)});
    const results=[];
    for (const part of parts) { try { new Function('var '+part.code); } catch(e) { results.push({offset:339870+part.start,length:part.code.length,message:e.message,snippet:part.code.slice(0,350),tail:part.code.slice(-350)}); } }
    return {count:parts.length,failures:results.slice(0,10)};
  });
  console.log('[DIAG declarator-probe]', JSON.stringify(declaratorProbe));


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
