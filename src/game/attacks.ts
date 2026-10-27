import type { AttackKind, Player } from './types.js';

export const ENEMY_MAX_HP = 3;
export const ENEMY_HURTBOX = { halfWidth: 1.25, bottom: 0.15, top: 1.7 };
export const ATTACKS = {
  poke: { duration: 0.3, cooldown: 0.4, activeFrom: 0.03, activeTo: 0.25, reach: 3, bottom: 0.8, top: 1.75, knockback: 0.45 },
  slash: { duration: 0.42, cooldown: 0.55, activeFrom: 0.07, activeTo: 0.32, reach: 2.35, bottom: -0.35, top: 2.6, knockback: 0.45 },
} satisfies Record<AttackKind, { duration: number; cooldown: number; activeFrom: number; activeTo: number; reach: number; bottom: number; top: number; knockback: number }>;

export function attackProgress(player: Player) {
  const spec = ATTACKS[player.attackKind ?? 'poke'];
  return Math.max(0, Math.min(1, (spec.duration - player.attack) / spec.duration));
}
export function attackIsActive(player: Player) {
  const spec = ATTACKS[player.attackKind ?? 'poke'];
  const elapsed = spec.duration - player.attack;
  return player.attack > 0 && elapsed >= spec.activeFrom && elapsed <= spec.activeTo;
}
