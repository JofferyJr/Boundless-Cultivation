const { test, expect } = require('@playwright/test');

test('Petak Penerokaan requires Peta Kecil and the top button', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('boundless-dev-mode', '1'));
  await page.goto('/Boundless-Cultivation/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/Boundless Cultivation/i);
  await expect(page.locator('#bc-nested-grid-v822')).toHaveCount(1);

  await page.evaluate(() => {
    const switcher = document.createElement('div');
    switcher.className = 'map-view-switch';
    switcher.innerHTML =
      '<button type="button" aria-pressed="false">Peta Besar</button>' +
      '<button type="button" aria-pressed="true">Peta Kecil</button>';
    document.body.appendChild(switcher);

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
      button.className = 'local-place-tile wilderness ' + (i === 4 ? 'active visited' : i === 3 ? 'frontier' : 'fog');
      button.disabled = i !== 4 && i !== 3;
      button.dataset.bcLoreIndex = String(i);
      button.innerHTML = '<span class="local-place-copy"><b>Slot ' + (i + 1) + '</b><small>Deskripsi asal ' + (i + 1) + '</small></span>';
      button.addEventListener('click', () => button.setAttribute('data-native-visit', '1'));
      grid.appendChild(button);
    }
    document.body.appendChild(shell);
    window.__boundlessNestedGridRefresh?.();
  });

  const explorationButton = page.getByRole('button', { name: 'Buka Petak Penerokaan' });
  await expect(explorationButton).toBeEnabled();
  await expect(page.locator('#bc-nested-grid-v822')).toBeHidden();

  // The 3x3 tile click must stay with the native travel handler, not open the nested grid.
  await page.locator('.local-region-shell .local-place-tile.active').click();
  await expect(page.locator('#bc-nested-grid-v822')).toBeHidden();
  await expect(page.locator('.local-region-shell .local-place-tile.active')).toHaveAttribute('data-native-visit', '1');

  // Peta Besar does not satisfy the first condition.
  await page.locator('.map-view-switch button').first().evaluate(button => {
    button.setAttribute('aria-pressed', 'true');
    button.parentElement.querySelectorAll('button')[1].setAttribute('aria-pressed', 'false');
  });
  await page.evaluate(() => window.__boundlessNestedGridRefresh?.());
  await expect(explorationButton).toBeDisabled();

  // Peta Kecil plus the top button opens the inner exploration grid.
  await page.locator('.map-view-switch button').nth(1).evaluate(button => {
    button.setAttribute('aria-pressed', 'true');
    button.parentElement.querySelectorAll('button')[0].setAttribute('aria-pressed', 'false');
  });
  await page.evaluate(() => window.__boundlessNestedGridRefresh?.());
  await expect(explorationButton).toBeEnabled();
  await explorationButton.click();
  await expect(page.locator('#bc-nested-grid-v822')).toBeVisible();
  await expect(page.locator('#bcng-summary')).toContainText('Saiz');

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
  await expect(page.locator('.local-region-shell .local-place-tile.active')).toHaveAttribute('data-native-visit', '1');
});
