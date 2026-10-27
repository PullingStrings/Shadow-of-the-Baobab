import { test } from 'node:test';
import assert from 'node:assert/strict';
import { synthesize, ambience, EFFECTS } from '../src/audio/synthesis.js';
import { SoundEvents } from '../src/audio/events.js';
import { audioPreferences } from '../src/audio/engine.js';
import { createGame, stepGame } from '../src/game/state.js';
const idle = { axis: 0, jump: false, attack: false };

test('every sound has finite bounded non-silent PCM and quiet one-shot endpoints', () => {
  for (const name of EFFECTS) {
    const samples = synthesize(name); let energy = 0;
    for (const value of samples) { assert.ok(Number.isFinite(value) && Math.abs(value) <= 0.850001, name); energy += value * value; }
    assert.ok(energy > 0.01, name); assert.equal(samples[0], 0); assert.equal(samples.at(-1), 0);
  }
  assert.ok(synthesize('slash').length > synthesize('poke').length);
  assert.notDeepEqual(synthesize('step-earth', 24000, 0), synthesize('step-earth', 24000, 1));
});
test('ambient loops are deterministic, bounded and have continuous seam amplitudes', () => {
  for (const kind of ['wind', 'sanctuary'] as const) {
    const samples = ambience(kind);
    assert.equal(samples.length, 12 * 24000); assert.deepEqual(samples, ambience(kind));
    assert.ok(samples.every(v => Number.isFinite(v) && Math.abs(v) < 0.5));
    assert.ok(Math.abs(samples[0] - samples.at(-1)!) < 0.08);
  }
});
test('corrupt audio preferences are clamped and recover defaults', () => {
  assert.deepEqual(audioPreferences(null), { muted: false, effects: 0.65, ambience: 0.3 });
  assert.deepEqual(audioPreferences({ muted: 'yes', effects: 5, ambience: -2 }), { muted: false, effects: 1, ambience: 0 });
  assert.equal(audioPreferences({ effects: NaN }).effects, 0.65);
});
test('held attacks emit once per new swing; repeated reads do not duplicate audio', () => {
  for (const kind of ['poke', 'slash'] as const) {
    const state = createGame('playing'), events = new SoundEvents(); events.update(state);
    let attacks = 0;
    for (let i = 0; i < 120; i++) {
      stepGame(state, { ...idle, attack: kind === 'poke', slash: kind === 'slash' }, 1 / 120);
      attacks += events.update(state).filter(e => e.name === kind).length;
      assert.deepEqual(events.update(state), []);
    }
    assert.equal(attacks, state.player.attackId); assert.ok(attacks >= 2);
  }
});
test('three proactive hits produce three impact cues and one lion defeat cue', () => {
  const state = createGame('playing'), events = new SoundEvents(); state.player.x = 21.5; events.update(state);
  const heard: string[] = [];
  for (let i = 0; i < 240; i++) { stepGame(state, { ...idle, attack: true }, 1 / 120); heard.push(...events.update(state).map(e => e.name)); }
  assert.equal(state.enemies[0].hp, 0); assert.equal(heard.filter(e => e === 'hit').length, 3); assert.equal(heard.filter(e => e === 'lion-death').length, 1);
});
test('lion warning/charge cues pan toward nearby enemies and ignore distant ones', () => {
  const state = createGame('playing'), events = new SoundEvents(); state.player.x = 18; events.update(state);
  stepGame(state, idle, 1 / 120); const warning = events.update(state).find(e => e.name === 'lion-warn');
  assert.ok(warning && warning.pan > 0 && warning.gain > 0 && warning.gain < 1);
  const heard: string[] = [];
  for (let i = 0; i < 100; i++) { stepGame(state, idle, 1 / 120); heard.push(...events.update(state).map(e => e.name)); }
  assert.equal(heard.filter(e => e === 'lion-charge').length, 1);
});
test('footsteps require grounded travel and select earth, bough and sanctuary stone', () => {
  for (const [x, y, name] of [[2, 0, 'step-earth'], [14, 2.5, 'step-wood'], [94, 3, 'step-stone']] as const) {
    const state = createGame('playing'), events = new SoundEvents(); state.player.x = x; state.player.y = y; events.update(state);
    const heard: string[] = [];
    for (let i = 0; i < 4; i++) { state.player.x += 0.5; state.time += 0.1; heard.push(...events.update(state).map(e => e.name)); }
    assert.deepEqual(heard, [name]); state.player.grounded = false; state.player.vy = -2;
    for (let i = 0; i < 6; i++) { state.player.x += 0.5; state.time += 0.1; assert.ok(!events.update(state).some(e => e.name.startsWith('step-'))); }
  }
});
test('pause/restart and terminal states never replay stale sounds or mutate state', () => {
  const state = createGame('playing'), events = new SoundEvents(); events.update(state);
  state.phase = 'paused'; const copy = structuredClone(state); assert.deepEqual(events.update(state), []); assert.deepEqual(state, copy);
  state.phase = 'dead'; assert.deepEqual(events.update(state).map(e => e.name), ['death']); assert.deepEqual(events.update(state), []);
  state.phase = 'won'; assert.deepEqual(events.update(state).map(e => e.name), ['rescue']); assert.deepEqual(events.update(state), []);
  events.reset(); assert.deepEqual(events.update(createGame('playing')), []);
});
test('jump, landing and damage have distinct cues without knockback sounding like jump', () => {
  const state = createGame('playing'), events = new SoundEvents(); events.update(state);
  stepGame(state, { ...idle, jump: true }, 1 / 120); assert.ok(events.update(state).some(e => e.name === 'jump'));
  const heard: string[] = [];
  for (let i = 0; i < 180; i++) { stepGame(state, idle, 1 / 120); heard.push(...events.update(state).map(e => e.name)); }
  assert.equal(heard.filter(e => e === 'land').length, 1);
  state.player.hp--; state.player.vy = 7; state.player.grounded = false;
  assert.deepEqual(events.update(state).map(e => e.name), ['hurt']);
});
