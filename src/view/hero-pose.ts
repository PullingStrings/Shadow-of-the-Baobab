import type { Phase, Player } from '../game/types.js';

export interface Point { x: number; y: number }
export interface LimbPose { start: Point; joint: Point; end: Point }
export type HeroAction = 'idle' | 'run' | 'rise' | 'fall' | 'strike' | 'hurt' | 'dead';
export const BOOT_SOLE_OFFSET = 70 * (0.45 / 276);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Analytic two-bone IK. All coordinates are facing-right, root-local view units. */
export function solveLimb(start: Point, target: Point, upper: number, lower: number, bend: 1 | -1): LimbPose {
  const dx = target.x - start.x, dy = target.y - start.y;
  const requested = Math.hypot(dx, dy);
  const distance = clamp(requested, Math.abs(upper - lower) + 0.0001, upper + lower - 0.0001);
  const aim = requested > 0.0001 ? Math.atan2(dy, dx) : -Math.PI / 2;
  const offset = Math.acos(clamp((upper * upper + distance * distance - lower * lower) / (2 * upper * distance), -1, 1));
  return {
    start,
    joint: { x: start.x + Math.cos(aim + bend * offset) * upper, y: start.y + Math.sin(aim + bend * offset) * upper },
    end: { x: start.x + Math.cos(aim) * distance, y: start.y + Math.sin(aim) * distance },
  };
}

export function heroPose(player: Player, time: number, phase: Phase, landing = 0) {
  // Pause uses the same simulation time and pose; ready/victory use a resting pose.
  const resting = phase === 'ready' || phase === 'won';
  const run = resting ? 0 : clamp(Math.abs(player.vx) / 9, 0, 1);
  const airborne = !resting && !player.grounded;
  const dead = phase === 'dead';
  const hurt = !resting && !dead && player.invulnerable > 1.1;
  const attack = resting || dead ? 0 : player.attack;
  const thrust = attack > 0 ? Math.sin(clamp((0.3 - attack) / 0.075, 0, 1) * Math.PI / 2) * Math.min(1, attack / 0.06) : 0;
  const stride = time * 14;
  const bob = dead ? 0 : airborne ? 0 : Math.sin(stride * 2) * 0.025 * run + Math.sin(time * 2.3) * 0.009 * (1 - run) - clamp(landing, 0, 1) * 0.08;
  // Lean towards actual travel, even during knockback or a quick direction reversal.
  const travel = resting ? 0 : clamp(player.vx * player.facing / 9, -1, 1);
  const lean = dead ? 0 : hurt ? 0.12 : -0.075 * travel - thrust * 0.035;
  const hipY = 1 + bob;
  // The painted tunic's belt sits above the hidden hip joints. Locate the arm
  // socket in that artwork rather than reusing the old polygon's shoulder.
  const shoulder = { x: 0.2 - 0.13 * Math.cos(lean) - 0.45 * Math.sin(lean), y: 1.23 + bob - 0.13 * Math.sin(lean) + 0.45 * Math.cos(lean) };
  // Keep the spear's original horizontal attack path and maximum tip at X + 2.95.
  const grip = { x: 0.35 + thrust * 0.95, y: 1.35 };
  const arm = solveLimb(shoulder, grip, 0.66, 0.66, -1);
  const farArm = solveLimb({ x: -0.15, y: hipY + 0.69 }, { x: -0.16 - Math.sin(stride) * 0.22 * run, y: 1.02 }, 0.48, 0.48, -1);
  const legs = [0, Math.PI].map((offset, index) => {
    const hip = { x: index === 0 ? 0.12 : -0.12, y: hipY };
    const cycle = stride + offset;
    let foot = { x: hip.x + Math.cos(cycle) * 0.34 * run, y: 0.025 + Math.max(0, Math.sin(cycle)) * 0.19 * run };
    if (airborne) foot = player.vy > 0
      ? { x: index === 0 ? 0.15 : -0.3, y: index === 0 ? 0.24 : 0.46 }
      : { x: index === 0 ? 0.24 : -0.2, y: index === 0 ? 0.04 : 0.14 };
    // Solve to the ankle, then keep the separate boot upright so its sole cannot
    // rotate below the floor when the shin bends during a stride.
    return solveLimb(hip, { x: foot.x, y: foot.y + BOOT_SOLE_OFFSET }, 0.5, 0.45, 1);
  });
  const action: HeroAction = dead ? 'dead' : hurt ? 'hurt' : attack > 0 ? 'strike' : airborne ? player.vy > 0 ? 'rise' : 'fall' : run > 0.05 ? 'run' : 'idle';
  return { action, run, thrust, bob, lean, arm, farArm, legs, grip, spearTip: { x: grip.x + 1.65, y: grip.y }, dead };
}
