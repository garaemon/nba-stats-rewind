import { test, expect } from '@playwright/test';

test.describe('Game Rewind Page', () => {
  test('should navigate from home to game page and display events', async ({ page }) => {
    // Go to a date that is likely to have games
    await page.goto('/?date=2026-01-04', { waitUntil: 'networkidle' });

    // Wait for games to load and click the first game card
    const gameCard = page.getByTestId('game-card').first();
    await gameCard.waitFor({ state: 'visible', timeout: 30000 });
    
    // Click the card to navigate
    await gameCard.click({ force: true });

    // Check if we are on the game page
    await expect(page).toHaveURL(/\/game\/.*/, { timeout: 30000 });
    
    // Check for page title (now contains team names)
    await expect(page.locator('h1')).toContainText(/vs|Game Rewind/);
    
    // Check for the events table (there are now multiple tables in box score view)
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('should navigate back to scoreboard', async ({ page }) => {
    // Direct navigation to a game page (using a dummy ID)
    await page.goto('/game/0022300001', { waitUntil: 'networkidle' });

    // Click back link
    await page.getByRole('link', { name: 'Back to Scoreboard' }).click({ force: true });

    // Check if we are back on the home page
    await expect(page).toHaveURL('/', { timeout: 30000 });
  });

  test('should control playback and filter events', async ({ page }) => {
    // Using a sample game ID
    await page.goto('/game/0022300001', { waitUntil: 'networkidle' });

    // Initially should show box score tables
    await expect(page.locator('table').first()).toBeVisible();

    // Check playback controls
    const playButton = page.getByRole('button', { name: 'Play', exact: true });
    await playButton.waitFor({ state: 'visible' });

    const speedSelect = page.getByRole('combobox');
    await expect(speedSelect).toHaveValue('1');

    // Seek to a later point in the game
    const seekSlider = page.getByTestId('seek-slider');
    
    // Set slider to a specific value (e.g., 10 minutes into the real-world time)
    await seekSlider.fill('600');
    
    // Check if both clocks are visible
    await expect(page.getByTestId('current-game-clock')).toBeVisible();
    await expect(page.getByTestId('current-actual-time')).toBeVisible();

    // Toggle play
    await playButton.click({ force: true });
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    // Speed up to see time changes quickly
    await speedSelect.selectOption('100');
    
    // Wait for actual time to progress
    await expect(async () => {
      const actualTimeText = await page.getByTestId('current-actual-time').textContent();
      // It should be a valid time format like HH:MM:SS JST or similar
      expect(actualTimeText).toMatch(/\d{2}:\d{2}:\d{2}.+/);
    }).toPass({ timeout: 30000 });
  });
});
