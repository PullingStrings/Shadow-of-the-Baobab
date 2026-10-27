import * as T from 'three';
export class FollowCamera {
  readonly camera = new T.OrthographicCamera(-15, 15, 8.5, -8.5, 0.1, 150);
  x = 7;
  resize(width: number, height: number) {
    const halfHeight = 8.5, halfWidth = halfHeight * width / height;
    this.camera.left = -halfWidth; this.camera.right = halfWidth;
    this.camera.top = halfHeight; this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }
  update(x: number, y: number, dt: number, ready: boolean) {
    const target = ready ? 8 : Math.max(7, Math.min(91, x + 3));
    this.x = T.MathUtils.damp(this.x, target, 4, dt);
    const cy = 3.2 + Math.max(0, y - 3) * 0.28;
    this.camera.position.set(this.x, cy + 5, 25);
    this.camera.lookAt(this.x, cy, 0);
  }
}
