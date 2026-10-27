export const EFFECTS = ['step-earth', 'step-wood', 'step-stone', 'jump', 'land', 'poke', 'slash', 'hit', 'hurt', 'lion-warn', 'lion-charge', 'lion-death', 'death', 'rescue'] as const;
export type SoundName = typeof EFFECTS[number];
const durations: Record<SoundName, number> = {
  'step-earth': 0.12, 'step-wood': 0.15, 'step-stone': 0.14, jump: 0.25, land: 0.23,
  poke: 0.19, slash: 0.34, hit: 0.19, hurt: 0.3, 'lion-warn': 0.75, 'lion-charge': 0.48,
  'lion-death': 0.8, death: 1.4, rescue: 3.2,
};
function noise(seed: number) {
  let state = seed >>> 0 || 1;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 2147483648 - 1; };
}
const sine = (phase: number) => Math.sin(phase * Math.PI * 2);
const envelope = (t: number, duration: number, attack = 0.006) => Math.min(1, t / attack) * Math.max(0, 1 - t / duration) ** 2 * Math.min(1, (duration - t) / 0.012);

/** Original mono PCM. Quiet endpoints, bounded peaks, deterministic variations. */
export function synthesize(name: SoundName, sampleRate = 24000, variation = 0) {
  const duration = durations[name], data = new Float32Array(Math.ceil(duration * sampleRate));
  const random = noise(9137 + variation * 7919 + EFFECTS.indexOf(name) * 331);
  let low = 0, phase = 0;
  const tune = 1 + (variation % 4 - 1.5) * 0.035;
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate, u = t / duration, white = random();
    low += (white - low) * 0.14;
    let value = 0;
    if (name.startsWith('step-')) {
      const frequency = name === 'step-wood' ? 175 : name === 'step-stone' ? 290 : 95;
      value = (sine(t * frequency * tune) * 0.5 * Math.exp(-t * 45) + low * (name === 'step-earth' ? 2.1 : 1.2)) * envelope(t, duration);
    } else if (name === 'jump' || name === 'poke' || name === 'slash') {
      const sweep = name === 'slash' ? Math.sin(Math.PI * u) : Math.exp(-u * 5);
      value = ((white - low) * 0.28 + low * 1.7) * sweep * envelope(t, duration, name === 'slash' ? 0.025 : 0.006);
      if (name === 'jump') value += sine(t * (130 + t * 180) * tune) * 0.12 * envelope(t, duration);
    } else if (name === 'land' || name === 'hit' || name === 'hurt') {
      const frequency = name === 'hit' ? 145 : name === 'hurt' ? 90 : 65;
      phase += frequency * (1 - u * 0.65) / sampleRate;
      value = (sine(phase) * 0.65 + low * 1.2 + white * Math.exp(-t * 80) * 0.16) * envelope(t, duration);
    } else if (name.startsWith('lion-')) {
      const pitch = name === 'lion-charge' ? 95 : name === 'lion-death' ? 78 : 68;
      phase += pitch * (1 - u * 0.3 + sine(t * 13) * 0.045) * tune / sampleRate;
      const throat = Math.tanh((sine(phase) + sine(phase * 2) * 0.45 + low * 1.8) * 1.8);
      value = (throat * 0.48 + low * 0.7) * envelope(t, duration, 0.045) * (0.7 + sine(t * 21) * 0.12);
    } else if (name === 'death') {
      phase += (120 * (1 - u * 0.65)) / sampleRate;
      value = (sine(phase) * 0.38 + sine(phase * 1.5) * 0.12 + low * 0.2) * envelope(t, duration, 0.025);
    } else if (name === 'rescue') {
      const notes = [293.6648, 369.9944, 440, 587.3295];
      for (let n = 0; n < notes.length; n++) {
        const local = t - n * 0.16;
        if (local >= 0) value += (sine(local * notes[n]) + 0.23 * sine(local * notes[n] * 2.002)) * Math.min(1, local / 0.012) * Math.exp(-local * 1.6) * 0.19;
      }
      value *= Math.min(1, (duration - t) / 0.12);
    }
    data[i] = Math.max(-0.85, Math.min(0.85, value));
  }
  data[0] = data[data.length - 1] = 0;
  return data;
}

/** A circular crossfade makes the random bed continuous at the loop boundary. */
export function ambience(kind: 'wind' | 'sanctuary', sampleRate = 24000) {
  const count = sampleRate * 12, overlap = Math.floor(sampleRate / 2), raw = new Float32Array(count + overlap);
  const random = noise(kind === 'wind' ? 733 : 941);
  let low = 0, air = 0;
  for (let i = 0; i < raw.length; i++) {
    const t = i / sampleRate, white = random();
    low += (white - low) * 0.015; air += (white - air) * 0.16;
    if (kind === 'wind') {
      const gust = 0.65 + sine(t / 12) * 0.22 + sine(t / 6) * 0.1;
      const chirpTime = t % 3, chirp = chirpTime < 0.28 ? Math.sin(Math.PI * chirpTime / 0.28) ** 2 : 0;
      raw[i] = (low * 0.6 + air * 0.08) * gust + sine(t * 2800) * chirp * (0.5 + sine(t * 34) * 0.5) * 0.018;
    } else {
      raw[i] = (sine(t * 146.8324) + sine(t * 220) * 0.55 + sine(t * 293.6648) * 0.25) * (0.032 + sine(t / 12) * 0.006);
    }
  }
  const data = raw.slice(0, count);
  for (let i = 0; i < overlap; i++) {
    const t = i / overlap, fade = t * t * (3 - 2 * t);
    data[i] = raw[count + i] * (1 - fade) + raw[i] * fade;
  }
  return data;
}
