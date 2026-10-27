# Poke and slash

J is a long fast spear poke; K/X is a shorter, vertically broader slash. Holding repeats after a shared cooldown; changing keys cannot cancel a swing or bypass its cooldown. Simultaneous keys select slash.

`src/game/attacks.ts` centralizes timing, reach, height bands, knockback and three-hit enemy health. Collision tests the lion body (1.25 half-width, 0.15–1.7 height) instead of only its centre. Patrol, windup, charge and recovery are vulnerable. Attacks require facing and active frames, and each attack ID can damage each lion once. Both deal one damage; the third hit kills. A hit interrupts into 0.8-second recovery. Movement, jumps, terrain and sanctuary are unchanged.

The slash has four complete painted poses and a baked warm spear arc. Crop bounds, shared pixel scale and planted foot origins live in hero-frames.ts. If the optional slash sheet fails, the approved painted poke frame remains visible. Lions flash briefly and show three health pips after damage; dead lions hide pips.

Verification: 28 native Node source tests passed (simulation, combat, hero and lion). These execute TypeScript via Node stripping and a local relative-import resolver, without a package install or build. Native Three r180 geometry checks and a software render cover eight attack poses, idle deformation and lion/ledge geometry. One existing gait-boundary test exposed floating point subtraction rounding; a tiny frame-boundary epsilon fixes it.

Docker is unavailable here. The required production/type build, Docker npm test, and Playwright keyboard/WebGL checks remain pending. Added browser coverage selects J/K/X through real keyboard events, without simulation mutation. Run the README Docker checks before merge. The preview is a software geometry render, not a gameplay capture.
