# Continuous painted trail

This extends the sanctuary PR across the missed middle: broken crossing and Ancient Trail. It replaces the remaining prototype trees, stacked platform pillars, flat arch, green terrain/grass and distant polygon mountains with the established painted sunset style. The middle has its own original distant valley, warm textured ground, the approved tree-bough atlas, exposed roots, fine grass and soft dust. The sanctuary stays the destination.

## Registration and continuity

All six pre-sanctuary platforms use one shared bough atlas. The opening's original three registrations are preserved. At X 37 the bough is mirrored so its trunk is on the far bank (fallback root X 39.5); it does not paint a solid bridge across the ravine. Only the existing landing width gets an edge highlight. Collision data, movement, enemies, attacks and rescue logic are untouched.

The trail is the fully opaque background behind the fading grove and sanctuary plates. It is hidden when either end plate is fully opaque. This avoids a double fade revealing an empty tint. All areas share sunset lighting and the warm vignette/overlay. Grove backdrop sizing now accounts for its parallax offset to avoid exposing a hard edge in wide views during the crossing. A correction removes the middle painting's sun disc, preventing two visible suns during the blends.

`trail.ts` owns the new distant plate, 216 grass instances in three batches, exposed roots and 64 dust sprites. Its soft circle texture is also reused by the existing global motes. Motion follows simulation time and freezes on pause. Existing wooden bough fallbacks cover image failure; the trail plate has a warm colour fallback. No dependency or Docker changes.

## Verification

28 native Node source tests pass, using Node's source stripping and the existing relative-import resolver. Native Three r180 checks cover 337 camera positions for background-layer visibility/opacity, all six exact bough-edge registrations, the far-bank crossing root, 216 finite/pause-stable grass instances, plus the sanctuary/queen/fallback checks. Actual projected backdrop corners cover three aspect ratios at 12 route positions and two player heights. Camera-projected software previews inspect crossing, middle and sanctuary approach framing. They are assembly renders, not WebGL captures; they omit real lighting, depth-buffer behaviour and performance.

Docker is unavailable in the authoring environment. Production/type build, Docker npm test and Playwright/WebGL journeys remain pending. The keyboard rescue test adds the trail asset response and a middle-trail screenshot. Run the README Docker checks before merging, then review the full route in both directions, jump/land at X 37/58/65, pause/restart and rescue/replay. Check 1440×900 and 1920×1080, and block the new image to review the fallback.

## Original asset

`public/art/trail/sunset-trail.webp`, 1672×941 RGB WebP quality 90, generated with the built-in image tool. The approved grove tree atlas is reused without altering its pixels. The culture and architectural motifs remain fictional. Generation prompt and the targeted sky correction follow.

Use case: stylized-concept. Production background plate for a cinematic painted 2D African-inspired fantasy platform game, wide landscape. Hand-painted detailed textures, warm amber sunset, muted ochre stone and lavender atmospheric shadows. A wooded ancient trail high above a hazy canyon, old baobab and acacia trees framing the far left and far right edges, layered canopies and enormous distant tree trunks, ancient weathered stone ruins partly swallowed by roots in the DISTANCE, a narrow waterfall deep in the valley. Open central sightline and softly glowing dusty air behind gameplay. Sky and distant mountains visible in upper half, gently illuminated valley in lower half. Natural, believable painterly realism matching an adult African spear warrior and realistic painted lions. Rich atmospheric depth, restrained contrast in the middle third for readable characters. NO foreground walkable floor, NO foreground platforms or bridge, NO foreground pillars, NO characters, no UI, no text, no border. All trees and ruins belong to the distant landscape, behind a separately rendered play lane. A cohesive transition between a sunset baobab grove and a golden sandstone sanctuary.

Correction: Remove only the distinct small circular white/yellow sun disc in the upper centre-right sky. Replace it seamlessly with softly glowing amber sunset sky and thin illuminated clouds matching the surrounding brushwork. Preserve the original composition, colour, trees, mountains, canyon, ruins, waterfall and mist. No new solar or lunar disc, text, characters or objects. This prevents a doubled sun when fading into adjacent backgrounds.
