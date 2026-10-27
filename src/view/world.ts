import * as T from 'three';
import { box, rock } from './meshes';
import { ground, platforms } from '../game/world';
import { openingTextures } from './opening';
import { buildGroveLedges } from './grove-trees';
import { buildSanctuary } from './sanctuary';
import { buildTrail } from './trail';
// Seeded decoration keeps screenshots, silhouettes and tests reproducible.
let seed = 71;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
export function buildWorld(scene: T.Scene) {
  seed = 71;
  const painted = openingTextures();
  const nature = new T.Group(); scene.add(nature);
  const terrain = ground.flatMap(g => g.from < 80 && g.to > 80 ? [{ from: g.from, to: 80 }, { from: 80, to: g.to }] : [g]);
  for (const g of terrain) {
    const mid = (g.from + g.to) / 2;
    const cliff = box(scene, '#424d3c', [g.to - g.from, 5, 8], [mid, -2.55, 0]);
    cliff.material = painted.cliff;
    const surface = box(scene, '#77805a', [g.to - g.from, 0.25, 7.9], [mid, -0.14, 0]);
    surface.material = painted.earth;
    const trail = box(scene, '#a9996a', [g.to - g.from, 0.07, 1.55], [mid, -0.015, 0]);
    trail.material = painted.earth;
    for (let x = g.from; x < g.to; x += 2.5) {
      const stone = rock(nature, '#ac8768', [1.8, 1.9, 1.2], [x, -2.4, 3.8]);
      stone.material = painted.slab;
      rock(nature, '#95876a', [0.3 + random() * 0.5, 0.12, 0.25], [x, 0, random() - 0.5]);
    }
  }
  // One shared atlas; the crossing bough reaches left from the far bank.
  buildGroveLedges(scene, platforms.filter(p => p.x < 80), p => p.x === 37);
  const trail = buildTrail(scene);
  const sanctuary = buildSanctuary(scene, painted.slab);
  const flames: T.Mesh[] = [];
  for (const [x, y] of [[8, 0], [29, 0], [41, 0], [70, 0], [90.5, 3], [97.3, 3]]) {
    const pedestal = box(scene, x >= 39 ? '#92704f' : '#535c4c', [0.7, 1.4, 0.7], [x, y + 0.7, -1.6]);
    if (x >= 39) pedestal.material = painted.slab;
    box(scene, '#b18c53', [0.95, 0.2, 0.9], [x, y + 1.45, -1.6]);
    flames.push(rock(scene, '#ffa34f', [0.24, 0.55, 0.24], [x, y + 1.85, -1.6], true));
  }
  // Arcane prison ring remains legible from the gameplay plane.
  const ring = new T.Mesh(new T.TorusGeometry(1.8, 0.045, 5, 48), new T.MeshBasicMaterial({ color: '#edc77b', transparent: true, opacity: 0.8 }));
  ring.position.set(94, 4.7, -0.5); scene.add(ring);
  const motes = new T.BufferGeometry(); const positions = [];
  for (let i = 0; i < 170; i++) positions.push(random() * 115 - 10, random() * 10 + 0.2, random() * 16 - 9);
  motes.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  const particles = new T.Points(motes, new T.PointsMaterial({ map: trail.dustTexture, depthWrite: false, toneMapped: false, color: '#eac781', size: 0.055, transparent: true, opacity: 0.7 })); scene.add(particles);
  return { flames, ring, particles, sanctuary, trail };
}
