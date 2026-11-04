const { test, expect } = require('@playwright/test');

test('standalone Boundless Cultivation 8.1.5 hydrates without SiteGPT', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log('PAGEERROR', error.message, error.stack || '');
  });
  page.on('console', async msg => {
    if (msg.type() === 'error') {
      const details = await Promise.all(msg.args().map(async arg => {
        try { return await arg.evaluate(value => ({ name:value?.name, message:value?.message, stack:value?.stack, text:String(value) })); }
        catch { return '[unserializable]'; }
      }));
      console.log('CONSOLE_ERROR', msg.text(), JSON.stringify(details));
    }
  });
  const oldHostRequests = [];
  page.on('request', request => {
    if (request.url().includes('legacy-source.invalid')) {
      oldHostRequests.push(request.url());
    }
  });
  await page.route('**://legacy-source.invalid/**', route => route.abort());

  await page.goto('/Boundless-Cultivation/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  console.log('HYDRATION_DIAGNOSTIC', JSON.stringify(await page.evaluate(() => ({
    hydratedAt: window.__VINEXT_HYDRATED_AT,
    root: window.__VINEXT_RSC_ROOT__ ? 'present' : 'missing',
    title: document.title,
    bodyText: document.body.innerText.slice(0, 1800),
    bodyChildren: [...document.body.children].map(el => el.tagName + '.' + String(el.className || '').slice(0,60)),
    modeSelector: !!document.querySelector('.bc-mode-choice'),
    creation: !!document.querySelector('.bc-character-creation')
  }))));
  await expect(page).toHaveTitle(/Boundless Cultivation/i);
  await expect(page.getByText('Boundless Cultivation', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Versi 8.1.11').first()).toBeVisible();
  await expect(page.locator('.bc-mode-choice')).toBeVisible();
  await expect(page.locator('.bc-creation-shell > .dao-card').last()).toBeVisible();
  expect(pageErrors).toEqual([]);

  const settings = page.getByRole('button', { name: 'Tetapan' }).first();
  await expect(settings).toBeVisible();
  await settings.click();
  const settingsDialog = page.getByRole('dialog');
  await expect(settingsDialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simpan & Export' })).toHaveCount(0);
  await settingsDialog.getByRole('tab', { name: /Permainan/ }).click();
  await expect(settingsDialog.locator('#bc-save-manager-panel')).toBeVisible();
  await expect(settingsDialog.locator('#bc-save-manager-panel')).toContainText('Simpan & Export');

  expect(oldHostRequests).toEqual([]);
});
