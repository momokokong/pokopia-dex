import { test, expect } from '@playwright/test';

test.describe('PokopiaDex - Quiz Challenge & Badges Engine', () => {
  test('renders Question 1 / 10 cleanly, handles option selection, feedback modal, advancing to 2 / 10, and mode switching (A-E)', async ({ page }) => {
    await page.goto('/quiz.html');

    const progressPill = page.locator('#progress-text');
    const questionText = page.locator('#question-text');
    const options = page.locator('#options-grid .option-btn');

    // Verify Question 1 / 10 renders cleanly with no undefined text
    await expect(progressPill).toContainText('1 / 10');
    await expect(options.first()).toBeVisible();
    const optCount = await options.count();
    expect(optCount).toBeGreaterThanOrEqual(3);

    const qTextContent = await questionText.textContent();
    expect(qTextContent).toBeTruthy();
    expect(qTextContent).not.toContain('undefined');

    for (let i = 0; i < optCount; i++) {
      const optAttr = await options.nth(i).getAttribute('data-value');
      expect(optAttr).toBeTruthy();
      expect(optAttr).not.toContain('undefined');
    }

    // Select an option and verify feedback modal appears
    await options.first().click();
    const feedbackOverlay = page.locator('#feedback-overlay');
    await expect(feedbackOverlay).toBeVisible();
    const feedbackDetail = await page.locator('#correct-answer-display').textContent();
    expect(feedbackDetail).not.toContain('undefined');

    // Click next question to advance to 2 / 10
    await page.locator('#next-btn').click();
    await expect(feedbackOverlay).toBeHidden();
    await expect(progressPill).toContainText('2 / 10');

    // Verify mode switching (A, B, C, D, E) resets game to 1 / 10 and renders appropriate visuals
    const modes = ['A', 'B', 'C', 'D', 'E'];
    for (const mode of modes) {
      const modeBtn = page.locator(`.mode-filter-btn[data-mode="${mode}"]`);
      await modeBtn.click();
      await expect(modeBtn).toHaveClass(/active/);
      await expect(progressPill).toContainText('1 / 10');

      const promptAfterSwitch = await questionText.textContent();
      expect(promptAfterSwitch).not.toContain('undefined');

      if (mode === 'A' || mode === 'B') {
        await expect(page.locator('#question-visual img.question-image')).toBeVisible();
      } else if (mode === 'C') {
        await expect(page.locator('#options-grid.options-grid--images img').first()).toBeVisible();
      } else if (mode === 'E') {
        await expect(page.locator('#question-visual .audio-hero-btn')).toBeVisible();
      }
    }
  });

  test('seeds localStorage and verifies 13 badge cards render with collector, type_specialist, and quiz_master unlocked', async ({ page }) => {
    // 10 Grass-type Pokémon IDs in PokopiaDex dataset
    const tenGrassPokemonIds = [1, 2, 3, 13, 14, 15, 16, 17, 18, 21];

    await page.addInitScript(({ collectedIds }) => {
      localStorage.setItem('pokopia-collected', JSON.stringify(collectedIds));
      localStorage.setItem('pokopia-quiz-stats', JSON.stringify({ maxCombo: 6, bestCorrect: 9 }));
    }, { collectedIds: tenGrassPokemonIds });

    await page.goto('/badges.html');

    const badgeCards = page.locator('.badge-card');
    await expect(badgeCards).toHaveCount(13);

    // Verify collector, type_specialist, and quiz_master are unlocked
    const collectorBadge = page.locator('.badge-card[data-badge-id="collector"]');
    const typeSpecialistBadge = page.locator('.badge-card[data-badge-id="type_specialist"]');
    const quizMasterBadge = page.locator('.badge-card[data-badge-id="quiz_master"]');

    await expect(collectorBadge).toHaveClass(/badge-card--unlocked/);
    await expect(typeSpecialistBadge).toHaveClass(/badge-card--unlocked/);
    await expect(quizMasterBadge).toHaveClass(/badge-card--unlocked/);

    // Verify explorer (needs 30) remains locked
    const explorerBadge = page.locator('.badge-card[data-badge-id="explorer"]');
    await expect(explorerBadge).toHaveClass(/badge-card--locked/);
  });
});
