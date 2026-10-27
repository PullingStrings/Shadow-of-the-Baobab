import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lionFrame } from '../src/view/lion-pose.js';
import { LION_ART, TREE_ART } from '../src/view/grove-art.js';

test('lion presentation follows patrol, crouch, gallop and recovery modes', () => {
  for (let i = 0; i < 8; i++) assert.equal(lionFrame('patrol', i * 0.5), i % 4);
  assert.equal(lionFrame('windup', 100), 4);
  assert.equal(lionFrame('charge', 0), 5); assert.equal(lionFrame('charge', 1.5), 6);
  assert.equal(lionFrame('recover', 100), 7); assert.equal(lionFrame('dead', 100), 7);
});
test('painted lion and branch masks remain inside their respective atlases', () => {
  assert.equal(LION_ART.frames.length, 8); assert.equal(TREE_ART.trees.length, 2);
  for (const [frames, width, height] of [
    [LION_ART.frames, LION_ART.width, LION_ART.height],
    [TREE_ART.trees, TREE_ART.width, TREE_ART.height],
  ] as const) {
    for (const frame of frames) {
      assert.ok(frame.outline.length > 3);
      for (const [x, y] of frame.outline) assert.ok(x >= 0 && x <= width && y >= 0 && y <= height);
    }
  }
  for (const tree of TREE_ART.trees) assert.ok(tree.rootY > tree.ledgeY && tree.ledgeTo > tree.ledgeFrom);
});
