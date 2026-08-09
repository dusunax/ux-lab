import { test, expect } from '@playwright/test';

test.describe('MythGraph E2E Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003');
    // Wait for graph to load
    await page.waitForTimeout(3000);
  });

  test('should capture initial graph view with Bloom layout', async ({ page }) => {
    // Wait for graph nodes to render
    await page.waitForSelector('[data-id="zeus"]', { timeout: 5000 }).catch(() => null);

    // Take screenshot of initial view
    await page.screenshot({
      path: 'docs/presentations/sprint-mythgraph-2/initial-view.png',
      fullPage: false,
    });
  });

  test('should capture search functionality with results', async ({ page }) => {
    // Wait for search input
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="Search"], input[type="text"]').first();

    if (await searchInput.isVisible()) {
      // Type search query
      await searchInput.fill('apollo');

      // Wait for results
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({
        path: 'docs/presentations/sprint-mythgraph-2/search-results.png',
        fullPage: false,
      });
    }
  });

  test('should capture graph with multiple nodes visible', async ({ page }) => {
    // Adjust node count slider if available
    const slider = page.locator('input[type="range"]').first();

    if (await slider.isVisible()) {
      await slider.evaluate((el: any) => {
        el.value = 40;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Wait for layout recalculation
      await page.waitForTimeout(3000);
    }

    // Take screenshot
    await page.screenshot({
      path: 'docs/presentations/sprint-mythgraph-2/large-graph.png',
      fullPage: false,
    });
  });

  test('should capture empty search state', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="Search"], input[type="text"]').first();

    if (await searchInput.isVisible()) {
      // Search for non-existent entity
      await searchInput.fill('nonexistententity12345');

      // Click search button or press Enter
      const searchButton = page.locator('button:has-text("검색"), button:has-text("Search")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }

      // Wait for results
      await page.waitForTimeout(2000);

      // Take screenshot showing empty state
      await page.screenshot({
        path: 'docs/presentations/sprint-mythgraph-2/empty-search.png',
        fullPage: false,
      });
    }
  });
});
