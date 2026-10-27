import * as T from 'three';
const materials = new Map<string, T.MeshStandardMaterial>();
export function material(color: string, emissive = false) {
  const key = color + emissive;
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness: 0.94, flatShading: true, ...(emissive ? { emissive: color, emissiveIntensity: 2 } : {}) }));
  return materials.get(key)!;
}
export function box(parent: T.Object3D, color: string, size: number[], pos: number[], rotation = 0) {
  const m = new T.Mesh(new T.BoxGeometry(...size as [number, number, number]), material(color));
  m.position.set(...pos as [number, number, number]); m.rotation.z = rotation;
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
export function rock(parent: T.Object3D, color: string, scale: number[], pos: number[], glow = false) {
  const m = new T.Mesh(new T.DodecahedronGeometry(1, 0), material(color, glow));
  m.scale.set(...scale as [number, number, number]); m.position.set(...pos as [number, number, number]);
  m.castShadow = !glow; m.receiveShadow = true; parent.add(m); return m;
}
export function branch(parent: T.Object3D, from: T.Vector3, to: T.Vector3, radius: number, color: string, top = radius * 0.6) {
  const delta = to.clone().sub(from);
  const m = new T.Mesh(new T.CylinderGeometry(top, radius, delta.length(), 6), material(color));
  m.position.copy(from).add(to).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  m.castShadow = true; parent.add(m); return m;
}
// Flat, layered cutouts keep actors legible against the dimensional world.
const inks = new Map<string, T.MeshBasicMaterial>();
function cutout(parent: T.Object3D, color: string, points: number[][], z = 0) {
  if (!inks.has(color)) inks.set(color, new T.MeshBasicMaterial({ color, side: T.DoubleSide }));
  const shape = new T.Shape(points.map(([x, y]) => new T.Vector2(x, y)));
  const mesh = new T.Mesh(new T.ShapeGeometry(shape), inks.get(color)!);
  mesh.position.z = z; mesh.castShadow = true; parent.add(mesh);
  return mesh;
}
export function warrior(queen = false) {
  const root = new T.Group();
  const skin = '#92563b', fabric = queen ? '#ddb765' : '#c6673d';
  const leftLeg = new T.Group(), rightLeg = new T.Group(), arm = new T.Group();
  leftLeg.position.set(-0.18, 0.95, 0); rightLeg.position.set(0.18, 0.95, 0.03);
  root.add(leftLeg, rightLeg);
  for (const leg of [leftLeg, rightLeg]) {
    cutout(leg, '#1c3031', [[-0.15, 0], [0.16, 0], [0.13, -0.72], [0.32, -0.8], [0.32, -0.94], [-0.15, -0.94]]);
    cutout(leg, '#bd9860', [[-0.14, -0.53], [0.13, -0.53], [0.13, -0.63], [-0.14, -0.63]], 0.01);
  }
  // A two-edge cloth strip: the shoulder is fixed; the hem trails and ripples.
  const capePositions: number[] = [], indices: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const s = i / 8;
    capePositions.push(-0.25 - s * 0.95, 1.83 - s * 0.55, -0.03);
    capePositions.push(-0.25 - s * 0.95, 1.83 - s * 1.3, -0.03);
    if (i < 8) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const cloth = new T.BufferGeometry();
  cloth.setAttribute('position', new T.Float32BufferAttribute(capePositions, 3)); cloth.setIndex(indices);
  const cape = new T.Mesh(cloth, new T.MeshBasicMaterial({ color: fabric, side: T.DoubleSide }));
  cape.castShadow = true; root.add(cape);
  const capeRest = Float32Array.from(capePositions);
  cutout(root, '#263b36', [[-0.34, 1.86], [0.25, 1.86], [0.4, 1.13], [0.23, 0.87], [-0.38, 0.94]], 0.02);
  cutout(root, fabric, [[-0.31, 1.81], [0.22, 1.82], [0.36, 1.18], [-0.35, 1.1]], 0.04);
  cutout(root, '#edc77b', [[-0.28, 1.83], [-0.12, 1.85], [0.31, 1.2], [0.14, 1.17]], 0.05);
  cutout(root, '#e2b468', [[-0.36, 1.15], [0.37, 1.15], [0.37, 1.04], [-0.36, 1.04]], 0.06);
  cutout(root, skin, [[-0.12, 1.79], [0.16, 1.79], [0.16, 2.04], [-0.12, 2.04]], 0.04);
  cutout(root, skin, [[-0.24, 2.04], [-0.28, 2.35], [-0.09, 2.52], [0.23, 2.43], [0.26, 2.23], [0.39, 2.16], [0.24, 2.1], [0.21, 1.99]], 0.06);
  cutout(root, '#202b28', [[-0.28, 2.21], [-0.33, 2.4], [-0.22, 2.58], [-0.1, 2.54], [0.03, 2.62], [0.14, 2.53], [0.26, 2.48], [0.24, 2.32], [-0.13, 2.36], [-0.12, 2.19]], 0.07);
  cutout(root, '#e1ba6e', [[-0.28, 2.35], [0.25, 2.35], [0.25, 2.28], [-0.28, 2.28]], 0.08);
  cutout(root, '#1b2828', [[0.12, 2.23], [0.24, 2.23], [0.24, 2.18], [0.12, 2.18]], 0.08);
  const upperArm = cutout(root, '#6e4131', [[0, -0.09], [1, -0.09], [1, 0.09], [0, 0.09]], 0.11);
  upperArm.position.set(0.13, 1.69, 0.11);
  upperArm.rotation.z = Math.atan2(-0.34, -0.03);
  upperArm.scale.x = Math.hypot(0.34, 0.03);
  arm.position.set(0.35, 1.35, 0.12); root.add(arm);
  cutout(arm, '#6e4131', [[-0.25, 0.04], [0.32, 0.04], [0.32, -0.13], [-0.25, -0.13]], 0);
  if (!queen) {
    cutout(arm, '#ad8350', [[-0.9, -0.04], [1.25, -0.04], [1.25, 0.04], [-0.9, 0.04]], 0.01);
    cutout(arm, '#f2dfac', [[1.12, -0.13], [1.65, 0], [1.12, 0.13], [1.22, 0]], 0.02);
    cutout(arm, '#946044', [[0.12, -0.1], [0.3, -0.1], [0.3, 0.1], [0.12, 0.1]], 0.03);
  } else {
    cutout(root, fabric, [[-0.3, 1.3], [0.3, 1.3], [0.55, 0], [-0.55, 0]], 0.1);
    cutout(root, '#f3d687', [[-0.3, 2.4], [-0.32, 2.78], [-0.12, 2.58], [0, 2.87], [0.13, 2.58], [0.31, 2.78], [0.28, 2.4]], 0.1);
  }
  return { root, leftLeg, rightLeg, arm, upperArm, cape, capeRest };
}
export function warthog() {
  const root = new T.Group();
  const legs: T.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const leg = cutout(root, i < 2 ? '#4e392d' : '#724b32', [[-0.13, 0.27], [0.15, 0.27], [0.1, -0.11], [0.22, -0.17], [0.2, -0.27], [-0.14, -0.27]], i < 2 ? -0.02 : 0.06);
    leg.position.x = (i % 2 ? 0.64 : -0.58) + (i < 2 ? -0.12 : 0); leg.position.y = 0.27; legs.push(leg);
  }
  cutout(root, '#342f28', [[-0.98, 0.56], [-1.15, 0.84], [-0.98, 1.13], [-0.82, 1.15], [-0.72, 1.38], [-0.53, 1.3], [-0.37, 1.5], [-0.18, 1.35], [0, 1.5], [0.15, 1.29], [0.42, 1.34], [0.7, 1.08], [0.9, 0.55]], 0);
  cutout(root, '#995c36', [[-1, 0.61], [-1.01, 0.98], [-0.6, 1.18], [0.18, 1.24], [0.75, 0.99], [0.87, 0.56], [0.38, 0.39], [-0.57, 0.42]], 0.02);
  cutout(root, '#b47a43', [[-0.86, 0.98], [-0.48, 1.12], [0.12, 1.15], [0.49, 0.97], [-0.25, 0.85]], 0.03);
  cutout(root, '#aa6c3e', [[0.38, 1.02], [0.65, 1.12], [0.81, 0.96], [0.98, 0.74], [1.33, 0.68], [1.34, 0.4], [0.87, 0.35], [0.5, 0.52]], 0.05);
  cutout(root, '#553c2c', [[0.47, 1.02], [0.46, 1.4], [0.75, 1.25], [0.69, 0.99]], 0.06);
  cutout(root, '#1b2825', [[0.8, 0.91], [1.02, 0.86], [0.98, 0.79], [0.82, 0.8]], 0.07);
  cutout(root, '#e5b96b', [[0.84, 0.85], [0.94, 0.84], [0.93, 0.8], [0.85, 0.8]], 0.08);
  cutout(root, '#eddbab', [[0.96, 0.43], [1.16, 0.45], [1.4, 0.65], [1.53, 0.92], [1.45, 0.58], [1.25, 0.3], [1.05, 0.31]], 0.09);
  cutout(root, '#302e27', [[1.24, 0.61], [1.33, 0.61], [1.33, 0.53], [1.24, 0.53]], 0.1);
  cutout(root, '#553c2c', [[-0.96, 0.81], [-1.35, 1], [-1.48, 1.3], [-1.35, 1.31], [-1.23, 1.08], [-0.93, 0.94]], -0.01);
  return { root, legs };
}
