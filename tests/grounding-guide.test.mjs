import test from 'node:test';import assert from 'node:assert/strict';
import {createWorkbench,addPart,mountSwitch,installCable,workbenchHistory}from '../src/cable-workbench-model.ts';
import {addPigtail,addConnector,connectEnd,disconnect,groupEnds}from '../src/branch-wiring.ts';
import {groundingState,groundingGuide}from '../src/grounding-guide.ts';
import {terminalDevice}from '../src/wiring-hardware-art.ts';import {keylessLampholder}from '../src/lampholder-art.ts';
test('ground progress follows actual splices and two independent bonds, including history',()=>{
 const s=createWorkbench(),a=addPart(s,'box',20,20),box=addPart(s,'box',400,20),b=addPart(s,'box',800,20),device=addPart(s,'switch',435,14);mountSwitch(s,device,box);
 installCable(s,{boxId:a.id,entryId:'right'},{boxId:box.id,entryId:'left'});installCable(s,{boxId:box.id,entryId:'right'},{boxId:b.id,entryId:'left'});
 const incoming='cable-1.bare.to',outgoing='cable-2.bare.from';assert.deepEqual(groundingState(s,box.id),{splice:false,device:false,box:false,deviceCount:1,bareCount:2});
 groupEnds(s,incoming,outgoing,300,300);assert.equal(groundingState(s,box.id).splice,false);
 addPigtail(s,box.id,'device');addPigtail(s,box.id,'box');addConnector(s,box.id);const [d,bond]=s.pigtails,nut=s.connectors[0];
 for(const id of [incoming,outgoing,d.ends[0].id,bond.ends[0].id])assert.equal(connectEnd(s,id,nut.id),null);
 assert.equal(groundingState(s,box.id).splice,true);assert.equal(groundingState(s,box.id).device,true);assert.equal(groundingState(s,box.id).box,true);
 disconnect(s,bond.ends[1].id);connectEnd(s,d.ends[1].id,device.id+'.ground');assert.equal(groundingState(s,box.id).device,true);assert.equal(groundingState(s,box.id).box,false);
 const h=workbenchHistory(s),before=structuredClone(s);connectEnd(s,bond.ends[1].id,box.id+'.box');h.record(before);assert.equal(groundingState(s,box.id).box,true);
 h.undo();assert.equal(groundingState(s,box.id).box,false);assert.equal(groundingState(s,box.id).device,true);h.redo();assert.equal(groundingState(s,box.id).box,true);
 const json=JSON.stringify(s);assert.match(groundingGuide(s,box.id),/data-ground-status="splice" data-complete="true"/);assert.equal(JSON.stringify(s),json);
 disconnect(s,nut.id);assert.equal(groundingState(s,box.id).splice,false);assert.equal(groundingState(s,box.id).device,false);assert.equal(groundingState(s,box.id).box,false);
});
test('inspection shows recognizable front faces and main lampholder bulb without changing model',()=>{
 const s=createWorkbench(),sw=addPart(s,'switch',0,0),r=addPart(s,'receptacle',200,0),light=addPart(s,'lampholder',400,0),before=JSON.stringify(s);
 for(const p of [sw,r]){const art=terminalDevice(p);assert.match(art,/data-inspection-projection="orthographic-front"/);assert.match(art,/data-inspection-face="front"/);for(const t of p.terminals)assert.ok(art.includes(`data-terminal-id="${t.id}"`));assert.doesNotMatch(art,/terminal-rear/);}
 assert.match(terminalDevice(sw),/TOGGLE/);assert.match(terminalDevice(r),/15A · 125V/);
 assert.match(keylessLampholder(light),/data-installed-bulb data-energized="false"/);assert.doesNotMatch(keylessLampholder(light,true),/data-installed-bulb/);assert.equal(JSON.stringify(s),before);
});
