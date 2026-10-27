# Opening grove — art direction and asset provenance

## Direction

User-selected: painted cinematic, detailed textures, warm atmospheric light and sunset colours. The opening combines amber/burnt-orange sunlight, dusty lavender shadows, a monumental baobab and textured sandstone. Keep the hero/enemy silhouettes and gold landing edges readable. The opening pass addresses scenery; a subsequent hero pass adds painted frame-based character art while keeping the existing queen. Painted lions and tree ledges were added in the grove polish revision.

## Included assets

| File | Origin | Use |
| --- | --- | --- |
| `public/art/opening/sunset-grove.webp` | Original built-in ImageGen output, 27 October 2026; converted lossily to WebP at quality 88 | Painted non-collidable distant background, 1672×941 |
| `public/art/opening/sandstone.webp` | Original built-in ImageGen output, 27 October 2026; resized to 1024×1024 and converted to WebP at quality 88 | Repeating diffuse colour on opening cliffs, rocks, platforms and supports |

No third-party reference artwork or models are shipped. Artwork is served locally; no runtime AI or remote asset request. A seamless texture was requested, but edge continuity and visible repetition still need in-game review. The earth brush texture, grass, haze and dust are generated deterministically in the renderer.

## Generation prompts

**Background:** Create a production game environment BACKGROUND PLATE for Shadow of the Baobab, a cinematic painted African fantasy side scrolling platformer. Wide landscape 16:9 composition. Rich hand-painted detailed bark, foliage, weathered rock. Warm sunset amber and burnt orange sky fading dusty lavender at top, atmospheric violet teal shadows, low glowing sun on upper right. Monumental beautifully gnarled baobab occupies central-left middle distance, long extending branches at upper third; distant African wooded escarpments and subtle waterfalls in layered atmospheric haze. Composition for side-on game: most detailed tree trunk around 45% width, distant hazy valley on right. Lower 30% should be softly painted shadowy woodland, no strong edges, so separate playable platforms and characters will read clearly in front. Avoid foreground framing objects. Absolutely NO characters, animals, weapons, UI, text, logos, platforms, walkable ground edge or gameplay ledges. This is background scenery only, not a screenshot. Painterly art direction with deliberate brush texture, detailed but not photographic, sophisticated cinematic colour. The background must work behind moving real-time game geometry.

**Stone:** Production game texture, stylized-concept. One square seamless tileable hand-painted surface texture of ancient weathered sandstone blocks, warm burnt sienna and ochre stone, fine cracks, broad painterly brush shading, small slate-purple shaded crevices, sparse muted olive moss. Medium irregular interlocking stone blocks, no perfect grid. Orthographic flat front view, evenly lit neutral diffuse ALBEDO only: no perspective, no dramatic directional light, no cast shadows, no vignette, no objects or scene, no border or text. Texture fills entire square edge to edge, continuous edges for tiling horizontally and vertically. Sophisticated illustrated cinematic indie-game asset, detailed brush texture but readable large shapes. Not photoreal.

## Review criteria

- Background composition supports a small moving hero; no painted surface suggests a false landing.
- Actual gold-edged ledges remain distinct from distant scenery.
- Light and atmosphere work both paused and during camera movement.
- No painted-plate edges appear at desktop aspect ratios or during jumping.
- Opening fades into existing later art without a sudden missing background.
- Dust and grass add movement without obscuring enemies or consuming excessive frame time.


## Complete hero animation frames — revision after playtest

The user liked the painted character but reported that the modular body was proportioned/assembled incorrectly, and supplied full-character animation-sheet examples. This revision replaces the segmented rig with coherent, frame-by-frame whole-body artwork. It keeps the original painted design rather than adopting the references' chibi/pixel style.

| Runtime asset | Origin | Contents |
| --- | --- | --- |
| `public/art/hero/hero-motion.webp` | Original built-in ImageGen output, 27 October 2026; RGBA WebP conversion, quality 92, no resizing | 1536×1024: four idle, eight run, four jump/landing poses |
| `public/art/hero/hero-attack.webp` | Original built-in ImageGen output referencing the movement sheet, same date; RGBA WebP conversion, quality 92, no resizing | 1536×1024: four horizontal spear-thrust poses |

The earlier `warrior-parts.webp` and its segmented-rig preview are superseded and removed from the current tree; their history remains in Git. No third-party example sprites are shipped. The character is fictional, without attribution to a named culture. Lighting is baked into the paintings, not simulated 3D skin/cloth lighting.

### Registration and playback

Explicit rectangles in `src/view/hero-frames.ts` include transparent gutters around measured silhouettes. This avoids clipping spear tips/capes that cross the generator's nominal grid. Foot/root origins register the poses; each sheet has a single shared scale, so a crouched frame is not enlarged to standing height. Running flight frames retain their deliberate foot lift. The runtime changes the UVs/geometry of a single sprite instead of rotating disconnected limbs. Gait follows distance, and attack frames follow the existing timer. Weapon silhouettes are authored into the frames and can differ slightly from the numerical combat range; collision rules are unchanged.

### Movement generation prompt

Use case: stylized-concept. Create a production animation SPRITE SHEET of COMPLETE ASSEMBLED CHARACTERS, not separate parts. Reference image defines ONLY the identity, painted style, clothing colours and materials. Correct the proportions: athletic adult African male, natural long legs about half total height, head about one seventh total height, balanced shoulders and connected limbs. Same dark brown skin, tied-back black locs, rust-orange woven sleeveless tunic/scarf with subtle brass trim, dark indigo trousers and brown boots. Warm amber highlights, soft violet shadows, detailed painterly cinematic indie-game art. All views strictly right-facing side profile, fully drawn coherent figures with organically joined shoulders, elbows, hips, knees and ankles. Every figure carries the SAME straight wooden spear with metal point facing right, held around waist height; cape trails left but stays compact. No extra weapons, no giant armour or extra limbs.

CANVAS: wide 3:2 aspect, ideally 2048x1360. Exactly FOUR equal columns and FOUR equal rows = SIXTEEN fully separate full-body animation frames in reading order. Every frame must stay wholly inside its own equal rectangular cell, including spear tip and cape. Transparent margins at every cell boundary. No grid, NO text/labels, NO background/floor/shadows/checkerboard.

Registration: identical body scale and camera across all frames; figure pelvis consistently around 38% cell width; ground line at 88% cell height. Normal standing figure from 14% to 88% cell height. Keep anatomical sizes unchanged between frames, including jump poses. Preserve ample empty room to right for the spear. Do not spread any figure across adjacent cells.

ROW 1: FOUR successive subtle IDLE breathing frames, same upright alert stance, relaxed knees, boots grounded, small natural chest/cloth differences. Avoid permanent crouch.

ROW 2: RUN CYCLE frames 1-4: right leg leading contact, right leg weight-accepting down pose, legs passing with left knee advancing, airborne flight with left leg reaching forward. Arms and torso support an athletic spear-carrying run; cape responds to motion.

ROW 3: RUN CYCLE frames 5-8: left leg leading contact, left leg weight-accepting down pose, legs passing with right knee advancing, airborne flight with right leg reaching forward. Make both strides clear and cyclic, not eight identical standing figures. Keep body sizes consistent.

ROW 4: four JUMP poses in order: upward launch with one knee driving up, compact apex with bent legs, descending with legs extending beneath the pelvis, grounded landing compression with knees bent. These are body poses only; do not move the entire figure upward within its cell to depict jumping. Jump translation happens in the game.

Important: this is a practical animation atlas for runtime frame-by-frame playback. Every frame must be a complete, well-proportioned painted hero with spear, with no paper-puppet seams. Not a concept poster, not disassembled parts, no action VFX.

### Attack generation prompt

Use case: stylized-concept. Generate a matching SPEAR ATTACK animation sheet for the exact same fully assembled painted African male hero in the reference. Reference defines the complete character design, natural athletic proportions, rust-orange cloth, dark indigo trousers, brown boots, tied-back locs, face, sunset light and painterly technique. Keep them IDENTICAL. This is an animation asset, NOT a redesign. All characters right-facing strict side view, normal adult athletic proportions with long legs, head about 1/7 height, torso and limbs naturally joined. Preserve consistent body size between all frames.

Canvas wide 3:2, 1536x1024 or larger. Exactly TWO equal columns and TWO equal rows, FOUR full-body frames. Every frame completely inside its own cell with transparent gutters, spear and cape fully visible. NO text, grid, background, scenery, floor, shadows or motion effects. Genuine transparent alpha.

Frame1 top-left: anticipation, feet planted, knees flexed, torso turns back slightly, both hands withdraw the SAME wooden spear horizontally at WAIST height. Spear tip facing right, shaft straight and level.

Frame2 top-right: FULL FORWARD THRUST. Long athletic lunge, front boot planted in front and rear boot planted behind, hips turn with thrust, arms extend naturally to the right, BOTH hands visibly grip the shaft. Spear shaft perfectly HORIZONTAL at waist height, tip right. No upward slash, no diagonal weapon.

Frame3 bottom-left: follow-through/held extension, weight over bent front knee, arms and spear remain fully extended to the right at the same waist-height horizontal attack line. Rear leg braced, cape trails left.

Frame4 bottom-right: recovery, torso returns upright, arms draw the horizontal spear back to a ready position, both boots planted, knees relaxing.

Registration: each figure's standing full height around 74% of its cell height. Keep enough transparent space to left for the cape and right for the full extended spear. Pelvis/root around 37% of cell width. Ground baseline around 88% cell height. Do not shorten legs or inflate the head. These are FOUR complete expressive body poses for a fast 0.3-second thrust, not disconnected skeletal parts. Same warm hand-painted detail as the reference.

### Review evidence and remaining checks

[Animated registration preview](previews/idle-lion.gif) and [20-frame contact sheet](previews/painted-hero-frames.webp) were rendered from actual runtime UV/geometry registration against a neutral background. They show proportions and frame alignment; they do not exercise the WebGL camera, tint, alpha test, fog or cast shadows. The animated comparison uses a slower review cadence; game gait timing follows travelled distance.

Check both facing directions, idle-to-run and jump/landing transitions, sustained attacks, damage, pause/restart, first ledges, ravine and atlas-load failure in the actual Docker game. Inspect cape/weapon clipping at frame boundaries and feet registration at normal camera scale. Docker/browser/hardware performance checks remain pending. PR #2 is updated in place; merge #1 first, then retarget #2 to main before merging.

## Grove polish revision

The user approved the hero’s painted design but reported idle popping and disliked the grove’s stone pillars and low-poly enemy. [GROVE_POLISH.md](GROVE_POLISH.md) records the stable breathing treatment, painted tree ledges, lion sheet, asset provenance, generation prompts, review previews and verification limits. The hero’s approved run/jump/attack sheets are unchanged.
