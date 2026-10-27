import * as T from 'three';
import { warrior } from './meshes';
import { breathingOffset } from './hero-pose';
import { SANCTUARY_ART } from './sanctuary-art';
import { sanctuaryDais } from './sanctuary-layout';
import type { GameState } from '../game/types';

/** One complete painted figure; no separately animated body parts. */
export class PaintedQueen {
  readonly root = new T.Group();
  private fallback = warrior(true);
  private sprite: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>;
  private restY: Float32Array;
  constructor() {
    this.root.name = 'Painted queen';
    this.root.position.set(sanctuaryDais.x, sanctuaryDais.y, 0.65);
    const art = SANCTUARY_ART.queen;
    const texture = new T.TextureLoader().load(`${import.meta.env.BASE_URL}art/sanctuary/queen.webp`, () => {
      this.sprite.visible = true; this.fallback.root.visible = false;
    }, undefined, () => console.warn('Queen artwork unavailable; retaining the original queen fallback.'));
    texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4;
    this.sprite = new T.Mesh(new T.PlaneGeometry(1, 1, 1, 12), new T.MeshBasicMaterial({ map: texture,
      transparent: true, alphaTest: 0.08, depthWrite: false, side: T.DoubleSide, toneMapped: false, color: '#fff4e8' }));
    const vertices = this.sprite.geometry.getAttribute('position'), uv = this.sprite.geometry.getAttribute('uv');
    this.restY = new Float32Array(vertices.count);
    for (let i = 0; i < vertices.count; i++) {
      this.restY[i] = (art.origin[1] - (1 - uv.getY(i)) * art.height) * art.scale;
      vertices.setXYZ(i, (uv.getX(i) * art.width - art.origin[0]) * art.scale, this.restY[i], 0);
    }
    vertices.needsUpdate = true; this.sprite.geometry.computeBoundingSphere();
    this.sprite.name = 'Complete painted queen'; this.sprite.visible = false; this.sprite.renderOrder = 12;
    this.root.add(this.sprite, this.fallback.root);
  }
  update(state: GameState) {
    const vertices = this.sprite.geometry.getAttribute('position');
    for (let i = 0; i < vertices.count; i++) {
      vertices.setY(i, this.restY[i] + breathingOffset(state.time, this.restY[i]));
    }
    vertices.needsUpdate = true; this.sprite.geometry.computeBoundingSphere();
  }
}
