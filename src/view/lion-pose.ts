import type { Enemy } from '../game/types.js';

export function lionFrame(mode: Enemy['mode'], distance: number): number {
  if (mode === 'windup') return 4;
  if (mode === 'charge') return 5 + Math.floor(Math.max(0, distance) / 1.5) % 2;
  if (mode === 'recover' || mode === 'dead') return 7;
  return Math.floor(Math.max(0, distance) / 0.5) % 4;
}
