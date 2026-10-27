import * as T from 'three';
import { warrior } from './meshes';
import { HeroFrameClock } from './hero-pose';
import { HERO_FRAMES, HERO_SHEETS, type HeroSheet } from './hero-frames';
import { ground, platforms } from '../game/world';
import type { GameState } from '../game/types';

export class PaintedHero {
  readonly root = new T.Group();
  readonly shadow: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>;
  private fallback = warrior();
  private clock = new HeroFrameClock();
  private loaded = { movement: false, attack: false };
  private textures: Record<HeroSheet, T.Texture>;
  private material: T.MeshBasicMaterial;
  private sprite: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>;
  private currentFrame = '';
  constructor() {
    this.root.name = 'Painted hero — complete animation frames';
    const loader = new T.TextureLoader();
    const load = (sheet: HeroSheet) => {
      const texture = loader.load(`${import.meta.env.BASE_URL}art/hero/${HERO_SHEETS[sheet].file}`,
        () => { this.loaded[sheet] = true; }, undefined,
        () => console.warn(`Hero ${sheet} sheet unavailable; retaining the procedural fallback.`));
      texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4;
      return texture;
    };
    this.textures = { movement: load('movement'), attack: load('attack') };
    this.material = new T.MeshBasicMaterial({ map: this.textures.movement, side: T.DoubleSide,
      transparent: true, alphaTest: 0.08, depthWrite: false, toneMapped: false, color: '#fff3e6' });
    this.sprite = new T.Mesh(new T.PlaneGeometry(1, 1), this.material);
    this.sprite.name = 'Whole-body painted frame'; this.sprite.castShadow = true;
    this.sprite.position.y = 0.025;
    this.sprite.renderOrder = 10; this.sprite.visible = false;
    this.root.add(this.sprite, this.fallback.root);

    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const c = canvas.getContext('2d')!;
    const gradient = c.createRadialGradient(32, 32, 0, 32, 32, 31);
    gradient.addColorStop(0, '#1b1425aa'); gradient.addColorStop(0.45, '#1b142560'); gradient.addColorStop(1, '#1b142500');
    c.fillStyle = gradient; c.fillRect(0, 0, 64, 64);
    const shadowMap = new T.CanvasTexture(canvas); shadowMap.colorSpace = T.SRGBColorSpace;
    this.shadow = new T.Mesh(new T.PlaneGeometry(1.5, 0.85), new T.MeshBasicMaterial({ map: shadowMap,
      transparent: true, opacity: 0.65, depthWrite: false, toneMapped: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.name = 'Hero contact shadow';
  }
  private showFrame(id: string) {
    if (id === this.currentFrame) return;
    const frame = HERO_FRAMES[id], sheet = HERO_SHEETS[frame.sheet];
    const [left, top, right, bottom] = frame.rect;
    const corners = [[left, top], [right, top], [left, bottom], [right, bottom]];
    const position = this.sprite.geometry.getAttribute('position');
    const uv = this.sprite.geometry.getAttribute('uv');
    corners.forEach(([x, y], i) => {
      position.setXYZ(i, (x - frame.origin[0]) * frame.scale, (frame.origin[1] - y) * frame.scale, 0);
      uv.setXY(i, x / sheet.width, 1 - y / sheet.height);
    });
    position.needsUpdate = true; uv.needsUpdate = true;
    this.sprite.geometry.computeBoundingSphere();
    this.material.map = this.textures[frame.sheet];
    this.currentFrame = id;
  }
  update(state: GameState) {
    const p = state.player;
    const frame = this.clock.update(state);
    const ready = this.loaded.movement && this.loaded.attack;
    this.root.position.set(p.x, p.y, 0.65); this.root.scale.x = p.facing;
    this.root.visible = p.invulnerable <= 0 || Math.floor(state.time * 18) % 2 === 0;
    this.sprite.visible = ready; this.fallback.root.visible = !ready;
    this.showFrame(frame.id);
    this.sprite.rotation.z = frame.action === 'dead' ? -1.2 : 0;
    if (!ready) {
      const run = p.grounded ? Math.min(1, Math.abs(p.vx) / 9) : 0.2;
      this.fallback.leftLeg.rotation.z = Math.sin(state.time * 14) * 0.6 * run;
      this.fallback.rightLeg.rotation.z = -this.fallback.leftLeg.rotation.z;
      const thrust = p.attack > 0 ? Math.sin(Math.min(1, (0.3 - p.attack) / 0.075) * Math.PI / 2) * Math.min(1, p.attack / 0.06) : 0;
      this.fallback.arm.position.x = 0.35 + thrust * 0.95;
      const dx = this.fallback.arm.position.x - 0.25 - this.fallback.upperArm.position.x;
      this.fallback.upperArm.rotation.z = Math.atan2(-0.34, dx);
      this.fallback.upperArm.scale.x = Math.hypot(dx, 0.34);
      this.fallback.root.rotation.z = frame.action === 'dead' ? -1.2 : 0;
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
