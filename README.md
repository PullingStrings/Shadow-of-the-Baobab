# Shadow of the Baobab

An original 2.5D action-platformer: cross the Whispering Grove, survive charging warthogs, leap the broken trail, and rescue the queen in the ruined sanctuary. A painted, articulated hero travels through a 3D forest; the queen and warthogs retain their original cutout art. The opening grove has a painted sunset backdrop, textured sandstone and earth, exposed roots, wind-swaying grass and drifting dust; later areas retain the procedural prototype art. The hero’s cape ripples and trails during movement; the spear thrusts horizontally toward the facing direction. Original generated background and sandstone textures are included locally; no external asset service is used at runtime.

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
| J or X (hold for repeated strikes) | Spear attack |
| Escape | Pause / resume |
| Enter | Begin, resume, respawn or replay |
| R | Restart the level |

Warthogs lower their heads before charging. Jump over a charge, or strike toward them with your spear. Each takes two hits. You have four health segments and brief invulnerability after damage. Falling into the ravine is fatal. Respawning resets the level; there are no checkpoints. Reach the queen **on the raised sanctuary**, not underneath it. Gold lips and matching end brackets mark jumpable ledges; decorative background ruins have no gold edge. These ledges are one-way platforms: jump through their underside and land on top.

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

The art assets are compressed WebP files in `public/art/opening/` (approximately 506 KiB combined). Asset origins and generation prompts are in [docs/ART.md](docs/ART.md). Grass uses four instanced draw batches. All vegetation and roots are decorative. The gold-edged platform convention, camera framing, actor animation, physics and combat rules are preserved. The queen and enemy art remain procedural cutouts. The hero pass described below adds painted modular character art; the opening remains an art-direction test rather than a full reproduction of the concept image.

To review locally, start with `docker compose up --build`, begin the journey, walk through the first grove, jump onto the first gold-edged ledges, pause, and restart. Compare the opening at 1440×900 and 1920×1080, then cross the ravine to check the transition to the existing scenery. Run the checks above before merging. **This pass has not yet been visually verified in WebGL or checked by the Docker build/test suites in the authoring environment**; see STATE.md for the checks actually performed.

## Painted hero pass

The hero now uses a transparent painted atlas (`public/art/hero/warrior-parts.webp`, about 258 KiB) with separate head, tunic, cape, upper arms, forearms, thighs, shins and boots. `src/view/hero.ts` assembles and animates these pieces. `src/view/hero-pose.ts` computes view-only two-bone limb poses, breathing/run lean, rising/falling poses, attack reach and a short landing compression. Boots stay upright at the ankle; the cape deforms from a pinned shoulder. A soft contact shadow follows real terrain/platform support and disappears over the ravine.

The spear follows the previous horizontal path: grip Y 1.35 and maximum facing-local tip X 2.95. Hit windows, collision dimensions, movement and enemy rules are unchanged. The original procedural hero remains visible while the atlas loads, or if it cannot load. The painted shading is baked into the artwork with separate cooler far-limb tint; it is not dynamic 3D skin or cloth lighting.

Five regression tests in `tests/hero-pose.test.ts` cover limb reach, spear alignment, planted boots, action selection/state preservation and frozen pause poses. They run with the existing Docker `npm test` command; Docker execution is still pending in the authoring environment. A native structural harness swept 240 frames, checked atlas UVs and finite transforms, confirmed read-only game state, and exercised missing-art fallback and platform/ravine shadow support. The [rig assembly preview](docs/previews/painted-hero-rig.webp) is a software render of the actual geometry and atlas, **not a WebGL gameplay screenshot**. Live visual and performance checks remain pending.

## Prototype boundaries

One short level, one enemy type, placeholder mesh animation, no sound, no save system, no mobile/controller support and no ranged guardian. The kingdom, clothing and motifs are fictional; they do not depict a specific African culture. Future art development should involve specific cultural research and collaboration. Safari/Firefox and a hardware performance budget remain future checks. See [docs/STATE.md](docs/STATE.md) for verification results.
