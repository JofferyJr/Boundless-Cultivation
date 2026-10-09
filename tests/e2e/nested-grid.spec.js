const { test, expect } = require('@playwright/test');

test('nested map grid opens and DEV can override its size and cell lore', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('boundless-dev-mode', '1'));
  await page.goto('/Boundless-Cultivation/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/Boundless Cultivation/i);
  await expect(page.locator('#bc-nested-grid-v822')).toHaveCount(1);

  await page.evaluate(() => {
    const shell = document.createElement('section');
    shell.className = 'local-region-shell';
    shell.innerHTML =
      '<div class="local-region-heading"><p class="eyebrow">Jubin Pengembaraan · Puncak Xuefeng</p></div>' +
      '<div class="local-region-map biome-hutan"><div class="local-place-grid"></div></div>' +
      '<p class="local-map-note">Pilih jubin untuk mengembara.</p>';
    const grid = shell.querySelector('.local-place-grid');
    for (let i = 0; i < 9; i++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'local-place-tile wilderness';
      button.disabled = i !== 4; // Simulate native exploration locks on non-frontier tiles.
      button.dataset.bcLoreIndex = String(i);
      button.innerHTML = '<span class="local-place-copy"><b>Slot ' + (i + 1) + '</b><small>Deskripsi asal ' + (i + 1) + '</small></span>';
      button.addEventListener('click', () => button.setAttribute('data-native-visit', '1'));
      grid.appendChild(button);
    }
    document.body.appendChild(shell);
    window.__boundlessNestedGridRefresh?.();
  });

  const lockedTile = page.locator('.local-region-shell .local-place-tile').first();
  await expect(lockedTile).toBeEnabled(); // Grid inspection is allowed even when native travel is locked.
  await expect(lockedTile).toHaveAttribute('aria-disabled', 'true');
  await lockedTile.click();
  await expect(page.locator('#bc-nested-grid-v822')).toBeVisible();
  await page.locator('#bcng-enter-parent').click();
  await expect(page.locator('#bc-nested-grid-v822')).toBeVisible();
  await expect(page.locator('#bcng-cell-status')).toContainText('belum boleh dimasuki');
  await page.locator('#bcng-return').click();

  await page.locator('.local-region-shell .local-place-tile').nth(4).click();
  await expect(page.locator('#bc-nested-grid-v822')).toBeVisible();
  await expect(page.locator('#bcng-summary')).toContainText('Saiz 6×6');

  await page.getByRole('button', { name: /Sunting grid \(DEV\)/ }).click();
  await page.locator('#bcng-mode').selectOption('manual');
  await page.locator('#bcng-rows').selectOption('1');
  await page.locator('#bcng-cols').selectOption('2');
  await page.locator('#bcng-name').fill('Grid Ujian DEV');
  await page.locator('#bcng-save-grid').click();

  await expect(page.locator('#bcng-title')).toHaveText('Grid Ujian DEV');
  await expect(page.locator('#bcng-summary')).toContainText('Saiz 1×2');
  await expect(page.locator('#bcng-grid .bcng-cell')).toHaveCount(2);

  await page.locator('#bcng-grid .bcng-cell').first().click();
  await page.locator('#bcng-cell-name').fill('Balai Utama');
  await page.locator('#bcng-cell-description').fill('Lokasi utama ujian.');
  await page.locator('#bcng-save-cell').click();
  await expect(page.locator('#bcng-grid .bcng-cell').first()).toContainText('Balai Utama');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('boundless-nested-grid-v1') || '{}'));
  expect(saved.entries['puncak-xuefeng::4'].mode).toBe('manual');
  expect(saved.entries['puncak-xuefeng::4'].rows).toBe(1);
  expect(saved.entries['puncak-xuefeng::4'].cols).toBe(2);
  expect(saved.entries['puncak-xuefeng::4'].cells['0-0'].name).toBe('Balai Utama');

  await page.locator('#bcng-enter-parent').click();
  await expect(page.locator('#bc-nested-grid-v822')).toBeHidden();
  await expect(page.locator('.local-region-shell .local-place-tile').nth(4)).toHaveAttribute('data-native-visit', '1');
});