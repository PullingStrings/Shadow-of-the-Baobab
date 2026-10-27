import { platforms } from '../game/world.js';

export const SANCTUARY_START = 80;
export const sanctuaryLedges = platforms.filter(p => p.x >= SANCTUARY_START);
export const sanctuaryDais = sanctuaryLedges.find(p => p.x === 94)!;
export function sanctuaryWeight(cameraX: number) {
  const t = Math.max(0, Math.min(1, (cameraX - 72) / 12));
  return t * t * (3 - 2 * t);
}
/** Slow distant parallax; aspect includes the camera's fixed 17-unit height. */
export function sanctuaryBackdrop(cameraX: number, aspect: number, imageAspect: number) {
  const width = Math.max(52, aspect * 17 * 1.4);
  return { x: 92 + (cameraX - 91) * 0.8, width, height: width / imageAspect };
}
