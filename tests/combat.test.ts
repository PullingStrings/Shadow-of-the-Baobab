import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame } from '../src/game/state.js';
import { createPlayer, movePlayer } from '../src/game/player.js';
import { createEnemies } from '../src/game/enemies.js';
import { resolveCombat } from '../src/game/combat.js';
import { ATTACKS } from '../src/game/attacks.js';
import type { Enemy } from '../src/game/types.js';
const idle = { axis: 0, jump: false, attack: false }, tick = 1 / 120;

for (const kind of ['poke', 'slash'] as const) {
  test(`${kind} hits a lion body before it attacks, in either direction`, () => {
    for (const facing of [-1, 1]) {
      const p = createPlayer(), e = createEnemies()[0];
      p.facing = facing; p.attackKind = kind; p.attack = ATTACKS[kind].duration - 0.12; p.attackId = 1;
      e.x = p.x + facing * (kind === 'poke' ? 4 : 3.3); e.mode = 'patrol';
      assert.equal(resolveCombat(p, [e]), 0); assert.equal(e.hp, 2);
      assert.equal(e.mode, 'recover'); assert.equal(p.hp, 4);
    }
  });
  test(`${kind} does one damage per swing and exactly three distinct hits defeat a lion`, () => {
    const p = createPlayer(), e = createEnemies()[0];
    p.attackKind = kind; p.attack = ATTACKS[kind].duration - 0.12;
    for (let hit = 1; hit <= 3; hit++) {
      p.attackId = hit; e.x = p.x + 2;
      assert.equal(resolveCombat(p, [e]), hit === 3 ? 1 : 0);
      assert.equal(e.hp, 3 - hit);
      for (let frame = 0; frame < 20; frame++) assert.equal(resolveCombat(p, [e]), 0);
      assert.equal(e.hp, 3 - hit);
    }
    assert.equal(e.mode, 'dead');
  });
  test(`holding ${kind} can finish a nearby lion without waiting for a charge`, () => {
    const s = createGame('playing'); s.player.x = 21.5;
    const input = { ...idle, attack: kind === 'poke', slash: kind === 'slash' };
    for (let i = 0; i < 240 && s.enemies[0].hp > 0; i++) {
      stepGame(s, input, tick);
      assert.notEqual(s.enemies[0].mode, 'charge');
    }
    assert.equal(s.enemies[0].hp, 0); assert.equal(s.kills, 1); assert.equal(s.player.hp, 4);
  });
}
test('windup and recovery are vulnerable rather than requiring a lion attack', () => {
  for (const mode of ['patrol', 'windup', 'recover'] as Enemy['mode'][]) {
    const p = createPlayer(), e = createEnemies()[0];
    p.attack = 0.2; p.attackId = 1; e.x = p.x + 3.8; e.mode = mode;
    resolveCombat(p, [e]); assert.equal(e.hp, 2);
  }
});
test('poke is longer, slash has a wider vertical sweep, and targets behind cannot be hit', () => {
  const p = createPlayer(); const enemy = () => { const e = createEnemies()[0]; e.x = p.x + 3.8; return e; };
  p.attackKind = 'slash'; p.attack = 0.3; p.attackId = 1;
  const far = enemy(); resolveCombat(p, [far]); assert.equal(far.hp, 3);
  p.attackKind = 'poke'; p.attack = 0.2;
  resolveCombat(p, [far]); assert.equal(far.hp, 2);
  p.y = 1.8; const low = enemy(); low.x = p.x + 2;
  resolveCombat(p, [low]); assert.equal(low.hp, 3);
  p.attackKind = 'slash'; p.attack = 0.3;
  resolveCombat(p, [low]); assert.equal(low.hp, 2);
  p.y = 0; const behind = enemy(); behind.x = p.x - 2;
  resolveCombat(p, [behind]); assert.equal(behind.hp, 3);
});
test('attack startup/recovery cannot hit and a successful close hit takes priority over contact damage', () => {
  const p = createPlayer(), e = createEnemies()[0]; e.x = p.x + 2;
  p.attackId = 1; p.attack = 0.3; resolveCombat(p, [e]); assert.equal(e.hp, 3);
  p.attack = 0.01; resolveCombat(p, [e]); assert.equal(e.hp, 3);
  p.attack = 0.2; e.x = p.x + 1; resolveCombat(p, [e]); assert.equal(e.hp, 2); assert.equal(p.hp, 4);
});
test('a shared cooldown locks attack type until the next swing and held slash repeats', () => {
  const p = createPlayer(); movePlayer(p, { ...idle, attack: true }, tick);
  assert.equal(p.attackKind, 'poke'); assert.equal(p.attackId, 1);
  movePlayer(p, { ...idle, slash: true }, tick);
  assert.equal(p.attackKind, 'poke'); assert.equal(p.attackId, 1);
  for (let i = 0; i < 60; i++) movePlayer(p, { ...idle, slash: true }, tick);
  assert.equal(p.attackKind, 'slash'); assert.equal(p.attackId, 2);
  for (let i = 0; i < 80; i++) movePlayer(p, { ...idle, slash: true }, tick);
  assert.ok(p.attackId >= 3); assert.equal(p.attackKind, 'slash');
  const both = createPlayer(); movePlayer(both, { ...idle, attack: true, slash: true }, tick);
  assert.equal(both.attackKind, 'slash');
});
