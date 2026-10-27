export type HeroSheet = 'movement' | 'attack' | 'slash';
export interface HeroFrame {
  sheet: HeroSheet;
  rect: [number, number, number, number];
  origin: [number, number];
  scale: number;
}
export const HERO_SHEETS = {
  movement: { file: 'hero-motion.webp', width: 1536, height: 1024 },
  attack: { file: 'hero-attack.webp', width: 1536, height: 1024 },
  slash: { file: 'hero-slash.webp', width: 1536, height: 1024 },
};
// Measured opaque bounds plus transparent gutters. Generative sheets are not
// perfect grids: some capes/spear tips cross nominal row/column boundaries.
// Whole-sheet scales are constant; crouching never enlarges the character.
const motionScale = 2.65 / 253;
const attackScale = 2.65 / 414;
const movement: [string, HeroFrame['rect'], HeroFrame['origin']][] = [
  ['idle-0', [39, 6, 373, 270], [202, 264]],
  ['idle-1', [415, 6, 746, 269], [576, 264]],
  ['idle-2', [804, 6, 1140, 269], [971, 264]],
  ['idle-3', [1188, 6, 1511, 269], [1354, 264]],
  ['run-0', [34, 276, 387, 514], [195, 509]],
  ['run-1', [417, 270, 774, 514], [578, 509]],
  ['run-2', [808, 271, 1162, 512], [965, 509]],
  ['run-3', [1201, 271, 1526, 491], [1336, 509]],
  ['run-4', [37, 516, 385, 761], [196, 756]],
  ['run-5', [414, 517, 782, 759], [578, 756]],
  ['run-6', [813, 513, 1161, 761], [971, 756]],
  ['run-7', [1198, 516, 1527, 744], [1338, 756]],
  ['jump-0', [40, 766, 393, 1012], [204, 1007]],
  ['jump-1', [443, 759, 772, 974], [584, 1007]],
  ['jump-2', [827, 760, 1154, 1010], [978, 1007]],
  ['jump-3', [1181, 798, 1526, 1011], [1361, 1007]],
];
const attacks: [HeroFrame['rect'], HeroFrame['origin']][] = [
  [[41, 73, 740, 497], [375, 492]],
  [[766, 121, 1531, 500], [1065, 495]],
  [[52, 594, 787, 981], [321, 976]],
  [[821, 532, 1503, 982], [1126, 977]],
];
const slashes: [HeroFrame['rect'], HeroFrame['origin']][] = [
  [[28, 10, 575, 502], [385, 495]],
  [[790, 45, 1485, 505], [1110, 498]],
  [[98, 583, 810, 970], [375, 963]],
  [[823, 554, 1518, 969], [1110, 962]],
];
export const HERO_FRAMES: Record<string, HeroFrame> = Object.fromEntries([
  ...movement.map(([id, rect, origin]) => [id, { sheet: 'movement' as const, rect, origin, scale: motionScale }]),
  ...slashes.map(([rect, origin], i) => [`slash-${i}`, { sheet: 'slash' as const, rect, origin, scale: 2.65 / 396 }]),
  ...attacks.map(([rect, origin], i) => [`attack-${i}`, { sheet: 'attack' as const, rect, origin, scale: attackScale }]),
]);
