import { test, expect } from '@playwright/test';

test.describe('Box Score Functionality', () => {
  test('should display box score and switch tabs', async ({ page }) => {
    // Navigate to a game page (using a sample ID)
    await page.goto('/game/0022300001', { waitUntil: 'networkidle' });

    // Wait for the controls to be visible
    await page.getByTestId('seek-slider').waitFor({ state: 'visible', timeout: 15000 });

    // Box Score should be default now
    // It could contain "HOME:", "AWAY:", or specific team names
    await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 });

    // Check for table headers in Box Score
    await expect(page.locator('th').getByText('PTS').first()).toBeVisible();
    await expect(page.locator('th').getByText('FG%').first()).toBeVisible();

    // Switch back to Play-by-Play
    await page.getByRole('button', { name: 'Play-by-Play' }).click({ force: true });
    await expect(page.locator('h2').getByText('Play-by-Play')).toBeVisible();

    // Switch back to Box Score
    await page.getByRole('button', { name: 'Box Score' }).click({ force: true });
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('should update box score when seeking', async ({ page }) => {
    await page.goto('/game/0022300001', { waitUntil: 'networkidle' });
    await page.getByTestId('seek-slider').waitFor({ state: 'visible', timeout: 15000 });

    // Switch to Box Score tab
    await page.getByRole('button', { name: 'Box Score' }).click({ force: true });

    // Seek to the end of the game
    const seekSlider = page.getByTestId('seek-slider');
    const maxVal = await seekSlider.getAttribute('max');
    if (maxVal) {
      // Use floor to ensure it's a valid integer for step="1"
      await seekSlider.fill(Math.floor(parseFloat(maxVal)).toString());
    }

    // Now totals should be updated
    await expect(async () => {
      const updatedTotals = await page.locator('tr:has-text("TOTALS")').allTextContents();
      // At least one of the scores should be greater than 0
      const combinedText = updatedTotals.join(' ');
      const scores = combinedText.match(/\d+/g);
      const hasPoints = scores?.some(s => parseInt(s) > 0);
      expect(hasPoints).toBe(true);
    }).toPass({ timeout: 30000 });
  });

  test('should display score in header', async ({ page }) => {
    await page.goto('/game/0022300001', { waitUntil: 'networkidle' });

    // Initial score should have 0s
    await expect(page.locator('span:has-text("Score")').locator('xpath=following-sibling::div')).toContainText('0');

    // Seek to middle
    const seekSlider = page.getByTestId('seek-slider');
    await seekSlider.fill('1000');

    // Score should change
    await expect(async () => {
      const scoreText = await page.locator('span:has-text("Score")').locator('xpath=following-sibling::div').textContent();
      // Should not be "0 - 0" if we check numbers, but simplified check:
      const scores = scoreText?.match(/\d+/g);
      const hasPoints = scores?.some(s => parseInt(s) > 0);
      expect(hasPoints).toBe(true);
    }).toPass({ timeout: 30000 });
  });
});
