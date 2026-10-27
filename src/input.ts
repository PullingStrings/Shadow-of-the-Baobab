import type { Input } from './game/types.js';
export class Controls {
  private held = new Set<string>();
  private pressed = new Set<string>();
  constructor(onCommand: (key: string) => void) {
    window.addEventListener('keydown', e => {
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.code)) e.preventDefault();
      if (!e.repeat) { this.pressed.add(e.code); onCommand(e.code); }
      this.held.add(e.code);
    });
    window.addEventListener('keyup', e => this.held.delete(e.code));
    window.addEventListener('blur', () => this.clear());
  }
  clear() { this.held.clear(); this.pressed.clear(); }
  read(): Input {
    const input = {
      axis: Number(this.held.has('KeyD') || this.held.has('ArrowRight')) - Number(this.held.has('KeyA') || this.held.has('ArrowLeft')),
      jump: ['Space', 'KeyW', 'ArrowUp'].some(k => this.pressed.has(k)),
      attack: this.held.has('KeyJ'),
      slash: this.held.has('KeyK') || this.held.has('KeyX'),
    };
    this.pressed.clear(); return input;
  }
}
