import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbench, addPart, installCable, entryPosition, inspectBox, deletePart, cableRoute, workbenchHistory, entryFree, unmountSwitch, mountSwitch } from '../src/cable-workbench-model.ts';
function scene() { const s=createWorkbench();addPart(s,'box',320,170);addPart(s,'box',820,300);return s; }
test('cable endpoints and all copper identities survive both box movements and inspection projections',()=>{
  const s=scene();assert.equal(installCable(s,{boxId:'part-1',entryId:'right'},{boxId:'part-2',entryId:'left'}),null);
  const c=s.cables[0], original=structuredClone(c), route=cableRoute(s,c).path;
  assert.equal(inspectBox(s,'part-1')[0].cable,c);assert.equal(inspectBox(s,'part-2')[0].conductors,c.conductors);
  assert.equal(c.conductors.length,3);assert.equal(new Set(c.conductors.flatMap(c=>[c.id,...c.ends.map(e=>e.id)])).size,9);
  assert.ok(c.conductors.every(c=>c.ends.every(e=>e.termination===null)));
  s.components[0].x+=85;s.components[1].y+=90;
  assert.deepEqual(c,original);assert.notEqual(cableRoute(s,c).path,route);
  assert.deepEqual(cableRoute(s,c).points[0],entryPosition(s,c.from));
  assert.deepEqual(cableRoute(s,c).points.at(-1),entryPosition(s,c.to));
  assert.equal(installCable(s,{boxId:'part-1',entryId:'left'},{boxId:'part-2',entryId:'right'}),null);
  assert.equal(inspectBox(s,'part-1').length,2);assert.equal(inspectBox(s,'part-2').length,2);
  assert.ok(installCable(s,c.from,{boxId:'part-2',entryId:'right'}));
});
test('box and cable deletion, reset and switch unmount are single identity-preserving history actions',()=>{
  const s=scene(),h=workbenchHistory(s);
  const step=fn=>{const before=structuredClone(s);fn();h.record(before);};
  step(()=>installCable(s,{boxId:'part-1',entryId:'right'},{boxId:'part-2',entryId:'left'}));
  const before=structuredClone(s);
  step(()=>deletePart(s,'part-1'));assert.equal(s.cables.length,0);assert.equal(s.components.length,1);
  h.undo();assert.deepEqual(s,before);h.redo();assert.equal(s.cables.length,0);h.undo();
  step(()=>deletePart(s,'cable-1'));assert.equal(entryFree(s,{boxId:'part-1',entryId:'right'}),true);
  h.undo();assert.deepEqual(s,before);
  step(()=>{s.components=[];s.cables=[];});h.undo();assert.deepEqual(s,before);
  const sw=addPart(s,'switch',355,164);mountSwitch(s,sw,s.components[0]);
  step(()=>unmountSwitch(s,sw));assert.equal(sw.parentId,null);h.undo();assert.equal(s.components.at(-1).parentId,'part-1');
});
test('invalid endpoints cannot create phantom connections; obstructed routing retains both entries',()=>{
  const s=scene();assert.ok(installCable(s,{boxId:'missing',entryId:'left'},{boxId:'part-2',entryId:'left'}));
  assert.ok(installCable(s,{boxId:'part-1',entryId:'left'},{boxId:'part-1',entryId:'right'}));assert.equal(s.cables.length,0);
  installCable(s,{boxId:'part-1',entryId:'right'},{boxId:'part-2',entryId:'left'});
  s.components[1].x=s.components[0].x;s.components[1].y=s.components[0].y;
  const c=structuredClone(s.cables[0]);cableRoute(s,s.cables[0]);assert.deepEqual(s.cables[0],c);
});
