import * as T from 'three';
import { openingWeight } from './opening';
import { sanctuaryWeight } from './sanctuary-layout';
import { TRAIL_ART } from './trail-art';

/** A continuous painted route between the existing grove and sanctuary. */
export function buildTrail(scene: T.Scene) {
  const dressing = new T.Group(); dressing.name = 'Ancient trail — scenery only'; scene.add(dressing);
  const material = new T.MeshBasicMaterial({ color: '#ad7b80', transparent: true, depthWrite: false, fog: false, toneMapped: false });
  new T.TextureLoader().load(`${import.meta.env.BASE_URL}art/trail/sunset-trail.webp`, texture => {
    texture.colorSpace = T.SRGBColorSpace; material.map = texture; material.color.set('#ffffff'); material.needsUpdate = true;
  }, undefined, () => console.warn('Ancient trail artwork unavailable; retaining the warm dusk backdrop.'));
  const backdrop = new T.Mesh(new T.PlaneGeometry(1, 1), material);
  backdrop.name = 'Ancient trail distant valley'; backdrop.rotation.x = -Math.atan(0.2);
  // Opaque base behind both fading end plates: no double-fade hole in coverage.
  backdrop.renderOrder = -11; backdrop.position.set(55, -1.2, -22); scene.add(backdrop);

  let seed = 583; const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  const blade = new T.Shape(); blade.moveTo(-0.04, 0); blade.quadraticCurveTo(-0.02, 0.5, 0.2, 0.85);
  blade.quadraticCurveTo(0.03, 0.3, 0.04, 0); blade.closePath();
  const geometry = new T.ShapeGeometry(blade);
  const batches = ['#766344', '#af8a50', '#c9a464'].map(color => {
    const mesh = new T.InstancedMesh(geometry, new T.MeshStandardMaterial({ color, roughness: 1, side: T.DoubleSide }), 72);
    mesh.name = 'Ancient trail grass'; mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.frustumCulled = false; dressing.add(mesh); return mesh;
  });
  const grasses: { x: number; z: number; height: number; phase: number }[] = [];
  for (let i = 0; i < 72; i++) {
    const x = i < 3 ? 39.1 + i * 0.4 : 39 + random() * 40.5;
    grasses.push({ x, z: (i % 2 ? -1 : 1) * (1.6 + random() * 1.6), height: 0.25 + random() * 0.35, phase: random() * Math.PI * 2 });
  }
  const transform = new T.Object3D();
  const rootMaterial = new T.MeshStandardMaterial({ color: '#654533', roughness: 1 });
  for (let x = 39.4; x < 80; x += 2.8) {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(x, -0.18, 3.95), new T.Vector3(x + 0.2, -0.75, 4.08),
      new T.Vector3(x - 0.25, -1.6, 4.17), new T.Vector3(x + 0.4, -2.5 - random(), 4.05),
    ]);
    const root = new T.Mesh(new T.TubeGeometry(path, 12, 0.06 + random() * 0.05, 5, false), rootMaterial);
    root.name = 'Ancient trail exposed root'; root.castShadow = true; dressing.add(root);
  }
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
  const c = canvas.getContext('2d')!, glow = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, '#ffe4b8bb'); glow.addColorStop(0.2, '#eac08b66'); glow.addColorStop(1, '#eac08b00');
  c.fillStyle = glow; c.fillRect(0, 0, 32, 32);
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
  const positions = new Float32Array(64 * 3);
  for (let i = 0; i < 64; i++) { positions[i * 3] = 34 + random() * 46; positions[i * 3 + 1] = 0.4 + random() * 7; positions[i * 3 + 2] = -2 - random() * 3; }
  const dustGeometry = new T.BufferGeometry(); dustGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const dust = new T.Points(dustGeometry, new T.PointsMaterial({ map: texture, size: 0.085, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }));
  dust.name = 'Ancient trail dust'; dressing.add(dust);
  return {
    dustTexture: texture,
    update(cameraX: number, aspect: number, time: number) {
      backdrop.visible = openingWeight(cameraX) < 1 && sanctuaryWeight(cameraX) < 1;
      const width = Math.max(52, aspect * 17 * 1.4);
      backdrop.position.x = 55 + (cameraX - 55) * 0.85;
      backdrop.scale.set(width, width / (TRAIL_ART.width / TRAIL_ART.height), 1);
      dressing.visible = cameraX > 18 && cameraX < 100;
      grasses.forEach((grass, i) => batches.forEach((mesh, j) => {
        transform.position.set(grass.x, 0.02, grass.z);
        transform.rotation.z = (j - 1) * 0.25 + Math.sin(time * 1.3 + grass.phase) * 0.05;
        transform.scale.set(0.65, grass.height * (0.75 + j * 0.12), 1); transform.updateMatrix();
        mesh.setMatrixAt(i, transform.matrix);
      }));
      batches.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
      dust.position.set(Math.sin(time * 0.17) * 0.2, Math.sin(time * 0.25) * 0.15, 0);
    },
  };
}
