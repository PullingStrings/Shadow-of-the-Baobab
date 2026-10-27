import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../src/game/player.js';
import { BOOT_SOLE_OFFSET, heroPose, solveLimb } from '../src/view/hero-pose.js';

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`);
test('hero limb solver keeps both bone lengths for folded, straight and unreachable targets', () => {
  for (const end of [{ x: 0, y: 0 }, { x: 0.2, y: -0.3 }, { x: 100, y: 100 }]) {
    for (const bend of [1, -1] as const) {
      const pose = solveLimb({ x: 0, y: 0 }, end, 0.66, 0.66, bend);
      close(Math.hypot(pose.joint.x, pose.joint.y), 0.66);
      close(Math.hypot(pose.end.x - pose.joint.x, pose.end.y - pose.joint.y), 0.66);
    }
  }
});
test('painted spear retains the horizontal path and original maximum reach through every attack frame', () => {
  const p = createPlayer(); p.vx = 9;
  for (const facing of [-1, 1]) {
    p.facing = facing;
    for (let frame = 0; frame <= 36; frame++) {
      p.attack = frame / 120;
      const pose = heroPose(p, 1, 'playing');
      close(pose.spearTip.y, 1.35);
      close(pose.arm.end.x, pose.grip.x); close(pose.arm.end.y, pose.grip.y);
      assert.ok(pose.spearTip.x <= 2.950001 && pose.spearTip.x >= 1.999999);
    }
  }
  p.attack = 0.15; close(heroPose(p, 1, 'playing').spearTip.x, 2.95);
});
test('upright boots stay above the floor over a complete running cycle', () => {
  const p = createPlayer(); p.vx = 9;
  for (let frame = 0; frame < 240; frame++) {
    const pose = heroPose(p, frame / 120, 'playing');
    for (const leg of pose.legs) {
      assert.ok(leg.end.y - BOOT_SOLE_OFFSET >= 0.02499);
      close(Math.hypot(leg.joint.x - leg.start.x, leg.joint.y - leg.start.y), 0.5);
      close(Math.hypot(leg.end.x - leg.joint.x, leg.end.y - leg.joint.y), 0.45);
    }
  }
});
test('hero view has distinct rise, fall, strike, hurt and death poses without changing simulation state', () => {
  const p = createPlayer(); const initial = structuredClone(p);
  assert.equal(heroPose(p, 0, 'playing').action, 'idle');
  p.grounded = false; p.vy = 8; const rise = heroPose(p, 1, 'playing');
  p.vy = -8; const fall = heroPose(p, 1, 'playing');
  assert.equal(rise.action, 'rise'); assert.equal(fall.action, 'fall'); assert.notDeepEqual(rise.legs, fall.legs);
  p.attack = 0.2; assert.equal(heroPose(p, 1, 'playing').action, 'strike');
  p.invulnerable = 1.4; assert.equal(heroPose(p, 1, 'playing').action, 'hurt');
  assert.equal(heroPose(p, 1, 'dead').action, 'dead');
  Object.assign(p, initial); heroPose(p, 1, 'playing'); assert.deepEqual(p, initial);
});
test('pausing freezes the same visual pose and torso motion never shifts the attack line', () => {
  const p = createPlayer(); p.vx = 9; p.attack = 0.15;
  assert.deepEqual(heroPose(p, 0.73, 'playing'), heroPose(p, 0.73, 'paused'));
  for (const landing of [0, 0.5, 1]) {
    const pose = heroPose(p, 0.73, 'playing', landing);
    close(pose.spearTip.y, 1.35); close(pose.arm.end.y, 1.35);
  }
});
