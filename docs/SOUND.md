# Sound design pass

Original synthesized audio supports the painted sunset journey without a constant melody competing with play. No samples, paid services, remote requests or dependencies are added. This is a first sound-design pass for listening review; lion cues are stylized low synthesized growls, not recorded animal vocalizations.

## Palette and cues

- A seeded filtered-noise wind bed and sparse soft insect chirps loop beneath the action. A quiet open D/A harmonic bed enters from X 76 to 92 as the sanctuary appears.
- Grounded distance triggers varied earth footsteps at half the painted run cycle’s stride distance; branch landings use wood and sanctuary ledges use stone. Feet remain silent in the air and while stopped. Jump and landing cues are separate, with landing level following incoming speed.
- Poke is a short tight rush; slash is a longer swept-noise sound. Each new attack ID sounds once. Every successful hit gives an impact; the third adds a lion defeat growl. Player damage and death have distinct low cues.
- Lion windup and charge transitions emit nearby warning cues. Their stereo position and distance level follow the lion relative to the player; enemies over 22 units away are silent.
- Rescue plays a brief rising D-major bell chord once. Ambience ducks on death/victory, rather than repeatedly firing ending sounds.

## Controls and lifecycle

M and the HUD note button toggle master mute. The keyboard-accessible Sound settings panel has Effects and Atmosphere sliders. `baobab-audio-v1` in localStorage preserves preferences; malformed or unavailable storage falls back gracefully. Slider arrow keys adjust volume without moving the hero.

No AudioContext is created until Begin, resume or unmute is invoked by the player. A single context and two looping buffers are reused. Sound events are read after fixed simulation steps, keeping swing/hit/landing timing independent of rendering. Muted events are consumed without being queued for later. Volume changes ramp; a compressor controls overlapping effects. One-shot variants are cached and active effects are bounded to 24, with old voices faded out.

Pause/lost focus fades the master, stops transient effects and suspends the context after a short fade. Resume waits for a pending suspend, clears stale voices and unlocks playback. Restart clears effects and the event history, while keeping volume settings. Context/device failure is contained. Vite hot disposal releases audio. No movement, combat, enemy AI, collision or rescue logic changes.

## Implementation

- `src/audio/synthesis.ts`: deterministic 24 kHz mono PCM, noise/oscillator envelopes, per-effect variation and 12-second ambience loops with circular crossfades.
- `src/audio/events.ts`: read-only simulation comparison, grounded travel, attack IDs, damage, enemy modes and terminal transitions.
- `src/audio/engine.ts`: lazy Web Audio graph, stereo panning, buses, smooth gains, cache, voice lifecycle, pause/restart/disposal.
- `src/audio/ui.ts`: mute, independent levels, accessible outputs and storage fallback.
- `src/main.ts`: audio updates after each fixed simulation step and gesture-bound begin/resume; development snapshots expose read-only audio status.

## Verification and review

43 native Node source tests pass, including 15 new audio tests: finite/bounded/non-silent PCM and quiet endpoints, deterministic loop seams/variations, preferences, real held-attack and three-hit simulation sequences, material footsteps, jump/landing/damage, spatial warnings, no repeated terminal cues, lazy context creation, bus gains, pause/resume/restart, bounded voices, mute without backlog and missing device and runtime graph failure. These use native TypeScript stripping and a fake AudioContext for graph/lifecycle assertions; they are not browser playback tests. Existing game/hero/lion tests still pass.

A 24-second stereo reel in `docs/audio/sound-pass.ogg` stages 18 cues over the same generated ambience. PCM before encoding: peak 0.366, RMS 0.0254, no clipping. This reel illustrates the sound palette; it does not record live game timing, Web Audio compression or actual speaker/headphone output.

Docker is unavailable in the authoring environment. Production/type build, Docker npm test and Playwright/browser playback remain pending. Browser tests are added for unlock, attack voices, pause suspension, mute persistence, independent levels, slider-key isolation and unavailable-device gameplay. Do not treat mock/signal tests as evidence that the mix has been heard in a browser.

Run README Docker checks, then listen on headphones and laptop speakers: compare wind against footsteps, distinguish poke/slash, strike a lion before its charge, check left/right warnings, jump onto branches/stone, take damage, pause/alt-tab/resume, mute/unmute, restart during an ending, and rescue/replay. Listen for excessive repetition, harsh high-frequency insect tones, muddy growls and abrupt loop seams. Set the final mix by ear after this review.
