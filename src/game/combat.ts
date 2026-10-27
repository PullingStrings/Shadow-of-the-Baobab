import type { Enemy, Player } from './types.js';
export function hurtPlayer(p: Player, direction: number): boolean {
  if (p.invulnerable > 0 || p.hp <= 0) return false;
  p.hp--; p.invulnerable = 1.4; p.vx = direction * 12; p.vy = 7;
  return true;
}
export function resolveCombat(p: Player, enemies: Enemy[]): number {
  let kills = 0;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - p.x;
    if (p.attack > 0.05 && p.attack < 0.27 && e.hitBy !== p.attackId && dx * p.facing > -0.4 && dx * p.facing < 3 && p.y < 1.7) {
      e.hp--; e.hitBy = p.attackId; e.x += p.facing * 1.1; e.mode = e.hp <= 0 ? 'dead' : 'recover'; e.timer = 0.8;
      if (e.hp <= 0) kills++;
    } else if (Math.abs(e.x - p.x) < 1.25 && p.y < 1.1 && e.mode !== 'recover') {
      hurtPlayer(p, dx > 0 ? -1 : 1);
    }
  }
  return kills;
}
