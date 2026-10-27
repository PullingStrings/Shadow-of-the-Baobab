import type { Body } from './types.js';
import { ground, platforms } from './world.js';
export const GRAVITY = 30;
export function integrate(body: Body, dt: number) {
  const previousY = body.y;
  body.vy -= GRAVITY * dt;
  body.x = Math.max(-5, Math.min(100, body.x + body.vx * dt));
  body.y += body.vy * dt;
  body.grounded = false;
  const surfaces = [
    ...ground.map(g => ({ x: (g.from + g.to) / 2, width: g.to - g.from, y: 0 })),
    ...platforms,
  ];
  if (body.vy <= 0) {
    const landing = surfaces.filter(p => body.x > p.x - p.width / 2 - 0.25 && body.x < p.x + p.width / 2 + 0.25 && previousY >= p.y - 0.02 && body.y <= p.y).sort((a, b) => b.y - a.y)[0];
    if (landing) { body.y = landing.y; body.vy = 0; body.grounded = true; }
  }
}
