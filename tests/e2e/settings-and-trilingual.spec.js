import { test, expect } from '@playwright/test';

test.describe('PokopiaDex - Settings, Trilingual Mode & Progress Code Sync', () => {
  test('toggles Trilingual Mode across index.html, detail.html?id=1, and settings.html', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.pokemon-card')).toHaveCount(303);

    // Initially trilingual mode is off
    const quickBtn = page.locator('#trilingualQuickBtn');
    await expect(page.locator('.pokemon-card--trilingual')).toHaveCount(0);

    // Enable Trilingual Mode via #trilingualQuickBtn on index.html
    await quickBtn.click();
    await expect(quickBtn).toHaveClass(/active/);
    await expect(page.locator('.pokemon-card--trilingual')).toHaveCount(303);

    const firstCardBadges = page.locator('.pokemon-card').first().locator('.trilingual-badge');
    await expect(firstCardBadges).toHaveCount(3);
    await expect(firstCardBadges.nth(0)).toContainText('🇹🇼');
    await expect(firstCardBadges.nth(1)).toContainText('🇺🇸');
    await expect(firstCardBadges.nth(2)).toContainText('🇪🇸');

    // Navigate to detail.html?id=1 and verify trilingual blocks appear
    await page.goto('/detail.html?id=1');
    const detailQuickBtn = page.locator('#trilingualQuickBtn');
    await expect(detailQuickBtn).toHaveClass(/active/);

    const descBlock = page.locator('#descText.trilingual-block');
    await expect(descBlock).toBeVisible();
    await expect(descBlock).toContainText('🇹🇼');
    await expect(descBlock).toContainText('🇺🇸');
    await expect(descBlock).toContainText('🇪🇸');

    const habitatBlock = page.locator('#idealHabitatTrilingual.trilingual-block');
    await expect(habitatBlock).toBeVisible();
    await expect(habitatBlock).toContainText('🇹🇼');
    await expect(habitatBlock).toContainText('🇺🇸');
    await expect(habitatBlock).toContainText('🇪🇸');

    // Toggle off on detail.html, then re-enable on settings.html via #trilingualToggle
    await detailQuickBtn.click();
    await expect(detailQuickBtn).not.toHaveClass(/active/);
    await expect(page.locator('.trilingual-block')).toHaveCount(0);

    await page.goto('/settings.html');
    const trilingualToggle = page.locator('#trilingualToggle');
    await expect(trilingualToggle).not.toBeChecked();

    // Click the toggle slider on settings.html
    await page.locator('label.settings-toggle').first().click();
    await expect(trilingualToggle).toBeChecked();

    const storedTrilingual = await page.evaluate(() => localStorage.getItem('pokopia-trilingual'));
    expect(storedTrilingual).toBe('true');
  });

  test('generates a Progress Code on settings.html, clears data, and imports the Progress Code to restore collection state', async ({ page }) => {
    await page.goto('/settings.html');

    // Seed custom collection state
    const expectedIds = [1, 4, 7, 25, 133, 150];
    await page.evaluate((ids) => {
      localStorage.setItem('pokopia-collected', JSON.stringify(ids));
      localStorage.setItem('pokopia-lang', 'zh');
      localStorage.setItem('pokopia-trilingual', 'true');
    }, expectedIds);

    await page.reload();
    await expect(page.locator('#collectedCountValue')).toHaveText('6 / 303');

    // 1. Generate Progress Code
    await page.locator('#generateCodeBtn').click();
    const generateModal = page.locator('#generateCodeModal');
    await expect(generateModal).toHaveClass(/open/);

    const codeTextarea = page.locator('#progressCodeText');
    const generatedCode = await codeTextarea.inputValue();
    expect(generatedCode).toMatch(/^POKOPIA:/);

    await page.locator('#generateCodeCloseBtn').click();
    await expect(generateModal).not.toHaveClass(/open/);

    // 2. Clear all data
    await page.locator('#clearBtn').click();
    const clearModal = page.locator('#clearModal');
    await expect(clearModal).toHaveClass(/open/);
    await page.locator('#clearConfirmBtn').click();
    await expect(clearModal).not.toHaveClass(/open/);

    await expect(page.locator('#collectedCountValue')).toHaveText('0 / 303');
    const clearedCollected = await page.evaluate(() => localStorage.getItem('pokopia-collected'));
    expect(clearedCollected).toBeNull();

    // 3. Import the generated Progress Code back
    await page.locator('#importCodeBtn').click();
    const importModal = page.locator('#importCodeModal');
    await expect(importModal).toHaveClass(/open/);

    await page.locator('#importCodeInput').fill(generatedCode);
    await page.locator('#importCodeConfirmBtn').click();
    await expect(importModal).not.toHaveClass(/open/);

    // Verify collection state is restored
    await expect(page.locator('#collectedCountValue')).toHaveText('6 / 303');
    const restoredIds = await page.evaluate(() => JSON.parse(localStorage.getItem('pokopia-collected') || '[]'));
    expect(restoredIds.sort((a, b) => a - b)).toEqual(expectedIds);
  });
});
