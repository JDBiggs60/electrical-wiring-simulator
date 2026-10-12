import {test} from 'node:test';import assert from 'node:assert/strict';
import {createWorkbench,addPart,mountSwitch,workbenchHistory}from '../src/cable-workbench-model.ts';
import {addPigtail,connectEnd}from '../src/branch-wiring.ts';
import {wiringLayout}from '../src/wiring-view.ts';
for(const kind of ['switch','receptacle'])test(`${kind}: pigtail creation anchors only the correct screw end and history restores its edge`,()=>{
 const s=createWorkbench(),b=addPart(s,'box',400,100),d=addPart(s,kind,435,94);mountSwitch(s,d,b);const h=workbenchHistory(s);
 for(const role of ['device','box']){
  const before=structuredClone(s);assert.equal(addPigtail(s,b.id,role),null);h.record(before);const t=s.pigtails.at(-1),target=role==='device'?`${d.id}.ground`:`${b.id}.box`;
  assert.equal(t.ends[0].termination,null);assert.equal(t.ends[1].termination,target);assert.ok(s.connections.some(c=>c.fromId===t.ends[1].id&&c.toId===target));
  const l=wiringLayout(s,b.id),m=wiringLayout(s,b.id,{x:l.d.x-8,y:l.d.y+12});assert.deepEqual(m.ends.get(t.ends[1].id),m.targets.get(target));
  h.undo();assert.ok(!s.pigtails.some(p=>p.id===t.id));assert.ok(!s.connections.some(c=>c.fromId===t.ends[1].id));h.redo();assert.ok(s.connections.some(c=>c.fromId===t.ends[1].id&&c.toId===target));
 }
});
test('missing devices and occupied grounding screws reject pigtail creation without changing state',()=>{
 const s=createWorkbench(),b=addPart(s,'box',400,100);let before=JSON.stringify(s);assert.ok(addPigtail(s,b.id,'device'));assert.equal(JSON.stringify(s),before);
 const d=addPart(s,'switch',435,94);mountSwitch(s,d,b);addPigtail(s,b.id,'box');connectEnd(s,s.pigtails[0].ends[0].id,`${d.id}.ground`);before=JSON.stringify(s);assert.ok(addPigtail(s,b.id,'device'));assert.equal(JSON.stringify(s),before);
});
