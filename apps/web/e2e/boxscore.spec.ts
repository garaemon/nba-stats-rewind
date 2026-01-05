import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock Scoreboard API
  await page.route(/.*stats\.nba\.com\/stats\/scoreboardv2.*/, async (route) => {
    const json = {
      resource: "ScoreboardV2",
      parameters: { GameDate: "2024-01-01", LeagueID: "00", DayOffset: "0" },
      resultSets: [
        {
          name: "GameHeader",
          headers: ["GAME_ID", "GAME_DATE_EST", "HOME_TEAM_ID", "VISITOR_TEAM_ID", "GAME_STATUS_TEXT"],
          rowSet: [["0022300001", "2024-01-01T00:00:00", 1610612737, 1610612754, "Final"]],
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
    }).toPass({ timeout: 10000 });
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
    }).toPass({ timeout: 10000 });
  });
});
