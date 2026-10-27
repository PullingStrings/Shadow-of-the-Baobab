import * as T from 'three';
import { warrior } from './meshes';
import { heroPose, type LimbPose } from './hero-pose';
import { ground, platforms } from '../game/world';
import type { GameState } from '../game/types';

// Pixel bounds measured from the generated atlas, not assumed equal-sized cells.
// Rectangles include a transparent gutter; anchors locate anatomical joints.
const ATLAS = { width: 1774, height: 887 };
type Part = 'head' | 'torso' | 'cape' | 'spear' | 'upperArm' | 'forearm' | 'thigh' | 'shin' | 'boot';
const parts: Record<Part, { rect: number[]; anchor: number[]; scale: number }> = {
  head: { rect: [52, 88, 349, 370], anchor: [240, 350], scale: 0.00245 },
  torso: { rect: [460, 28, 717, 433], anchor: [600, 280], scale: 0.0034 },
  cape: { rect: [763, 111, 1280, 385], anchor: [1260, 145], scale: 0.003 },
  spear: { rect: [1308, 199, 1754, 251], anchor: [1466, 225], scale: 2.55 / 442 },
  upperArm: { rect: [128, 463, 303, 828], anchor: [220, 530], scale: 0.66 / 287 },
  forearm: { rect: [585, 460, 716, 842], anchor: [650, 470], scale: 0.66 / 351 },
  thigh: { rect: [988, 459, 1184, 819], anchor: [1083, 478], scale: 0.5 / 327 },
  shin: { rect: [1471, 460, 1693, 763], anchor: [1545, 475], scale: 0.45 / 276 },
  boot: { rect: [1471, 738, 1693, 823], anchor: [1545, 751], scale: 0.45 / 276 },
};

function partGeometry(name: Part, columns = 1, rows = 1) {
  const { rect: [left, top, right, bottom], anchor, scale } = parts[name];
  const geometry = new T.PlaneGeometry((right - left) * scale, (bottom - top) * scale, columns, rows);
  geometry.translate(((left + right) / 2 - anchor[0]) * scale, (anchor[1] - (top + bottom) / 2) * scale, 0);
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (left + uv.getX(i) * (right - left)) / ATLAS.width,
      1 - (top + (1 - uv.getY(i)) * (bottom - top)) / ATLAS.height);
  }
  return geometry;
}

function placeLimb(upper: T.Mesh, lower: T.Mesh, pose: LimbPose, upperLength: number, lowerLength: number) {
  upper.position.x = pose.start.x; upper.position.y = pose.start.y;
  upper.rotation.z = Math.atan2(pose.joint.y - pose.start.y, pose.joint.x - pose.start.x) + Math.PI / 2;
  upper.scale.y = Math.hypot(pose.joint.x - pose.start.x, pose.joint.y - pose.start.y) / upperLength;
  lower.position.x = pose.joint.x; lower.position.y = pose.joint.y;
  lower.rotation.z = Math.atan2(pose.end.y - pose.joint.y, pose.end.x - pose.joint.x) + Math.PI / 2;
  lower.scale.y = Math.hypot(pose.end.x - pose.joint.x, pose.end.y - pose.joint.y) / lowerLength;
}

export class PaintedHero {
  readonly root = new T.Group();
  readonly shadow: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>;
  private rig = new T.Group();
  private body = new T.Group();
  private fallback = warrior();
  private near: T.MeshBasicMaterial;
  private far: T.MeshBasicMaterial;
  private head: T.Mesh;
  private cape: T.Mesh;
  private capeRest: Float32Array;
  private upperArm: T.Mesh;
  private forearm: T.Mesh;
  private farUpperArm: T.Mesh;
  private farForearm: T.Mesh;
  private legs: { upper: T.Mesh; lower: T.Mesh; boot: T.Mesh }[];
  private spear: T.Mesh;
  private ready = false;
  private previousTime = 0;
  private wasGrounded = true;
  private landing = 0;
  constructor() {
    this.root.name = 'Painted hero';
    const texture = new T.TextureLoader().load(`${import.meta.env.BASE_URL}art/hero/warrior-parts.webp`, () => {
      this.ready = true;
    }, undefined, () => console.warn('Painted hero atlas unavailable; retaining the procedural hero.'));
    texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4;
    // Baked brush highlights preserve the painted look under changing world light.
    const options: T.MeshBasicMaterialParameters = { map: texture, side: T.DoubleSide, transparent: true, alphaTest: 0.05, depthWrite: false, toneMapped: false };
    this.near = new T.MeshBasicMaterial({ ...options, color: '#fff3e6' });
    this.far = new T.MeshBasicMaterial({ ...options, color: '#a4a0b5' });
    this.root.add(this.rig, this.fallback.root); this.rig.add(this.body);
    const add = (name: Part, parent: T.Group, layer: number, far = false, columns = 1, rows = 1) => {
      const mesh = new T.Mesh(partGeometry(name, columns, rows), far ? this.far : this.near);
      mesh.name = name; mesh.position.z = layer * 0.01;
      mesh.renderOrder = 10 + layer; mesh.castShadow = true; parent.add(mesh); return mesh;
    };
    this.cape = add('cape', this.body, -8, false, 16, 4);
    this.cape.position.x = -0.18; this.cape.position.y = 0.82;
    this.capeRest = Float32Array.from(this.cape.geometry.getAttribute('position').array);
    this.legs = [false, true].map(far => ({
      upper: add('thigh', this.rig, far ? -5 : 1, far),
      lower: add('shin', this.rig, far ? -4 : 2, far),
      boot: add('boot', this.rig, far ? -3 : 3, far),
    }));
    this.farUpperArm = add('upperArm', this.rig, -2, true);
    this.farForearm = add('forearm', this.rig, -1, true);
    this.farUpperArm.scale.setScalar(0.48 / 0.66); this.farForearm.scale.setScalar(0.48 / 0.66);
    add('torso', this.body, 5);
    this.head = add('head', this.body, 6); this.head.position.set(0.04, 0.8, 0.06);
    this.upperArm = add('upperArm', this.rig, 7);
    this.spear = add('spear', this.rig, 8);
    this.forearm = add('forearm', this.rig, 9);

    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const c = canvas.getContext('2d')!;
    const gradient = c.createRadialGradient(32, 32, 0, 32, 32, 31);
    gradient.addColorStop(0, '#1b1425aa'); gradient.addColorStop(0.45, '#1b142560'); gradient.addColorStop(1, '#1b142500');
    c.fillStyle = gradient; c.fillRect(0, 0, 64, 64);
    const shadowMap = new T.CanvasTexture(canvas); shadowMap.colorSpace = T.SRGBColorSpace;
    this.shadow = new T.Mesh(new T.PlaneGeometry(1.5, 0.85), new T.MeshBasicMaterial({ map: shadowMap, transparent: true, opacity: 0.65, depthWrite: false, toneMapped: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.name = 'Hero contact shadow';
    this.rig.visible = false;
  }
  update(state: GameState) {
    const p = state.player;
    const elapsed = state.time - this.previousTime;
    if (elapsed < 0) { this.landing = 0; this.wasGrounded = true; }
    if (p.grounded && !this.wasGrounded) this.landing = 1;
    this.landing = Math.max(0, this.landing - Math.max(0, elapsed) * 6);
    this.wasGrounded = p.grounded; this.previousTime = state.time;
    const pose = heroPose(p, state.time, state.phase, this.landing);
    this.root.position.set(p.x, p.y, 0.65); this.root.scale.x = p.facing;
    this.root.visible = p.invulnerable <= 0 || Math.floor(state.time * 18) % 2 === 0;
    // Collapse around the feet; this is cosmetic and cannot alter the player body.
    this.rig.rotation.z = pose.dead ? -1.2 : 0;
    this.rig.visible = this.ready; this.fallback.root.visible = !this.ready;
    this.body.position.set(0.2, 1.23 + pose.bob, 0); this.body.rotation.z = pose.lean;
    this.head.rotation.z = -pose.lean * 0.35;
    placeLimb(this.upperArm, this.forearm, pose.arm, 0.66, 0.66);
    placeLimb(this.farUpperArm, this.farForearm, pose.farArm, 0.66, 0.66);
    this.spear.position.x = pose.grip.x; this.spear.position.y = pose.grip.y;
    this.legs.forEach((leg, i) => {
      placeLimb(leg.upper, leg.lower, pose.legs[i], 0.5, 0.45);
      leg.boot.position.x = pose.legs[i].end.x; leg.boot.position.y = pose.legs[i].end.y;
    });
    const cloth = this.cape.geometry.getAttribute('position');
    for (let i = 0; i < cloth.count; i++) {
      const x = this.capeRest[i * 3], y = this.capeRest[i * 3 + 1];
      const weight = T.MathUtils.clamp(-x / 1.5, 0, 1);
      cloth.setXYZ(i, x - weight * pose.run * 0.18,
        y + weight * (Math.sin(state.time * 8 - weight * 6) * (0.035 + pose.run * 0.065) + pose.run * 0.16 - p.vy * 0.008),
        this.capeRest[i * 3 + 2]);
    }
    cloth.needsUpdate = true;
    this.cape.geometry.computeBoundingSphere();
    if (!this.ready) {
      this.fallback.leftLeg.rotation.z = Math.sin(state.time * 14) * 0.6 * pose.run;
      this.fallback.rightLeg.rotation.z = -this.fallback.leftLeg.rotation.z;
      this.fallback.arm.position.x = pose.grip.x;
      const dx = pose.grip.x - 0.25 - this.fallback.upperArm.position.x;
      this.fallback.upperArm.rotation.z = Math.atan2(-0.34, dx);
      this.fallback.upperArm.scale.x = Math.hypot(dx, 0.34);
      this.fallback.root.rotation.z = pose.dead ? -1.2 : 0;
    }
    const supports = platforms.filter(platform => Math.abs(p.x - platform.x) <= platform.width / 2 && platform.y <= p.y + 0.08).map(platform => platform.y);
    if (ground.some(segment => p.x >= segment.from && p.x <= segment.to) && p.y >= -0.08) supports.push(0);
    const floor = supports.length ? Math.max(...supports) : undefined;
    this.shadow.visible = floor !== undefined && state.phase !== 'dead';
    if (floor !== undefined) {
      const height = Math.max(0, p.y - floor);
      this.shadow.position.set(p.x, floor + 0.035, 0.65);
      this.shadow.scale.setScalar(1 + Math.min(height, 5) * 0.07);
      this.shadow.material.opacity = 0.65 / (1 + height * 0.5);
    }
  }
}
