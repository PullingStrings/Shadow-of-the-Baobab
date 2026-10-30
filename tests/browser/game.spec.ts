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
  // Start a clean run, then meet the first lion with the spear ready.
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
  const sanctuaryArt = ['sanctuary/valley.webp', 'sanctuary/shrine.webp', 'sanctuary/queen.webp', 'trail/sunset-trail.webp'].map(file => page.waitForResponse(response => response.url().endsWith(`/art/${file}`) && response.ok()));
  await page.goto('/'); await Promise.all(sanctuaryArt); await page.keyboard.press('Enter');
  // Jump the first patrol, land before the ravine, and cross it from the edge.
  await reach(page, 16); await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForTimeout(1200); await page.keyboard.up('KeyD');
  await reach(page, 30.5); await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.player.x > 41);
  await page.keyboard.up('KeyD');
  await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.player.grounded);
  await reach(page, 43); await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForTimeout(1200); await page.keyboard.up('KeyD');
  await reach(page, 68);
  await page.screenshot({ path: 'test-results/ancient-trail.png' });
  await page.keyboard.down('KeyD'); await page.keyboard.press('Space');
  await page.waitForTimeout(1200); await page.keyboard.up('KeyD');
  await reach(page, 86);
  await page.screenshot({ path: 'test-results/sanctuary-approach.png' });
  await page.keyboard.press('Space'); await page.keyboard.down('KeyD');
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

for (const key of ['KeyJ', 'KeyK', 'KeyX']) {
  test(`${key} selects its attack and can defeat the first lion`, async ({ page }) => {
    await page.goto('/'); await page.keyboard.press('Enter');
    await page.keyboard.down(key); await reach(page, 18.5);
    await page.waitForFunction(kind => {
      const p = (window as unknown as { __game: Snapshot }).__game.player;
      return p.attack > 0 && p.attackKind === kind;
    }, key === 'KeyJ' ? 'poke' : 'slash');
    await page.waitForFunction(() => (window as unknown as { __game: Snapshot }).__game.kills >= 1, undefined, { timeout: 15000 });
    await page.keyboard.up(key);
    const state = await snapshot(page);
    expect(state.enemies[0].hp).toBe(0); expect(state.player.hp).toBeGreaterThan(0);
  });
}

test('sound unlocks on begin, pauses, mutes and persists independent volume settings', async ({ page }) => {
  await page.goto('/');
  const audio = () => page.evaluate(() => (window as unknown as { __game: { audio: { contextState: string; muted: boolean; effects: number; ambience: number; music: number; voices: number } } }).__game.audio);
  expect((await audio()).contextState).toBe('locked');
  await page.getByRole('button', { name: 'Begin the journey' }).click();
  await page.waitForFunction(() => (window as unknown as { __game: { audio: { contextState: string } } }).__game.audio.contextState === 'running');
  await page.waitForFunction(() => (window as unknown as { __game: { audio: { musicStatus: string; musicLayers: number } } }).__game.audio.musicStatus === 'ready' && (window as unknown as { __game: { audio: { musicLayers: number } } }).__game.audio.musicLayers === 2);
  await page.keyboard.down('KeyJ');
  await page.waitForFunction(() => (window as unknown as { __game: { audio: { voices: number } } }).__game.audio.voices > 0);
  await page.keyboard.up('KeyJ');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => (window as unknown as { __game: { audio: { contextState: string } } }).__game.audio.contextState === 'suspended');
  await page.keyboard.press('KeyM'); expect((await audio()).muted).toBe(true);
  await expect(page.getByRole('button', { name: 'Unmute sound (M)', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByText('Sound settings', { exact: true }).click();
  await page.locator('#volume-effects').focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight');
  expect((await audio()).effects).toBe(0.01); expect((await audio()).ambience).toBe(0.3);
  await page.locator('#volume-music').focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight'); expect((await audio()).music).toBe(0.01);
  await page.reload(); expect((await audio()).music).toBe(0.01); expect((await audio()).muted).toBe(true); expect((await audio()).effects).toBe(0.01);
  await page.getByRole('button', { name: 'Begin the journey' }).click();
  await page.getByRole('button', { name: 'Unmute sound (M)', exact: true }).click(); expect((await audio()).muted).toBe(false);
  const before = (await snapshot(page)).player.x;
  await page.getByText('Sound settings', { exact: true }).click(); await page.locator('#volume-ambience').focus(); await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150); expect((await snapshot(page)).player.x).toBe(before);
});

test('an unavailable audio device does not stop the journey', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'AudioContext', { value: class { constructor() { throw new Error('Audio device unavailable'); } } }));
  await page.goto('/'); await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as unknown as { __game: { audio: { status: string } } }).__game.audio.status === 'unavailable');
  await reach(page, 5); expect((await snapshot(page)).phase).toBe('playing');
});

test('missing background music leaves effects and the journey available', async ({ page }) => {
  await page.route('**/audio/music/**', route => route.abort());
  await page.goto('/'); await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as unknown as { __game: { audio: { musicStatus: string } } }).__game.audio.musicStatus === 'unavailable');
  await page.keyboard.down('KeyJ');
  await page.waitForFunction(() => (window as unknown as { __game: { audio: { voices: number } } }).__game.audio.voices > 0);
  await page.keyboard.up('KeyJ'); await reach(page, 5); expect((await snapshot(page)).phase).toBe('playing');
});
