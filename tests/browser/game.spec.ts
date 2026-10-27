import { test, expect, type Page } from '@playwright/test';
import type { GameState } from '../../src/game/types';
type Snapshot = GameState & { cameraX: number };
const snapshot = (page: Page) => page.evaluate(() => (window as unknown as { __game: Snapshot }).__game);
async function reach(page: Page, x: number) {
  await page.keyboard.down('KeyD');
  await page.waitForFunction(target => (window as unknown as { __game: Snapshot }).__game.player.x >= target, x, { timeout: 20_000 });
  await page.keyboard.up('KeyD');
}
test('keyboard movement, vertical traversal, pause, combat, death and restart', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('button', { name: 'Begin the journey' })).toBeVisible();
  await page.screenshot({ path: 'test-results/title.png' });
  await page.keyboard.press('Enter');
  await reach(page, 11);
  const start = await snapshot(page); expect(start.player.x).toBeGreaterThan(10); expect(start.cameraX).toBeGreaterThan(7);
  await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.player.y > 3);
  await page.keyboard.up('KeyD');
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.player.grounded);
  expect((await snapshot(page)).player.y).toBe(2.5);
  await page.keyboard.press('Escape'); const paused = await snapshot(page);
  await page.waitForTimeout(250); expect((await snapshot(page)).time).toBe(paused.time);
  await page.keyboard.press('Escape');
  // Start a clean run, then meet the first boar with the spear ready.
  await page.keyboard.press('KeyR'); await page.keyboard.down('KeyJ');
  await reach(page, 18.5);
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.kills >= 1, undefined, { timeout: 15000 });
  await page.keyboard.up('KeyJ');
  const fought = await snapshot(page); expect(fought.kills).toBeGreaterThanOrEqual(1);
  await page.screenshot({ path: 'test-results/combat.png' });
  await reach(page, 35); // Intentionally walk into the ravine.
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.phase === 'dead');
  await expect(page.getByRole('button', { name: 'Rise again' })).toBeVisible();
  expect((await snapshot(page)).player.hp).toBe(0);
  await page.keyboard.press('Enter'); expect((await snapshot(page)).player.hp).toBe(4);
  expect((await snapshot(page)).phase).toBe('playing'); expect(errors).toEqual([]);
});
test('complete the trail and rescue the queen using keyboard controls', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Enter');
  // Jump the first patrol, land before the ravine, and cross it from the edge.
  await reach(page, 16); await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForTimeout(1200); await page.keyboard.up('KeyD');
  await reach(page, 30.5); await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.player.x > 41);
  await page.keyboard.up('KeyD');
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.player.grounded);
  await reach(page, 43); await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForTimeout(1200); await page.keyboard.up('KeyD');
  await reach(page, 68); await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForTimeout(1200); await page.keyboard.up('KeyD');
  await reach(page, 86); await page.keyboard.press('Space'); await page.keyboard.down('KeyD');
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.player.x > 92);
  await page.keyboard.up('KeyD');
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.phase === 'won');
  await expect(page.getByRole('button', { name: 'Journey again' })).toBeVisible();
  await page.screenshot({ path: 'test-results/victory.png' });
  await page.keyboard.press('KeyR'); expect((await snapshot(page)).phase).toBe('playing');
});

test('a charging enemy damages the player and the HUD; buttons resume and restart', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the journey' }).click();
  await reach(page, 18.5);
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.player.hp < 4);
  const hurt = await snapshot(page);
  expect(hurt.player.hp).toBeGreaterThan(0);
  expect(hurt.player.invulnerable).toBeGreaterThan(0);
  await expect(page.locator('#health')).toHaveAttribute('aria-label', `Health: ${hurt.player.hp} of 4`);
  await page.getByRole('button', { name: 'Pause game' }).click();
  expect((await snapshot(page)).phase).toBe('paused');
  await page.getByRole('button', { name: 'Continue the journey' }).click();
  expect((await snapshot(page)).phase).toBe('playing');
  await page.keyboard.press('KeyR');
  expect((await snapshot(page)).player.hp).toBe(4);
});
