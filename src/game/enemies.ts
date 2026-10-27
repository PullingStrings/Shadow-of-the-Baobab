import type { Enemy, Player } from './types.js';
import { enemyHomes, ground } from './world.js';
export function createEnemies(): Enemy[] {
  return enemyHomes.map(x => ({ x, y: 0, home: x, hp: 2, facing: -1, mode: 'patrol', timer: 0, hitBy: -1 }));
}
export function updateEnemy(e: Enemy, p: Player, dt: number) {
  if (e.hp <= 0) { e.mode = 'dead'; return; }
  e.timer -= dt;
  if (e.mode === 'patrol') {
    e.x += e.facing * 1.5 * dt;
    if (Math.abs(e.x - e.home) > 3) e.facing *= -1;
    if (Math.abs(p.x - e.x) < 8 && p.y < 2) {
      e.facing = p.x < e.x ? -1 : 1; e.mode = 'windup'; e.timer = 0.65;
    }
  } else if (e.mode === 'windup' && e.timer <= 0) { e.mode = 'charge'; e.timer = 0.8; }
  else if (e.mode === 'charge') {
    e.x += e.facing * 12 * dt;
    if (e.timer <= 0 || Math.abs(e.x - e.home) > 10) { e.mode = 'recover'; e.timer = 1.2; }
  } else if (e.mode === 'recover' && e.timer <= 0) { e.mode = 'patrol'; e.facing = e.x > e.home ? -1 : 1; }
  const territory = ground.find(g => e.home >= g.from && e.home <= g.to)!;
  const left = Math.max(e.home - 10, territory.from + 1);
  const right = Math.min(e.home + 10, territory.to - 1);
  if (e.x < left || e.x > right) {
    e.x = Math.max(left, Math.min(right, e.x));
    if (e.mode === 'charge') { e.mode = 'recover'; e.timer = 1.2; }
  }
}
