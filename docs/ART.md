# Opening grove — art direction and asset provenance

## Direction

User-selected: painted cinematic, detailed textures, warm atmospheric light and sunset colours. The opening combines amber/burnt-orange sunlight, dusty lavender shadows, a monumental baobab and textured sandstone. Keep the hero/enemy silhouettes and gold landing edges readable. The opening pass addresses scenery; a subsequent hero pass adds painted modular character art while keeping the existing queen and enemies.

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


## Painted hero atlas

`public/art/hero/warrior-parts.webp` is an original built-in ImageGen output from 27 October 2026, converted to RGBA WebP at quality 91 without resizing (1774×887; about 258 KiB). Actual opaque bounds were measured after generation; the renderer uses explicit pixel rectangles and anatomical anchors rather than assuming a perfectly regular atlas grid. Shins and boots are separate runtime regions of the same generated lower-leg piece, with an overlapping ankle seam. Transparent alpha is preserved.

The hero is fictional. The design uses dark brown skin, tied-back locs, rust-orange cloth, indigo trousers, leather wraps and restrained brass details. It does not represent a named African culture. Its amber highlights and violet shadows are painted into the image. MeshBasicMaterial preserves that artwork; the far limbs have a cooler tint for depth. No photorealistic skin simulation or dynamic material lighting is claimed.

**Hero generation prompt:** Use case: stylized-concept. Production 2D skeletal-animation SPRITE PARTS ATLAS for the hero of Shadow of the Baobab, a painted cinematic African fantasy side-scrolling game. Transparent background. Wide canvas 2048 by 1024, EXACTLY FOUR equal columns and TWO equal rows, eight separate isolated sprite parts. Each part centred inside its own rectangular cell with generous transparent gutters (at least 12% on every side). No visible grid, NO text, NO labels. All parts from ONE consistent adult athletic Black African male warrior viewed strictly in RIGHT-FACING SIDE PROFILE. Dark brown skin, tied-back short black locs, no face covering, focused expression, weathered rust-orange woven tunic and scarf, dark indigo trousers, dark brown leather boots and forearm wraps, restrained aged-brass edging. Detailed hand-painted brushwork, warm amber edge highlights from upper right, cool muted purple shadows, clear readable silhouette, painterly fantasy game illustration, NOT photoreal, NOT flat vector. Modular parts must not touch each other or cross cell boundaries. Top row left to right: (1) ONLY head and short neck, facing right, locs tied back close to head, no torso; (2) ONLY tunic-covered torso from shoulder to hips with sash and a few short cloth tails, side profile, NO head, NO arms, NO legs, NO long cape; (3) ONLY long flowing rust-orange cape/scarf trailing to the LEFT from its shoulder attachment on the RIGHT, broad flowing fabric with painted folds, no body parts; (4) ONLY long straight horizontal wooden spear with slim aged-metal spearhead pointing RIGHT, no hand or body, no feather. Bottom row left to right: (5) ONLY one bare dark-brown muscular UPPER ARM with short orange sleeve cap, rounded shoulder at TOP and elbow at BOTTOM, hanging straight VERTICALLY DOWN; (6) ONLY one dark-brown FOREARM with leather wrist wrap ending in closed gripping fist at BOTTOM, rounded elbow at TOP, hanging straight VERTICALLY DOWN, no weapon; (7) ONLY one indigo-trousered THIGH, rounded hip at TOP and knee at BOTTOM, hanging VERTICALLY DOWN; (8) ONLY one SHIN and leather BOOT, knee at TOP, sole at BOTTOM and toes pointing RIGHT, hanging VERTICALLY DOWN. These are isolated components for joint rotation in an actual game, not assembled figures or a concept poster. Preserve clean alpha silhouettes without cast shadows, floor, scenery, checkerboard painting, or backdrop.

The atlas was converted to WebP; the layout and painted pixels were otherwise retained. UV rectangles, joint anchors, separate boot regions and cape deformation are defined in code. No further image-generation edits or CLI/API image mode were used.

### Hero review

[Idle / run / rise / strike assembly preview](previews/painted-hero-rig.webp) was rendered in a temporary CPU triangle rasteriser using the actual Three.js mesh transforms and atlas UVs. It shows joint assembly on a neutral background. It omits WebGL shading, alpha-test behaviour, fog, cast shadows, material tint and the world/camera, so it is not proof of in-game appearance.

In Docker, inspect both facing directions, idle breathing, full-speed running, rising and falling, landing on the first ledge, repeated spear attacks, damage flash, death, pause/resume and restart. Watch for shoulder/ankle seams, sprite alpha edges, legibility at normal camera scale and foreground occlusion. Also check that blocking the atlas request retains the procedural hero. The first environment PR is the base of the separate hero PR; merge them in that order.
