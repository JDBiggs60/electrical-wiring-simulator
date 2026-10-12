# Drag-wire switch-controlled lighting: review evidence

Development branch: `codex/training-board-preview`. This change has not been deployed. The currently published `/preview/` continues to run the previous revision until preview deployment is approved.

The screenshots below come from real Chromium mouse interactions that placed the existing panel, steel switch box, single-pole switch, steel ceiling box and porcelain keyless lampholder, installed two actual NM-B cables, and connected their individual conductor ends and grounding pigtails. The test does not inject a demonstration circuit or prewired scene.

| State | Desktop | Phone inspection (390 × 844) |
|---|---|---|
| Breaker on, switch on, bulb illuminated | [Workbench](desktop-light-on.png), [fixture](desktop-fixture-on.png), [switch](desktop-switch-on.png) | [Fixture](phone-fixture-on.png), [switch](phone-switch-on.png) |
| Switch off, bulb dark | [Workbench](desktop-switch-off.png) | [Switch and circuit feedback](phone-switch-off.png) |
| Actual short, breaker tripped | [Workbench](desktop-breaker-tripped.png) | [Panel inspection](phone-breaker-tripped.png) |

## Implementation

- `src/branch-wiring.ts`: exports the existing copper/termination graph for reuse. Cable conductors, pigtails, actual connections, installed wire nuts, neutral/ground bars and receptacle tabs retain their identities. Switch contact edges are optional; existing receptacle evaluation retains its original behavior.
- `src/lighting-circuit.ts`: derives 120V lighting continuity and feedback from that graph, identifies the actual branch feed, models the switch contact, classifies open hot/neutral, missing grounds/box bonds, reversed lamp polarity, shorts and unsupported wiring. A bulb is a load, never a zero-resistance graph edge. Equipment ground cannot substitute for neutral.
- `src/workbench-model.ts`: stores switch position and breaker trip/reason. Wiring history preserves live operating state and latched trips in lighting assemblies.
- `src/workbench.ts` and `src/wiring-interaction.ts`: operate the actual switch and breaker in both views, synchronize power feedback, and require simulated power off before wiring edits, movement, Undo/Redo or repair.
- `src/lampholder-art.ts`, `src/wiring-hardware-art.ts`, `src/panel-art.ts`, `src/wiring-view.ts`: show the actual bulb state, switch position and visibly tripped breaker. The enlarged terminal view includes the same lamp's illumination state while keeping its hot/neutral screws accessible.
- `src/fault-events.ts` and `src/workbench.css`: reusable local short-event presentation, a restrained amber flash, optional brief click/pop tone, visible sound setting muted by default, and a static reduced-motion presentation.
- `src/grounding-guide.ts`: corrects the instruction wording for porcelain fixtures, which need a box bond but have no device ground screw.

Conductor routing, pigtail creation, drag-to-connect compatibility, connector membership and the original circuit validator are unchanged. No connection is created by switching power on, closing a switch, tripping or resetting a breaker.

## Behavior and limits

This initial lighting evaluator supports one panel, one mounted single-pole switch and one mounted keyless lampholder. Multiple feeds, bypassed switches, downstream neutral-ground bonds and other unsupported layouts receive an explicit explanation rather than an invented operating result. Receptacle inspection continues to use the existing receptacle evaluator.

A missing equipment ground or metal-box bond raises an unsafe warning; it is not treated as the normal current return. Like a real incandescent lamp, a reversed lamp connection can illuminate but remains unsafe because its screw shell can be live. Ordinary shorts and open neutrals never shatter the bulb.

A short trips only the actual supplying branch breaker, removes its power, and persists until the student turns master simulated power off, repairs the short, resets the breaker to OFF, and then switches it back on. Opening the wall switch alone cannot defeat the reset check; reset checks prospective closed-switch continuity too. Sound is optional and muted on initial load.

Full animated bulb destruction, cracking glass and falling fragments are **deferred**: no overvoltage or other electrically justified bulb-damage lesson is modeled in this assignment. No broken-bulb or replacement state is falsely triggered by a 120V short.

## Verification

`npm run build` passed. All 85 model tests and all 54 Playwright browser tests passed; targeted lighting checks were repeated after the final history/fault-presentation review.

New model cases cover actual wiring, switch and source operation, open hot/neutral, missing ground/box bonds, reversed polarity, hot-neutral and hot-ground fault classification, independent breaker-two tripping, latched reset behavior, repair, movement, Undo/Redo, and no bulb damage.

The desktop and phone browser workflows build and connect the real circuit through the UI, verify the shared bulb state in both views, reject powered conductor edits, disconnect/repair an open neutral, disconnect/repair a ground bond, create a short by attaching the white feed to the switch's load-side brass screw, verify the local fault event and reduced-motion presentation, test refused resets, repair the neutral splice, reset the breaker, and restore illumination. Existing receptacle, inspection-routing, pigtail, wire-nut, movement and history tests are included in the full regression suite.

Phone assembly placement is performed at desktop size, then the same shared assembly is inspected and operated at phone size. The existing workbench layout is not redesigned.

To review locally: `npm ci`, `npm run dev`, then open `http://localhost:5173/?view=cables`.
