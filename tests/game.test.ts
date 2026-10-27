import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame } from '../src/game/state.js';
import { createPlayer, movePlayer } from '../src/game/player.js';
import { integrate } from '../src/game/physics.js';
import { createEnemies, updateEnemy } from '../src/game/enemies.js';
import { hurtPlayer, resolveCombat } from '../src/game/combat.js';
const idle = { axis: 0, jump: false, attack: false };
const tick = 1 / 120;
test('player accelerates, brakes and can reverse direction', () => {
  const p = createPlayer();
  for (let i = 0; i < 60; i++) movePlayer(p, { ...idle, axis: 1 }, tick);
  assert.equal(p.vx, 9); assert.ok(p.x > 5);
  for (let i = 0; i < 30; i++) movePlayer(p, idle, tick);
  assert.equal(p.vx, 0);
  for (let i = 0; i < 60; i++) movePlayer(p, { ...idle, axis: -1 }, tick);
  assert.equal(p.vx, -9); assert.equal(p.facing, -1);
});
test('arcade jump has height, gravity and landing without repeated aerial jumping', () => {
  const p = createPlayer(); movePlayer(p, { ...idle, jump: true }, tick);
  let apex = p.y;
  for (let i = 0; i < 180; i++) { movePlayer(p, idle, tick); apex = Math.max(apex, p.y); }
  assert.ok(apex > 4.9 && apex < 5.3); assert.equal(p.y, 0); assert.equal(p.grounded, true);
});
test('one-way platforms accept descending feet; ravine has no invisible floor', () => {
  const p = createPlayer(); Object.assign(p, { x: 14, y: 3, vy: -3 });
  for (let i = 0; i < 50; i++) integrate(p, tick);
  assert.equal(p.y, 2.5);
  Object.assign(p, { x: 35, y: 0, vy: 0 });
  for (let i = 0; i < 120; i++) integrate(p, tick);
  assert.ok(p.y < -8);
});
test('melee is directional, hits once per swing and defeats a lion on the third hit', () => {
  const p = createPlayer(), e = createEnemies()[0];
  e.x = p.x - 2; p.attack = 0.2; p.attackId = 1;
  resolveCombat(p, [e]); assert.equal(e.hp, 3);
  e.x = p.x + 2; resolveCombat(p, [e]); assert.equal(e.hp, 2);
  resolveCombat(p, [e]); assert.equal(e.hp, 2);
  p.attackId++; e.x = p.x + 2;
  assert.equal(resolveCombat(p, [e]), 0); assert.equal(e.hp, 1);
  p.attackId++; e.x = p.x + 2;
  assert.equal(resolveCombat(p, [e]), 1); assert.equal(e.hp, 0);
  assert.equal(resolveCombat(p, [e]), 0);
});
test('enemy telegraphs, charges, recovers; damage has invulnerability', () => {
  const p = createPlayer(), e = createEnemies()[0]; p.x = e.x - 5;
  updateEnemy(e, p, tick); assert.equal(e.mode, 'windup');
  for (let i = 0; i < 80; i++) updateEnemy(e, p, tick);
  assert.equal(e.mode, 'charge');
  for (let i = 0; i < 100; i++) updateEnemy(e, p, tick);
  assert.equal(e.mode, 'recover');
  assert.equal(hurtPlayer(p, -1), true); assert.equal(p.hp, 3);
  assert.equal(hurtPlayer(p, -1), false); assert.equal(p.hp, 3);
});
test('death freezes gameplay, restart restores it, rescue requires sanctuary height', () => {
  const s = createGame('playing'); s.player.hp = 0; stepGame(s, idle, tick);
  assert.equal(s.phase, 'dead'); assert.equal(s.deaths, 1);
  const before = s.time; stepGame(s, { ...idle, axis: 1 }, tick); assert.equal(s.time, before);
  const fresh = createGame('playing', s.deaths); assert.equal(fresh.player.hp, 4); assert.equal(fresh.deaths, 1);
  fresh.player.x = 92; stepGame(fresh, idle, tick); assert.equal(fresh.phase, 'playing');
  fresh.player.y = 3; fresh.player.vy = 0; stepGame(fresh, idle, tick); assert.equal(fresh.phase, 'won');
});
test('pause does not advance physics or enemy timers', () => {
  const s = createGame('paused'), before = structuredClone(s);
  stepGame(s, { axis: 1, jump: true, attack: true }, tick); assert.deepEqual(s, before);
});

test('grounded enemies stop at the ravine rather than charging over empty space', () => {
  const e = createEnemies()[0], p = createPlayer();
  Object.assign(e, { x: 31.9, facing: 1, mode: 'charge', timer: 1 });
  for (let i = 0; i < 30; i++) updateEnemy(e, p, tick);
  assert.ok(e.x <= 32); assert.equal(e.mode, 'recover');
});
