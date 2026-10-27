import './style.css';
import { createGame, stepGame } from './game/state';
import { END } from './game/world';
import { Controls } from './input';
import { GameView } from './view/scene';
import { GameAudio } from './audio/engine';
import { SoundControls, loadAudioPreferences } from './audio/ui';
import type { Phase } from './game/types';
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const audio = new GameAudio(loadAudioPreferences());
const soundControls = new SoundControls(audio);
let state = createGame();
let view: GameView;
const overlay = $('#overlay'), title = $('h1'), message = $('#message'), start = $('#start');
const originalTitle = title.innerHTML;
let lastPhase: Phase | undefined;
function startGame() { state = createGame('playing', state.deaths); controls.clear(); audio.begin(state); }
function togglePause() {
  if (state.phase === 'playing') { state.phase = 'paused'; controls.clear(); }
  else if (state.phase === 'paused') { state.phase = 'playing'; controls.clear(); }
  audio.setPhase(state.phase);
  if (state.phase === 'playing') void audio.unlock();
}
const controls = new Controls(key => {
  if (key === 'Enter') { if (state.phase === 'paused') togglePause(); else if (state.phase !== 'playing') startGame(); }
  if (key === 'Escape') togglePause();
  if (key === 'KeyR') startGame();
  if (key === 'KeyM') soundControls.toggle();
});
start.addEventListener('click', () => state.phase === 'paused' ? togglePause() : startGame());
$('#pause').addEventListener('click', togglePause);
window.addEventListener('blur', () => { if (state.phase === 'playing') togglePause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.phase === 'playing') togglePause(); });
function updateUI() {
  $('.stage').dataset.opening = String(state.player.x < 33);
  $('#health').innerHTML = Array.from({ length: 4 }, (_, i) => `<span class="heart ${i >= state.player.hp ? 'empty' : ''}"></span>`).join('');
  $('#health').setAttribute('aria-label', `Health: ${state.player.hp} of 4`);
  const progress = Math.min(100, Math.max(0, (state.bestX - 2) / (END - 2) * 100));
  $('#progress').style.width = `${progress}%`;
  $('#progress-label').textContent = state.phase === 'won' ? 'QUEEN RESCUED' : `SANCTUARY · ${Math.max(0, Math.ceil(END - state.player.x))} M`;
  $('#location').textContent = state.player.x < 30 ? 'THE WHISPERING GROVE' : state.player.x < 44 ? 'THE BROKEN CROSSING' : state.player.x < 80 ? 'THE ANCIENT TRAIL' : 'SANCTUARY OF THE QUEEN';
  const enemy = state.enemies.find(e => e.mode === 'windup' && Math.abs(e.x - state.player.x) < 9);
  $('#toast').textContent = state.phase !== 'playing' ? '' : enemy ? 'Strike first: J to poke · K / X to slash. Lions take 3 hits.' : state.player.x < 10 ? 'A / D move · SPACE jump · J poke · K / X slash' : state.player.x < 18 ? 'Sunlit branch edges are safe to land on.' : state.player.x > 27 && state.player.x < 40 ? 'The trail is broken. Leap across the ravine.' : state.player.x > 83 ? 'Climb the sanctuary. Reach the queen.' : '';
  if (lastPhase === state.phase) return;
  lastPhase = state.phase;
  overlay.classList.toggle('hidden', state.phase === 'playing');
  $('#pause').setAttribute('aria-label', state.phase === 'paused' ? 'Resume game' : 'Pause game');
  if (state.phase === 'ready') { title.innerHTML = originalTitle; return; }
  const copy = {
    paused: ['A moment<br>of <em>stillness.</em>', 'The grove can wait.<br>Your journey continues when you are ready.', 'Continue the journey', 'PRESS ENTER OR ESC TO RESUME'],
    dead: ['The grove<br><em>remembers.</em>', 'Every legend begins with another attempt.<br>Rise again. The queen is still waiting.', 'Rise again', 'PRESS ENTER OR R TO RESTART'],
    won: ['A light<br><em>returns.</em>', `The queen is free. The kingdom has hope.<br>${state.kills} lions defeated · ${Math.floor(state.time)} seconds · ${state.deaths} falls`, 'Journey again', 'PRESS ENTER OR R TO PLAY AGAIN'],
    playing: ['', '', '', ''],
  }[state.phase];
  title.innerHTML = copy[0]; message.innerHTML = copy[1]; start.innerHTML = `${copy[2]} <span>↗</span>`; $('#overlay-hint').textContent = copy[3];
}
try {
  view = new GameView($('#game'));
  let previous = performance.now(), accumulator = 0, uiElapsed = 0;
  const frame = (now: number) => {
    const dt = Math.min((now - previous) / 1000, 0.1); previous = now; accumulator += dt;
    while (accumulator >= 1 / 120) { stepGame(state, controls.read(), 1 / 120); audio.update(state); accumulator -= 1 / 120; }
    view.render(state, dt, now / 1000);
    uiElapsed += dt;
    if (uiElapsed > 0.08 || lastPhase !== state.phase) { updateUI(); uiElapsed = 0; }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  // Read-only snapshots expose observability, never gameplay shortcuts.
  if (import.meta.env.DEV) Object.defineProperty(window, '__game', { get: () => structuredClone({ ...state, cameraX: view.follow.x, audio: audio.snapshot }) });
} catch (error) {
  title.textContent = 'A little more light.';
  message.textContent = 'The 3D renderer could not start. Enable WebGL 2 and hardware acceleration, then reload.';
  start.style.display = 'none'; console.error(error);
}

if (import.meta.hot) import.meta.hot.dispose(() => audio.dispose());
