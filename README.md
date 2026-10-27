# Shadow of the Baobab

An original 2.5D action-platformer: cross the Whispering Grove, survive charging warthogs, leap the broken trail, and rescue the queen in the ruined sanctuary. Flat, layered character cutouts sit within a procedural low-poly 3D forest. The hero’s cape ripples and trails during movement; the spear thrusts horizontally toward the facing direction. Reference images guide the mood; no reference assets are included.

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

## Prototype boundaries

One short level, one enemy type, placeholder mesh animation, no sound, no save system, no mobile/controller support and no ranged guardian. The kingdom, clothing and motifs are fictional; they do not depict a specific African culture. Future art development should involve specific cultural research and collaboration. Safari/Firefox and a hardware performance budget remain future checks. See [docs/STATE.md](docs/STATE.md) for verification results.
