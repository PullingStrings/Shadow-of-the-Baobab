# Painted sanctuary

The final stretch, X 80–105, gets a painted warm-sunset destination. A transparent rooted sandstone arch frames a complete painted queen; a distant canyon, waterfalls and baobab valley move with slower camera parallax. Bronze sun details echo the queen's crown. The culture and motifs are fictional.

## Integration

- `sanctuary.ts` builds a distant plate, shrine, approach-step foundation cropped from the same atlas, textured thin 3D caps, fine landing-edge traces, small grasses and a local soft dust batch. The existing flat arch and two platform stacks are replaced only in this area.
- `sanctuary-art.ts` records measured image dimensions and shrine walk line (pixel Y 815, X 80–1315); root Y 1120 maps to ground height zero. The queen's origin is pixel (505,1505), with scale 2.9/1492 world units per pixel.
- `sanctuary-layout.ts` reads the existing platforms at X 88 and 94. The image is registered around their unchanged width/height. The image's painting is not used by collision code.
- `queen.ts` renders one coherent subdivided figure, with the existing bounded upper-body breathing function. Lower vertices remain pinned. Original queen, warm stone arch and a dusk colour plate are separate loading/error fallbacks.
- `world.ts` splits only visual terrain at X 80 for warm texture dressing and clears prototype trees/grass at the destination. `scene.ts` blends sunset lighting back in from camera X 72–84. Torch, ring, queen and dust animation now share simulation time, so pause freezes them. The prison ring still disappears on victory.

No game/input files, platform collision data, hero/lion art, attack rules, rescue condition, dependencies or Docker configuration change. Queen remains at (94,3); victory still requires proximity to END=92 at height 3.

## Verification

28 native Node source tests passed using the existing source-import resolver (no package install/build). Native Three r180 construction checks passed: local assets load, finite geometry/transforms, arrival/exit/re-entry visibility, background sizing at 4:3/16:9/21:9, exact landing-edge X/Y extents, 481 bounded/pinned/read-only queen updates, pause freeze, and independent missing-image fallbacks. Camera-projected software previews at 1440×810 and 1680×720 were visually inspected. They omit WebGL lighting, fog, depth-buffer behaviour and performance; they are not gameplay captures.

Docker is unavailable here. Production/type build, Docker npm test and Playwright/WebGL journeys remain pending. The existing full keyboard rescue test now waits for all three sanctuary asset responses and saves an approach screenshot, then follows the same rescue/replay route.

Review locally with README Docker commands: walk from the ancient trail into the destination, pause/restart, jump onto the small step then the raised dais, approach the queen, confirm victory and replay. Inspect at 1440×900 and 1920×1080. Also block sanctuary images to inspect fallbacks. No merge or deployment has been performed.

## Generated assets

Built-in image generation was used for three original images; source PNGs were converted to local WebP quality 90, retaining alpha. No external runtime requests are required. Prompts follow.

### public/art/sanctuary/valley.webp — 1881×836

Use case: stylized-concept. Production game background asset, wide landscape 1536x1024 or wider. A hand-painted cinematic African-inspired fantasy sanctuary valley at amber sunset, detailed brush textures, soft dusty mauve atmosphere, warm golden light, distant weathered sandstone citadel and sacred giant baobab among terraced cliffs, narrow waterfalls and luminous mist far below. View from a high ridge looking across the valley. Monumental but peaceful, sense of final arrival. Golden sky fills upper half, layered lavender mountains and canyon fill lower half, a distant open circular ruin on right third. Medium-low contrast behind gameplay, richly painted rather than low-poly or photoreal photograph. NO foreground ground, NO platforms or foreground architecture, NO characters, NO UI, NO text, NO border. The image is a distant parallax plate behind independently rendered game scenery. Same warm orange/ochre and lavender sunset palette as the approved grove.

### public/art/sanctuary/shrine.webp — 1374×1145 RGBA

Use case: stylized-concept. Production 2D game scenery cutout on genuinely transparent alpha background, single complete African-inspired fantasy sanctuary shrine, front elevation with a very slight view of top surfaces. Painterly detailed natural textures, believable worn ochre sandstone, bronze inlay, tangled ancient baobab roots, sparse trailing vines. Large open rounded arch framing EMPTY central space, two irregular weathered side piers, carved circular bronze sun medallion at crown, graceful broken outer stones. Beneath arch a broad single raised rectangular stone DAIS with a FLAT HORIZONTAL WALKABLE TOP spanning about 80% of total width at roughly 70% down the image; substantial textured rock-and-root foundation extends from that top to bottom of composition, about 30% of total height. Arch opening rises above dais, central walkway completely clear. Dais has crisp thin golden sunlit top edge and irregular darker rubble underside; NO stair steps, no railing, no spikes. Keep entire shrine and foundation fully inside canvas with transparent gutters. Warm sunset rim light upper right, mauve shadows, hand painted cinematic indie-game art matching a realistic painted spear warrior. No characters, NO backdrop, NO floor outside foundation, NO UI, text, watermark or ground shadow. Not low-poly, not a cartoon. One single isolated shrine with transparent opening and surroundings.

### public/art/sanctuary/queen.webp — 1024×1536 RGBA

Use case: stylized-concept. Single full-body game character cutout on genuinely TRANSPARENT background. An adult Black African fantasy queen, believable realistic adult anatomy and beautifully painted detailed textures, matching cinematic painted 2D indie game art. Three-quarter side view FACING LEFT, head turned left toward an approaching rescuer. Dark brown skin, dignified warm expression, elegant braided natural hair swept into high sculptural updo, small original bronze sun-shaped crown/head ornament, subtle bronze jewelry. Flowing ivory and warm antique gold ankle-length gown with indigo woven sash and ochre shoulder drape, clear cloth folds and restrained fictional geometric embroidery. Hands resting naturally together in front at waist, relaxed grounded stance, two visible feet/sandals planted on same baseline, complete crown and hem inside frame with transparent gutters. Warm amber sunset light from right with gentle lavender shadows. One single coherent connected figure, no weapon, no furniture, no environment, no ground plane, no cast shadow, no glow circle, no text or border. Strong readable silhouette at game size, NOT chibi or low-poly, not photoreal photograph. Character sheet with ONE pose only.
