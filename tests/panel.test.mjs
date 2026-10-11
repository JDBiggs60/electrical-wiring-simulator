import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorkbench,addPart,installCable,entryPosition,inspectBox,cableRoute,deletePart,workbenchHistory,electricalNodes,mountSwitch} from '../src/cable-workbench-model.ts';

test('six-space isolated subpanel and devices share disconnected terminal and conductor nodes',()=>{
 const s=createWorkbench(),p=addPart(s,'panel',400,100),b=addPart(s,'box',1000,200),r=addPart(s,'receptacle',1035,194),toggle=addPart(s,'switch',0,0);
 assert.equal(p.panel.designation,'subpanel');assert.equal(p.panel.neutralIsolated,true);assert.equal(p.panel.groundBarBondedToEnclosure,true);assert.equal(p.panel.source.accessible,false);assert.equal(p.panel.spaces.length,6);assert.equal(p.panel.spaces.filter(s=>s.breaker===null).length,4);assert.ok(p.panel.spaces.filter(s=>s.breaker).every(s=>s.breaker.amps===15&&s.breaker.poles===1));
 assert.equal(p.terminals.length,14);assert.equal(toggle.terminals.length,3);assert.equal(r.terminals.length,5);assert.equal(mountSwitch(s,p,b),false);assert.equal(mountSwitch(s,r,b),true);
 assert.equal(installCable(s,{boxId:p.id,entryId:'right'},{boxId:b.id,entryId:'left'}),null);
 const nodes=electricalNodes(s);assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);assert.ok(nodes.every(n=>n.termination===null));assert.deepEqual(s.connections,[]);assert.equal(nodes.filter(n=>n.nodeType==='conductor-end').length,6);
 assert.equal(inspectBox(s,p.id)[0].cable,s.cables[0]);assert.equal(inspectBox(s,p.id)[0].conductors,inspectBox(s,b.id)[0].conductors);
});
test('panel entry routes follow both enclosures; deletion and undo restore the exact loose copper',()=>{
 const s=createWorkbench(),p=addPart(s,'panel',400,100),b=addPart(s,'box',1000,200),h=workbenchHistory(s);installCable(s,{boxId:p.id,entryId:'right'},{boxId:b.id,entryId:'left'});
 const copper=structuredClone(s.cables[0].conductors),route=cableRoute(s,s.cables[0]).path,before=structuredClone(s);p.x+=70;p.y+=20;h.record(before);assert.notEqual(cableRoute(s,s.cables[0]).path,route);assert.deepEqual(entryPosition(s,s.cables[0].from),{x:730,y:395,side:1});h.undo();assert.equal(cableRoute(s,s.cables[0]).path,route);h.redo();assert.deepEqual(s.cables[0].conductors,copper);
 const moved=structuredClone(s);deletePart(s,p.id);h.record(moved);assert.equal(s.cables.length,0);h.undo();assert.deepEqual(s.cables[0].conductors,copper);h.redo();assert.equal(s.cables.length,0);
 assert.notEqual(installCable(s,{boxId:b.id,entryId:'right'},{boxId:'missing',entryId:'left'}),null);
});
