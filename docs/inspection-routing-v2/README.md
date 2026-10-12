# Cable-workbench inspection routing repair

Only `?view=cables`, on `codex/training-board-preview`. No merge or deployment. The default lesson renderer, circuit validators, breaker panel, power behavior, normal workbench layout, receptacle and multi-gang inspection layouts are preserved.

## Root cause

The box used a translated 1.9× projection, while the inspected device used an unrelated fixed position at x=690 and a 1.35× scale. That stretched terminations across a large exploded gap. The earlier repair only shortened device-bound detours; cable-to-wire-nut and pigtail routing did not consistently account for a device face as an obstacle. Its regression test explicitly exempted device-bound wires from cavity containment.

Loose-end positions were individually projected into the cavity, causing several ends to converge onto the same hit area. Compatible targets could take precedence over an incompatible loose end directly under the pointer. When the device was centered over the box, the mounting-target overlay also intercepted device dragging. Finally, wire-nut dragging used a legacy rectangular model clamp, which could differ from the displayed cavity position; octagonal corner clearance also needed to include the full cap's width, height and stroke.

## Repair

- Derive the switch or lampholder inspection position from its box center and a single inspection coordinate frame. Physical components and circuit anchors retain their IDs and stored coordinates.
- Build face obstacles from the actual device artwork and projected scale. A visibility graph chooses short paths within the convex cavity; controlled clearance lanes and small rounded corners replace fixed Bézier overshoots. Device-bound wires receive the same containment checks as every other stationary conductor.
- Reserve clear space for caps, electrical screws and loose ends. Copper tips remain separate and draggable. The porcelain socket stays clear; short terminal approaches use the exposed rear-terminal area.
- Recompute terminal anchors, faces, connector projections and routes during device or cap dragging. Device travel cannot cover cable breakout points. The mount outline no longer consumes device hits.
- Store a compact inspection cap's constrained position without applying a conflicting legacy clamp. Shared normal-view connector targets use the same projection. All electrical membership remains unchanged.

No conductors are removed, replaced by decoration, or automatically attached. No power simulation or validation changes were added.

## Screenshot arrangements

The switch has two NM cables, both black ends attached to the two brass screws, white conductors in a neutral nut, both bare conductors in a ground nut, a device grounding pigtail and a separate steel-box bond pigtail. The ceiling has an incoming NM cable with black and white attached to the actual lampholder screws; its bare ground and steel-box pigtail share a ground nut. The porcelain body has no ground terminal.

| Inspection | Previous repair | Corrected close-up |
| --- | --- | --- |
| Switch | [Before](switch-before.png) | [Corrected](switch-corrected.png) |
| Ceiling lampholder | [Before](ceiling-before.png) | [Corrected](ceiling-corrected.png) |

## Validation

Production build; 76 model tests; seven focused Chromium checks across the final runs. New connected-arrangement model tests sample every route segment, verify actual terminal projections, and assert rendering does not mutate conductor IDs, terminations or state. Strengthened browser tests sample SVG paths for cavity escapes, face intersections, excessive detours and incorrect endpoints. They exercise loose-end reconnection, wire-nut movement, Undo/Redo, shared workbench state, box movement and reopening both inspections. Existing checks verify live device movement, independent ground bonds, receptacle preservation, ceiling/multi-gang assembly behavior and the panel.

Remaining limitation: short approaches to exposed lampholder screws cross the peripheral rear plate. Shared splice entries may still converge at the nut. The model has no stored conductor-length field; the repair changes the drawing path only and retains every conductor and endpoint. No oversized or escaped stationary routes appeared in the tested connected arrangements.
