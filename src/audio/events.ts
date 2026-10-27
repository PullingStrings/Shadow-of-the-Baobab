import type { GameState } from '../game/types.js';
import { platforms } from '../game/world.js';
import { STRIDE_DISTANCE } from '../view/hero-pose.js';
import type { SoundName } from './synthesis.js';
export interface SoundEvent { name: SoundName; gain: number; pan: number }
type Snapshot = { phase: GameState['phase']; time: number; x: number; y: number; vy: number; grounded: boolean; hp: number; attackId: number; enemies: { x: number; hp: number; mode: string }[] };
export class SoundEvents {
  private previous?: Snapshot;
  private distance = 0;
  reset() { this.previous = undefined; this.distance = 0; }
  update(state: GameState): SoundEvent[] {
    const p = state.player, previous = this.previous, events: SoundEvent[] = [];
    const emit = (name: SoundName, x = p.x, gain = 1) => {
      const distance = Math.abs(x - p.x);
      if (distance <= 22) events.push({ name, pan: Math.max(-0.8, Math.min(0.8, (x - p.x) / 14)), gain: gain / (1 + distance * 0.09) });
    };
    if (previous && state.time >= previous.time) {
      if (state.phase === 'won' && previous.phase !== 'won') emit('rescue');
      else if (state.phase === 'dead' && previous.phase !== 'dead') emit('death');
      if (state.phase === 'playing' && previous.phase === 'playing') {
        if (p.attackId > previous.attackId) emit(p.attackKind);
        if (p.hp < previous.hp) emit('hurt');
        if (p.vy > 8 && p.vy > previous.vy + 8 && !p.grounded && p.hp >= previous.hp) emit('jump', p.x, 0.65);
        if (p.grounded && !previous.grounded) { emit('land', p.x, Math.min(1, Math.abs(previous.vy) / 16)); this.distance = 0; }
        const travelled = Math.abs(p.x - previous.x);
        if (p.grounded && previous.grounded && travelled < 1) {
          this.distance += travelled;
          if (this.distance >= STRIDE_DISTANCE / 2) {
            const onPlatform = platforms.some(platform => Math.abs(p.y - platform.y) < 0.06 && Math.abs(p.x - platform.x) <= platform.width / 2);
            emit(onPlatform ? p.x < 80 ? 'step-wood' : 'step-stone' : 'step-earth', p.x, 0.45);
            this.distance %= STRIDE_DISTANCE / 2;
          }
        }
        state.enemies.forEach((enemy, i) => {
          const old = previous.enemies[i]; if (!old) return;
          if (enemy.hp < old.hp) {
            emit('hit', enemy.x);
            if (enemy.hp <= 0) emit('lion-death', enemy.x, 0.8);
          }
          if (enemy.hp > 0 && enemy.mode !== old.mode) {
            if (enemy.mode === 'windup') emit('lion-warn', enemy.x, 0.8);
            if (enemy.mode === 'charge') emit('lion-charge', enemy.x, 0.8);
          }
        });
      }
    } else this.distance = 0;
    this.previous = { phase: state.phase, time: state.time, x: p.x, y: p.y, vy: p.vy, grounded: p.grounded, hp: p.hp, attackId: p.attackId,
      enemies: state.enemies.map(e => ({ x: e.x, hp: e.hp, mode: e.mode })) };
    return events;
  }
}
