import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the correct date and handle navigation', async ({ page }) => {
    await page.goto('/?date=2024-01-01');

    // Check if the date is displayed correctly
    await expect(page.locator('h2')).toContainText('January 1, 2024');

    // Navigate to previous day
    await page.getByTestId('prev-date').click({ force: true });
    await expect(page).toHaveURL(/.*date=2023-12-31/);
    await expect(page.locator('h2')).toContainText('December 31, 2023');

    // Navigate back to Jan 1
    await page.getByTestId('next-date').click({ force: true });
    await expect(page).toHaveURL(/.*date=2024-01-01/);

    // Navigate to next day (Jan 2)
    await page.getByTestId('next-date').click({ force: true });
    await expect(page).toHaveURL(/.*date=2024-01-02/);
    await expect(page.locator('h2')).toContainText('January 2, 2024');
  });

  test('should toggle score visibility in game cards', async ({ page }) => {
    await page.goto('/?date=2024-01-01');

    // Wait for games to load
    const gameCard = page.getByTestId('game-card').first();
    await expect(gameCard).toBeVisible();

    // Score should be blurred/hidden initially
    const score = gameCard.getByTestId('visitor-score');
    await expect(score).toHaveClass(/blur-md/);

    // Click to show score (via button)
    await gameCard.getByRole('button', { name: 'Show Score' }).click({ force: true });
    await expect(score).not.toHaveClass(/blur-md/);
    await expect(gameCard).toContainText('Visible');

    // Click again to hide score (via button)
    await gameCard.getByRole('button', { name: 'Hide Score' }).click({ force: true });
    await expect(score).toHaveClass(/blur-md/);
  });
});
