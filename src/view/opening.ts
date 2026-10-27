import * as T from 'three';

// Art-only dressing for the first ground segment. Never used by collision code.
export const openingWeight = (cameraX: number) => 1 - T.MathUtils.smoothstep(cameraX, 28, 44);
const art = `${import.meta.env.BASE_URL}art/opening/`;

export function openingTextures() {
  const loader = new T.TextureLoader();
  const stone = loader.load(`${art}sandstone.webp`, () => {
    // Clones share image data but need their own upload version after async load.
    slab.needsUpdate = cliff.needsUpdate = true;
  });
  stone.colorSpace = T.SRGBColorSpace;
  stone.wrapS = stone.wrapT = T.RepeatWrapping;
  stone.anisotropy = 4;
  // Seeded brush flecks avoid a flat plastic ground without another image request.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#94704c'; c.fillRect(0, 0, 256, 256);
  let seed = 103;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 6500; i++) {
    c.fillStyle = ['#ad8358', '#705543', '#c69b64', '#7f694b'][i % 4];
    c.globalAlpha = 0.12 + random() * 0.25;
    c.fillRect(random() * 256, random() * 256, 1 + random() * 8, 1 + random() * 2);
  }
  const earth = new T.CanvasTexture(canvas);
  earth.colorSpace = T.SRGBColorSpace; earth.wrapS = earth.wrapT = T.RepeatWrapping;
  earth.repeat.set(16, 3); earth.anisotropy = 4;
  const slab = stone.clone(); slab.repeat.set(1.6, 0.45);
  const cliff = stone.clone(); cliff.repeat.set(14, 2);
  return {
    cliff: new T.MeshStandardMaterial({ map: cliff, color: '#a89685', roughness: 1 }),
    slab: new T.MeshStandardMaterial({ map: slab, color: '#c8a17b', roughness: 1 }),
    earth: new T.MeshStandardMaterial({ map: earth, color: '#d7b583', roughness: 1 }),
  };
}

export function buildOpening(scene: T.Scene) {
  const dressing = new T.Group(); dressing.name = 'Opening grove — scenery only'; scene.add(dressing);
  const loader = new T.TextureLoader();
  const background = loader.load(`${art}sunset-grove.webp`);
  background.colorSpace = T.SRGBColorSpace;
  const backdropMaterial = new T.MeshBasicMaterial({ map: background, fog: false, toneMapped: false, transparent: true, depthWrite: false });
  const backdrop = new T.Mesh(new T.PlaneGeometry(1, 1), backdropMaterial);
  backdrop.rotation.x = -Math.atan(0.2);
  backdrop.position.set(12, -1.2, -22); backdrop.renderOrder = -10;
  dressing.add(backdrop);

  // Transparent haze veil is behind actors; it never whites out the play lane.
  const hazeCanvas = document.createElement('canvas'); hazeCanvas.width = 8; hazeCanvas.height = 128;
  const hc = hazeCanvas.getContext('2d')!;
  const fade = hc.createLinearGradient(0, 0, 0, 128);
  fade.addColorStop(0, '#e5a06b00'); fade.addColorStop(0.55, '#e5a06b44'); fade.addColorStop(1, '#e5a06b00');
  hc.fillStyle = fade; hc.fillRect(0, 0, 8, 128);
  const hazeTexture = new T.CanvasTexture(hazeCanvas); hazeTexture.colorSpace = T.SRGBColorSpace;
  const haze = new T.Mesh(new T.PlaneGeometry(64, 12), new T.MeshBasicMaterial({ map: hazeTexture, transparent: true, opacity: 0.24, depthWrite: false, fog: false, toneMapped: false }));
  haze.position.set(12, 3, -4); dressing.add(haze);

  let seed = 307;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  // Shared geometry/materials keep the small grass clumps inexpensive.
  const bladeShape = new T.Shape();
  bladeShape.moveTo(-0.045, 0); bladeShape.quadraticCurveTo(-0.02, 0.5, 0.24, 1);
  bladeShape.quadraticCurveTo(0.03, 0.45, 0.045, 0); bladeShape.closePath();
  const bladeGeometry = new T.ShapeGeometry(bladeShape);
  const grassMaterials = ['#706946', '#a88a4b', '#c5a25f', '#414c43'].map(color => new T.MeshStandardMaterial({ color, roughness: 1, side: T.DoubleSide }));
  const grasses: { position: T.Vector3; height: number; phase: number }[] = [];
  const grassMeshes = grassMaterials.map(material => {
    const mesh = new T.InstancedMesh(bladeGeometry, material, 100);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    // Instance bounds change with wind; this small local group is visibility gated.
    mesh.frustumCulled = false;
    dressing.add(mesh); return mesh;
  });
  const bladeTransform = new T.Object3D();
  for (let i = 0; i < 100; i++) {
    const position = new T.Vector3(-11 + random() * 43, 0.02, (i % 2 ? -1 : 1) * (1.6 + random() * 1.5));
    const h = 0.22 + random() * 0.46;
    for (let j = 0; j < 4; j++) {
      const height = h * (0.65 + random() * 0.5);
      grasses.push({ position, height, phase: i * 0.7 });
    }
  }
  // Exposed roots below the trail edge add irregular shapes without false ledges.
  const rootMaterial = new T.MeshStandardMaterial({ color: '#644636', roughness: 1 });
  for (let i = 0; i < 17; i++) {
    const x = -10 + i * 2.5 + random();
    const path = new T.CatmullRomCurve3([
      new T.Vector3(x, -0.18, 3.95), new T.Vector3(x + 0.2, -0.7, 4.12),
      new T.Vector3(x - 0.3, -1.65, 4.2), new T.Vector3(x + 0.5, -2.7 - random(), 4.05),
    ]);
    const root = new T.Mesh(new T.TubeGeometry(path, 12, 0.07 + random() * 0.06, 5, false), rootMaterial);
    root.castShadow = true; dressing.add(root);
  }
  // A soft disc, not square WebGL points. All positions remain below jump targets.
  const dustCanvas = document.createElement('canvas'); dustCanvas.width = dustCanvas.height = 32;
  const dc = dustCanvas.getContext('2d')!;
  const glow = dc.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, '#fff3d6cc'); glow.addColorStop(0.25, '#ffd6a080'); glow.addColorStop(1, '#ffd6a000');
  dc.fillStyle = glow; dc.fillRect(0, 0, 32, 32);
  const dustTexture = new T.CanvasTexture(dustCanvas); dustTexture.colorSpace = T.SRGBColorSpace;
  const positions = new Float32Array(75 * 3);
  for (let i = 0; i < 75; i++) { positions[i * 3] = -12 + random() * 48; positions[i * 3 + 1] = random() * 7; positions[i * 3 + 2] = -3 + random() * 6; }
  const dustGeometry = new T.BufferGeometry(); dustGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const dust = new T.Points(dustGeometry, new T.PointsMaterial({ map: dustTexture, color: '#ffd6a0', size: 0.11, transparent: true, opacity: 0.65, depthWrite: false, toneMapped: false }));
  dressing.add(dust);
  return {
    update(cameraX: number, aspect: number, time: number) {
      const weight = openingWeight(cameraX);
      dressing.visible = weight > 0;
      // Orthographic cameras need explicit differential motion for painted layers.
      backdrop.position.x = 4 + (cameraX - 7) * 0.84;
      // Include the parallax offset so the plate covers wide views while fading.
      const width = Math.max(43, aspect * 17 * 1.25, aspect * 17 + 2 * Math.abs(cameraX - backdrop.position.x) + 2);
      backdrop.scale.set(width, width / (1672 / 941), 1);
      backdropMaterial.opacity = weight;
      haze.material.opacity = 0.24 * weight;
      haze.position.x = 12 + (cameraX - 7) * 0.45;
      dust.material.opacity = 0.65 * weight;
      dust.position.x = Math.sin(time * 0.17) * 0.4; dust.position.y = Math.sin(time * 0.25) * 0.2;
      if (weight > 0) {
        grasses.forEach((grass, i) => {
          const blade = i % 4;
          bladeTransform.position.copy(grass.position);
          bladeTransform.rotation.z = (blade - 1.5) * 0.23 + Math.sin(time * 1.3 + grass.phase) * 0.045;
          bladeTransform.scale.set(0.65, grass.height, 1); bladeTransform.updateMatrix();
          grassMeshes[blade].setMatrixAt(Math.floor(i / 4), bladeTransform.matrix);
        });
        grassMeshes.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
      }
    },
  };
}
