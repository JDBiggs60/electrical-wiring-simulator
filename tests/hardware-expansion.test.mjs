import test from 'node:test';import assert from 'node:assert/strict';
import {addPart,createWorkbench,mountSwitch,snapTarget,worldPosition,slotOffset,workbenchHistory,partSize,installCable,entryPosition,inspectBox} from '../src/cable-workbench-model.ts';
import {wiringLayout,wiringInspection} from '../src/wiring-view.ts';import {connectEnd,pruneWiring} from '../src/branch-wiring.ts';import {deletePart,unmountDevice} from '../src/cable-workbench-model.ts';
for(const [kind,count] of [['box',1],['box2',2],['box3',3]])test(`${kind}: distinct mounting slots, capacity, assembled movement and history`,()=>{
 const s=createWorkbench(),h=workbenchHistory(s),box=addPart(s,kind,400,100);
 for(let i=0;i<count;i++){const o=slotOffset(box,i),d=addPart(s,i%2?'receptacle':'switch',box.x+o.x,box.y+o.y),before=structuredClone(s);assert.equal(snapTarget(s,d)?.id,box.id);assert.equal(mountSwitch(s,d,box),true);assert.equal(d.slot,i);h.record(before);}
 const extra=addPart(s,'switch',435,94);assert.equal(mountSwitch(s,extra,box),false);
 h.undo();assert.equal(s.components.filter(p=>p.parentId===box.id).length,count-1);h.redo();assert.equal(s.components.filter(p=>p.parentId===box.id).length,count);
 const b=s.components.find(p=>p.id===box.id),d=s.components.find(p=>p.parentId===box.id),old=worldPosition(s,d);b.x+=70;b.y+=25;assert.deepEqual(worldPosition(s,d),{x:old.x+70,y:old.y+25});
 const l=wiringLayout(s,b.id);assert.equal(l.devices.length,count);assert.equal(new Set(l.devices.map(p=>l.positions.get(p.id).x)).size,count);assert.equal(new Set([...l.targets.values()].map(p=>`${p.x},${p.y}`)).size,l.targets.size);
 assert.ok(wiringInspection(s,b.id,null).includes(`data-gang-count="${count}"`));
 unmountDevice(s,d);assert.equal(d.parentId,null);assert.equal(d.slot,undefined);
 deletePart(s,b.id);pruneWiring(s);assert.ok(!s.components.some(p=>p.parentId===b.id));assert.ok(s.components.some(p=>p.id===d.id));
});
test('octagon accepts only porcelain fixture; shared cables, exposed terminals and box bond',()=>{
 const s=createWorkbench(),ceiling=addPart(s,'ceiling',400,100),box=addPart(s,'box2',800,100),light=addPart(s,'lampholder',415,115),sw=addPart(s,'switch',435,94);
 assert.equal(mountSwitch(s,sw,ceiling),false);assert.equal(mountSwitch(s,light,box),false);assert.equal(snapTarget(s,light)?.id,ceiling.id);assert.equal(mountSwitch(s,light,ceiling),true);
 assert.equal(installCable(s,{boxId:box.id,entryId:'right'},{boxId:ceiling.id,entryId:'left'}),null);
 const c=s.cables[0];assert.equal(inspectBox(s,ceiling.id)[0].conductors,c.conductors);assert.ok(c.conductors.every(w=>w.ends.every(e=>e.termination===null)));
 assert.equal(connectEnd(s,c.conductors[0].ends[1].id,light.id+'.hot'),null);assert.equal(connectEnd(s,c.conductors[1].ends[1].id,light.id+'.neutral'),null);assert.equal(connectEnd(s,c.conductors[2].ends[1].id,ceiling.id+'.box'),null);
 assert.equal(light.terminals.length,2);assert.ok(!light.terminals.some(t=>t.kind==='ground'));assert.ok(ceiling.terminals[0].y<partSize.ceiling.height);
 const l=wiringLayout(s,ceiling.id),entry=entryPosition(s,c.to);assert.equal(l.wires[0].origin.x,l.base.x+(entry.x-ceiling.x+30)*l.base.scale);
 const html=wiringInspection(s,ceiling.id,null);assert.ok(html.includes('steel-octagon-box'));assert.ok(html.includes('porcelain-keyless-lampholder'));assert.ok(html.includes(`data-connection-target="${light.id}.hot"`));
});
test('multi-gang devices each get their own loose grounding pigtail, with separate box bond',async()=>{
 const {addPigtail}=await import('../src/branch-wiring.ts');const s=createWorkbench(),box=addPart(s,'box3',100,100);
 for(let i=0;i<3;i++)mountSwitch(s,addPart(s,'switch',135+i*120,94),box);
 for(let i=0;i<3;i++)assert.equal(addPigtail(s,box.id,'device'),null);
 assert.equal(addPigtail(s,box.id,'box'),null);assert.notEqual(addPigtail(s,box.id,'device'),null);
 assert.equal(new Set(s.pigtails.filter(p=>p.role==='device').map(p=>p.deviceId)).size,3);
 assert.ok(s.pigtails.every(p=>p.ends[0].termination===null&&p.ends[1].termination===(p.role==='device'?p.deviceId+'.ground':box.id+'.box')));const l=wiringLayout(s,box.id);
 for(const w of l.wires){assert.ok(w.loose.x>=l.base.x+26*l.base.scale&&w.loose.x<=l.base.x+(partSize.box3.width-25)*l.base.scale);assert.ok(w.loose.y>=l.base.y+18*l.base.scale&&w.loose.y<=l.base.y+260*l.base.scale);}
});
