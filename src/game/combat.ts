import type { Enemy, Player } from './types.js';
import { ATTACKS, ENEMY_HURTBOX, attackIsActive } from './attacks.js';
export function hurtPlayer(p: Player, direction: number): boolean {
  if (p.invulnerable > 0 || p.hp <= 0) return false;
  p.hp--; p.invulnerable = 1.4; p.vx = direction * 12; p.vy = 7;
  return true;
}
/** Test the attack against the lion's BODY extent, not only its root/centre. */
export function attackOverlapsEnemy(p: Player, e: Enemy): boolean {
  const attack = ATTACKS[p.attackKind ?? 'poke'];
  const forward = (e.x - p.x) * p.facing;
  const horizontal = forward > -0.35 && forward - ENEMY_HURTBOX.halfWidth <= attack.reach;
  const vertical = p.y + attack.bottom <= e.y + ENEMY_HURTBOX.top && p.y + attack.top >= e.y + ENEMY_HURTBOX.bottom;
  return horizontal && vertical;
}
export function resolveCombat(p: Player, enemies: Enemy[]): number {
  let kills = 0;
  const attack = ATTACKS[p.attackKind ?? 'poke'];
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - p.x;
    // Patrol, windup and recovery are all vulnerable. Each attack ID can hit
    // each lion once, even while a held input repeats on subsequent cooldowns.
    if (attackIsActive(p) && e.hitBy !== p.attackId && attackOverlapsEnemy(p, e)) {
      e.hp--; e.hitBy = p.attackId; e.x += p.facing * attack.knockback;
      e.mode = e.hp <= 0 ? 'dead' : 'recover'; e.timer = 0.8;
      if (e.hp <= 0) kills++;
    } else if (Math.abs(dx) < 1.25 && p.y < e.y + 1.1 && p.y + 2.2 > e.y && e.mode !== 'recover') {
      hurtPlayer(p, dx > 0 ? -1 : 1);
    }
  }
  return kills;
}
