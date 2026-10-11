import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorkbench,addPart,mountSwitch,worldPosition,workbenchHistory,installCable,unmountDevice,deletePart} from '../src/cable-workbench-model.ts';
test('receptacle identities, single occupancy, movement, removal and history preserve cables',()=>{
 const s=createWorkbench(),a=addPart(s,'box',350,150),b=addPart(s,'box',850,150),r=addPart(s,'receptacle',385,144),toggle=addPart(s,'switch',385,144),h=workbenchHistory(s);
 assert.equal(r.receptacle.terminals.length,5);assert.equal(new Set(r.receptacle.terminals.map(t=>t.id)).size,5);assert.ok(r.receptacle.terminals.every(t=>t.termination===null));assert.ok(r.receptacle.tabs.every(t=>t.intact&&t.terminalIds.every(id=>r.receptacle.terminals.some(term=>term.id===id))));
 assert.equal(mountSwitch(s,r,a),true);assert.equal(mountSwitch(s,toggle,a),false);installCable(s,{boxId:a.id,entryId:'right'},{boxId:b.id,entryId:'left'});a.x+=40;assert.equal(worldPosition(s,r).x,a.x+35);
 const before=structuredClone(s);unmountDevice(s,r);h.record(before);assert.equal(r.parentId,null);h.undo();assert.equal(s.components.find(p=>p.id===r.id).parentId,a.id);h.redo();assert.equal(mountSwitch(s,s.components.find(p=>p.id===r.id),b),true);deletePart(s,r.id);assert.equal(s.cables.length,1);
});
