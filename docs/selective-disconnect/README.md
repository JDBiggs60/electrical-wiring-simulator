# Selective wire disconnection — development review

Development branch: `codex/training-board-preview`. **Not deployed.** The live preview remains on the previously approved Auto Wire release until this correction is approved for publishing.

Click a connected conductor path or its endpoint to highlight that specific end. The existing Disconnect control now shows **Disconnect Selected Wire**. The main workbench uses the same shared operation; its Inspect box button opens the selected end's enclosure for manual reconnection. A **Select conductor** picker lists real end IDs and their targets so overlapping paths and wire-nut members can be selected unambiguously. Keyboard selection and Delete/Backspace also use the selective operation.

The operation removes the selected `fromId` connection directly from the current shared model. It does not rewind the history of earlier connections. Other connection IDs, pigtails, grounding-screw attachments, boxes, devices and connector positions remain unchanged. A wire nut with at least two remaining members stays in place with those members connected. If fewer than two members remain, the invalid nut is removed and its remaining member is released, as required. All conductor IDs remain present and loose ends can be dragged through the existing inspection controls.

Each successful selective disconnection records one shared Undo snapshot. Undo restores the previous connection and any removed cap/membership; Redo repeats only that operation. Selection itself does not create history entries. Power must be OFF for electrical edits and Undo/Redo; selection remains available while powered. Circuit feedback immediately reflects changed hot/neutral/ground continuity.

The inspection button reserves its layout space when hidden, so selecting or attaching an end cannot move the drawing during a drag. Selecting a whole wire nut does not guess which conductor to detach; the separate existing **Remove wire nut** control remains available for deliberate whole-splice removal.

## Files changed

- `src/branch-wiring.ts`: `disconnectSelectedWire` extends the existing low-level disconnection operation, with end-specific selection, power-off refusal and invalid-splice cleanup.
- `src/wiring-interaction.ts`: existing inspection selection, drag behavior, Disconnect control, overlap picker, keyboard shortcuts and power guard.
- `src/workbench.ts`: selection of actual conductor paths, the main Disconnect Selected Wire control, endpoint picker and shared history/validation refresh.
- `src/wiring-view.ts`: selected-path highlighting, accessible selection metadata and main-view conductor hit paths; routes and conductor identities remain intact.
- `src/workbench.css`: compact styling for the new endpoint pickers.
- `scripts/receptacle-wiring-browser-check.mjs` and `scripts/wire-nut-browser-check.mjs`: existing repair regressions now explicitly turn power off before electrical edits, then test the repaired circuit.
- `tests/selective-disconnect.test.mjs` and `tests/selective-disconnect.spec.ts`: model and desktop/phone interaction regressions.

## Verification

Build passed. **104 model tests** and the full **58 browser tests** passed. The two selective-disconnection browser tests were also repeated after the final powered wire-nut selection review.

New cases verify five real connections, direct selection/disconnection of the second connection while retaining connections three through five, exact model/edge restoration with Undo/Redo, manual reconnection, actual path clicks in both views, unambiguous end selection, three-to-two wire-nut membership, two-to-one cap removal/release, unaffected grounding screws and unrelated neutral connections, powered refusal, immediate open-neutral/open-ground feedback, and inspection persistence. The full suite includes existing Auto Wire, breaker/lighting faults, grounding, circuit validators, routing, mounting, movement, wire-nut and history checks.

## Rendered selection

- [Main workbench selection](main-selected.png)
- [Desktop inspection selection](desktop-inspection-selected.png)
- [Phone inspection selection](phone-inspection-selected.png)

These screenshots show selection of the second conductor connection in the real five-connection browser arrangement. They do not inject a decorative circuit.

To try this development revision locally: `npm ci`, `npm run dev`, then open `http://localhost:5173/?view=cables`.
