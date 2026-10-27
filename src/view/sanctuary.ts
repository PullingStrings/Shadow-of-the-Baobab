import * as T from 'three';
import { box, rock } from './meshes';
import { SANCTUARY_ART } from './sanctuary-art';
import { sanctuaryWeight, sanctuaryBackdrop, sanctuaryDais, sanctuaryLedges } from './sanctuary-layout';

/** Art only: the raised rescue platform and approach keep their collision data. */
export function buildSanctuary(scene: T.Scene, stone: T.MeshStandardMaterial) {
  const root = new T.Group(); root.name = 'Sanctuary — scenery only'; scene.add(root);
  const art = SANCTUARY_ART.shrine, dais = sanctuaryDais;
  const sx = dais.width / (art.ledgeTo - art.ledgeFrom), sy = dais.y / (art.rootY - art.ledgeY);
  const fallback = new T.Group(); fallback.name = 'Sanctuary image fallback'; root.add(fallback);
  const foundation = box(fallback, '#98704e', [dais.width, dais.y, 2], [dais.x, dais.y / 2, -0.7]); foundation.material = stone;
  for (const side of [-1, 1]) {
    const pier = box(fallback, '#a57b56', [0.85, 3.5, 1], [dais.x + side * 3, dais.y + 1.75, -0.7]); pier.material = stone;
  }
  const arch = new T.Mesh(new T.TorusGeometry(3, 0.4, 8, 32, Math.PI), stone);
  arch.position.set(dais.x, dais.y + 3.5, -0.7); fallback.add(arch);
  const painted: T.Mesh[] = [], supports: T.Mesh[] = [];
  const shrineTexture = new T.TextureLoader().load(`${import.meta.env.BASE_URL}art/sanctuary/shrine.webp`, () => {
    painted.forEach(mesh => { mesh.visible = true; }); supports.forEach(mesh => { mesh.visible = false; }); fallback.visible = false;
  }, undefined, () => console.warn('Sanctuary artwork unavailable; retaining the stone arch fallback.'));
  shrineTexture.colorSpace = T.SRGBColorSpace; shrineTexture.anisotropy = 4;
  const shrine = new T.Mesh(new T.PlaneGeometry(art.width * sx, art.height * sy), new T.MeshBasicMaterial({
    map: shrineTexture, transparent: true, alphaTest: 0.08, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
  shrine.name = 'Painted sanctuary shrine'; shrine.visible = false; shrine.renderOrder = 4;
  shrine.position.set(dais.x + (art.width / 2 - (art.ledgeFrom + art.ledgeTo) / 2) * sx,
    (art.rootY - art.height / 2) * sy, 0.1); root.add(shrine); painted.push(shrine);

  for (const p of sanctuaryLedges) {
    // The thin 3D cap supplies depth without introducing a second false ledge.
    const cap = box(root, '#95714c', [p.width, 0.18, p.depth], [p.x, p.y - 0.09, -0.3]); cap.material = stone;
    if (p !== dais) {
      const support = rock(root, '#846046', [p.width * 0.53, p.y * 0.5, 1.1], [p.x, p.y * 0.5 - 0.12, -0.35]); support.material = stone; supports.push(support);
      // Reuse just the rooted foundation strip of the shrine atlas for the step.
      const stepSX = p.width / (art.ledgeTo - art.ledgeFrom), stepSY = p.y / (art.rootY - art.ledgeY);
      const geometry = new T.PlaneGeometry(art.width * stepSX, (art.height - art.ledgeY) * stepSY);
      const uv = geometry.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (1 - art.ledgeY / art.height));
      uv.needsUpdate = true;
      const step = new T.Mesh(geometry, shrine.material);
      step.name = 'Painted sanctuary approach step'; step.renderOrder = 4; step.visible = false;
      step.position.set(p.x + (art.width / 2 - (art.ledgeFrom + art.ledgeTo) / 2) * stepSX,
        (art.rootY - (art.ledgeY + art.height) / 2) * stepSY, 0.1);
      root.add(step); painted.push(step);
    }
    const edge = new T.Line(new T.BufferGeometry().setFromPoints([
      new T.Vector3(p.x - p.width / 2, p.y, 0.75), new T.Vector3(p.x + p.width / 2, p.y, 0.75),
    ]), new T.LineBasicMaterial({ color: '#f0cb87', transparent: true, opacity: 0.85 }));
    edge.name = `Sanctuary landing edge ${p.x}`; edge.renderOrder = 6; root.add(edge);
  }
  const valley = SANCTUARY_ART.valley;
  const backdropMaterial = new T.MeshBasicMaterial({ color: '#bc8790', fog: false, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
  new T.TextureLoader().load(`${import.meta.env.BASE_URL}art/sanctuary/valley.webp`, texture => {
    texture.colorSpace = T.SRGBColorSpace; backdropMaterial.map = texture; backdropMaterial.color.set('#ffffff'); backdropMaterial.needsUpdate = true;
  }, undefined, () => console.warn('Sanctuary valley unavailable; retaining the dusk colour backdrop.'));
  const backdrop = new T.Mesh(new T.PlaneGeometry(1, 1), backdropMaterial);
  backdrop.name = 'Sanctuary distant valley'; backdrop.rotation.x = -Math.atan(0.2); backdrop.renderOrder = -9;
  backdrop.position.set(92, -1.2, -22); root.add(backdrop);

  const leaf = new T.Shape(); leaf.moveTo(0, 0); leaf.quadraticCurveTo(-0.1, 0.45, 0.18, 0.8); leaf.quadraticCurveTo(0.03, 0.32, 0, 0);
  const grassGeometry = new T.ShapeGeometry(leaf);
  const grasses = ['#817044', '#bc9559', '#594f41'].map(color => new T.MeshBasicMaterial({ color, side: T.DoubleSide }));
  for (let i = 0; i < 42; i++) {
    const tuft = new T.Mesh(grassGeometry, grasses[i % 3]);
    tuft.position.set(80.4 + i * 0.58, 0.02, i % 2 ? 1.9 : -1.6);
    tuft.scale.setScalar(0.35 + (i % 5) * 0.07); tuft.rotation.z = (i % 3 - 1) * 0.3; root.add(tuft);
  }

  // A small local sprite batch, rather than square points across the whole view.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
  const c = canvas.getContext('2d')!, glow = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, '#fff4d2dd'); glow.addColorStop(0.25, '#edc47f88'); glow.addColorStop(1, '#edc47f00');
  c.fillStyle = glow; c.fillRect(0, 0, 32, 32);
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
  const geometry = new T.BufferGeometry(), positions = new Float32Array(48 * 3);
  let seed = 941; const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 48; i++) { positions[i * 3] = 83 + random() * 19; positions[i * 3 + 1] = 0.5 + random() * 8; positions[i * 3 + 2] = -2 - random() * 3; }
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const motes = new T.Points(geometry, new T.PointsMaterial({ map: texture, color: '#ffdfa1', size: 0.09, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
  motes.name = 'Sanctuary dust'; root.add(motes);
  return {
    update(cameraX: number, aspect: number, time: number) {
      const weight = sanctuaryWeight(cameraX), plate = sanctuaryBackdrop(cameraX, aspect, valley.width / valley.height);
      root.visible = weight > 0;
      backdrop.position.x = plate.x; backdrop.scale.set(plate.width, plate.height, 1); backdropMaterial.opacity = weight;
      motes.material.opacity = 0.55 * weight;
      motes.position.set(Math.sin(time * 0.2) * 0.15, Math.sin(time * 0.3) * 0.16, 0);
    },
  };
}
