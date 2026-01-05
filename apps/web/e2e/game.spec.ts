import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock Scoreboard API
  await page.route(/.*stats\.nba\.com\/stats\/scoreboardv2.*/, async (route) => {
    const json = {
      resource: "ScoreboardV2",
      parameters: { GameDate: "2026-01-04", LeagueID: "00", DayOffset: "0" },
      resultSets: [
        {
          name: "GameHeader",
          headers: ["GAME_ID", "GAME_DATE_EST", "HOME_TEAM_ID", "VISITOR_TEAM_ID", "GAME_STATUS_TEXT"],
          rowSet: [["0022300001", "2026-01-04T00:00:00", 1610612737, 1610612754, "Final"]],
        },
        {
          name: "LineScore",
          headers: ["GAME_ID", "TEAM_ID", "TEAM_CITY_NAME", "TEAM_NAME", "PTS"],
          rowSet: [
            ["0022300001", 1610612737, "Atlanta", "Hawks", 110],
            ["0022300001", 1610612754, "Indiana", "Pacers", 120],
          ],
        },
      ],
    };
    await route.fulfill({ json });
  });

  // Mock Play-by-Play V3 API
  await page.route(/.*cdn\.nba\.com\/static\/json\/liveData\/playbyplay\/playbyplay_.*\.json/, async (route) => {
    const json = {
      game: {
        gameId: "0022300001",
        actions: [
          {
            actionNumber: 2,
            clock: "PT12M00.00S",
            timeActual: "2024-01-01T00:00:00Z",
            period: 1,
            actionType: "period",
            subType: "start",
            description: "Period Start",
            scoreHome: "0",
            scoreAway: "0",
          },
          {
            actionNumber: 7,
            clock: "PT11M30.00S",
            timeActual: "2024-01-01T00:00:30Z",
            period: 1,
            actionType: "2pt",
            subType: "jump-shot",
            description: "Jump Shot",
            scoreHome: "0",
            scoreAway: "2",
            playerName: "Player A",
            teamTriplet: "IND",
            pointsTotal: 2,
          },
        ],
      },
    };
    await route.fulfill({ json });
  });

  // Mock Boxscore V3 API
  await page.route(/.*cdn\.nba\.com\/static\/json\/liveData\/boxscore\/boxscore_.*\.json/, async (route) => {
    const json = {
      game: {
        gameId: "0022300001",
        gameStatus: 3,
        homeTeam: {
          teamId: 1610612737,
          teamName: "Hawks",
          teamCity: "Atlanta",
          teamTricode: "ATL",
          players: [],
        },
        awayTeam: {
          teamId: 1610612754,
          teamName: "Pacers",
          teamCity: "Indiana",
          teamTricode: "IND",
          players: [],
        },
      },
    };
    await route.fulfill({ json });
  });
});

test.describe('Game Rewind Page', () => {
  test('should navigate from home to game page and display events', async ({ page }) => {
    // Go to a date that is likely to have games
    await page.goto('/?date=2026-01-04', { waitUntil: 'networkidle' });

    // Wait for games to load and click the first game card
    const gameCard = page.getByTestId('game-card').first();
    await gameCard.waitFor({ state: 'visible', timeout: 10000 });
    
    // Click the card to navigate
    await gameCard.click({ force: true });

    // Check if we are on the game page
    await expect(page).toHaveURL(/\/game\/.*/, { timeout: 10000 });
    
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
    await expect(page).toHaveURL('/', { timeout: 10000 });
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
    }).toPass({ timeout: 10000 });
  });
});
