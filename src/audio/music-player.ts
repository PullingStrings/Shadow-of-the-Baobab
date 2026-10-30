import type { Phase } from '../game/types.js';
export type MusicLoader = (context: AudioContext, signal: AbortSignal) => Promise<[AudioBuffer, AudioBuffer]>;
const loadMusic: MusicLoader = async (context, signal) => Promise.all(['journey.ogg', 'sanctuary.ogg'].map(async file => {
  const response = await fetch(`${import.meta.env.BASE_URL}audio/music/${file}`, { signal });
  if (!response.ok) throw new Error('Music unavailable');
  return context.decodeAudioData(await response.arrayBuffer());
})) as Promise<[AudioBuffer, AudioBuffer]>;

/** Two pre-rendered, synchronized layers; decoding never blocks gameplay. */
export class MusicPlayer {
  onChange?: () => void;
  private sources: AudioBufferSourceNode[] = [];
  private journey: GainNode;
  private sanctuary: GainNode;
  private controller = new AbortController();
  private status = 'loading';
  private started = 0;
  private length = 48;
  private disposed = false;
  private requested = false;
  private phase: Phase = 'ready';
  private x = 2;
  private targets = [-1, -1];
  private context: AudioContext;
  private loader: MusicLoader;
  constructor(context: AudioContext, output: GainNode, loader: MusicLoader = loadMusic) {
    this.context = context; this.loader = loader;
    this.journey = context.createGain(); this.sanctuary = context.createGain();
    this.journey.gain.value = this.sanctuary.gain.value = 0;
    this.journey.connect(output); this.sanctuary.connect(output);
  }
  async load() {
    if (this.requested) return;
    this.requested = true;
    try {
      const buffers = await this.loader(this.context, this.controller.signal);
      if (this.disposed || this.context.state === 'closed') return;
      if (buffers.some(buffer => Math.abs(buffer.duration - this.length) > 0.01)) throw new Error('Unexpected music length');
      this.started = this.context.currentTime + 0.03;
      buffers.forEach((buffer, i) => {
        const source = this.context.createBufferSource(); source.buffer = buffer; source.loop = true; source.loopStart = 0; source.loopEnd = this.length;
        source.connect(i ? this.sanctuary : this.journey); source.start(this.started); this.sources.push(source);
      });
      this.status = 'ready'; this.setScene(this.phase, this.x); this.onChange?.();
    } catch {
      if (!this.disposed) {
        this.sources.forEach(source => { try { source.stop(); } catch { /* Already stopped. */ } }); this.sources = [];
        this.status = 'unavailable'; this.onChange?.();
      }
    }
  }
  setScene(phase: Phase, x: number) {
    this.phase = phase; this.x = x;
    const t = Math.max(0, Math.min(1, (x - 76) / 16)), lift = Math.round(t * t * (3 - 2 * t) * 100) / 100;
    const active = this.status === 'ready' && phase === 'playing' ? 1 : 0;
    [this.journey, this.sanctuary].forEach((gain, i) => {
      const value = active * (i ? lift * 0.9 : 1);
      if (this.targets[i] === value) return;
      gain.gain.cancelScheduledValues(this.context.currentTime); gain.gain.setTargetAtTime(value, this.context.currentTime, phase === 'paused' ? 0.025 : 0.22); this.targets[i] = value;
    });
  }
  get snapshot() {
    return { status: this.status, layers: this.sources.length, position: this.status === 'ready' ? Math.max(0, this.context.currentTime - this.started) % this.length : 0 };
  }
  dispose() {
    this.disposed = true; this.controller.abort();
    this.sources.forEach(source => { try { source.stop(); } catch { /* Already stopped. */ } source.disconnect(); }); this.sources = [];
    this.journey.disconnect(); this.sanctuary.disconnect();
  }
}
