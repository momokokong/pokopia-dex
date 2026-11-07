import { test, expect } from '@playwright/test';

test.describe('PokopiaDex - Pokédex Home (index.html)', () => {
  test('loads index.html, renders 303 Pokémon cards, filters by search and type', async ({ page }) => {
    await page.goto('/index.html');

    // Wait for loading state to disappear and 303 cards to render
    const cards = page.locator('.pokemon-card');
    await expect(cards).toHaveCount(303);

    // Search filter: English name "Bulbasaur"
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('Bulbasaur');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Bulbasaur');

    // Search filter: Chinese name "妙蛙種子"
    await searchInput.fill('妙蛙種子');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('妙蛙種子');

    // Clear search -> back to 303 cards
    await searchInput.fill('');
    await expect(cards).toHaveCount(303);

    // Type filter: Fire
    const fireBtn = page.locator('.type-filter-btn[data-type="Fire"]');
    await fireBtn.click();
    await expect(fireBtn).toHaveClass(/active/);
    const fireCount = await cards.count();
    expect(fireCount).toBeGreaterThan(0);
    expect(fireCount).toBeLessThan(303);

    // Type filter: Multi-select Fire + Water (OR logic)
    const waterBtn = page.locator('.type-filter-btn[data-type="Water"]');
    await waterBtn.click();
    await expect(waterBtn).toHaveClass(/active/);
    const combinedCount = await cards.count();
    expect(combinedCount).toBeGreaterThan(fireCount);

    // Click "All" to reset type filters
    const allBtn = page.locator('.type-filter-btn[data-type="all"]');
    await allBtn.click();
    await expect(allBtn).toHaveClass(/active/);
    await expect(cards).toHaveCount(303);
  });

  test('switches languages (🇹🇼, 🇺🇸, 🇪🇸) with UI updates and zero horizontal overflow', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.pokemon-card')).toHaveCount(303);

    const searchInput = page.locator('#searchInput');
    const allBtn = page.locator('.type-filter-btn[data-type="all"]');

    // Switch to Traditional Chinese (🇹🇼)
    await page.locator('.lang-btn[data-lang="zh"]').click();
    await expect(searchInput).toHaveAttribute('placeholder', '搜尋寶可夢...');
    await expect(allBtn).toHaveText('全部');
    const overflowZh = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(overflowZh).toBe(true);

    // Switch to English (🇺🇸)
    await page.locator('.lang-btn[data-lang="en"]').click();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search Pokémon...');
    await expect(allBtn).toHaveText('All');
    const overflowEn = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(overflowEn).toBe(true);

    // Switch to Spanish (🇪🇸)
    await page.locator('.lang-btn[data-lang="es"]').click();
    await expect(searchInput).toHaveAttribute('placeholder', 'Buscar Pokémon...');
    await expect(allBtn).toHaveText('Todos');
    const overflowEs = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(overflowEs).toBe(true);
  });

  test('toggles collection status on a card and persists to localStorage (pokopia-collected)', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.pokemon-card')).toHaveCount(303);

    // Second card is Ivysaur (id=2), uncollected by default (default collected is [1, 133])
    const secondCard = page.locator('.pokemon-card').nth(1);
    const collectIcon = secondCard.locator('.pokemon-card__collect-icon');

    await expect(secondCard).toHaveClass(/uncollected/);

    // Click collect icon to mark as collected
    await collectIcon.click();
    await expect(secondCard).not.toHaveClass(/uncollected/);

    let collectedIds = await page.evaluate(() => JSON.parse(localStorage.getItem('pokopia-collected') || '[]'));
    expect(collectedIds).toContain(2);

    // Click collect icon again to uncollect
    await collectIcon.click();
    await expect(secondCard).toHaveClass(/uncollected/);

    collectedIds = await page.evaluate(() => JSON.parse(localStorage.getItem('pokopia-collected') || '[]'));
    expect(collectedIds).not.toContain(2);
  });
});
