import { test, expect, Page } from '@playwright/test';

const TAILWIND_XL_BREAKPOINT_PX = 1280;
const STACKED_MIN_VERTICAL_GAP_PX = 50;
const SAME_ROW_Y_TOLERANCE_PX = 5;
const SIDE_BY_SIDE_MIN_HORIZONTAL_GAP_PX = 100;

async function loadBoxScoreSections(page: Page, viewportWidth: number) {
  await page.setViewportSize({ width: viewportWidth, height: 900 });
  await page.goto('/game/0022300001', { waitUntil: 'networkidle' });
  await page.getByTestId('seek-slider').waitFor({ state: 'visible', timeout: 15000 });

  const sections = page.getByTestId('boxscore-section');
  await expect(sections).toHaveCount(2, { timeout: 10000 });

  const awayBox = await page.locator('[data-testid="boxscore-section"][data-team-side="away"]').boundingBox();
  const homeBox = await page.locator('[data-testid="boxscore-section"][data-team-side="home"]').boundingBox();
  expect(awayBox).not.toBeNull();
  expect(homeBox).not.toBeNull();
  return { awayBox: awayBox!, homeBox: homeBox! };
}

test.describe('Box Score Side-by-Side Layout', () => {
  test('stacks vertically below xl breakpoint', async ({ page }) => {
    const { awayBox, homeBox } = await loadBoxScoreSections(page, TAILWIND_XL_BREAKPOINT_PX - 256);
    expect(homeBox.y).toBeGreaterThan(awayBox.y + STACKED_MIN_VERTICAL_GAP_PX);
  });

  test('places teams side-by-side at xl breakpoint', async ({ page }) => {
    const { awayBox, homeBox } = await loadBoxScoreSections(page, TAILWIND_XL_BREAKPOINT_PX + 160);
    expect(Math.abs(awayBox.y - homeBox.y)).toBeLessThan(SAME_ROW_Y_TOLERANCE_PX);
    expect(homeBox.x).toBeGreaterThan(awayBox.x + SIDE_BY_SIDE_MIN_HORIZONTAL_GAP_PX);
  });
});
