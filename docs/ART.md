# Opening grove — art direction and asset provenance

## Direction

User-selected: painted cinematic, detailed textures, warm atmospheric light and sunset colours. The opening combines amber/burnt-orange sunlight, dusty lavender shadows, a monumental baobab and textured sandstone. Keep the hero/enemy silhouettes and gold landing edges readable. This first pass addresses scenery, not final character art.

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
