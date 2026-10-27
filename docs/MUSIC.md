# The Queen’s Trail — Sunset Theme

An original background composition for the painted sunset setting: 80 BPM, 4/4, 16 bars / 48 seconds, in a D-major palette with minor and suspended colour. Wooden plucked tones carry a sparse call-and-response melody over soft bass, broad sustained harmony, a quiet shaker and low drum pulse. The instrument timbres are synthesized, not sampled or presented as an authentic performance of a particular tradition.

The underlying two-bar chord sequence is Dadd9 → Bm7 → Gadd9 → A7sus4, repeated with melodic variation. A second synchronized stem supplies higher sustained voices and bell answers near the sanctuary. Both remain aligned to one audio clock. The score is intentionally quieter than foreground combat.

## Playback

The existing sound PR now includes `public/audio/music/journey.ogg` and `sanctuary.ogg`, each 48-second stereo Vorbis at 24 kHz. `music-player.ts` fetches/decodes these local assets asynchronously after the player unlocks audio. It schedules both loop sources at the same context time and fades them in only when ready. No score synthesis occurs in the game loop or delays Begin.

The sanctuary stem rises smoothly from X 76 to 92. Music releases on death/victory so the existing ending cue leads. Pause suspends the shared context and preserves musical position; restart keeps the score flowing while resetting game effects. M mutes all buses. A separate Music slider defaults to 35% and persists with the existing preferences. Old saved settings receive the new default without losing mute/effects/atmosphere values.

Music loading or decoding failure stays independent of effects and ambience. Disposal aborts loading and prevents late sources from starting. A failed partial start is stopped. No external audio service, new dependency or gameplay/art change is required.

## Authored source and rendering

`src/audio/music.ts` contains the note-level composition, synthesis, panning, circular release tails and short stereo reflections. It is used only by authoring/tests, not imported into the gameplay bundle. `tools/render-music.mjs` writes the two original WAV stems and a preview mix. Authoring used native Node and the existing FFmpeg encoder, with no packages installed.

To reproduce the PCM in the project’s Docker environment:

```sh
docker compose exec game node --experimental-strip-types tools/render-music.mjs /app/music-render
```

Encode each generated stem with FFmpeg Vorbis quality 5 into its corresponding public/audio/music file. FFmpeg is an authoring utility, not a game/runtime dependency. The preview `docs/audio/sunset-theme.ogg` adds the sanctuary layer over seconds 24–36, with a fade at its start/end; the runtime stem files retain circular loop tails.

## Verification and listening review

48 native source tests pass: the existing 43 sound/game/hero/lion checks plus five music tests. New checks cover aligned stereo sample counts, finite signal/headroom, non-silent stereo content, circular boundary amplitudes, synchronized layer start times, no duplicate loading, approach/ending fades, missing/invalid music, and disposal while loading. Existing audio tests now also exercise the independent Music bus and legacy preference migration. Web Audio routing/lifecycle assertions use fake nodes.

Encoded tracks were decoded with FFmpeg: both retain exactly 48 seconds at 24 kHz stereo, with finite PCM and peak below 0.6. Native source peaks: journey 0.459, sanctuary 0.242, preview 0.482. Source RMS: 0.0693, 0.0349 and 0.0713 respectively. Circular source seam differences are approximately 0.0028, and decoded stem boundaries remain below 0.02. These are signal checks, not proof of inaudible seams on hardware.

Docker is unavailable in the authoring environment. Production/type build, Docker npm test, Playwright/browser decoding/playback and listening balance remain pending. Browser tests now wait for both music layers and test Music level persistence; another blocks music and checks that combat/effects/gameplay still run.

Listen through two full loops on headphones and laptop speakers. Review the melody against footsteps, spear impacts and lion warnings; approach the sanctuary; pause/alt-tab/resume; mute/unmute; change all three levels independently; restart; die; rescue/replay. Verify loop joins and adjust the final mix by ear. No merge/deployment performed.
