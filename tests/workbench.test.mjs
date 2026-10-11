import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbench, addPart, mountSwitch, worldPosition, deletePart, snapTarget, mountOffset, workbenchHistory } from '../src/workbench-model.ts';

test('snapping establishes a unique parent and local mount offset; parent movement carries child', () => {
  const s = createWorkbench(), box = addPart(s,'box',350,150), toggle = addPart(s,'switch',400,160);
  assert.equal(snapTarget(s,toggle),box);
  assert.equal(mountSwitch(s,toggle,box),true);
  assert.equal(toggle.parentId,box.id); assert.equal(toggle.x,mountOffset.x);
  box.x += 100; box.y += 40;
  assert.deepEqual(worldPosition(s,toggle),{x:485,y:184});
  const second = addPart(s,'switch',400,160);
  assert.equal(mountSwitch(s,second,box),false);
  assert.equal(snapTarget(s,second),undefined);
  assert.equal(new Set(s.components.map(c => c.id)).size,3);
  deletePart(s,box.id); assert.deepEqual(s.components.map(c => c.id),[second.id]);
});

test('placement, mounting, movement, delete and reset remain individual undoable actions', () => {
  const s = createWorkbench(), h = workbenchHistory(s);
  const step = fn => { const before = structuredClone(s); fn(); h.record(before); };
  step(() => addPart(s,'box',300,100));
  step(() => mountSwitch(s,addPart(s,'switch',330,110),s.components[0]));
  step(() => { s.components[0].x += 70; });
  h.undo(); assert.equal(s.components[0].x,300); assert.equal(s.components[1].parentId,s.components[0].id);
  h.undo(); assert.equal(s.components.length,1);
  h.redo(); assert.equal(s.components.length,2);
  step(() => deletePart(s,s.components[1].id)); assert.equal(s.components.length,1); assert.equal(h.canRedo,false);
  h.undo(); assert.equal(s.components.length,2);
  step(() => { s.components = []; }); assert.equal(s.components.length,0);
  h.undo(); assert.equal(s.components.length,2);
  h.redo(); assert.equal(s.components.length,0);
});
