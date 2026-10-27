import * as T from 'three';
import { box, rock, branch } from './meshes';
import { ground, platforms } from '../game/world';
import { openingTextures } from './opening';
import { buildGroveLedges } from './grove-trees';
import { buildSanctuary } from './sanctuary';
// Seeded decoration keeps screenshots, silhouettes and tests reproducible.
let seed = 71;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
export function buildWorld(scene: T.Scene) {
  seed = 71;
  const painted = openingTextures();
  const nature = new T.Group(); scene.add(nature);
  // Scenery has its own terrain behind the narrow, collidable gameplay lane.
  box(scene, '#647452', [85.5, 0.3, 46], [77.75, -0.3, -27]);
  const terrain = ground.flatMap(g => g.from < 80 && g.to > 80 ? [{ from: g.from, to: 80 }, { from: 80, to: g.to }] : [g]);
  for (const g of terrain) {
    const mid = (g.from + g.to) / 2;
    const cliff = box(scene, '#424d3c', [g.to - g.from, 5, 8], [mid, -2.55, 0]);
    if (g.from < 0 || g.from >= 80) cliff.material = painted.cliff;
    const surface = box(scene, '#77805a', [g.to - g.from, 0.25, 7.9], [mid, -0.14, 0]);
    if (g.from < 0 || g.from >= 80) surface.material = painted.earth;
    const trail = box(scene, '#a9996a', [g.to - g.from, 0.07, 1.55], [mid, -0.015, 0]);
    if (g.from < 0 || g.from >= 80) trail.material = painted.earth;
    for (let x = g.from; x < g.to; x += 2.5) {
      const stone = rock(nature, g.from < 0 || g.from >= 80 ? '#ac8768' : '#4d5540', [1.8, 1.9, 1.2], [x, -2.4, 3.8]);
      if (g.from < 0 || g.from >= 80) stone.material = painted.slab;
      rock(nature, '#95876a', [0.3 + random() * 0.5, 0.12, 0.25], [x, 0, random() - 0.5]);
    }
  }
  buildGroveLedges(scene, platforms.filter(p => p.x < 33));
  for (const p of platforms) {
    if (p.x < 33 || p.x >= 80) continue;
    const slab = box(scene, '#8d947b', [p.width, 0.5, p.depth], [p.x, p.y - 0.25, 0]);
    if (p.x < 33) slab.material = painted.slab;
    box(scene, '#b7a36d', [p.width, 0.12, p.depth], [p.x, p.y - 0.06, 0]);
    // Only collidable ledges carry this continuous gold lip and end brackets.
    const lip = box(scene, '#efcb7e', [p.width, 0.12, 0.12], [p.x, p.y - 0.06, p.depth / 2 + 0.02]);
    lip.material.emissive.set('#a8772a');
    lip.material.emissiveIntensity = 0.6;
    for (const dx of [-p.width / 2 + 0.14, p.width / 2 - 0.14]) {
      const bracket = box(scene, '#efcb7e', [0.16, 0.34, 0.14], [p.x + dx, p.y - 0.17, p.depth / 2 + 0.03]);
      bracket.material = lip.material;
    }
    for (const dx of [-p.width / 2 + 0.55, p.width / 2 - 0.55]) {
      for (let y = 0; y < p.y - 0.5; y += 0.8) {
        const support = box(scene, '#656e5e', [0.85, 0.72, 1.2], [p.x + dx, y + 0.36, -0.35]);
        if (p.x < 33) support.material = painted.slab;
      }
    }
  }
  function tree(x: number, z: number, scale: number, distant = false) {
    const t = new T.Group(); t.position.set(x, -0.1, z); t.scale.setScalar(scale); t.visible = x >= 35 && x < 80; nature.add(t);
    const bark = distant ? '#324c47' : '#665440';
    branch(t, new T.Vector3(0, 0, 0), new T.Vector3(0.2, 6, 0), 0.9, bark, 0.55);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 0.4, end = new T.Vector3(Math.cos(a) * 2.8, 7 + random(), Math.sin(a) * 1.7);
      branch(t, new T.Vector3(0.1, 3.8, 0), end, 0.4, bark, 0.14);
      rock(t, distant ? '#34594b' : ['#486c43', '#62834b', '#809153'][i % 3], [2.8, 1.0, 2.2], [end.x, end.y + 0.2, end.z]);
    }
    for (let i = 0; i < 3; i++) branch(t, new T.Vector3(0, 1.5, 0), new T.Vector3((i - 1) * 1.7, 0, 0.8), 0.3, bark, 0.12);
  }
  // Keep original seeded placement beyond the grove; painted art replaces early scenery.
  for (let x = -20; x < 125; x += 9) tree(x, -13 - random() * 5, 1.2 + random() * 0.8, true);
  for (let x = -10; x < 110; x += 13) tree(x, -5 - random() * 2, 0.85 + random() * 0.35);
  tree(-6, 4, 1.5); tree(44, 4.8, 1.1); tree(81, 5, 1.4);
  // Distant monumental baobab and mountain ridges.
  tree(47, -31, 3, true);
  for (let x = -30; x < 150; x += 15) {
    const ridge = rock(nature, '#345351', [15, 9 + random() * 9, 6], [x, 1, -36]);
    ridge.visible = x >= 35;
  }
  for (let i = 0; i < 145; i++) {
    const x = random() * 112 - 8;
    if (x > 32 && x < 40) continue;
    const z = (random() > 0.5 ? 1 : -1) * (1.5 + random() * 2);
    const h = 0.25 + random() * 0.45;
    const tuft = new T.Mesh(new T.ConeGeometry(0.2 + random() * 0.25, h, 4), undefined);
    tuft.material = new T.MeshStandardMaterial({ color: ['#6a874d', '#8a9b57', '#556e47'][i % 3], flatShading: true });
    tuft.position.set(x, h / 2, z); tuft.visible = x >= 40 && x < 80; nature.add(tuft);
    if (i % 5 === 0) {
      const flower = rock(nature, '#e2b879', [0.09, 0.12, 0.09], [x, h, z]);
      flower.visible = x >= 40 && x < 80;
    }
  }
  function arch(x: number, y: number, z: number, width: number) {
    for (const dx of [-width / 2, width / 2]) {
      for (let j = 0; j < 5; j++) box(scene, j % 2 ? '#818b73' : '#92987f', [1.05, 0.87, 1.2], [x + dx + (j % 2) * 0.04, y + j * 0.9 + 0.4, z]);
      box(scene, '#a6a58a', [1.45, 0.36, 1.55], [x + dx, y + 4.6, z]);
    }
    box(scene, '#93987c', [width + 1.8, 0.9, 1.45], [x, y + 5.1, z]);
    for (let j = 0; j < 6; j++) rock(scene, '#55714d', [0.3, 0.55, 0.32], [x - width / 2 + j * 0.5, y + 4.7 - j * 0.2, z + 0.8]);
  }
  arch(60, 0, -3.4, 4.4);
  const sanctuary = buildSanctuary(scene, painted.slab);
  const flames: T.Mesh[] = [];
  for (const [x, y] of [[8, 0], [29, 0], [41, 0], [70, 0], [90.5, 3], [97.3, 3]]) {
    const pedestal = box(scene, x >= 80 ? '#92704f' : '#535c4c', [0.7, 1.4, 0.7], [x, y + 0.7, -1.6]);
    if (x >= 80) pedestal.material = painted.slab;
    box(scene, '#b18c53', [0.95, 0.2, 0.9], [x, y + 1.45, -1.6]);
    flames.push(rock(scene, '#ffa34f', [0.24, 0.55, 0.24], [x, y + 1.85, -1.6], true));
  }
  // Arcane prison ring remains legible from the gameplay plane.
  const ring = new T.Mesh(new T.TorusGeometry(1.8, 0.045, 5, 48), new T.MeshBasicMaterial({ color: '#edc77b', transparent: true, opacity: 0.8 }));
  ring.position.set(94, 4.7, -0.5); scene.add(ring);
  const motes = new T.BufferGeometry(); const positions = [];
  for (let i = 0; i < 170; i++) positions.push(random() * 115 - 10, random() * 10 + 0.2, random() * 16 - 9);
  motes.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  const particles = new T.Points(motes, new T.PointsMaterial({ color: '#eac781', size: 0.055, transparent: true, opacity: 0.7 })); scene.add(particles);
  return { flames, ring, particles, sanctuary };
}
