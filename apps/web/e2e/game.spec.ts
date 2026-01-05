import { test, expect } from '@playwright/test';

test.describe('Game Rewind Page', () => {
  test('should navigate from home to game page and display events', async ({ page }) => {
    // Go to a date that is likely to have games (using the default in the app)
    await page.goto('/?date=2026-01-04');

    // Wait for games to load and click the first game card
    const gameCard = page.getByTestId('game-card').first();
    await expect(gameCard).toBeVisible();
    
    // Click the card to navigate
    await gameCard.click();

    // Check if we are on the game page
    await expect(page).toHaveURL(/\/game\/.*/);
    
    // Check for page title
    await expect(page.locator('h1')).toContainText('Game Rewind');
    
    // Check for the events table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th')).toContainText(['Period', 'Time', 'Score', 'Event Description']);
  });

  test('should navigate back to scoreboard', async ({ page }) => {
    // Direct navigation to a game page (using a dummy ID)
    await page.goto('/game/0022300001');

    // Click back link
    await page.getByRole('link', { name: 'Back to Scoreboard' }).click();

    // Check if we are back on the home page
    await expect(page).toHaveURL('/');
  });
});
