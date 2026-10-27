# Stable idle, organic ledges and painted lions

The user approved the hero art but reported a glitchy breathing stance, disliked the stone platform pillars, and requested a real-ish dangerous animal. This revision keeps the accepted hero and sunset direction while correcting those three presentation issues.

## Behaviour and scope

- Idle always uses the same registered `idle-0` drawing. A four-second sinusoidal deformation is smoothly weighted above the waist, capped at 0.018 world units. Vertices at/below Y 0.95 do not move. Simulation time freezes the breath during pause. Run/jump/attack art is unchanged.
- Grove platforms X 14, 21 and 31 use painted trees/boughs. The tree root, branch height and horizontal span are registered to the existing platform data. A fine dashed warm edge indicates the unchanged landing plane; stone supports and beige caps are skipped for these three platforms. Later stone platforms remain.
- Painted adult male lions replace the procedural boars. The existing enemy modes select stalking walk, low crouch, extended/gathered charge and recovery poses. Positions, territory, speeds, attack timing, health and damage remain the original simulation's responsibility.
- Original hero, lion-shaped and wooden-branch fallback presentations remain visible if the new art cannot load. No new dependencies, accounts, paid assets or runtime remote services.

## Assets and implementation

| Asset | Source and preparation | Runtime role |
| --- | --- | --- |
| `public/art/enemies/lion.webp` | Original built-in ImageGen output, 27 October 2026; RGBA WebP quality 91, no resizing; 1774×887, about 344 KiB | Eight complete lion poses |
| `public/art/opening/tree-ledges.webp` | Original built-in ImageGen output, same date; RGBA WebP quality 91, no resizing; 1536×1024, about 516 KiB | Two tree/bough silhouettes |

Generated art does not follow a perfectly separated grid. Alpha-connected silhouettes were measured and simplified into vector contours in `src/view/grove-art.ts`. `painted-shape.ts` maps those contours to atlas UVs, preventing parts of neighbouring lions/trees leaking through overlapping rectangular crops. This changes runtime geometry, not the original painted pixels. Tiny disconnected flecks are not retained. Baked sunset shading is preserved with unlit textured materials; the result is painterly realism rather than photorealistic 3D fur/bark.

The lion has eight prebuilt geometries per instance and a single painted sprite per active pose. The tree geometry follows the foliage/bark outline. The hero remains one subdivided sprite with fixed lower vertices. Fall-back silhouettes are deliberately simpler than the artwork.

## Generation prompts

### Lion

Use case: stylized-concept. Production game SPRITE SHEET, exactly FOUR columns and TWO rows, EIGHT complete FULL-BODY MALE AFRICAN LION poses. Wide 2:1 canvas. Realistic animal anatomy rendered as detailed cinematic hand-painted game art, warm amber sunset highlights and cool violet shadows, matching a painted African fantasy platformer. Adult dangerous powerful male lion with dark tawny mane, muscular shoulders and haunches, convincing feline paws, golden ochre fur with varied fine brush texture, long tail with dark tuft. NOT cartoon, NOT low-poly, NOT cute, NOT anthropomorphic. Strict RIGHT-FACING SIDE PROFILE for every lion. Every animal fully inside its own equal cell, including tail, paws and mane, generous transparent gutters, same body proportions and camera scale across all frames. Transparent alpha, absolutely no background, grass, floor, shadows, text, frame labels or checkerboard. Keep all paws on a consistent ground baseline around 85% of cell height; show the entire tail. Reference body proportion: lion nose-to-rump about twice height at shoulder, tail adds length on the left; not an oversized bobble head.

Top row frames1-4: four distinct natural STALKING WALK poses across a full alternating fore/hind leg cycle: contact, passing, opposite contact, passing. Head focused right, mouth closed, mane detailed.

Bottom row left-to-right: frame5 LOW WINDUP CROUCH with shoulders lowered and weight gathering in rear legs, ears pinned, jaws slightly open showing teeth, menacing but no gore. Frame6 CHARGING GALLOP EXTENDED with front legs reaching right and rear legs extending back, low powerful head. Frame7 CHARGING GALLOP GATHERED with all limbs tucked beneath the body, spine flexed, head still focused right. Frame8 RECOVERY STANCE standing breathing with open mouth and weight settling. These are eight coherent full-body animation frames, not separate body pieces and not a poster. Consistent body size and foot registration are essential.

### Tree ledges

Use case: stylized-concept. Production 2.5D SIDE-SCROLLING GAME ENVIRONMENT ASSET SHEET: exactly TWO separate full trees side-by-side, each isolated on transparent background with ample clear gutters. Wide 3:2 composition. Beautiful detailed hand-painted African woodland trees with richly textured gnarled bark, warm amber sunset edge light and cool violet/brown shadows, sparse olive foliage. Real-ish organic shapes, no geometric primitives, no bricks, ruins, pillars, gold slabs, artificial platforms or text. Tree one on LEFT: thick twisting rooted trunk on left side of its cell, with a broad strong almost-horizontal bough extending far RIGHT at about 40% of total tree height above its root. The bough should have a naturally flat upper landing edge across about 60% of the tree's width, thick knotted underside, rough bark, subtle amber sunlight along that upper edge, a few small leaf clusters around tips. Tree two on RIGHT: taller twisting trunk with a different natural silhouette, rooted on the left side of its cell, with its broad almost-horizontal rightward landing bough about 60% up its full height. Both trees: visible roots and a modest crown of smaller branches and sparse leaves above, not a huge dense ball of foliage. Design actual organic climbable TREE BRANCHES rather than attaching a wooden shelf. Clean readable branch upper edges for a platformer. All parts of each tree inside its cell; no parts touch the neighbour. Strict side-on view, flat illustration with rich dimensional shading. No perspective floor, ground strip, cast shadow, scenery/background or labels. Genuine transparent alpha; the game will add collision and a thin highlight.

## Verification and review

[Tree/lion assembly preview](previews/grove-tree-lion.webp) uses the actual textured silhouette geometry and platform registration. [Idle/lion animation preview](previews/idle-lion.gif) shows the pinned idle and enemy pose progression. Both are software renders against neutral backgrounds, **not gameplay screenshots**. The preview does not reproduce WebGL lighting, fog, depth testing, alpha-test thresholds or hardware performance.

Native structural checks: 481 idle updates with unchanged foot vertices, bounded/continuous upper-body breathing and pause freeze; all lion modes with valid UVs and finite transforms; read-only enemy/player state; three branch highlights matching collision endpoints/heights within float-buffer precision; nonempty contour geometries; hero/lion/tree asset-error fallbacks. Added regression tests cover idle stability/breath bounds, enemy mode selection and atlas masks. Docker execution of the production/type build, unit suite and Playwright suite remains pending because Docker/browser execution is unavailable in the authoring environment.

Review in the actual game: idle for several breaths, pause/resume/restart, jump onto all three grove boughs from both directions, walk in front of the tree trunks, verify warm edge readability, approach the lion and observe its crouch/charge/recovery, fight/jump over it, test the ravine and complete the rescue. Check that art remains readable at normal camera scale and that failure to load the new textures preserves visible hazards/landing cues. PR #2 remains stacked on #1; merge #1 then retarget #2 to main before merging.
