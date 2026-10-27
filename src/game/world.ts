import type { Platform } from './types.js';
export const END = 92;
export const platforms: Platform[] = [
  { x: 14, width: 5, y: 2.5, depth: 2.5 },
  { x: 21, width: 5, y: 4.8, depth: 2.5 },
  { x: 31, width: 3, y: 2, depth: 2.5 },
  { x: 37, width: 3, y: 2, depth: 2.5 },
  { x: 58, width: 5, y: 2.7, depth: 2.5 },
  { x: 65, width: 4, y: 4.6, depth: 2.5 },
  { x: 88, width: 3, y: 1.5, depth: 3 },
  { x: 94, width: 9, y: 3, depth: 5 },
];
export const ground = [{ from: -12, to: 33 }, { from: 39, to: 105 }];
export const enemyHomes = [24, 50, 76];
