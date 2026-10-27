// Authoring only; Node 22 with --experimental-strip-types or Node 24.
import fs from 'node:fs';
import path from 'node:path';
import { composeMusic } from '../src/audio/music.ts';
const directory = process.argv[2] ?? '/tmp/baobab-music'; fs.mkdirSync(directory, { recursive: true });
const score = composeMusic(), rate = 24000;
function wav(file, left, right) {
  const data = Buffer.alloc(44 + left.length * 4); data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22); data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(left.length * 4, 40);
  let peak = 0, energy = 0;
  for (let i = 0; i < left.length; i++) for (let channel = 0; channel < 2; channel++) {
    const value = channel ? right[i] : left[i]; peak = Math.max(peak, Math.abs(value)); energy += value * value;
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + i * 4 + channel * 2);
  }
  fs.writeFileSync(path.join(directory, file), data); return { peak, rms: Math.sqrt(energy / (left.length * 2)) };
}
console.log('journey', wav('journey.wav', score.journey.left, score.journey.right));
console.log('sanctuary', wav('sanctuary.wav', score.sanctuary.left, score.sanctuary.right));
const left = score.journey.left.slice(), right = score.journey.right.slice();
for (let i = 0; i < left.length; i++) {
  const time = i / rate, lift = Math.max(0, Math.min(1, (time - 24) / 12)), fade = Math.min(1, time / 0.4, (48 - time) / 1.3);
  left[i] = (left[i] + score.sanctuary.left[i] * lift * 0.9) * fade; right[i] = (right[i] + score.sanctuary.right[i] * lift * 0.9) * fade;
}
console.log('preview', wav('sunset-theme.wav', left, right));
