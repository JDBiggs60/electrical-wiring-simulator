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
