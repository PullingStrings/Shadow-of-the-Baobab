import type { GameState, Phase, Player } from '../game/types.js';

export type HeroAction = 'idle' | 'run' | 'rise' | 'apex' | 'fall' | 'land' | 'strike' | 'hurt' | 'dead';
export const STRIDE_DISTANCE = 3.6;

/** Select complete painted poses. No body-part rotation or simulation writes. */
export function heroFrame(player: Player, time: number, phase: Phase, distance = 0, landing = false) {
  const sample = (action: HeroAction, id: string) => ({ action, id });
  if (phase === 'ready' || phase === 'won') return sample('idle', 'idle-0');
  if (phase === 'dead') return sample('dead', 'jump-3');
  if (player.attack > 0) {
    // Existing 0.3s attack: anticipate, extend/hold in the active window, recover.
    // The simulation still decides all hits/damage.
    const elapsed = 0.3 - player.attack;
    const index = elapsed < 0.03 ? 0 : elapsed < 0.13 ? 1 : elapsed < 0.25 ? 2 : 3;
    return sample('strike', `attack-${index}`);
  }
  if (player.invulnerable > 1.1) return sample('hurt', 'jump-2');
  if (!player.grounded) {
    const index = player.vy > 3 ? 0 : player.vy >= -3 ? 1 : 2;
    return sample((['rise', 'apex', 'fall'] as const)[index], `jump-${index}`);
  }
  if (landing) return sample('land', 'jump-3');
  if (Math.abs(player.vx) > 0.25) return sample('run', `run-${Math.floor(Math.max(0, distance) / STRIDE_DISTANCE * 8) % 8}`);
  return sample('idle', `idle-${Math.floor(Math.max(0, time) * 3) % 4}`);
}

/** A gait follows travelled distance, so stopped/slower feet do not keep cycling. */
export class HeroFrameClock {
  private previousTime: number | undefined;
  private previousX = 0;
  private wasGrounded = true;
  private distance = 0;
  private landingUntil = 0;
  update(state: GameState) {
    const p = state.player;
    if (this.previousTime === undefined || state.time < this.previousTime || state.phase === 'ready') {
      this.distance = 0; this.landingUntil = 0;
      this.previousX = p.x; this.wasGrounded = p.grounded;
    }
    if (state.phase === 'playing') {
      if (p.grounded && !this.wasGrounded) this.landingUntil = state.time + 0.12;
      if (p.grounded && this.wasGrounded) this.distance += Math.abs(p.x - this.previousX);
    }
    this.previousTime = state.time; this.previousX = p.x; this.wasGrounded = p.grounded;
    return heroFrame(p, state.time, state.phase, this.distance, state.time < this.landingUntil);
  }
}
