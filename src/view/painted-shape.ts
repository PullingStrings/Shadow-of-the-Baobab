import * as T from 'three';

/** Keep only this painted silhouette when atlas rectangles overlap neighbours. */
export function paintedShape(outline: number[][], origin: number[], scaleX: number, scaleY: number, width: number, height: number) {
  const shape = new T.Shape(outline.map(([x, y]) => new T.Vector2((x - origin[0]) * scaleX, (origin[1] - y) * scaleY)));
  shape.autoClose = true;
  const geometry = new T.ShapeGeometry(shape);
  const p = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
  for (let i = 0; i < p.count; i++) {
    uv.setXY(i, (p.getX(i) / scaleX + origin[0]) / width, 1 - (origin[1] - p.getY(i) / scaleY) / height);
  }
  return geometry;
}
