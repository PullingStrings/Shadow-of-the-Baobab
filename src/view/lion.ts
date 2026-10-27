import * as T from 'three';
import type { Enemy } from '../game/types';
import { ENEMY_MAX_HP } from '../game/attacks';
import { LION_ART } from './grove-art';
import { paintedShape } from './painted-shape';
import { lionFrame } from './lion-pose';

function fallbackLion() {
  const root = new T.Group();
  const fur = new T.MeshStandardMaterial({ color: '#ad7b43', roughness: 1 });
  const mane = new T.MeshStandardMaterial({ color: '#62402d', roughness: 1 });
  const sphere = (size: number[], at: number[], material: T.MeshStandardMaterial) => {
    const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), material);
    m.scale.set(size[0], size[1], size[2]); m.position.set(at[0], at[1], at[2]); m.castShadow = true; root.add(m);
  };
  sphere([0.9, 0.43, 0.35], [-0.15, 0.87, 0], fur);
  sphere([0.48, 0.65, 0.42], [0.65, 1.04, 0], mane);
  sphere([0.3, 0.3, 0.28], [0.98, 1.16, 0.07], fur);
  sphere([0.27, 0.16, 0.2], [1.15, 1.02, 0.1], fur);
  for (const x of [-0.68, 0.55]) for (const z of [-0.18, 0.18]) sphere([0.13, 0.41, 0.12], [x, 0.43, z], fur);
  const tail = new T.CatmullRomCurve3([new T.Vector3(-0.8, 1, 0), new T.Vector3(-1.4, 0.55, 0), new T.Vector3(-1.75, 0.7, 0)]);
  root.add(new T.Mesh(new T.TubeGeometry(tail, 10, 0.045, 6, false), fur));
  sphere([0.14, 0.1, 0.09], [-1.75, 0.7, 0], mane);
  return root;
}

export class PaintedLion {
  readonly root = new T.Group();
  readonly shadow: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>;
  private fallback = fallbackLion();
  private sprite: T.Mesh<T.ShapeGeometry, T.MeshBasicMaterial>;
  private geometries = LION_ART.frames.map(f => paintedShape(f.outline, f.origin, LION_ART.scale, LION_ART.scale, LION_ART.width, LION_ART.height));
  private ready = false;
  private distance = 0;
  private previousX: number | undefined;
  private previousTime = 0;
  private previousMode: Enemy['mode'] = 'patrol';
  private previousHP = ENEMY_MAX_HP;
  private flashUntil = 0;
  private health = new T.Group();
  private pips: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>[] = [];
  constructor() {
    const texture = new T.TextureLoader().load(`${import.meta.env.BASE_URL}art/enemies/lion.webp`, () => { this.ready = true; }, undefined,
      () => console.warn('Lion artwork unavailable; retaining the lion-shaped fallback.'));
    texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4;
    this.sprite = new T.Mesh(this.geometries[0], new T.MeshBasicMaterial({ map: texture, transparent: true,
      alphaTest: 0.08, side: T.DoubleSide, depthWrite: false, toneMapped: false, color: '#fff4e8' }));
    this.sprite.name = 'Painted lion'; this.sprite.castShadow = true; this.sprite.renderOrder = 10;
    this.sprite.position.y = 0.025; this.sprite.visible = false;
    this.root.add(this.sprite, this.fallback, this.health);
    this.health.position.set(0, 2.22, 0.12); this.health.visible = false;
    for (let i = 0; i < ENEMY_MAX_HP; i++) {
      const pip = new T.Mesh(new T.PlaneGeometry(0.16, 0.055), new T.MeshBasicMaterial({ color: '#efc17b', depthTest: false, depthWrite: false }));
      pip.position.x = (i - (ENEMY_MAX_HP - 1) / 2) * 0.23; pip.renderOrder = 30;
      this.health.add(pip); this.pips.push(pip);
    }
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const c = canvas.getContext('2d')!, glow = c.createRadialGradient(32, 32, 0, 32, 32, 31);
    glow.addColorStop(0, '#20172499'); glow.addColorStop(1, '#20172400'); c.fillStyle = glow; c.fillRect(0, 0, 64, 64);
    this.shadow = new T.Mesh(new T.PlaneGeometry(2.7, 0.9), new T.MeshBasicMaterial({ map: new T.CanvasTexture(canvas),
      transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.name = 'Lion contact shadow';
  }
  update(enemy: Enemy, time: number) {
    if (time < this.previousTime || enemy.hp > this.previousHP) this.flashUntil = 0;
    else if (enemy.hp < this.previousHP) this.flashUntil = time + 0.12;
    this.previousHP = enemy.hp;
    if (time < this.previousTime || enemy.mode !== this.previousMode) this.distance = 0;
    else if (this.previousX !== undefined && (enemy.mode === 'patrol' || enemy.mode === 'charge')) this.distance += Math.abs(enemy.x - this.previousX);
    this.previousX = enemy.x; this.previousTime = time; this.previousMode = enemy.mode;
    this.sprite.geometry = this.geometries[lionFrame(enemy.mode, this.distance)];
    this.sprite.visible = this.ready; this.fallback.visible = !this.ready;
    this.sprite.material.color.set('#fff4e8');
    if (time < this.flashUntil) this.sprite.material.color.setRGB(2.2, 1.5, 1);
    this.health.visible = enemy.hp > 0 && enemy.hp < ENEMY_MAX_HP;
    this.pips.forEach((pip, i) => pip.material.color.set(i < enemy.hp ? '#efc17b' : '#503c3e'));
    this.root.visible = enemy.hp > 0;
    this.root.position.set(enemy.x, enemy.y, 0.65); this.root.scale.x = enemy.facing;
    this.shadow.visible = enemy.hp > 0; this.shadow.position.set(enemy.x, enemy.y + 0.035, 0.65);
  }
}
