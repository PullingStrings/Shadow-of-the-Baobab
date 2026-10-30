import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from '../src/audio/engine.js';
import { createGame } from '../src/game/state.js';
import { Context } from './audio-fakes.js';
function setup() { const context = new Context(); let created = 0; const audio = new GameAudio(undefined, () => { created++; return context as unknown as AudioContext; }, async () => [{ duration: 48 } as AudioBuffer, { duration: 48 } as AudioBuffer]); return { audio, context, count: () => created }; }
test('audio is lazy; updates alone cannot create or resume a context', async () => {
  const { audio, context, count } = setup(); const state = createGame('playing');
  for (let i = 0; i < 50; i++) audio.update(state);
  assert.equal(count(), 0); await audio.unlock(); assert.equal(count(), 1); assert.equal(context.resumes, 1); assert.equal(context.sources.filter(s => s.loop).length, 4); audio.dispose();
});
test('mute and independent level buses update without changing simulation', async () => {
  const { audio, context } = setup(), state = createGame('playing'); audio.begin(state); await audio.unlock();
  const copy = structuredClone(state); audio.setPreferences({ muted: true, effects: 0.2, ambience: 0.7, music: 0.1 }); audio.update(state);
  assert.equal(context.gains[0].gain.target, 0); assert.equal(context.gains[1].gain.target, 0.2); assert.equal(context.gains[2].gain.target, 0.7); assert.equal(context.gains[5].gain.target, 0.1); assert.deepEqual(state, copy); audio.dispose();
});
test('pause suspends, resume unlocks, restart clears voices, and loops are not duplicated', async () => {
  const { audio, context, count } = setup(), state = createGame('playing'); audio.begin(state); await audio.unlock();
  state.player.attackId++; state.time += 0.1; audio.update(state); assert.equal(audio.snapshot.voices, 1);
  state.phase = 'paused'; audio.update(state); await new Promise(resolve => setTimeout(resolve, 80)); assert.equal(context.state, 'suspended'); assert.equal(audio.snapshot.voices, 0);
  state.phase = 'playing'; audio.setPhase('playing'); await audio.unlock(); assert.equal(context.state, 'running'); assert.equal(count(), 1); assert.equal(context.sources.filter(s => s.loop).length, 4);
  audio.begin(createGame('playing')); await audio.unlock(); assert.equal(audio.snapshot.voices, 0); audio.dispose(); assert.equal(context.state, 'closed');
});
test('rapid inputs respect the voice cap and muted updates do not queue a burst', async () => {
  const { audio } = setup(), state = createGame('playing'); audio.begin(state); await audio.unlock();
  for (let i = 0; i < 60; i++) { state.player.attackId++; state.time += 0.01; audio.update(state); }
  assert.ok(audio.snapshot.voices <= 24); audio.setPreferences({ muted: true }); audio.begin(state); await audio.unlock();
  for (let i = 0; i < 20; i++) { state.player.attackId++; state.time += 0.01; audio.update(state); }
  assert.equal(audio.snapshot.voices, 0); audio.setPreferences({ muted: false }); audio.update(state); assert.equal(audio.snapshot.voices, 0); audio.dispose();
});
test('unavailable audio is contained and gameplay can continue', async () => {
  const audio = new GameAudio(undefined, () => { throw new Error('No audio device'); });
  audio.begin(createGame('playing')); await audio.unlock(); assert.equal(audio.snapshot.status, 'unavailable');
  assert.doesNotThrow(() => audio.update(createGame('playing'))); audio.dispose();
});

test('a device or graph failure during a sound cannot stop the simulation loop', async () => {
  const { audio, context } = setup(), state = createGame('playing'); audio.begin(state); await audio.unlock();
  context.createStereoPanner = () => { throw new Error('Audio graph unavailable'); };
  state.player.attackId++; state.time += 0.1;
  assert.doesNotThrow(() => audio.update(state)); assert.equal(audio.snapshot.status, 'unavailable');
  state.time += 0.1; assert.doesNotThrow(() => audio.update(state)); audio.dispose();
});
