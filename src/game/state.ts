import { createEnemies, updateEnemy } from './enemies.js';
import { resolveCombat } from './combat.js';
import { createPlayer, movePlayer } from './player.js';
import { END } from './world.js';
import type { GameState, Input } from './types.js';
export function createGame(phase: GameState['phase'] = 'ready', deaths = 0): GameState {
  return { phase, player: createPlayer(), enemies: createEnemies(), time: 0, kills: 0, bestX: 2, deaths };
}
export function stepGame(s: GameState, input: Input, dt: number) {
  if (s.phase !== 'playing') return;
  s.time += dt;
  movePlayer(s.player, input, dt);
  for (const e of s.enemies) updateEnemy(e, s.player, dt);
  s.kills += resolveCombat(s.player, s.enemies);
  s.bestX = Math.max(s.bestX, s.player.x);
  if (s.player.y < -8 || s.player.hp <= 0) { s.player.hp = 0; s.phase = 'dead'; s.deaths++; }
  else if (Math.abs(s.player.x - END) < 2 && Math.abs(s.player.y - 3) < 0.5) s.phase = 'won';
}
