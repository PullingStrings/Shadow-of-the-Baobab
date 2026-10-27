import * as T from 'three';
import type { Platform } from '../game/types';
import { TREE_ART } from './grove-art';
import { paintedShape } from './painted-shape';

/** Decorative branches share the existing collision ledges' exact X/Y/width. */
export function buildGroveLedges(scene: T.Scene, ledges: Platform[]) {
  const targets: { painted: T.Mesh; fallback: T.Group }[] = [];
  const texture = new T.TextureLoader().load(`${import.meta.env.BASE_URL}art/opening/tree-ledges.webp`, () => {
    targets.forEach(t => { t.painted.visible = true; t.fallback.visible = false; });
  }, undefined, () => console.warn('Tree ledge artwork unavailable; retaining the wooden branch fallback.'));
  texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4;
  const material = new T.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.08,
    side: T.DoubleSide, depthWrite: false, toneMapped: false });
  const wood = new T.MeshStandardMaterial({ color: '#70503b', roughness: 1 });
  ledges.forEach((p, i) => {
    const group = new T.Group(); group.name = `Tree ledge ${p.x}`;
    const art = TREE_ART.trees[i % 2];
    const sx = p.width / (art.ledgeTo - art.ledgeFrom), sy = p.y / (art.rootY - art.ledgeY);
    const origin = [(art.ledgeFrom + art.ledgeTo) / 2, art.rootY];
    const painted = new T.Mesh(paintedShape(art.outline, origin, sx, sy, TREE_ART.width, TREE_ART.height), material);
    painted.position.set(p.x, 0, -0.45); painted.castShadow = true; painted.renderOrder = 2; painted.visible = false;
    group.add(painted);
    // Readable, organic fallback while loading; no stone pillars or broad caps.
    const fallback = new T.Group(); group.add(fallback);
    const bough = new T.Mesh(new T.CylinderGeometry(0.16, 0.24, p.width, 9), wood);
    bough.rotation.z = Math.PI / 2; bough.position.set(p.x, p.y - 0.18, -0.5); bough.castShadow = true;
    fallback.add(bough);
    const path = new T.CatmullRomCurve3([
      new T.Vector3(p.x - p.width / 2 - 1, 0, -0.55),
      new T.Vector3(p.x - p.width / 2 - 0.7, p.y * 0.6, -0.55),
      new T.Vector3(p.x - p.width / 2, p.y - 0.2, -0.55),
    ]);
    const trunk = new T.Mesh(new T.TubeGeometry(path, 12, 0.28, 7, false), wood); trunk.castShadow = true; fallback.add(trunk);
    // A fine sunlit trace marks the exact landing plane instead of a beige slab.
    const edgeGeometry = new T.BufferGeometry().setFromPoints([
      new T.Vector3(p.x - p.width / 2, p.y, -0.35), new T.Vector3(p.x + p.width / 2, p.y, -0.35),
    ]);
    const edge = new T.Line(edgeGeometry, new T.LineDashedMaterial({ color: '#e3b56d', transparent: true,
      opacity: 0.78, dashSize: 0.2, gapSize: 0.15 }));
    edge.computeLineDistances(); edge.name = 'Sunlit landing edge'; edge.renderOrder = 3; group.add(edge);
    group.userData.ledge = { x: p.x, y: p.y, width: p.width };
    scene.add(group); targets.push({ painted, fallback });
  });
}
