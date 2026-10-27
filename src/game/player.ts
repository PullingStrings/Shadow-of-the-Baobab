import type { Input, Player } from './types.js';
import { integrate } from './physics.js';
import { ATTACKS } from './attacks.js';
export function createPlayer(): Player {
  return { x: 2, y: 0, vx: 0, vy: 0, grounded: true, hp: 4, facing: 1, invulnerable: 0, attack: 0, attackKind: 'poke', cooldown: 0, coyote: 0.12, buffer: 0, attackId: 0 };
}
export function movePlayer(p: Player, input: Input, dt: number) {
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.attack = Math.max(0, p.attack - dt);
  p.coyote = p.grounded ? 0.12 : Math.max(0, p.coyote - dt);
  p.buffer = input.jump ? 0.14 : Math.max(0, p.buffer - dt);
  if (input.axis) p.facing = Math.sign(input.axis);
  const target = input.axis * 9;
  const acceleration = (input.axis ? 65 : 85) * dt;
  p.vx += Math.max(-acceleration, Math.min(acceleration, target - p.vx));
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = 17.5; p.buffer = 0; p.coyote = 0; p.grounded = false;
  }
  if ((input.attack || input.slash) && p.cooldown <= 0) {
    p.attackKind = input.slash ? 'slash' : 'poke';
    const spec = ATTACKS[p.attackKind];
    p.attack = spec.duration; p.cooldown = spec.cooldown; p.attackId++;
  }
  integrate(p, dt);
}
