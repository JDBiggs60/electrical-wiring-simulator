# Old Carpenter Electrical Wiring Simulator

A browser-based educational wiring workbench for Old Carpenter Workshop. Phase 1 teaches a single-pole switch controlling one light in a simplified U.S. 120 V branch circuit.

## Interactive hardware lesson

The default preview now uses the approved exploded hardware drawings as a working lesson. It reuses the Phase 2B editing workflow, shared circuit model and electrical validator. Main and enlarged views use the same assembly renderer, cable identities, physical ports and connection state. The original artwork study remains at `?view=study`; the earlier Phase 2B layout remains at `?view=lesson`; Phase 1 remains at `?view=trainer`.

All terminations, splices and bonds start disconnected. Grounding pigtails start in the parts tray and must be added explicitly. Select ends using the blue rings or named buttons; select one end and an electrical screw to attach it, or two to four free ends and **Join with connector** to splice. Mounting screws have no electrical interaction. Connector removal and disconnect controls reopen the actual circuit. Grounding status reports the path to the supply ground, not merely whether a screw is occupied.

Test the complete lesson:

1. Open the switch box and add both ground pigtails. Land supply black on brass A and outgoing black on brass B (the brass screws are interchangeable).
2. Join supply white and outgoing white. Separately join both bare grounds and both pigtail splice ends. Attach the device pigtail terminal end to the green device screw and the box pigtail terminal end to the green box screw.
3. Open the fixture box and add its fixture-ground and steel-box pigtails. Join incoming black to the black fixture lead splice end, and incoming white to the white fixture lead splice end, using separate connectors. Attach their terminal ends to brass hot and silver neutral.
4. Join incoming bare ground, fixture-ground splice end and box-bond splice end. Attach their terminal ends to the green fixture strap screw and green box screw respectively.
5. Return to the circuit, check wiring, turn test power on, then toggle the wall switch. The illustrated toggle changes position and the bulb lights only with valid wiring, power on and switch on.
6. Turn power off, remove a neutral connector or disconnect a box bond, and check again. Continuity must open and power must be refused. Reset removes all connections and returns ground pigtails to the tray.

Interaction uses selection and attachment rather than freehand dragging. State lasts for the current page session. Tests cover parts-tray identity, electrical faults and continuity, artwork consistency, actual SVG end/screw keyboard selection, connectors, bonds, reset, power, switch, lamp and mobile containment. Publication remains isolated to `/preview/`, with production artifacts preserved by the existing deployment checks; no merge to main is authorized.

## Undo, redo and guided grounding

Undo and Redo are beside the box connection controls and in the main installation controls. Ctrl+Z undoes; Ctrl+Y or Ctrl+Shift+Z redoes. One shared history follows you between boxes. Each successful wiring operation records one action, including terminal attachments, connector creation/removal, disconnecting selected ends and adding a pigtail. Selection, checks, invalid attempts and switch/power operation do not create history entries. New wiring after undo clears redo. Reset clears both history stacks; refreshing starts a new session. Turn test power off to use wiring history.

The grounding guide lists the bare cable conductors, explains the difference between each pigtail's splice end and terminal end, and identifies missing pigtails. Add both pigtails manually, select their splice ends along with the cable grounds, then join them. The virtual connector accepts two to four ends; the switch ground splice uses four and the fixture ground splice uses three. Complete the device and box bonds separately. The splice indicator checks actual connector membership; device and box indicators check continuity back to supply ground. No grounding connection is automatic.

## Phase 3A drag-and-snap prototype

Open `?view=workbench` on the separate preview. The default interactive wiring lesson and every earlier view remain available. This prototype stops at mechanical assembly: no cables, conductors or wiring controls have been added.

Drag the steel box from the small collapsible tray into the empty full-height bench. Move the box by dragging it. Drag a toggle switch from the tray toward the box's center; a green outline says **Release to mount**. Dropping there establishes a parent/child relationship with local mounting coordinates. The original SVG artwork is reused at uniform scales that align the mounting centers. Each component has its own unique identity. Drag either the box or mounted switch to move the assembled unit.

Undo/Redo treat each completed drag (including placement and snap together) as one action. They also restore Delete and Reset. Ctrl+Z and Ctrl+Y/Ctrl+Shift+Z work; Escape cancels an active drag. Delete removes the selected part; deleting a box removes its mounted child too. Clicking a part selects it without requiring a list. A new committed action clears Redo. All controls and drags support mouse and touch through Pointer Events; cancelled gestures restore the previous component model.

`workbench-model.ts` owns component identities, parent relationships, world positions, snap targets and scene history independently of SVG rendering. `workbench.ts` translates pointer coordinates into bench space and commits drops to that model. This establishes the interaction boundary for future endpoint and terminal snapping without changing the electrical engine. Components remain within the bench; work lasts for the page session. Automated tests exercise model parenting/history, real mouse drags, visible snap feedback, assembly movement, actual Chromium touch events and toolbar taps.

## Phase 3B cable installation

Phase 3B continues the actual published Phase 3A source from `codex/phase-3a-workbench`, commit `94ae2b86162c7c94b475269a5ee5e823fb2bccb2`. Open `?view=cables` on the separate preview. `?view=workbench` keeps the Phase 3A experience; the default wiring lesson and prior views are preserved.

1. Drag two steel boxes onto the bench. Each has an independent component ID. Switch mounting uses the existing drag-and-snap mechanism. Selecting a mounted switch or box exposes **Unmount switch**; it leaves the box and its cables intact.
2. Select **14/2 NM-B** in the tray, then drag from a highlighted free side-wall knockout on the first box to a free knockout on the second. The snap radius is 38 pixels. Release when **Release to install** appears. Alternatively drag the cable tray item to the first entry, then select the destination; click-first/click-second and keyboard Enter on entry points also work. No connection button is needed.
3. Move either box. Orthogonal routes with rounded stroke corners are recalculated around box footprints while endpoint IDs remain unchanged. An obstructed or clipped route displays a routing warning; attachments are retained. Each entry accepts one cable.
4. Use the small inspection icon on a box, or select it and choose **Inspect box**. Inspection renders its actual installed cables at the same side entries, with matching black/white/bare conductor IDs and loose disconnected ends. A mounted switch is pulled forward for visibility with no terminal wiring.
5. Click a cable to select it and see its ID, type and endpoint boxes. Delete removes that cable. Deleting a box removes its attached cables and mounted child together. Undo/Redo restore one completed placement, movement, mounting/unmounting, cable installation/removal, box deletion or Reset at a time. Escape or a background drop cancels an unfinished cable without creating an object. New committed actions clear Redo.

`cable-workbench-model.ts` extends the original component model with real installed cable objects and endpoint/conductor identities; `cable-inspection.ts` reads that model directly. Both conductor termination records remain null. This phase does not introduce electrical splicing, terminal editing, power or further lessons. Tests exercise actual mouse/touch input, multiple boxes/cables, matching inspections, stable attachments during movement, deletion/history, cancellation, keyboard pairing, and the unchanged earlier lessons.

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

The working lesson at `?view=lesson` preserves the Phase 2 residential circuit layout: incoming supply, single-gang switch box, visible NM cables, and octagonal ceiling fixture box. Both cables are selectable with mouse or keyboard. Their inspector lists unique black, white, and bare-ground conductor identities and the connection state at each box end.

The lesson starts with every accessible conductor termination disconnected and no connectors installed. Open either box, select one conductor end and click its actual electrical screw (or the corresponding terminal button), or select two to four free ends and choose **Join with connector**. Grounding pigtails have two separate ends: join the splice end to the bare equipment grounds and attach the terminal end to the device or steel-box screw. Fixture leads likewise have loose splice and terminal ends. **Disconnect selected ends** removes terminations or their entire connector; each connector also has a removal control. Closing and reopening boxes preserves the wiring. **Reset to unwired** clears both boxes.

`src/lesson-circuit.ts` owns the single circuit state used by the overview and both close-ups. Cable conductors are continuous copper spans between uniquely identified ends; jackets and visual crossings create no continuity. Cable ports preserve the same wall and normalized physical entry location in every view. `src/lesson-view.ts` renders and edits that state. Connector selection and capacity validation reuse the junction prototype's shared helper in `src/connectors.ts`; the working Phase 1 trainer and junction prototype remain available at `?view=trainer`.

Student attachments and connectors are converted to the existing physical conductor/splice model and checked by the existing circuit evaluator. Separate device grounds and steel-box bonds, switched hot, and neutral return are required. Incorrect connections remain visible so students can diagnose faults, but invalid or unfinished wiring cannot energize. Test power locks wiring edits; the wall switch changes actual hot continuity and lamp operation. The incoming supply boundary is upstream of this lesson; all terminations inside both student workspaces start loose.

Validation includes the original circuit, box-wiring and junction tests, eight additional model tests for unique identities, shared views, normalized cable entries, cross-box continuity, independent grounding bonds, removal/repair, faults and power guards, plus four new Chromium scenarios. The previous read-only diagram scenario now checks the unwired interactive lesson. There are 37 model tests and 21 browser scenarios, including the complete student wiring sequence, cable inspection, actual SVG end/terminal keyboard activation, persistence, fault correction, reset and mobile layout. Strict TypeScript checking and the production build are also required.

Publish only through the existing isolated `/preview/` workflow on `codex/training-board-preview`. Its production-artifact hash checks and main baseline guard remain unchanged. Do not merge into main or replace the public production website without the owner's approval.

## Hardware illustration approval prototype

The default `/preview/` page is now an original SVG hardware study for drawing approval. It shows one continuous single-pole installation: left-hand branch supply, a steel single-gang box, NM-B cable to an octagonal ceiling box, a toggle pulled forward, and a porcelain keyless holder lifted away. Both assemblies can be enlarged with their inspection buttons or keyboard-accessible regions on the drawing. All conductor ends and grounding pigtails are loose; no completed splices are shown. A loose twist-on connector is illustrated separately in each detail view.

`src/hardware-art.ts` contains the original component linework: recessed backs, formed box sidewalls, knockouts, keyed mounting holes, threaded mounting ears, cable locknuts and two-screw saddle clamps, NM jackets ending inside the boxes, the switch's moulded side body and steel yoke, two brass side terminals, a green yoke ground, and separate steel mounting screws. The ceiling holder exposes its rear brass hot and silver neutral screws. Its green equipment-ground screw belongs to the steel mounting strap, not the porcelain. Flat neutral face tones describe actual geometry; the drawings contain no photographs, textures, gradients or decorative shadows. The supplied image informs the exploded instructional presentation, not the circuit plan.

`src/installation-art.ts` renders the same assembly in the complete diagram and enlarged views. It reads the existing shared circuit model's cable identities, conductor ends, terminal identities, connection state, wall and normalized entry positions. Rendering changes no circuit state. `src/hardware-prototype.ts` is limited to opening and closing the drawings; it adds no lesson or wiring controls. The Phase 2B implementation remains accessible through **Open working Phase 2B lesson** (`?view=lesson`), and the Phase 1 trainer / junction prototype remains at `?view=trainer`. Circuit engines, validators and working interactions are unchanged.

Four additional browser scenarios cover hardware structure and terminal distinction, identical conductor/entry/state rendering at both scales, keyboard inspection and focus restoration, mobile overflow, and continued access to the working lesson. Existing Phase 2B browser scenarios only change their entry URL to `?view=lesson`; all previous behavior checks remain. Validation is 37 model tests, 25 Chromium scenarios, strict TypeScript checking and the production build.

Publish only to the existing `/preview/` site through the unchanged production-preserving branch workflow. Stop here for the owner's approval of the drawings; do not integrate a replacement interactive lesson, change the circuit engine or merge into main.

## Phase 3B cable drag repair

Open `/preview/?view=cables`. Drag two steel boxes onto the bench, click **14/2 NM-B**, then press a highlighted green knockout on the first box and drag to a green knockout on the other box. The temporary cable follows the pointer and **Release to install** confirms a valid destination. Release to snap it into the shared component model. Move either box to reroute the attached cable. Alternatively, drag the tray cable onto the bench; the loose draft can be picked up and dragged to the first knockout, followed by a click on the second. Escape cancels unfinished drafts without adding a history action.

The preview deployment now runs real Chromium mouse interactions against the published Pages URL, checks its revision, and saves a screenshot and JSON report. The same mouse workflow runs in local browser tests. Production preservation checks and the main branch guard remain in place.

## Duplex receptacle assembly

The cable workbench (`?view=cables`) includes an original white 15A, 125V NEMA 5-15R duplex receptacle illustration. Drag **Duplex Receptacle** to an empty steel box and release at the green mounting outline. A box holds one full-size device. Move the box to carry its device; select the device or its box and use **Unmount receptacle** to detach it, then drag it into another empty box. Delete removes a selected receptacle, and Undo/Redo preserve its identities and cable attachments.

The component stores five distinct disconnected terminal records and two intact break-off tabs referencing their matching terminal pairs. Rendering and box inspection use the same component ID. No automatic connections, tab removal, receptacle power or circuit-engine changes are included. Local model and mouse browser tests cover these operations; the post-deployment browser check also mounts and unmounts the receptacle on the published preview beside an installed cable.

## Phase 3D six-space subpanel

The existing cable workbench (`/preview/?view=cables`) adds **Breaker Panel** below the original parts. This advanced assembly is explicitly a subpanel: its neutral bar is isolated, its ground bar is factory bonded to the enclosure, and its simulated feed/bus stay behind an inaccessible protective cover. Six spaces show two installed 15A single-pole breakers and four blank covers. Basic switch/receptacle lessons remain available through **Wiring lesson**, using the existing simulated 120V supply without opening a panel.

Drag a panel and a box onto the bench, mount a receptacle in the box, then select NM-B and drag between highlighted panel and box entries. These use the same installed cable/conductor objects, free-entry rules, routing and history as box-to-box cables. Moving either enclosure reroutes the cable; deleting the panel removes its attached cables as one undoable action. Double-click the panel (or select **Inspect panel**) to see its actual loose black, white and bare conductors and disconnected branch terminals.

All components now expose a common terminal record with stable ID, owning component, local drawing coordinates, kind and disconnected termination. The workbench has an empty electrical-edge collection and a shared node projection containing device/panel terminals and conductor ends. Receptacle tabs retain their matching terminal IDs; switches gain distinct brass and ground terminal IDs. No connection gestures, splices, pigtails, tab removal, energizing or circuit-engine changes are implemented in this phase. Model and real mouse browser tests cover panel placement, panel-to-receptacle-box cabling, routing, inspection identity, deletion and Undo/Redo. The same panel workflow runs against the published preview after deployment.

## Phase 3E hands-on receptacle circuit

The existing `/preview/?view=cables` workspace now supports one protected 120V panel-to-duplex-receptacle circuit. Install the existing panel, steel box, receptacle and NM-B cable. Inspect the panel and drag black to a 15A breaker output, white to an isolated neutral bar terminal, and bare ground to the ground bar. Switch that branch breaker ON explicitly; upstream simulated service/feed points remain inaccessible.

Inspect the receptacle box and choose **Pull Device Out**. Drag black to either brass screw and white to either silver screw. Add one device-ground pigtail, one box-bond pigtail and a ground connector. Drag the cable bare conductor and both pigtails' splice ends into the connector; drag the other pigtail ends to the receptacle green terminal and the steel-box grounding screw respectively. Nothing is automatically connected. Drag the device body back onto the green mounting outline, turn simulated power ON, and choose **Check Wiring**. A correct circuit reports **Correctly wired · 120V**. The same device can also be pulled and dragged back into its owner box on the main bench without losing terminations.

The workbench's shared connection edges and actual conductor/terminal termination records drive all close-up and main drawings, ground-splice membership, and the new branch continuity evaluator. Actual cable copper, grounding pigtails and factory-intact receptacle tabs create continuity; neutral and equipment ground remain separate at the subpanel. Ground and steel-box bonds are independently required for a safe result. The tester distinguishes no power, open neutral, open ground, missing steel-box bond, reversed polarity, and a blocked short/unsafe connection. An open ground/bond may still show 120V hot-neutral while reporting the unsafe condition; a short or reversed polarity never reports a correct energized circuit.

Select an attached wire's copper end or wire path and choose **Disconnect** to correct it. Shared Undo/Redo and Ctrl+Z/Ctrl+Y/Ctrl+Shift+Z retain individual wiring actions across views. **Reset Wiring** clears student wiring and virtual power while retaining installed hardware and cables; its Undo restores the circuit. The main **Reset** still clears the entire assembly. All electricity is simulated. Existing switch/lighting lessons and assembly prototypes remain separate and unchanged; this phase adds no new switch or lighting circuit.

Validation includes 58 unit tests, 42 real Chromium browser scenarios, strict TypeScript checking and the production build. The new browser workflow installs and wires the complete circuit using mouse pointer events, tests both close-up and main device mounting, faults and repairs, pigtail/termination history, reset/undo, cable identities and box movement. The same workflow runs against the published preview after deployment, alongside the existing cable/panel checks and production-preservation guards.

If the original one-day Pages artifact has expired, preview packaging recovers only the production root files from a retained successful preview artifact. It requires the same pinned production commit/run, an exact production file set and matching hashes, then performs the existing live-site hash checks twice. Five fixture tests reject modified root bytes, wrong baseline metadata, extra production files and unsafe paths. Main is never rebuilt or deployed from a new baseline by this fallback.

## Phase 3E panel routing and wire-nut improvements

Panel conductors now follow rounded side gutters and a lower wiring trough, with separate lanes. The black conductor approaches its selected breaker output from the outer side; white and bare conductors reach their actual isolated-neutral and bonded-ground bar terminals. The same routing function serves the main installation and enlarged panel. This changes drawing geometry only; identities, terminations and continuity remain unchanged.

In a box containing two installed cables, drag one loose white copper end onto the other white end. The approaching end highlights. Release to group the stripped ends, then choose the small **Install wire nut** control beside the group. Grouping alone remains electrically open. The installed connector has its own ID, explicit member-end IDs, conductor type, capacity and enclosure-relative position. New wire nuts accept two or three matching 14 AWG conductors; hot, neutral and equipment-ground splices remain separate. Mixed hot-neutral and neutral-ground joins are rejected without changing the circuit. The existing four-conductor ground connector remains available for the original receptacle grounding workflow.

Drag an installed wire nut by its cap or **Drag** handle to reposition it inside the box; its member wires follow. Select it and choose **Remove wire nut** to open that splice. Undo/Redo (including Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z) cover grouping, installation, movement and removal as separate actions. Reopening a box or moving its enclosure preserves the connector and all conductor identities. **Pull Device Out** also works for a switch so its existing terminal connections can remain attached while splicing.

Validation: 65 unit tests and 43 Chromium browser scenarios, strict TypeScript and production build. The added mouse scenario installs a panel, switch box and receptacle box, rejects unsafe splice attempts, wires the panel, installs neutral/hot/three-ground wire nuts, adds a steel-box bonding pigtail, moves and reopens a connector, and demonstrates real 120V continuity followed by open-neutral detection and history restoration when its neutral connector is removed. Desktop panel and switch-box screenshots are inspected locally. The same mouse workflow is included in the published-preview verification. Public production files and main retain the existing pinned-baseline preservation checks.

## Clear switch and receptacle inspection workspaces

Box inspection now uses an enlarged orthographic steel-box projection on the left and a rear terminal projection of the existing device on the right. Both receptacle terminal sides are exposed together, so no flip menu is needed. Brass hot, silver neutral and green equipment-ground screws remain the existing circuit's individually selectable terminal IDs. Mounting screws are separate, and the single-pole switch explicitly has no neutral terminal. The main workbench retains its original hardware illustrations.

Loose grounding-pigtail ends and their bend points stay inside the steel box. Legacy connector positions are projected into the enclosure without changing any termination or circuit edge. Wire nuts retain their IDs and member sets; students drag their caps, with a small hover tooltip replacing permanent Drag labels. Individual attached ends remain accessible above target overlays for Disconnect. Connector movement uses the same shared history and selecting an unmoved connector does not consume an Undo action.

Device leads run through open space to exposed terminal lugs, with black leads approaching the outer brass side and white/ground leads approaching the exposed left side. Dragging a pulled device updates its terminal projection and connected wire endpoints live. Mounting it back into the box, closing/reopening inspection, and Undo/Redo retain the actual wiring. Inspection itself does not move or prewire a component in the circuit model. Panel geometry and electrical evaluation remain unchanged.

Validation: 67 unit tests, 45 Chromium browser scenarios, TypeScript and production build. Separate switch and receptacle mouse tests connect every terminal, bond the steel box and device, inspect actual pointer hit targets, sample wire paths to ensure they do not cross the device body, check for clipped ends/connectors, drag the device while verifying live wire following, disconnect/undo/redo, and reopen the same shared state. Desktop screenshots of both enlarged views are captured and visually inspected. These checks also run against the published preview and upload both screenshots with the release's browser evidence. Deployment retains the pinned main commit and production-file preservation guards.

### Expanded steel-box and ceiling-fixture workbench

The existing `?view=cables` preview now has straight-on drawn-steel single-, double-, and triple-gang boxes, an octagon ceiling box, and a porcelain keyless lampholder. Each device occupies a distinct model mounting slot; switches/receptacles fit rectangular device boxes and the lampholder fits the octagon only. Capacity checks, parent movement, cable entry positions, deletion and shared history apply to all sizes. Inspection projects every mounted device and the actual installed cable conductors from the same objects, with exposed terminal screws. Existing switch/receptacle front artwork and the breaker panel are preserved.

`src/lampholder-art.ts` adds front/rear porcelain hardware; `src/wiring-hardware-art.ts` supplies shared orthographic steel-box projections. The nonmetallic lampholder has hot and neutral screws, with equipment grounding on the steel box separately. These terminals accept the existing real conductor connections; lamp illumination is not implemented in this graphics/placement phase. Cable entry capacity remains the current two modeled side knockouts per enclosure. Multi-device grounding pigtails can be created individually, but complete multi-gang lesson validation and box-fill sizing are future work.

Try placing each rectangular box size, dropping switches and receptacles onto its mounting ears, then placing an octagon box and dropping the lampholder into it. Select NM-B and drag between green cable entries. Use the magnifier to inspect loose conductors and drag their ends to exposed screws. Move assemblies and try Undo/Redo, Unmount, Delete and Reset.
