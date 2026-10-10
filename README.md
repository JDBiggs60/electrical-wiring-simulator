# Old Carpenter Electrical Wiring Simulator

A browser-based educational wiring workbench for Old Carpenter Workshop. Phase 1 teaches a single-pole switch controlling one light in a simplified U.S. 120 V branch circuit.

## Run locally

Requires Node.js 24 or newer and npm. No backend, database, account, API key, or external font service is needed.

```sh
npm ci
npm run dev
```

Vite reports the development server address. To build and serve the production version:

```sh
npm run build
npm run preview
```

In the prepared cloud workspace, run these commands from `/workspace/electrical-wiring-simulator` and add `--cache /workspace/.npm-cache` to `npm ci` if the default home cache is unavailable.

## Try Lesson 1

1. Keep power **off**. Select **Hot wire** (black).
2. Click Breaker 1’s hot output and brass terminal **A** on the switch.
3. Connect brass terminal **B** to the light’s **HOT** connection. The two brass screws are interchangeable.
4. Select **Neutral wire** (white). Connect the panel **NEUTRAL** bar directly to light **NEUTRAL**.
5. Select **Ground wire** (green). Connect the panel **GROUND** bar to the switch’s green ground screw and to light **GROUND**. A continuous shared ground path through both devices also works.
6. Click **Check my wiring**, then **Turn power on**. Toggle the switch: the light lights only when the power and switch are both on.

Click two terminals or drag between them to create a wire. Drag device labels to move the switch or light; wires remain attached. Remove a connection with its **×** button, or click a wire and press **Delete**. **Escape** cancels a selection. **Reset** turns power off, clears wires, and restores the bench. **Hint** cycles through five guidance steps. Terminals and the switch also support keyboard focus with Enter or Space. On small screens, the board scrolls horizontally within its panel.

Power cannot turn on unless the entire lesson circuit is correct. Changing wires while powered is blocked. To test incorrect feedback, connect Breaker 1 straight to light HOT, omit a ground, use Breaker 2, or connect ground to light NEUTRAL. Each must keep power off and explain the issue.

## Training board presentation

The local redesign uses a framed plywood trainer with a steel load-center cutaway, a metal-box single-pole switch, and a porcelain-style light holder. Black hot, white neutral, and green grounding wires follow separate instructional routing lanes; crossings are not electrical joints. The switch A/B line/load labels describe this lesson’s routing, not polarized switch terminals—either brass screw can receive line.

The parts palette shows the mounted Phase 1 devices plus inactive future three-way switch, duplex receptacle, junction box, and splice connector items. Future items do not add devices or change the lesson’s circuit model.

## Electrical model and scope

- Six breaker spaces: two installed single-pole 15 A breakers and four spare spaces. Breaker 1 is the lesson source; Breaker 2 remains off and is reserved for later lessons.
- The switch has two brass current-carrying screws and one green grounding screw. Top and bottom mounting screws are not wiring terminals.
- The fixture has exactly one labeled hot, neutral, and grounding connection.
- Hot runs through the switch; neutral goes directly to the light. Ground bonds both devices and never substitutes for neutral.
- Validation checks connectivity with the switch open and closed, so even a fault hidden behind an open switch prevents energizing. A bypassed switch, wrong conductor colors, cross-connected hot/neutral/ground, missing required paths, and use of Breaker 2 are rejected.
- This models only a branch circuit. The upstream supply and service bonding are omitted; the displayed neutral and ground bars stay separate. It does not simulate voltage drops, current, conductor sizing, overload timing, arc faults, GFCI protection, or local code requirements. Wiring joins at terminals only; visual wire crossings are not connections. Ground connections represent simplified bonding paths, not instructions for stacking conductors under real screws.

This is an educational simulation, not an installation design or a guide to working on live wiring. Component illustrations are scalable SVG. No reference images were supplied with the written brief; the visuals use its workshop style description, not photo matching.

## Tests

```sh
npm test          # 12 circuit-rule tests using Node's built-in runner
npm run build    # strict TypeScript check + production bundle
npx playwright install chromium
npm run test:e2e # browser interactions, successful/incorrect wiring, dragging, keyboard, mobile
```

In this cloud machine, Chromium is already installed; use:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Browser tests launch their own Vite server on port 5173 (or reuse a local one outside CI). No tests require a live electrical circuit or external services.

## Publish with GitHub Pages

The app is static, with relative asset paths so it can run under a repository subpath. The included `.github/workflows/pages.yml` runs the tests and build, then deploys `dist/`.

1. Commit and push these project files to `JDBiggs60/electrical-wiring-simulator` on `main`.
2. In **that repository only**, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Run **Test and deploy GitHub Pages** from Actions, or push a subsequent commit to `main`.
4. Use the published URL shown by the deployment job once it succeeds.

Adding the workflow does not itself publish a site. GitHub Pages deployment has not been executed from the cloud setup session.

## Project structure

- `src/main.ts`: workshop SVG graphics, controls, wire gestures, and lesson feedback.
- `src/circuit.ts`: independent circuit graph and electrical validation.
- `src/style.css`: workshop theme, responsive panels, and focus styles.
- `tests/circuit.test.mjs`: valid circuits and fault cases.
- `tests/lesson.spec.ts`: real Chromium interaction checks.

Only Phase 1 is implemented. Additional loads, receptacles, multiple lights, and advanced lessons are intentionally outside this version.

## Isolated design preview branch

`codex/training-board-preview` hosts the redesigned trainer at `/preview/`. Its branch-only Pages workflow retains the exact original production artifact at the site root and verifies each public file against the live site by SHA-256 before packaging. It refuses publication if main moves beyond the baseline commit or production files differ. A branch push tests and prepares an artifact; only a manual workflow dispatch can deploy it, after the branch is explicitly permitted in the `github-pages` environment.

This workflow and `scripts/prepare-preview.mjs` are preview infrastructure, not intended to replace main’s production workflow in a future design pull request. The preview is temporary: a future production deployment from main replaces the site and removes `/preview/`.

## Box-and-cable accuracy preview

The Phase 1 terminal exercise and its evaluator remain intact. **Load NM cable example** adds an optional complete reference circuit with two 14/2 NM-B cable assemblies. Each jacket contains independent black, white and bare-ground conductor spans. It does not itself connect anything. **Terminal wiring** restores the learner's original exercise; **Reset** clears both modes.

**Inspect switch box** and **Inspect fixture box** show steel boxes, sheath terminations and cable clamps. The switch has two brass wiring screws and one green grounding screw on its steel yoke. Its silver mounting screws are non-interactive mechanical fasteners. White neutral passes through the switch box in a splice; the two black conductors attach directly to the switch, with no unnecessary hot pigtail. Ground splices have separate green pigtails for each steel box and its device. The fixture cutaway lifts the holder to show black, white and green fixture leads and their connectors.

`src/box-wiring.ts` models conductor ends, enabled conductor spans, connector membership and metal-box bonds. It reduces actual continuity to the existing device-terminal graph and delegates circuit validation to `src/circuit.ts`, adding physical faults and missing metal-box bonds. Opening a connector or disconnecting a conductor changes continuity; repair restores it. Power must be off to edit. Inspections show conductor routing schematically; the example is not a cable length, box-fill, connector-capacity or installation specification, and is not a free-placement cable editor.

Three-way and duplex lessons remain inactive. The future palette distinguishes a dark common screw / two brass travelers / green ground for a generic three-way and brass hot / silver neutral / green ground for a generic receptacle. Placement is illustrative, not a verified drawing of a specific product. Before activating a three-way lesson, select a device and verify its common identification, traveler positions and grounding screw from that manufacturer's instructions. The cloud environment currently blocks outbound access to the manufacturer website, so no product-specific layout is claimed as verified.

Tests retain all 12 original circuit checks and five original browser scenarios. Eight physical cable/splice tests and four browser scenarios cover continuity loss, restored splices, box bonds, mixed-purpose faults, preserved terminal wiring, power editing guards, keyboard use and mobile inspection.

## Interactive junction-box prototype

Click the steel **JUNCTION BOX** on the board or the toolbox's **Junction box** button. A near-full-screen workspace opens with two NM-B cable sheaths, six separately identified conductor ends, steel knockouts, clamps and an independent box-bonding screw. Select ends on the drawing or through the labeled end buttons. **Join with connector** creates a new electrical splice from the selection. Wrong-purpose splices are allowed so the checker can explain the fault; **Remove** frees those ends for correction. One end can belong to only one connector. The prototype connector accepts two to four ends; this is an interaction limit, not a manufacturer's conductor-capacity specification.

Join A black to B black, A white to B white, and the two bare grounds together with the free end of an added green grounding pigtail. Attach the pigtail's other end at the green steel-box screw. These are two independent electrical attachments: joining the splice end does not automatically bond the box, and attaching the box end does not automatically connect it to equipment ground. Removing a connector opens that net. Removing the pigtail removes the box bond while preserving any remaining bare-ground splice.

**Check junction wiring** reports open hot/neutral/ground paths, mixed conductor purposes, hot-to-neutral faults, hot-to-ground faults and a missing steel-box bond. **Turn test power on** is permitted only with valid wiring. **Toggle test switch** then operates the downstream test light. Test power must be off before edits. This prototype has a fixed external single-pole switch/fixture test loop and separate state from the original learner-created Phase 1 circuit; it does not replace that exercise or alter its power and wiring state.

`src/junction.ts` owns conductor identities and learner-created connector membership, projects those joins into the existing `BoxWiring` graph, and reuses its continuity adapter and the original circuit evaluator. SVG position and wire crossings have no electrical effect. `src/junction-view.ts` renders and controls the close-up workspace. Connections and the test state persist in memory when closing and reopening the box, including closing with Escape. Browser reload starts a new prototype session.

The current suite has 29 unit tests and 14 Chromium scenarios, preserving every earlier test. New checks cover correct splices, removal and repair, all black/white and black/ground combinations, both pigtail ends, separate box bonding, duplicate conductor membership, mouse wiring, keyboard input, view persistence, preservation of the Phase 1 exercise, test-power guards and mobile layout. Three-way lessons, arbitrary device placement and full installation design remain outside this prototype. Publish only through the established isolated preview workflow; do not merge its deployment infrastructure into main.

## Phase 2B — student wiring

The default preview preserves the Phase 2 residential circuit layout: incoming supply, single-gang switch box, visible NM cables, and octagonal ceiling fixture box. Both cables are selectable with mouse or keyboard. Their inspector lists unique black, white, and bare-ground conductor identities and the connection state at each box end.

The lesson starts with every accessible conductor termination disconnected and no connectors installed. Open either box, select one conductor end and click its actual electrical screw (or the corresponding terminal button), or select two to four free ends and choose **Join with connector**. Grounding pigtails have two separate ends: join the splice end to the bare equipment grounds and attach the terminal end to the device or steel-box screw. Fixture leads likewise have loose splice and terminal ends. **Disconnect selected ends** removes terminations or their entire connector; each connector also has a removal control. Closing and reopening boxes preserves the wiring. **Reset to unwired** clears both boxes.

`src/lesson-circuit.ts` owns the single circuit state used by the overview and both close-ups. Cable conductors are continuous copper spans between uniquely identified ends; jackets and visual crossings create no continuity. Cable ports preserve the same wall and normalized physical entry location in every view. `src/lesson-view.ts` renders and edits that state. Connector selection and capacity validation reuse the junction prototype's shared helper in `src/connectors.ts`; the working Phase 1 trainer and junction prototype remain available at `?view=trainer`.

Student attachments and connectors are converted to the existing physical conductor/splice model and checked by the existing circuit evaluator. Separate device grounds and steel-box bonds, switched hot, and neutral return are required. Incorrect connections remain visible so students can diagnose faults, but invalid or unfinished wiring cannot energize. Test power locks wiring edits; the wall switch changes actual hot continuity and lamp operation. The incoming supply boundary is upstream of this lesson; all terminations inside both student workspaces start loose.

Validation includes the original circuit, box-wiring and junction tests, eight additional model tests for unique identities, shared views, normalized cable entries, cross-box continuity, independent grounding bonds, removal/repair, faults and power guards, plus four new Chromium scenarios. The previous read-only diagram scenario now checks the unwired interactive lesson. There are 37 model tests and 21 browser scenarios, including the complete student wiring sequence, cable inspection, actual SVG end/terminal keyboard activation, persistence, fault correction, reset and mobile layout. Strict TypeScript checking and the production build are also required.

Publish only through the existing isolated `/preview/` workflow on `codex/training-board-preview`. Its production-artifact hash checks and main baseline guard remain unchanged. Do not merge into main or replace the public production website without the owner's approval.
