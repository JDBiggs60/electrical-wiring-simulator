import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorkbench,addPart,installCable} from '../src/cable-workbench-model.ts';
import {addPigtail,addConnector,connectEnd,groupEnds,installWireNut,wireEnds} from '../src/branch-wiring.ts';
import {wiringLayout,wiringInspection} from '../src/wiring-view.ts';
import {insideBox,cavityRoute} from '../src/inspection-routing.ts';

for(const kind of ['switch','lampholder'])test(`${kind}: connected screenshot arrangement has bounded routes, correct anchors and immutable electrical state`,()=>{
 const s=createWorkbench(),supply=addPart(s,'box',50,50),box=addPart(s,kind==='switch'?'box':'ceiling',500,100),device=addPart(s,kind,0,0);device.parentId=box.id;
 installCable(s,{boxId:supply.id,entryId:'right'},{boxId:box.id,entryId:'left'});
 connectEnd(s,'cable-1.black.to',`${device.id}.${kind==='switch'?'a':'hot'}`);
 if(kind==='switch'){
  const downstream=addPart(s,'box',900,100);installCable(s,{boxId:box.id,entryId:'right'},{boxId:downstream.id,entryId:'left'});
  connectEnd(s,'cable-2.black.from',`${device.id}.b`);
  groupEnds(s,'cable-1.white.to','cable-2.white.from',365,305);installWireNut(s,s.spliceGroups[0].id);
  addPigtail(s,box.id,'device');
 }else connectEnd(s,'cable-1.white.to',`${device.id}.neutral`);
 addPigtail(s,box.id,'box');addConnector(s,box.id);
 const nut=s.connectors.find(c=>c.kind==='ground');
 connectEnd(s,'cable-1.bare.to',nut.id);if(kind==='switch')connectEnd(s,'cable-2.bare.from',nut.id);
 for(const tail of s.pigtails){connectEnd(s,tail.ends[0].id,nut.id);connectEnd(s,tail.ends[1].id,tail.role==='device'?`${device.id}.ground`:`${box.id}.box`);}
 const saved=JSON.stringify(s),ends=wireEnds(s).map(w=>({id:w.end.id,to:w.end.termination}));
 for(const delta of [{x:0,y:0},{x:-10,y:15}]){
  const initial=wiringLayout(s,box.id),l=wiringLayout(s,box.id,{x:initial.d.x+delta.x,y:initial.d.y+delta.y});
  for(const t of device.terminals)assert.deepEqual(l.targets.get(t.id),{x:l.d.x+t.x*l.d.scale,y:l.d.y+t.y*l.d.scale});
  for(const [i,w]of l.wires.entries()){
   const end=l.ends.get(w.id),route=cavityRoute(w.origin,end,box,l.base,l.faces,i);
   assert.deepEqual(route[0],w.origin);assert.deepEqual(route.at(-1),end);
   for(let j=1;j<route.length;j++)for(let step=0;step<=50;step++){
    const a=route[j-1],b=route[j],t=step/50,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},bounded=insideBox(p,box,l.base,0);
    assert.ok(Math.hypot(p.x-bounded.x,p.y-bounded.y)<.01,`escaped ${w.id}`);
    assert.ok(!l.faces.some(r=>p.x>r.left+.1&&p.x<r.right-.1&&p.y>r.top+.1&&p.y<r.bottom-.1),`face obscured by ${w.id}`);
   }
  }
  wiringInspection(s,box.id,null,undefined,{x:l.d.x,y:l.d.y});
  assert.equal(JSON.stringify(s),saved);assert.deepEqual(wireEnds(s).map(w=>({id:w.end.id,to:w.end.termination})),ends);
 }
});
