# Auto Wire Circuit — development review

This update is on `codex/training-board-preview` and has **not been deployed**. The published `/preview/` remains on its earlier version until deployment is approved.

The main cable workbench now has an **Auto Wire Circuit** button. Assemble the parts and install the NM-B cables first, turn simulated power **OFF**, then click the button. The operation uses actual conductor ends, electrical screws, pigtails and wire nuts; manual wiring remains available.

## Supported layouts

- One panel → one NM-B cable → one single-gang steel box with one mounted duplex receptacle.
- One panel → one NM-B cable → one single-gang steel box with a mounted single-pole switch → one NM-B cable → one steel ceiling box with a mounted porcelain keyless lampholder.

Cable installation direction does not matter. Extra parts, missing cables, unmounted devices, ambiguous routes/pigtails/connectors, incompatible cable contents and inadequate existing connector capacity are rejected with instructions. Rejected requests leave the entire model unchanged; there are no partially applied connections.

Auto Wire preserves a valid existing breaker selection. An unwired feed uses the first available modeled 15A branch breaker and the completion message identifies it. It does not change the switch position, turn power on, turn a breaker on, or reset a tripped breaker.

The receptacle/switch receives a real device-ground pigtail and a separate steel-box bond. The ceiling fixture receives a separate **box-bond pigtail only**: porcelain has no equipment-ground terminal. White neutral, black hot and bare equipment-ground conductors remain separate. The lighting hot path runs through the two actual switch screws; the white conductors are spliced with a real neutral wire nut.

Existing eligible pigtails and connectors are reused. Cable/conductor/end identities are preserved. A single Undo restores the prior wiring, connector memberships and pigtails; Redo restores the completed circuit. Operating safety/trip state follows the existing shared history rules.

## Screenshots

These were captured from real Chromium mouse interactions. The browser test placed parts, installed cables, clicked Auto Wire, inspected and moved connectors, performed Undo/Redo, then **explicitly** operated the breaker, switch and power controls to verify the result. Auto Wire itself leaves power off.

| Example | Completed circuit after manual power-on | Power-off inspection |
|---|---|---|
| Duplex receptacle | [Workbench](receptacle-completed.png) | [Receptacle and box bond](receptacle-inspection.png) |
| Switch-controlled keyless lamp | [Workbench with illuminated bulb](lighting-completed.png) | [Switch and splices](switch-inspection.png), [fixture and ceiling-box bond](fixture-inspection.png) |

## Files changed

- `src/auto-wire.ts`: transactional layout recognition, actual connection generation, pigtail/connector reuse, and validation against the existing shared graph.
- `src/workbench.ts`: visible button, one history operation, power-off feedback, and a small manual-cable fix: a simple tool click cannot snap to a nearby entry underneath the tray; placing a cable draft requires a drag.
- `src/wiring-view.ts`: normal-view splice routes reuse the existing cavity routing to avoid mounted device faces. Ground-pigtail routes use the actual screw/splice anchors to choose a clear midpoint. Inspection routing and electrical identities remain unchanged.
- `tests/auto-wire.test.mjs`: electrical, grounding, cable-direction, identity, history, repair, trip-latch and atomic rejection cases.
- `tests/auto-wire.spec.ts`: actual mouse workflow, powered refusal, incomplete-layout refusal, single-step Undo/Redo, inspection persistence, connector movement, manual disconnection/repair, and sampled SVG paths that must not cross device faces.
- `docs/auto-wire/`: screenshots and this report.

## Verification

`npm run build`, all **100 model tests**, and the full **56 browser tests** passed. Existing circuit-validator, receptacle, lighting/fault, conductor routing, grounding, wire-nut, device movement and history regressions are included.

To try locally, check out the development branch, run `npm ci` and `npm run dev`, then open `http://localhost:5173/?view=cables`. Public preview deployment awaits approval; production and `main` are unchanged.
