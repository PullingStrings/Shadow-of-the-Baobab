import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from '../src/audio/engine.js';
import { createGame } from '../src/game/state.js';
class Parameter {
  value = 0; target = 0;
  cancelScheduledValues() {}
  setTargetAtTime(value: number) { this.target = value; }
}
class Node {
  gain = new Parameter(); pan = new Parameter(); threshold = new Parameter(); knee = new Parameter(); ratio = new Parameter(); attack = new Parameter(); release = new Parameter();
  onended: (() => void) | null = null; loop = false; buffer: unknown;
  connect() {} disconnect() {} start() {} stop() { this.onended?.(); }
}
class Context {
  state = 'suspended'; currentTime = 0; destination = new Node(); gains: Node[] = []; resumes = 0; sources: Node[] = [];
  createGain() { const node = new Node(); this.gains.push(node); return node; }
  createDynamicsCompressor() { return new Node(); }
  createStereoPanner() { return new Node(); }
  createBufferSource() { const node = new Node(); this.sources.push(node); return node; }
  createBuffer(_channels: number, length: number) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  async resume() { this.resumes++; this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
}
function setup() { const context = new Context(); let created = 0; const audio = new GameAudio(undefined, () => { created++; return context as unknown as AudioContext; }); return { audio, context, count: () => created }; }
test('audio is lazy; updates alone cannot create or resume a context', async () => {
  const { audio, context, count } = setup(); const state = createGame('playing');
  for (let i = 0; i < 50; i++) audio.update(state);
  assert.equal(count(), 0); await audio.unlock(); assert.equal(count(), 1); assert.equal(context.resumes, 1); assert.equal(context.sources.filter(s => s.loop).length, 2); audio.dispose();
});
test('mute and independent level buses update without changing simulation', async () => {
  const { audio, context } = setup(), state = createGame('playing'); audio.begin(state); await audio.unlock();
  const copy = structuredClone(state); audio.setPreferences({ muted: true, effects: 0.2, ambience: 0.7 }); audio.update(state);
  assert.equal(context.gains[0].gain.target, 0); assert.equal(context.gains[1].gain.target, 0.2); assert.equal(context.gains[2].gain.target, 0.7); assert.deepEqual(state, copy); audio.dispose();
});
test('pause suspends, resume unlocks, restart clears voices, and loops are not duplicated', async () => {
  const { audio, context, count } = setup(), state = createGame('playing'); audio.begin(state); await audio.unlock();
  state.player.attackId++; state.time += 0.1; audio.update(state); assert.equal(audio.snapshot.voices, 1);
  state.phase = 'paused'; audio.update(state); await new Promise(resolve => setTimeout(resolve, 80)); assert.equal(context.state, 'suspended'); assert.equal(audio.snapshot.voices, 0);
  state.phase = 'playing'; audio.setPhase('playing'); await audio.unlock(); assert.equal(context.state, 'running'); assert.equal(count(), 1); assert.equal(context.sources.filter(s => s.loop).length, 2);
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
