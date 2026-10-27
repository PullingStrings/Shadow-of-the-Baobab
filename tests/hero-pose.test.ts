import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/state.js';
import { HERO_FRAMES, HERO_SHEETS } from '../src/view/hero-frames.js';
import { heroFrame, HeroFrameClock, STRIDE_DISTANCE, breathingOffset } from '../src/view/hero-pose.js';

test('all 20 complete frames have valid bounds, foot origins and a constant scale per sheet', () => {
  assert.equal(Object.keys(HERO_FRAMES).length, 20);
  const scales: Record<string, number> = {};
  for (const frame of Object.values(HERO_FRAMES)) {
    const sheet = HERO_SHEETS[frame.sheet], [l, t, r, b] = frame.rect;
    assert.ok(l >= 0 && t >= 0 && r <= sheet.width && b <= sheet.height && l < r && t < b);
    assert.ok(frame.origin.every(Number.isFinite) && frame.scale > 0);
    scales[frame.sheet] ??= frame.scale;
    assert.equal(frame.scale, scales[frame.sheet]);
  }
});
test('spear frames follow the original attack timer without changing hit rules', () => {
  const state = createGame('playing');
  for (const [remaining, frame] of [[0.3, 0], [0.26, 1], [0.15, 2], [0.04, 3]]) {
    state.player.attack = remaining;
    assert.equal(heroFrame(state.player, 10, 'playing').id, `attack-${frame}`);
  }
  state.player.attack = 0;
  assert.equal(heroFrame(state.player, 10, 'playing').action, 'idle');
});
test('run frames advance by distance and freeze when position and time are paused', () => {
  const state = createGame('playing'), clock = new HeroFrameClock();
  state.player.vx = 9; clock.update(state);
  state.player.x += STRIDE_DISTANCE / 8; state.time += 0.05;
  assert.equal(clock.update(state).id, 'run-1');
  state.time += 1;
  assert.equal(clock.update(state).id, 'run-1');
  state.phase = 'paused'; const frozen = clock.update(state);
  assert.deepEqual(clock.update(state), frozen);
});
test('rising, apex, falling and brief landing compression select distinct complete poses', () => {
  const state = createGame('playing'), clock = new HeroFrameClock(); clock.update(state);
  state.player.grounded = false; state.player.vy = 10; state.time = 0.1;
  assert.equal(clock.update(state).action, 'rise');
  state.player.vy = 0; state.time = 0.2; assert.equal(clock.update(state).action, 'apex');
  state.player.vy = -10; state.time = 0.3; assert.equal(clock.update(state).action, 'fall');
  state.player.grounded = true; state.player.vy = 0; state.time = 0.4;
  assert.equal(clock.update(state).action, 'land');
  state.time = 0.6; assert.equal(clock.update(state).action, 'idle');
});
test('restarts reset the gait and frame selection never mutates simulation state', () => {
  const state = createGame('playing'), clock = new HeroFrameClock(); state.player.vx = 9;
  clock.update(state); state.player.x += STRIDE_DISTANCE / 4; state.time = 0.5;
  assert.equal(clock.update(state).id, 'run-2');
  state.player.x = 2; state.time = 0;
  assert.equal(clock.update(state).id, 'run-0');
  for (const facing of [-1, 1]) {
    state.player.facing = facing; const before = structuredClone(state);
    const selected = clock.update(state);
    assert.ok(HERO_FRAMES[selected.id]); assert.deepEqual(state, before);
  }
});
test('damage, death and ready states select safe existing frames', () => {
  const state = createGame('playing'); state.player.invulnerable = 1.4;
  assert.equal(heroFrame(state.player, 0, 'playing').action, 'hurt');
  assert.equal(heroFrame(state.player, 0, 'dead').action, 'dead');
  assert.equal(heroFrame(state.player, 0, 'ready').id, 'idle-0');
});

test('idle holds one stance, breathing is continuous and feet remain pinned', () => {
  const state = createGame('playing');
  for (let i = 0; i <= 480; i++) {
    const time = i / 120;
    assert.equal(heroFrame(state.player, time, 'playing').id, 'idle-0');
    for (const height of [0, 0.5, 0.95]) assert.equal(breathingOffset(time, height), 0);
    assert.ok(Math.abs(breathingOffset(time, 2.6)) <= 0.018001);
    if (i) assert.ok(Math.abs(breathingOffset(time, 2.6) - breathingOffset(time - 1 / 120, 2.6)) < 0.0003);
  }
  assert.ok(Math.abs(breathingOffset(4, 2.6)) < 0.000001);
});
