# Shadow of the Baobab

An original 2.5D action-platformer: cross the Whispering Grove, survive charging lions, leap the broken trail, and rescue the queen in the ruined sanctuary. The hero and lions use painted animation frames within a 3D forest; a complete painted queen waits in the sunset sanctuary. The opening grove has a sunset backdrop, textured terrain, climbable tree boughs, wind-swaying grass and drifting dust. The Ancient Trail and crossing continue the painted sunset style into a rooted sandstone sanctuary and distant valley. All artwork is served locally.

## Play locally

Start Docker Desktop (or Docker Engine with Compose), then run:

```sh
docker compose up --build
```

Open **http://localhost:5173** in a desktop browser with WebGL 2 and hardware acceleration enabled. Press **Enter** to begin. No host Node installation, backend, account, art download or Blender is required. The first build downloads the image and npm dependencies. Source edits hot reload through a bind mount. The port binds to localhost only.

| Key | Action |
| --- | --- |
| A / D or left / right arrows | Move |
| Space, W or up arrow | Jump |
| J (hold to repeat) | Long, fast spear poke |
| K or X (hold to repeat) | Shorter, broader spear slash |
| M | Mute / unmute sound |
| Escape | Pause / resume |
| Enter | Begin, resume, respawn or replay |
| R | Restart the level |

Lions crouch before charging. Jump over a charge, or strike toward them with your spear. You can strike first, including during patrol or windup. Each takes three hits from either attack. You have four health segments and brief invulnerability after damage. Falling into the ravine is fatal. Respawning resets the level; there are no checkpoints. Reach the queen **on the raised sanctuary**, not underneath it. Thin warm highlights mark the opening grove’s climbable branch edges. Later stone ledges retain gold lips and end brackets; decorative background ruins are unmarked. These ledges are one-way platforms: jump through their underside and land on top.

## Checks (Docker only)

With the game service running:

```sh
docker compose exec game npm run build
docker compose exec game npm test
docker compose run --rm browser-tests
```

The build includes a strict TypeScript check. Eight deterministic simulation tests cover movement, jump/landing, platforms/ravine, directional combat, charge timing, invulnerability, death/restart, rescue, pause and enemy terrain boundaries. Playwright uses a separate browser container and exercises actual keyboard input, elevated traversal, combat, death, restart and the complete rescue route. Its first run downloads a larger browser image. Screenshots and failure traces go to `test-results/`. Browser tests read cloned development snapshots; they do not teleport the player, change health or invoke game logic directly.

Stop development with Ctrl+C, or `docker compose stop` after a detached start. Dependencies live in named volumes; when dependencies change, run `docker compose exec game npm ci` and rebuild the image. Never run package-manager commands on the host.

## Architecture

The simulation uses world units, feet-based collision and a fixed 120 Hz step, independent of rendering. Movement is constrained to X/Y; Z is scenery depth. Large frame intervals are capped to prevent huge advances after a tab stalls. Losing focus pauses the game and clears held keys.

| Module | Responsibility |
| --- | --- |
| `src/game/player.ts`, `src/input.ts` | Acceleration, braking, jump buffer/coyote time, keyboard input |
| `src/game/physics.ts`, `src/game/world.ts` | Gravity, one-way landings, level layout |
| `src/game/enemies.ts` | Patrol → windup → charge → recover |
| `src/game/combat.ts` | Directional melee, one hit per swing, damage/knockback |
| `src/game/state.ts` | Ready, playing, paused, dead and victory states |
| `src/view/` | Procedural meshes, animation, lighting, atmosphere, following camera |
| `src/main.ts`, `src/style.css` | Game loop, HUD, overlays, presentation |

Physics and combat are plain TypeScript without Three.js imports. Rendering reads simulation state. React is unnecessary for this small HUD. `window.__game` exposes cloned, read-only snapshots in development only; production builds omit it.

## Stack decision

Documentation checked **27 October 2026**. Installed versions: TypeScript 5.9.3, Vite 8.3.5 and Three.js 0.180.0. Current Three.js renderer/camera documentation was successfully consulted through the existing Context7 integration. No integrations were installed.

- **Three.js + Vite:** chosen for genuine 3D meshes, orthographic projection, shadows and atmospheric depth while retaining TypeScript. We own the small collision/combat implementation. See [Three.js renderer documentation](https://threejs.org/docs/#WebGLRenderer) and [Vite documentation](https://vite.dev/guide/).
- **Phaser:** a strong web arcade foundation, but its official documentation describes a 2D engine without built-in 3D rendering. A second renderer would complicate this slice. See [Why Phaser](https://phaser.io/why-phaser).
- **Godot:** a viable future choice for editor-driven scenes, animation and richer physics. Its web export targets WebAssembly/WebGL 2 using the Compatibility renderer, with single-threaded exports supported. For this TypeScript-first, programmatic-mesh slice, editor/export tooling offers less immediate benefit. See [Godot web export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html).

Scope and acceptance criteria are recorded in [docs/PROJECT.md](docs/PROJECT.md). Starter workflows are available locally in `.agents/skills/`, with optional agent definitions in `.codex/agents/`. These are development instructions, not runtime dependencies. Existing Context7 and browser connections were used directly.

## Opening grove art pass

The first ground segment (world X −12 to 33) explores a painted cinematic direction with amber sunset light, lavender shadows and textured stone. `src/view/opening.ts` owns its backdrop, procedural earth texture, grass, roots, haze and dust. `src/view/world.ts` applies the sandstone/earth materials to the opening terrain and first ledges. `src/view/scene.ts` blends the opening light back to the original lighting as the camera moves from X 28 to 44. Background art follows more slowly than the gameplay camera for parallax; it does not replace the collidable world.

The original backdrop and stone WebP assets total approximately 506 KiB; the tree-ledge atlas adds approximately 516 KiB in `public/art/opening/`. Asset origins and generation prompts are in [docs/ART.md](docs/ART.md). Grass uses four instanced draw batches. All vegetation and roots are decorative. The six pre-sanctuary ledges are dressed as painted tree boughs at the same collision coordinates; the final ledges use rooted sandstone. Camera framing and physics are preserved. The queen is now a complete painted figure; the enemy is now a painted lion. The hero pass described below adds painted frame-based character art; the opening remains an art-direction test rather than a full reproduction of the concept image.

To review locally, start with `docker compose up --build`, begin the journey, walk through the first grove, jump onto the first highlighted branches, pause, and restart. Compare the opening at 1440×900 and 1920×1080, then cross the ravine to check the transition to the existing scenery. Run the checks above before merging. **This pass has not yet been visually verified in WebGL or checked by the Docker build/test suites in the authoring environment**; see STATE.md for the checks actually performed.

## Painted hero pass

The hero uses **complete painted animation frames**, replacing the earlier body-part puppet. The three local RGBA WebP sheets in `public/art/hero/` contain 24 coherent full-body poses: four idle, eight running, four rise/apex/fall/landing and four poke and four slash frames. The character keeps the sunset palette and materials, with balanced adult proportions and naturally connected shoulders, arms and legs.

`src/view/hero-frames.ts` records measured crop bounds, foot/root origins and one fixed pixel scale per sheet. Frames are not independently stretched to fit, and the renderer draws just one full-body sprite at a time. `src/view/hero-pose.ts` selects frames from simulation state: gait advances with grounded distance travelled, jump poses follow vertical velocity, landing compresses briefly, and thrust phases follow the existing 0.3-second attack timer. Pausing freezes playback; restart resets it. Damage reuses a braced frame with the existing flash, and death reuses a collapsed landing pose.

`src/view/hero.ts` retains the procedural loading/error fallback and terrain-aware contact shadow. The obsolete parts atlas was removed. The original movement/poke sheets together are approximately 720 KiB; no new dependency or Docker change is required. Movement, level data and camera remain unchanged. The combat update adds distinct attack windows, a body-based lion hurtbox and three-hit health. The weapon is painted into each pose; its silhouette is not an independently simulated spear or a pixel-perfect trace of the collision range.

Eight hero regression tests cover frame bounds/scales, attack timing, distance-based gait, jump/landing transitions, pause/restart, read-only state and stable breathing. Additional lion tests cover enemy pose selection and atlas masks. They run with the existing Docker test command. [Animated registration preview](docs/previews/idle-lion.gif) and [all 20 registered frames](docs/previews/painted-hero-frames.webp) are software renders of the actual runtime crop/geometry data, **not WebGL gameplay captures**. Syntax and native structural checks passed; Docker build/tests and live WebGL/performance review are still pending in the authoring environment.

## Prototype boundaries

One short level, one enemy type, original synthesized sound, no save system, no mobile/controller support and no ranged guardian. The kingdom, clothing and motifs are fictional; they do not depict a specific African culture. Future art development should involve specific cultural research and collaboration. Safari/Firefox and a hardware performance budget remain future checks. See [docs/STATE.md](docs/STATE.md) for verification results.

## Idle, tree ledges and lions

The idle pose holds a single registered drawing. A slow four-second deformation above the waist supplies breathing; the boots and lower legs are pinned. It uses simulation time, so pause freezes it. This replaces swapping the four slightly different idle images, which caused stance popping. Run/jump/attack art is unchanged.

The grove’s first three platforms (X 14, 21 and 31) use painted trees and broad boughs with a fine warm landing-edge highlight. No stone pillars or beige slabs are drawn there. Their position, width and jump/collision rules are unchanged. The Ancient Trail uses painted trees and boughs; the sanctuary has its own rooted sandstone shrine.

Painted lions replace the procedural boars. An eight-pose atlas supplies stalking, windup crouch, extended/gathered gallop and recovery, using the existing patrol/charge timing, speed and damage, with three-hit health. Alpha-contour meshes isolate each silhouette where generated sheet bounds overlap. Lion-shaped and wooden-bough loading/error fallbacks keep hazards and landing edges visible.

See [grove polish notes and generation prompts](docs/GROVE_POLISH.md), [tree/lion assembly preview](docs/previews/grove-tree-lion.webp) and [idle/lion animation preview](docs/previews/idle-lion.gif). These are software assembly renders, not live gameplay captures. Docker build/tests and live WebGL review remain pending.

## Poke and slash

J pokes (0.3 s action, 0.4 s repeat); K or X slashes (0.42 s action, 0.55 s repeat). Both deal one damage per lion per swing. Poke reaches farther; slash covers a broader vertical band. A successful hit interrupts the lion into recovery. Body overlap replaces the centre-only melee check, so its visible front can be struck before it charges. A brief flash and three health pips show successful damage.

[Combat details and verification](docs/COMBAT.md) · [Eight runtime attack poses, software preview](docs/previews/poke-slash.webp). Docker build and browser checks remain pending.

## Painted sanctuary

The final area (world X 80–105) now continues the cinematic sunset direction: a distant canyon/baobab valley, rooted sandstone arch with bronze sun carvings, a painted ivory-and-gold queen facing the hero, and warm textured approach/dais stonework. A thin sunlit trace marks both real landing edges. Lighting and the background blend in as the camera approaches; the trail now connects all three painted areas.

The queen holds one connected pose with slow breathing above the waist. Dust, torch flicker and the prison ring now use simulation time and freeze on pause. The ring still disappears on rescue. Platform positions, jump/landing rules, combat, rescue height and victory trigger are unchanged. No new interaction is required.

[Sanctuary notes, asset prompts and verification](docs/SANCTUARY.md) · [Arrival preview](docs/previews/sanctuary-arrival.webp) · [Rescue framing preview](docs/previews/sanctuary-rescue.webp). These are camera-projected software assembly renders, not WebGL gameplay captures. The three new local WebP assets total approximately 1.06 MiB. Docker build/type checks and browser journeys remain pending in the authoring environment; run the checks above before merging.

## Continuous painted trail

The crossing and Ancient Trail now continue the grove’s painted treatment, with warm textured earth, tree-bough platforms, exposed roots, soft grass/dust and a new atmospheric valley. The crossing bough grows left from the far bank; the ravine remains visibly open. The remaining prototype pillars, flat ruin arch, polygon trees and green terrain have been removed. Movement, landing widths/heights, combat and rescue rules are preserved.

The three backgrounds blend over an opaque middle plate, with continuous sunset lighting and a warm overlay. The middle sky has no distinct sun disc to avoid double suns during transitions. See [trail notes and generation prompt](docs/TRAIL.md), [middle preview](docs/previews/ancient-trail.webp) and [crossing preview](docs/previews/broken-crossing.webp). These are software assembly renders, not gameplay captures. Docker build/type and browser checks remain pending.

## Sound design

Begin the journey to enable audio. The mix adds a quiet looping wind/insect bed, a warm sanctuary drone, earth/wood/stone footsteps, jump/landing, distinct poke/slash whooshes, hit/hurt cues, positional lion warning/charge/defeat cues, death and a short rescue chord. This is original synthesized sound, with no external samples or runtime dependencies. The original score loads from two local compressed audio files. The lion cues are stylized synthesized growls, not wildlife recordings.

**M** or the note button mutes everything. Open **Sound settings** below the game for separate **Effects**, **Atmosphere** and **Music** levels. Preferences persist on this browser when storage is available. Audio starts after a player gesture, fades/suspends on pause or losing focus, and resumes with the journey. Restart clears old effects; unsupported audio leaves gameplay available.

[Listen to the 24-second sound reel](docs/audio/sound-pass.ogg) · [Sound architecture, cue list and verification](docs/SOUND.md). The reel uses the same original PCM generators in a staged sequence, not a gameplay recording. Browser playback and listening balance still need local review.

## Background score

An original 48-second, 80 BPM sunset theme accompanies the full journey: wooden plucked tones, soft bass, light percussion and sustained harmony. A synchronized brighter layer enters near the sanctuary. Music fades out for death/rescue cues, pauses with the game and resumes at the same musical position. Restart keeps the ongoing score while clearing effects.

**Music** has its own saved level in Sound settings (35% by default); M still mutes everything. Both tracks load/decode asynchronously after audio is unlocked, with no gameplay delay. Missing music leaves ambience/effects available.

[Listen to the sunset theme](docs/audio/sunset-theme.ogg) · [Composition, source and verification](docs/MUSIC.md). The standalone preview brings in the sanctuary layer during its second half. Browser listening and the final mix balance remain pending local review.
