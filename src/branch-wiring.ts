import type {Workbench} from './cable-workbench-model.ts';
export function wireEnds(s:Workbench) {
 return [...s.cables.flatMap(c=>c.conductors.flatMap(w=>w.ends.map(e=>({wireId:w.id,kind:w.kind,end:e})))),...s.pigtails.flatMap(w=>w.ends.map(e=>({wireId:w.id,kind:'bare' as const,end:e})))];
}
export function wiringNodes(s:Workbench) {
 return [...s.components.flatMap(c=>c.terminals.map(t=>({id:t.id,boxId:c.parentId??c.id,kind:t.kind,type:'terminal' as const}))),...s.connectors.map(c=>({id:c.id,boxId:c.boxId,kind:'ground' as const,type:'connector' as const}))];
}
export function addPigtail(s:Workbench,boxId:string,role:'device'|'box') {
 if(!s.components.some(p=>p.id===boxId&&p.kind==='box')) return 'Pigtails belong inside a steel device box.';
 if(s.pigtails.some(p=>p.boxId===boxId&&p.role===role)) return 'That grounding pigtail already exists.';
 const id=`pigtail-${s.nextWiringId++}`;s.pigtails.push({id,boxId,role,ends:['splice','terminal'].map(name=>({id:`${id}.${name}`,boxId,kind:'bare',termination:null}))});return null;
}
export function addConnector(s:Workbench,boxId:string) {
 if(s.connectors.some(c=>c.boxId===boxId)) return 'A grounding connector already exists in this box.';
 if(!s.components.some(p=>p.id===boxId&&p.kind==='box')) return 'Create ground connectors inside the device box.';
 s.connectors.push({id:`connector-${s.nextWiringId++}`,boxId,capacity:4});return null;
}
export function disconnect(s:Workbench,id:string) {
 const removed=s.connections.filter(c=>c.fromId===id||c.toId===id);
 if(!removed.length) return 'Select an attached conductor or connector to disconnect.';
 s.connections=s.connections.filter(c=>!removed.includes(c));
 for(const {end} of wireEnds(s)) if(removed.some(c=>c.fromId===end.id)) end.termination=null;
 for(const p of s.components)for(const t of p.terminals)if(removed.some(c=>c.toId===t.id))t.termination=null;
 return null;
}
export function connectEnd(s:Workbench,endId:string,targetId:string) {
 const wire=wireEnds(s).find(w=>w.end.id===endId),target=wiringNodes(s).find(t=>t.id===targetId);
 if(!wire||!target) return 'Drag a loose conductor end to an electrical terminal or ground connector; mounting screws are not terminals.';
 if(wire.end.boxId!==target.boxId)return 'Both ends of this connection must be in the same enclosure.';
 if((wire.kind==='bare') !== (target.kind==='ground'))return 'Equipment ground goes only to a ground terminal or ground connector. Neutral is not equipment ground.';
 if(s.connections.some(c=>c.toId===targetId&&c.fromId===endId))return null;
 if(target.type==='terminal'&&s.connections.some(c=>c.toId===targetId))return 'That terminal already has a conductor. Use the other matching screw or a free bar terminal.';
 if(target.type==='connector'&&s.connections.filter(c=>c.toId===targetId).length>=4)return 'This ground connector is full.';
 if(wire.end.termination)disconnect(s,endId);
 const id=`connection-${s.nextWiringId++}`;s.connections.push({id,fromId:endId,toId:targetId});wire.end.termination=targetId;
 for(const p of s.components)for(const t of p.terminals)if(t.id===targetId)t.termination=endId;
 return null;
}
export function pullDevice(s:Workbench,boxId:string) {const p=s.components.find(p=>p.parentId===boxId&&p.kind==='receptacle');if(!p)return 'Mount a receptacle in this box first.';p.pulledOut=true;return null;}
export function mountPulledDevice(s:Workbench,boxId:string) {const p=s.components.find(p=>p.parentId===boxId&&p.kind==='receptacle');if(!p)return 'This box has no associated receptacle.';p.pulledOut=false;return null;}
export function pruneWiring(s:Workbench) {
 s.pigtails=s.pigtails.filter(w=>s.components.some(c=>c.id===w.boxId));s.connectors=s.connectors.filter(w=>s.components.some(c=>c.id===w.boxId));
 const ends=new Set(wireEnds(s).map(w=>w.end.id)),nodes=new Set(wiringNodes(s).map(n=>n.id));s.connections=s.connections.filter(c=>ends.has(c.fromId)&&nodes.has(c.toId));
 for(const {end}of wireEnds(s))end.termination=s.connections.find(c=>c.fromId===end.id)?.toId??null;
 for(const p of s.components)for(const t of p.terminals)t.termination=s.connections.find(c=>c.toId===t.id)?.fromId??null;
}
export function testReceptacle(s:Workbench,deviceId?:string) {
 const device=s.components.find(p=>p.kind==='receptacle'&&(!deviceId||p.id===deviceId));
 const parent=new Map<string,string>();const find=(id:string):string=>{const p=parent.get(id);if(!p){parent.set(id,id);return id;}if(p===id)return id;const root=find(p);parent.set(id,root);return root;};const join=(a:string,b:string)=>parent.set(find(a),find(b));const same=(a:string,b:string)=>find(a)===find(b);
 for(const c of s.cables)for(const w of c.conductors)join(w.ends[0].id,w.ends[1].id);
 for(const w of s.pigtails)join(w.ends[0]!.id,w.ends[1]!.id);
 for(const c of s.connections)join(c.fromId,c.toId);
 for(const p of s.components)for(const tab of p.receptacle?.tabs??[])if(tab.intact)join(...tab.terminalIds);
 const sources=s.components.filter(p=>p.panel).map(p=>{
  const h=`${p.id}.source.hot`,n=`${p.id}.source.neutral`,g=`${p.id}.source.ground`;
  for(const t of p.terminals)if(t.kind==='neutral')join(t.id,n);else if(t.kind==='ground')join(t.id,g);
  for(const space of p.panel!.spaces)if(space.breaker?.on)join(space.breaker.terminalId,h);
  return {h,n,g};
 });
 const fault=sources.some(p=>same(p.h,p.n)||same(p.h,p.g)||same(p.n,p.g));
 if(!device?.parentId)return {status:'No power',message:'Mount one receptacle in a steel box and install its branch cable.',volts:0,energized:false,safe:false};
 const h=`${device.id}.hot.upper`,n=`${device.id}.neutral.upper`,g=`${device.id}.ground`,box=`${device.parentId}.box`;
 const hot=sources.find(p=>same(h,p.h)),neutral=sources.find(p=>same(n,p.n)),ground=sources.find(p=>same(g,p.g)),bond=sources.find(p=>same(box,p.g));
 const reversed=sources.some(p=>same(h,p.n)&&same(n,p.h));
 const unsafe=fault||!!(hot&&neutral&&hot!==neutral)||same(h,n)||sources.some(p=>same(h,p.g)||same(n,p.g)||same(box,p.h));
 const volts=s.power&&hot&&neutral&&!unsafe?120:0;
 let status='Correctly wired',message='120V hot-neutral path, equipment ground and steel-box bond are complete.';
 if(unsafe){status='Short circuit or unsafe connection';message='Hot, neutral and equipment ground must remain separate downstream. Simulated output is blocked.';}
 else if(reversed){status='Hot/neutral reversed';message='Move black to brass and white to silver at both ends of the branch.';}
 else if(!hot){status='No power';message='Check the branch breaker and hot conductor continuity.';}
 else if(!neutral){status='Open neutral';message='The white neutral return is disconnected. Ground cannot replace it.';}
 else if(!ground){status='Open ground';message='The receptacle lacks equipment grounding; hot-neutral voltage may still be present.';}
 else if(!bond){status='Steel box not bonded';message='Add a separate box-bonding pigtail to the steel box grounding screw.';}
 else if(!s.power){status='No power';message='Wiring paths are complete. Turn simulated power on to test 120V.';}
 return {status,message,volts,energized:volts===120,safe:!!hot&&!!neutral&&!!ground&&!!bond&&!unsafe&&!reversed};
}
