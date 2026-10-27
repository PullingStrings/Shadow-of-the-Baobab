import * as T from 'three';
import { warrior, warthog } from './meshes';
import { buildWorld } from './world';
import { FollowCamera } from './camera';
import type { GameState } from '../game/types';
export class GameView {
  private renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  readonly follow = new FollowCamera();
  private hero = warrior();
  private queen = warrior(true);
  private boars = [warthog(), warthog(), warthog()];
  private world;
  private sun = new T.DirectionalLight('#ffcf90', 3.4);
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene.background = new T.Color('#80958a');
    this.scene.fog = new T.FogExp2('#80958a', 0.014);
    this.scene.add(new T.HemisphereLight('#c8e4d2', '#48513e', 2.8));
    this.sun.position.set(8, 17, 7); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -22, right: 22, top: 17, bottom: -17, near: 1, far: 65 });
    this.sun.shadow.bias = -0.001; this.scene.add(this.sun, this.sun.target);
    const rim = new T.DirectionalLight('#a8d8cd', 1.5); rim.position.set(-10, 5, -12); this.scene.add(rim);
    this.world = buildWorld(this.scene);
    this.scene.add(this.hero.root, this.queen.root, ...this.boars.map(b => b.root));
    this.queen.root.position.set(94, 3, 0.65);
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      this.renderer.setSize(width, height, false); this.follow.resize(width, height);
    };
    new ResizeObserver(resize).observe(canvas); resize();
  }
  render(state: GameState, dt: number, time: number) {
    const p = state.player;
    this.hero.root.position.set(p.x, p.y, 0.65);
    this.hero.root.scale.x = p.facing;
    this.hero.root.visible = p.invulnerable <= 0 || Math.floor(time * 18) % 2 === 0;
    const run = p.grounded ? Math.min(1, Math.abs(p.vx) / 9) : 0.2;
    this.hero.leftLeg.rotation.z = Math.sin(state.time * 18) * 0.65 * run;
    this.hero.rightLeg.rotation.z = -this.hero.leftLeg.rotation.z;
    // Extend along the facing axis, hold through the hit window, then retract.
    const thrust = p.attack > 0 ? Math.sin(Math.min(1, (0.3 - p.attack) / 0.075) * Math.PI / 2) * Math.min(1, p.attack / 0.06) : 0;
    this.hero.arm.position.x = 0.35 + thrust * 0.95;
    const elbowX = this.hero.arm.position.x - 0.25 - this.hero.upperArm.position.x;
    this.hero.upperArm.rotation.z = Math.atan2(-0.34, elbowX);
    this.hero.upperArm.scale.x = Math.hypot(elbowX, 0.34);
    const cloth = this.hero.cape.geometry.getAttribute('position');
    for (let i = 0; i < cloth.count; i++) {
      const s = Math.floor(i / 2) / 8;
      const flutter = Math.sin(state.time * 9 - s * 7) * (0.09 + run * 0.18);
      cloth.setXYZ(i,
        this.hero.capeRest[i * 3] - s * run * 0.55,
        this.hero.capeRest[i * 3 + 1] + s * (flutter + run * 0.5 - p.vy * 0.015),
        this.hero.capeRest[i * 3 + 2]);
    }
    cloth.needsUpdate = true;
    if (state.phase === 'dead') this.hero.root.rotation.z = -1.2;
    else this.hero.root.rotation.z = 0;
    state.enemies.forEach((e, i) => {
      const b = this.boars[i]; b.root.visible = e.hp > 0;
      b.root.position.set(e.x, e.mode === 'windup' ? Math.sin(time * 35) * 0.035 : 0, 0.65);
      b.root.scale.x = e.facing;
      b.root.rotation.z = e.mode === 'windup' ? -0.08 : 0;
      b.legs.forEach((l, j) => l.rotation.z = Math.sin(state.time * (e.mode === 'charge' ? 28 : 9) + j * 2) * (e.mode === 'recover' ? 0 : 0.3));
    });
    this.queen.arm.rotation.z = Math.sin(time * 2) * 0.15;
    this.world.ring.visible = state.phase !== 'won';
    this.world.ring.rotation.z = time * 0.12;
    this.world.flames.forEach((f, i) => f.scale.y = 0.5 + Math.sin(time * 9 + i) * 0.09);
    this.world.particles.position.y = Math.sin(time * 0.35) * 0.2;
    this.follow.update(p.x, p.y, dt, state.phase === 'ready');
    this.sun.position.x = this.follow.x + 5; this.sun.target.position.set(this.follow.x, 0, 0);
    this.renderer.render(this.scene, this.follow.camera);
  }
}
