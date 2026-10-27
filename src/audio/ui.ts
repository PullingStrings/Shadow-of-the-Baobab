import { GameAudio } from './engine';
const STORAGE = 'baobab-audio-v1';
export function loadAudioPreferences(): unknown {
  try { return JSON.parse(localStorage.getItem(STORAGE) ?? 'null'); } catch { return null; }
}
export class SoundControls {
  private mute = document.querySelector<HTMLButtonElement>('#mute')!;
  private status = document.querySelector<HTMLElement>('#audio-status')!;
  private audio: GameAudio;
  constructor(audio: GameAudio) {
    this.audio = audio;
    this.mute.addEventListener('click', () => this.toggle());
    for (const name of ['effects', 'ambience', 'music'] as const) {
      const input = document.querySelector<HTMLInputElement>(`#volume-${name}`)!;
      input.value = String(Math.round(audio.preferences[name] * 100));
      input.addEventListener('keydown', event => event.stopPropagation());
      input.addEventListener('input', () => {
        audio.setPreferences({ [name]: Number(input.value) / 100 }); this.save();
      });
    }
    audio.onChange = () => this.render(); this.render();
  }
  toggle() {
    this.audio.setPreferences({ muted: !this.audio.preferences.muted }); this.save();
    if (!this.audio.preferences.muted) void this.audio.unlock();
  }
  private save() { try { localStorage.setItem(STORAGE, JSON.stringify(this.audio.preferences)); } catch { /* Settings still work without storage. */ } }
  private render() {
    const data = this.audio.snapshot;
    this.mute.setAttribute('aria-label', data.muted ? 'Unmute sound (M)' : 'Mute sound (M)');
    this.mute.setAttribute('aria-pressed', String(data.muted)); this.mute.classList.toggle('muted', data.muted);
    for (const name of ['effects', 'ambience', 'music'] as const) {
      const value = Math.round(data[name] * 100);
      document.querySelector<HTMLOutputElement>(`#value-${name}`)!.value = `${value}%`;
      document.querySelector<HTMLInputElement>(`#volume-${name}`)!.setAttribute('aria-valuetext', `${value}%`);
    }
    this.status.textContent = data.status === 'unavailable' ? 'Sound unavailable. Your journey can continue.' : data.muted ? 'Sound muted.' : data.status === 'locked' ? 'Sound starts when you begin.' : data.status === 'paused' ? 'Sound paused with the game.' : data.musicStatus === 'unavailable' ? 'Music unavailable. Effects and atmosphere remain on.' : 'Sound on.';
  }
}
