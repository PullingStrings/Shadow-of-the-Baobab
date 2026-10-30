import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeMusic, MUSIC } from '../src/audio/music.js';
import { MusicPlayer } from '../src/audio/music-player.js';
import { Context } from './audio-fakes.js';

test('the original score has aligned stereo layers, finite headroom and continuous circular tails', () => {
  const score = composeMusic();
  assert.equal(score.duration, MUSIC.bars * MUSIC.beatsPerBar * 60 / MUSIC.bpm);
  for (const stem of [score.journey, score.sanctuary]) {
    assert.equal(stem.left.length, 48 * 24000); assert.equal(stem.right.length, stem.left.length);
    let energy = 0, difference = 0;
    for (let i = 0; i < stem.left.length; i++) {
      assert.ok(Number.isFinite(stem.left[i]) && Number.isFinite(stem.right[i]));
      assert.ok(Math.abs(stem.left[i]) < 0.5 && Math.abs(stem.right[i]) < 0.5);
      energy += stem.left[i] ** 2; difference += Math.abs(stem.left[i] - stem.right[i]);
    }
    assert.ok(energy > 1 && difference > 1);
    assert.ok(Math.abs(stem.left[0] - stem.left.at(-1)!) < 0.01);
    assert.ok(Math.abs(stem.right[0] - stem.right.at(-1)!) < 0.01);
  }
});
const buffers = (): [AudioBuffer, AudioBuffer] => [{ duration: 48 } as AudioBuffer, { duration: 48 } as AudioBuffer];
test('both music layers start on the same clock and repeated loading does not duplicate loops', async () => {
  const context = new Context(); context.currentTime = 2;
  const player = new MusicPlayer(context as unknown as AudioContext, context.destination as unknown as GainNode, async () => buffers());
  await player.load(); await player.load();
  assert.equal(player.snapshot.layers, 2); assert.equal(context.sources[0].startedAt, context.sources[1].startedAt);
  context.currentTime = 10; assert.ok(Math.abs(player.snapshot.position - 7.97) < 0.001); player.dispose();
});
test('sanctuary layers fade by position, ending phases release music and paused clocks preserve position', async () => {
  const context = new Context(), player = new MusicPlayer(context as unknown as AudioContext, context.destination as unknown as GainNode, async () => buffers());
  await player.load(); player.setScene('playing', 2); assert.equal(context.gains[0].gain.target, 1); assert.equal(context.gains[1].gain.target, 0);
  player.setScene('playing', 92); assert.equal(context.gains[1].gain.target, 0.9);
  player.setScene('paused', 92); const frozen = player.snapshot.position; assert.equal(context.gains[0].gain.target, 0); assert.equal(player.snapshot.position, frozen);
  player.setScene('playing', 92); player.setScene('won', 92); assert.equal(context.gains[0].gain.target, 0); assert.equal(context.gains[1].gain.target, 0); player.dispose();
});
test('missing or invalid music fails independently without starting partial layers', async () => {
  for (const loader of [async () => { throw new Error('Missing music'); }, async () => [{ duration: 1 }, { duration: 48 }] as [AudioBuffer, AudioBuffer]]) {
    const context = new Context(), player = new MusicPlayer(context as unknown as AudioContext, context.destination as unknown as GainNode, loader);
    await player.load(); assert.equal(player.snapshot.status, 'unavailable'); assert.equal(player.snapshot.layers, 0); player.dispose();
  }
});
test('disposing during asynchronous music loading aborts without starting stale sources', async () => {
  const context = new Context(); let finish!: (value: [AudioBuffer, AudioBuffer]) => void; let signal!: AbortSignal;
  const player = new MusicPlayer(context as unknown as AudioContext, context.destination as unknown as GainNode, async (_context, abort) => { signal = abort; return new Promise(resolve => { finish = resolve; }); });
  const loading = player.load(); player.dispose(); finish(buffers()); await loading;
  assert.equal(signal.aborted, true); assert.equal(context.sources.length, 0);
});
