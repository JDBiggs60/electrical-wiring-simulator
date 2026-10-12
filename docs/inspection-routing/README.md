# Inspection wire-routing repair

Branch: `codex/training-board-preview`. No production deployment or merge.

The switch and porcelain ceiling fixture screenshots use the same manually connected assemblies before and after the rendering repair. The switch has incoming/outgoing NM conductors, a neutral wire nut, a grounding wire nut, and separate device and steel-box grounding pigtails. The ceiling fixture has manually connected hot/neutral screws and a grounding wire nut with a separate steel-box pigtail. The porcelain body has no equipment-ground terminal.

| Inspection | Before | After |
| --- | --- | --- |
| Single-pole switch | [Before](switch-inspection-before.png) | [After](switch-inspection-after.png) |
| Ceiling lampholder | [Before](lampholder-inspection-before.png) | [After](lampholder-inspection-after.png) |

Changes are limited to wire geometry and connector position projection. Cable origins still come from actual installed entries; all conductor ends and IDs remain interactive. Device leads use short rounded detours around the switch face or rear socket instead of circling the entire device. Internal wires stay within the rectangular or octagonal cavity, and wire-nut dragging uses the same cavity projection as rendering. Both ends of each pigtail share a route derived from their real positions, replacing the unrelated fixed bend point. The main view shares connector and pigtail projections with inspection.

No changes to validators, termination records, connector membership, cable lengths, grounding requirements, or automatic electrical connections.

Validation: production build, 74 model tests, and six focused Chromium tests. Separate switch and lampholder regressions sample conductor paths and cap bounds; verify loose-end attachment, reconnecting, wire-nut dragging, undo/redo, ground indicators, moving boxes, and reopening inspections. Existing switch/receptacle tests also verify live device dragging and retained wire endpoints; hardware tests cover ceiling assembly movement; wire-nut tests verify actual continuity and open-neutral undo/redo.

Remaining visual limits: terminal leads bridge the existing exploded box/device separation, and the ceiling hot lead approaches an exposed rear screw along the porcelain plate. Small crossings can remain near common cable entries or splices; these do not create electrical connections. A user can still place connectors close together. No excessive loops or escaped internal conductors/caps appeared in the tested layouts.
