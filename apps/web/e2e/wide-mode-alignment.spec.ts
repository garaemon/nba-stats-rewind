import { test, expect } from '@playwright/test';

const BOTTOM_ALIGNMENT_TOLERANCE_PX = 2;

test.describe('Wide Mode Panel Alignment', () => {
  test('aligns bottoms of Play-by-Play and Team Comparison', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto('/game/0022300001', { waitUntil: 'networkidle' });
    await page.getByTestId('seek-slider').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByTestId('wide-mode-toggle').click();
    await expect(page.getByTestId('wide-mode-layout')).toBeVisible();

    const pbpPanel = page.locator('h2', { hasText: 'Play-by-Play' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
    const comparisonPanel = page.locator('h2', { hasText: 'Team Comparison' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');

    const pbpBox = await pbpPanel.boundingBox();
    const comparisonBox = await comparisonPanel.boundingBox();
    expect(pbpBox).not.toBeNull();
    expect(comparisonBox).not.toBeNull();

    const pbpBottom = pbpBox!.y + pbpBox!.height;
    const comparisonBottom = comparisonBox!.y + comparisonBox!.height;
    expect(Math.abs(pbpBottom - comparisonBottom)).toBeLessThanOrEqual(BOTTOM_ALIGNMENT_TOLERANCE_PX);
  });
});
