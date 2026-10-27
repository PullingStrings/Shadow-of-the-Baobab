import type { GameState, Phase } from '../game/types.js';
import { ambience, synthesize, type SoundName } from './synthesis.js';
import { SoundEvents, type SoundEvent } from './events.js';
export interface AudioPreferences { muted: boolean; effects: number; ambience: number }
export const DEFAULT_AUDIO: AudioPreferences = { muted: false, effects: 0.65, ambience: 0.3 };
export function audioPreferences(value: unknown): AudioPreferences {
  const data = value && typeof value === 'object' ? value as Partial<AudioPreferences> : {};
  const level = (v: unknown, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
  return { muted: typeof data.muted === 'boolean' ? data.muted : false, effects: level(data.effects, 0.65), ambience: level(data.ambience, 0.3) };
}
type Voice = { source: AudioBufferSourceNode; gain: GainNode; pan: StereoPannerNode };
/** Browser adapter only. It reads simulation state and never changes gameplay. */
export class GameAudio {
  readonly preferences: AudioPreferences;
  onChange?: () => void;
  private context?: AudioContext;
  private master?: GainNode;
  private effects?: GainNode;
  private bed?: GainNode;
  private wind?: GainNode;
  private shrine?: GainNode;
  private loops: AudioBufferSourceNode[] = [];
  private voices = new Set<Voice>();
  private buffers = new Map<string, AudioBuffer>();
  private targets = new WeakMap<GainNode, number>();
  private events = new SoundEvents();
  private variation = 0;
  private phase: Phase = 'ready';
  private x = 2;
  private pending?: Promise<void>;
  private suspension?: Promise<void>;
  private suspendTimer?: ReturnType<typeof setTimeout>;
  private status = 'locked';
  private factory: () => AudioContext;
  constructor(preferences: unknown = DEFAULT_AUDIO, factory: () => AudioContext = () => new AudioContext()) {
    this.factory = factory;
    this.preferences = audioPreferences(preferences);
  }
  get snapshot() {
    return { status: this.status, contextState: this.context?.state ?? 'locked', voices: this.voices.size, ...this.preferences };
  }
  /** Call directly from a player gesture; no context is made on page load. */
  unlock(): Promise<void> {
    if (this.pending) return this.pending;
    this.pending = this.open().finally(() => { this.pending = undefined; });
    return this.pending;
  }
  private async open() {
    try {
      if (!this.context) {
        const context = this.factory(); this.context = context;
        this.master = context.createGain(); this.master.gain.value = 0;
        this.effects = context.createGain(); this.bed = context.createGain();
        this.wind = context.createGain(); this.shrine = context.createGain();
        this.wind.gain.value = this.shrine.gain.value = 0;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -10; compressor.knee.value = 10; compressor.ratio.value = 8;
        compressor.attack.value = 0.003; compressor.release.value = 0.18;
        this.master.connect(compressor); compressor.connect(context.destination);
        this.effects.connect(this.master); this.bed.connect(this.master);
        this.wind.connect(this.bed); this.shrine.connect(this.bed);
        for (const kind of ['wind', 'sanctuary'] as const) {
          const source = context.createBufferSource(); source.buffer = this.buffer(ambience(kind)); source.loop = true;
          source.connect(kind === 'wind' ? this.wind : this.shrine); source.start(); this.loops.push(source);
        }
      }
      if (this.suspension) await this.suspension;
      if (this.phase !== 'paused' && this.context.state !== 'running') await this.context.resume();
      this.status = this.phase === 'paused' ? 'paused' : this.context.state === 'running' ? 'running' : 'locked';
      this.mix(); this.onChange?.();
    } catch {
      this.dispose(); this.status = 'unavailable'; this.onChange?.();
    }
  }
  private buffer(samples: Float32Array) {
    const buffer = this.context!.createBuffer(1, samples.length, 24000); buffer.getChannelData(0).set(samples); return buffer;
  }
  begin(state: GameState) {
    clearTimeout(this.suspendTimer); this.stopVoices(); this.events.reset(); this.events.update(state);
    this.x = state.player.x; this.phase = state.phase; this.mix(); void this.unlock();
  }
  setPhase(phase: Phase) {
    if (this.phase === phase) return;
    const wasPaused = this.phase === 'paused';
    this.phase = phase; clearTimeout(this.suspendTimer);
    if (wasPaused && phase === 'playing') this.stopVoices();
    if (phase === 'paused') {
      this.status = this.context ? 'paused' : this.status; this.mix(); this.stopVoices(0.04);
      this.suspendTimer = setTimeout(() => {
        if (this.phase === 'paused' && this.context?.state === 'running') this.suspension = this.context.suspend().catch(() => {});
      }, 60);
    }
    this.mix(); this.onChange?.();
  }
  setPreferences(value: Partial<AudioPreferences>) {
    Object.assign(this.preferences, audioPreferences({ ...this.preferences, ...value }));
    this.mix(); this.onChange?.();
  }
  private gain(node: GainNode | undefined, value: number) {
    if (!node || this.targets.get(node) === value) return;
    const now = this.context!.currentTime;
    node.gain.cancelScheduledValues(now); node.gain.setTargetAtTime(value, now, 0.025); this.targets.set(node, value);
  }
  private mix() {
    this.gain(this.master, this.preferences.muted || this.phase === 'paused' ? 0 : 0.8);
    this.gain(this.effects, this.preferences.effects); this.gain(this.bed, this.preferences.ambience);
    const active = this.phase === 'playing' ? 1 : this.phase === 'won' ? 0.5 : this.phase === 'dead' ? 0.12 : 0;
    const t = Math.max(0, Math.min(1, (this.x - 76) / 16));
    this.gain(this.wind, active * 0.8);
    this.gain(this.shrine, Math.round(t * t * (3 - 2 * t) * 100) / 100 * active);
  }
  update(state: GameState) {
    const events = this.events.update(state);
    if (this.status === 'unavailable') return;
    try {
      this.setPhase(state.phase); this.x = state.player.x; this.mix();
      for (const event of events) this.play(event);
    } catch {
      this.dispose(); this.status = 'unavailable'; this.onChange?.();
    }
  }
  private play(event: SoundEvent) {
    const context = this.context;
    if (!context || context.state !== 'running' || this.preferences.muted || this.phase === 'paused' || !this.effects) return;
    if (this.voices.size >= 24) {
      const oldest = this.voices.values().next().value as Voice;
      oldest.gain.gain.setTargetAtTime(0, context.currentTime, 0.005); oldest.source.stop(context.currentTime + 0.02); this.voices.delete(oldest);
    }
    const variant = this.variation++ % 4, key = `${event.name}-${variant}`;
    let buffer = this.buffers.get(key);
    if (!buffer) { buffer = this.buffer(synthesize(event.name as SoundName, 24000, variant)); this.buffers.set(key, buffer); }
    const source = context.createBufferSource(), gain = context.createGain(), pan = context.createStereoPanner();
    source.buffer = buffer; gain.gain.value = event.gain; pan.pan.value = event.pan;
    source.connect(gain); gain.connect(pan); pan.connect(this.effects);
    const voice = { source, gain, pan }; this.voices.add(voice);
    source.onended = () => { source.disconnect(); gain.disconnect(); pan.disconnect(); this.voices.delete(voice); };
    source.start();
  }
  private stopVoices(delay = 0) {
    for (const voice of this.voices) { try { voice.source.stop((this.context?.currentTime ?? 0) + delay); } catch { /* Already ended. */ } }
    if (!delay) this.voices.clear();
  }
  dispose() {
    clearTimeout(this.suspendTimer); this.stopVoices(); this.loops.forEach(source => { try { source.stop(); } catch { /* Already stopped. */ } }); this.loops = [];
    if (this.context) void this.context.close().catch(() => {});
    this.context = undefined; this.master = this.effects = this.bed = this.wind = this.shrine = undefined;
    this.buffers.clear(); this.targets = new WeakMap();
  }
}
