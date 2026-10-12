# Anchored ground pigtails and contained inspection routing

Current drag-wire workbench at `/preview/?view=cables`, on `codex/training-board-preview`. This changes the existing cable workbench, not the default lesson or its validator. Production and main remain at the pinned baseline.

## Reproduction

The live preview revision before this update was `71313eaebe0fca9d654c2aab2d67b34724077da7`, so it had neither of the previous routing commits. Chromium reproduced its large device-bound loops and the two loose ends created by each pigtail action.

- [Live oversized loops](before-live-loops-desktop.png)
- [Live unanchored pigtails](before-live-pigtails.png)

## Fixes

`addPigtail` now creates the requested wire and electrically attaches its terminal end to the actual device green screw or the separate steel BOX BOND screw, in the same undoable action. Only its splice end remains open. Missing devices, occupied screws and duplicate pigtails are rejected without changing the circuit. Screw-end hit targets are explicitly anchored; dragging them cannot silently detach a pigtail. Explicit Disconnect remains available for deliberate fault exercises.

The compact cavity routing frame now includes both single-pole switches and duplex receptacles. Every stationary path is calculated within the real box cavity and around the device face. Endpoints and terminal anchors use the same SVG transform. No path is hidden, clipped or deleted to conceal overflowing conductors. Existing cable entries, wires, splice memberships, grounding requirements and circuit validation remain intact.

Phone inspections scale the complete SVG to the available width instead of requiring a 620-pixel drawing. Desktop and phone checks use the actual rendered paths, not screenshots of a separate decorative diagram.

## Rendered evidence

| Device | Desktop: anchored screw / loose splice | Desktop: connected | Phone: loose | Phone: connected |
| --- | --- | --- | --- | --- |
| Switch | [Loose](anchored-switch-desktop-loose.png) | [Connected](anchored-switch-desktop-connected.png) | [Loose](anchored-switch-phone-loose.png) | [Connected](anchored-switch-phone-connected.png) |
| Receptacle | [Loose](anchored-receptacle-desktop-loose.png) | [Connected](anchored-receptacle-desktop-connected.png) | [Loose](anchored-receptacle-phone-loose.png) | [Connected](anchored-receptacle-phone-connected.png) |

## Verification

79 model tests and a 52-test browser suite cover pigtail creation, real connection records, correct screw ownership, untouched loose splice ends, occupied-screw rejection, Undo/Redo, loose and connected routing, SVG cavity containment, face intersections, exact copper endpoints, device movement, fixed-tip drag rejection, reopening, shared main-view state and existing circuit fault behavior. Local failures caused by the old manual-attachment test assumptions and a resize synchronization race were corrected; the preview deployment runs the complete suite again.

The publishing workflow preserves the verified production archive at the root and deploys only the changed `/preview/` content. Its post-deployment verification checks the exact revision and repeats the anchored/contained inspections on both desktop and phone against the live site. Published browser evidence is saved in the workflow artifact.

Small conductor convergences at the same wire nut remain intentional. The model stores conductor identity and connections, not physical cut length; all original conductors and endpoints are retained.
