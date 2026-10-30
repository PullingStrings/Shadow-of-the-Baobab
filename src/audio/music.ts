/** Original 16-bar sunset composition. No sampled instruments or external synth. */
export const MUSIC = { bpm: 80, bars: 16, beatsPerBar: 4, sampleRate: 24000, duration: 48 } as const;
export interface StereoStem { left: Float32Array; right: Float32Array }
export interface MusicScore { journey: StereoStem; sanctuary: StereoStem; duration: number }
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const sin = (cycles: number) => Math.sin(cycles * 2 * Math.PI);
type Instrument = 'wood' | 'bass' | 'pad' | 'shaker' | 'drum' | 'bell';

export function composeMusic(): MusicScore {
  const rate = MUSIC.sampleRate, length = rate * MUSIC.duration, beat = 60 / MUSIC.bpm;
  const stem = (): StereoStem => ({ left: new Float32Array(length), right: new Float32Array(length) });
  const journey = stem(), sanctuary = stem();
  let seed = 1947;
  const noise = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1; };
  function note(target: StereoStem, atBeat: number, midi: number, duration: number, velocity: number, pan: number, instrument: Instrument) {
    const start = Math.round(atBeat * beat * rate), count = Math.ceil(duration * rate), hz = frequency(midi);
    const l = Math.cos((pan + 1) * Math.PI / 4) * velocity, r = Math.sin((pan + 1) * Math.PI / 4) * velocity;
    let low = 0;
    for (let i = 0; i < count; i++) {
      const t = i / rate; let sample = 0;
      if (instrument === 'wood') {
        sample = sin(hz * t) * Math.exp(-t * 3.8) + sin(hz * 2.76 * t) * Math.exp(-t * 13) * 0.28 + sin(hz * 5.4 * t) * Math.exp(-t * 30) * 0.1;
        sample *= Math.min(1, t / 0.004);
      } else if (instrument === 'bass') {
        sample = (sin(hz * t) + sin(hz * t * 2) * 0.22) * Math.min(1, t / 0.018) * Math.exp(-t * 2.3);
      } else if (instrument === 'pad') {
        const envelope = Math.sin(Math.PI * Math.min(1, t / duration)) ** 1.2;
        sample = (sin(hz * t) * 0.65 + sin(hz * 1.002 * t) * 0.22 + sin(hz * 2 * t) * 0.08) * envelope;
      } else if (instrument === 'bell') {
        sample = (sin(hz * t) + sin(hz * t * 2.003) * 0.18) * Math.min(1, t / 0.016) * Math.exp(-t * 1.9);
      } else if (instrument === 'shaker') {
        const white = noise(); low += (white - low) * 0.2;
        sample = (white - low) * Math.min(1, t / 0.003) * Math.exp(-t * 65);
      } else {
        sample = sin(62 * t + 1.1 * (1 - Math.exp(-t * 20))) * Math.min(1, t / 0.004) * Math.exp(-t * 18);
      }
      sample *= Math.min(1, (duration - t) / 0.035);
      const index = (start + i) % length;
      // Release tails wrap into the first bar, rather than being chopped off.
      target.left[index] += sample * l; target.right[index] += sample * r;
    }
  }
  const chords = [
    { root: 38, pad: [50, 57, 64, 66], answer: [78, 76] }, // D add9
    { root: 35, pad: [47, 54, 62, 69], answer: [78, 74] }, // B minor7
    { root: 31, pad: [43, 50, 57, 59], answer: [79, 78] }, // G add9
    { root: 33, pad: [45, 52, 62, 67], answer: [76, 74] }, // A suspended7
  ];
  const melody: [number, number][][] = [
    [[0,74],[1.5,69],[2.5,66]], [[0.5,76],[2,74]],
    [[0,66],[1.5,69],[3,71]], [[0.5,74],[2,78]],
    [[0,71],[1.5,69],[2.5,67]], [[0.5,74],[2,71]],
    [[0,69],[1.5,76],[3,74]], [[2,69]],
    [[0,74],[1.5,76],[2.5,78]], [[0.5,76],[2,74]],
    [[0,71],[1.5,69],[3,66]], [[0.5,74],[2,78]],
    [[0,79],[1.5,78],[2.5,74]], [[0.5,71],[2,69]],
    [[0,76],[1.5,74],[3,69]], [[1,76],[2.5,74]],
  ];
  for (let bar = 0; bar < MUSIC.bars; bar++) {
    const chord = chords[Math.floor(bar / 2) % chords.length], start = bar * 4;
    if (bar % 2 === 0) chord.pad.forEach((pitch, i) => note(journey, start, pitch, 7.1, 0.035, (i - 1.5) * 0.25, 'pad'));
    note(journey, start, chord.root, 1.7, 0.15, 0, 'bass');
    note(journey, start + 2.5, chord.root + 7, 1.2, 0.075, 0, 'bass');
    melody[bar].forEach(([offset, pitch], i) => note(journey, start + offset, pitch, 1.65, 0.12 * (i ? 0.85 : 1), i % 2 ? 0.22 : -0.22, 'wood'));
    for (let eighth = 0; eighth < 8; eighth++) note(journey, start + eighth * 0.5, 0, 0.11, eighth % 2 ? 0.018 : 0.009, eighth % 2 ? 0.35 : -0.35, 'shaker');
    note(journey, start, 0, 0.3, 0.035, -0.1, 'drum');
    if (bar % 2) note(journey, start + 2.75, 0, 0.22, 0.02, 0.1, 'drum');
    if (bar % 2) chord.answer.forEach((pitch, i) => note(sanctuary, start + 0.5 + i * 1.5, pitch, 2.8, 0.09, i ? 0.4 : -0.4, 'bell'));
    if (bar % 2 === 0) chord.pad.slice(1).forEach((pitch, i) => note(sanctuary, start, pitch + 12, 7.1, 0.025, (i - 1) * 0.4, 'pad'));
  }
  // Small stereo early reflections; circular reads preserve the looping tails.
  for (const target of [journey, sanctuary]) {
    const left = target.left.slice(), right = target.right.slice(), d1 = Math.round(rate * 0.173), d2 = Math.round(rate * 0.287);
    for (let i = 0; i < length; i++) {
      target.left[i] += right[(i - d1 + length) % length] * 0.16 + left[(i - d2 + length) % length] * 0.07;
      target.right[i] += left[(i - d1 + length) % length] * 0.16 + right[(i - d2 + length) % length] * 0.07;
    }
  }
  // Shared mastering gain preserves the balance between the two stems.
  for (const target of [journey, sanctuary]) for (let i = 0; i < length; i++) { target.left[i] *= 2; target.right[i] *= 2; }
  return { journey, sanctuary, duration: MUSIC.duration };
}
