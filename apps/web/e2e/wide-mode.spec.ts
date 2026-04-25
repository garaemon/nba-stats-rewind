import { test, expect } from '@playwright/test';

test.describe('Wide Mode', () => {
  test('toggles between tabbed view and wide-mode single-page layout', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto('/game/0022300001', { waitUntil: 'networkidle' });
    await page.getByTestId('seek-slider').waitFor({ state: 'visible', timeout: 15000 });

    const toggle = page.getByTestId('wide-mode-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('Wide Mode');

    await expect(page.getByRole('button', { name: 'Box Score' })).toBeVisible();
    await expect(page.getByTestId('wide-mode-layout')).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveText('Exit Wide Mode');
    await expect(page.getByRole('button', { name: 'Box Score' })).toHaveCount(0);
    await expect(page.getByTestId('wide-mode-layout')).toBeVisible();

    await expect(page.locator('h2', { hasText: 'Play-by-Play' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Team Comparison' })).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveText('Wide Mode');
    await expect(page.getByRole('button', { name: 'Box Score' })).toBeVisible();
  });
});
