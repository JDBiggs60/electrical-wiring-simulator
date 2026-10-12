import {isSteelBox,isDevice} from './workbench-model.ts';
import type {Workbench} from './cable-workbench-model.ts';
export function wireEnds(s:Workbench) {
 return [...s.cables.flatMap(c=>c.conductors.flatMap(w=>w.ends.map(e=>({wireId:w.id,kind:w.kind,end:e})))),...s.pigtails.flatMap(w=>w.ends.map(e=>({wireId:w.id,kind:'bare' as const,end:e})))];
}
export function wiringNodes(s:Workbench) {
 return [...s.components.flatMap(c=>c.terminals.map(t=>({id:t.id,boxId:c.parentId??c.id,kind:t.kind,type:'terminal' as const}))),...s.connectors.map(c=>({id:c.id,boxId:c.boxId,kind:c.kind,type:'connector' as const}))];
}
export function addPigtail(s:Workbench,boxId:string,role:'device'|'box') {
 if(!s.components.some(p=>p.id===boxId&&isSteelBox(p))) return 'Pigtails belong inside a steel device box.';
 const devices=s.components.filter(p=>p.parentId===boxId&&p.terminals.some(t=>t.kind==='ground'));
 const device=role==='device'?devices.find(d=>!s.pigtails.some(p=>p.boxId===boxId&&p.role==='device'&&(p.deviceId===d.id||(!p.deviceId&&d===devices[0])))):undefined;
 if(role==='device'&&devices.length&&!device)return 'Every mounted device already has a grounding pigtail.';
 if(s.pigtails.some(p=>p.boxId===boxId&&p.role===role)&&!device) return 'That grounding pigtail already exists.';
 const target=role==='device'?device?.terminals.find(t=>t.kind==='ground'):s.components.find(p=>p.id===boxId)?.terminals.find(t=>t.kind==='ground');
 if(!target)return role==='device'?'Mount a switch or receptacle with a green grounding screw first.':'This box has no grounding screw.';
 if(target.termination||s.connections.some(c=>c.toId===target.id))return 'That grounding screw already has a conductor; use its existing connection.';
 const id=`pigtail-${s.nextWiringId++}`,tail={id,boxId,role,...(device?{deviceId:device.id}:{}),ends:['splice','terminal'].map(name=>({id:`${id}.${name}`,boxId,kind:'bare' as const,termination:null as string|null}))};
 s.pigtails.push(tail);
 // Creation is one user action: electrically attach only the screw end. The
 // splice end remains open until the learner joins it to the ground conductors.
 return connectEnd(s,tail.ends[1]!.id,target.id);
}
export function addConnector(s:Workbench,boxId:string) {
 if(s.connectors.some(c=>c.boxId===boxId&&c.kind==='ground')) return 'A grounding connector already exists in this box.';
 if(!s.components.some(p=>p.id===boxId&&isSteelBox(p))) return 'Create ground connectors inside the device box.';
 s.connectors.push({id:`connector-${s.nextWiringId++}`,boxId,capacity:4,kind:'ground',endIds:[],x:510,y:630});return null;
}
export function disconnect(s:Workbench,id:string) {
 const removed=s.connections.filter(c=>c.fromId===id||c.toId===id);
 if(!removed.length) return 'Select an attached conductor or connector to disconnect.';
 s.connections=s.connections.filter(c=>!removed.includes(c));
 for(const {end} of wireEnds(s)) if(removed.some(c=>c.fromId===end.id)) end.termination=null;
 for(const c of s.connectors)c.endIds=s.connections.filter(e=>e.toId===c.id).map(e=>e.fromId);
 for(const p of s.components)for(const t of p.terminals)if(removed.some(c=>c.toId===t.id))t.termination=null;
 return null;
}
export function connectEnd(s:Workbench,endId:string,targetId:string) {
 const wire=wireEnds(s).find(w=>w.end.id===endId),target=wiringNodes(s).find(t=>t.id===targetId);
 if(!wire||!target) return 'Drag a loose conductor end to an electrical terminal or ground connector; mounting screws are not terminals.';
 if(wire.end.boxId!==target.boxId)return 'Both ends of this connection must be in the same enclosure.';
 if(target.type==='connector'&&conductorKind(wire.kind)!==target.kind)return 'Unsafe splice rejected: hot, neutral and equipment ground must use separate wire nuts.';
 if((wire.kind==='bare') !== (target.kind==='ground'))return 'Equipment ground goes only to a ground terminal or ground connector. Neutral is not equipment ground.';
 if(s.connections.some(c=>c.toId===targetId&&c.fromId===endId))return null;
 if(target.type==='terminal'&&s.connections.some(c=>c.toId===targetId))return 'That terminal already has a conductor. Use the other matching screw or a free bar terminal.';
 if(target.type==='connector'&&s.connections.filter(c=>c.toId===targetId).length>=s.connectors.find(c=>c.id===targetId)!.capacity)return 'This wire nut is full; use a suitable separate connector.';
 if(wire.end.termination)disconnect(s,endId);
 const id=`connection-${s.nextWiringId++}`;s.connections.push({id,fromId:endId,toId:targetId});wire.end.termination=targetId;
 const connector=s.connectors.find(c=>c.id===targetId);if(connector)connector.endIds.push(endId);
 s.spliceGroups=s.spliceGroups.filter(g=>!g.endIds.includes(endId));
 for(const p of s.components)for(const t of p.terminals)if(t.id===targetId)t.termination=endId;
 return null;
}
export function pullDevice(s:Workbench,boxId:string,deviceId?:string) {const p=s.components.find(p=>p.parentId===boxId&&isDevice(p)&&(!deviceId||p.id===deviceId));if(!p)return 'Mount a switch or receptacle in this box first.';p.pulledOut=true;return null;}
export function mountPulledDevice(s:Workbench,boxId:string,deviceId?:string) {const p=s.components.find(p=>p.parentId===boxId&&isDevice(p)&&(!deviceId||p.id===deviceId));if(!p)return 'This box has no associated device.';p.pulledOut=false;return null;}
export function pruneWiring(s:Workbench) {
 s.pigtails=s.pigtails.filter(w=>s.components.some(c=>c.id===w.boxId));s.connectors=s.connectors.filter(w=>s.components.some(c=>c.id===w.boxId));
 s.spliceGroups=s.spliceGroups.filter(g=>s.components.some(c=>c.id===g.boxId)&&g.endIds.every(id=>wireEnds(s).some(w=>w.end.id===id&&!w.end.termination)));
 const ends=new Set(wireEnds(s).map(w=>w.end.id)),nodes=new Set(wiringNodes(s).map(n=>n.id));s.connections=s.connections.filter(c=>ends.has(c.fromId)&&nodes.has(c.toId));
 for(const c of s.connectors)c.endIds=s.connections.filter(e=>e.toId===c.id).map(e=>e.fromId);
 for(const {end}of wireEnds(s))end.termination=s.connections.find(c=>c.fromId===end.id)?.toId??null;
 for(const p of s.components)for(const t of p.terminals)t.termination=s.connections.find(c=>c.toId===t.id)?.fromId??null;
}
export function branchGraph(s:Workbench,options:{switches?:boolean;closeSwitches?:boolean;breakersOn?:boolean;breakerId?:string;noBreakers?:boolean}={}) {
 const parent=new Map<string,string>();const find=(id:string):string=>{const p=parent.get(id);if(!p){parent.set(id,id);return id;}if(p===id)return id;const root=find(p);parent.set(id,root);return root;};const join=(a:string,b:string)=>parent.set(find(a),find(b));const same=(a:string,b:string)=>find(a)===find(b);
 for(const c of s.cables)for(const w of c.conductors)join(w.ends[0].id,w.ends[1].id);
 for(const w of s.pigtails)join(w.ends[0]!.id,w.ends[1]!.id);
 for(const c of s.connections)join(c.fromId,c.toId);
 for(const p of s.components)for(const tab of p.receptacle?.tabs??[])if(tab.intact)join(...tab.terminalIds);
 if(options.switches)for(const p of s.components)if(p.kind==='switch'&&(options.closeSwitches||p.switchClosed))join(`${p.id}.a`,`${p.id}.b`);
 const sources=s.components.filter(p=>p.panel).map(p=>{
  const h=`${p.id}.source.hot`,n=`${p.id}.source.neutral`,g=`${p.id}.source.ground`;
  for(const t of p.terminals)if(t.kind==='neutral')join(t.id,n);else if(t.kind==='ground')join(t.id,g);
  for(const space of p.panel!.spaces)if(space.breaker&&!options.noBreakers&&(!options.breakerId||space.breaker.id===options.breakerId)&&(options.breakersOn||(space.breaker.on&&!space.breaker.tripped)))join(space.breaker.terminalId,h);
  return {h,n,g,panelId:p.id};
 });
 return {same,sources};
}
export function testReceptacle(s:Workbench,deviceId?:string) {
 const device=s.components.find(p=>p.kind==='receptacle'&&(!deviceId||p.id===deviceId));
 const {same,sources}=branchGraph(s);
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

export const conductorKind=(kind:string):'hot'|'neutral'|'ground'=>kind==='black'?'hot':kind==='white'?'neutral':'ground';
/** Grouping is a mechanical action only. No continuity until a rated connector is installed. */
export function groupEnds(s:Workbench,a:string,b:string,x:number,y:number) {
 const ends=wireEnds(s),first=ends.find(w=>w.end.id===a),second=ends.find(w=>w.end.id===b);
 if(!first||!second||a===b||first.end.termination||second.end.termination)return 'Bring two loose stripped ends together first.';
 if(first.end.boxId!==second.end.boxId)return 'Splices must remain inside the same enclosure.';
 if(conductorKind(first.kind)!==conductorKind(second.kind))return 'Unsafe splice rejected: do not join hot to neutral or neutral to equipment ground.';
 const groups=s.spliceGroups.filter(g=>g.endIds.includes(a)||g.endIds.includes(b));
 const endIds=[...new Set([...groups.flatMap(g=>g.endIds),a,b])];
 if(endIds.length>3)return 'This modeled wire nut accepts two or three same-type 14 AWG conductors.';
 s.spliceGroups=s.spliceGroups.filter(g=>!groups.includes(g));
 x=groups[0]?.x??Math.max(205,Math.min(410,x));y=groups[0]?.y??Math.max(155,Math.min(480,y));
 if(!groups.length){const occupied=s.connectors.filter(c=>c.boxId===first.end.boxId);for(let i=0;i<6&&occupied.some(c=>Math.hypot(c.x-x,c.y-y)<75);i++){y+=80;if(y>480){y=240;x=250;}}}
 s.spliceGroups.push({id:groups[0]?.id??`splice-${s.nextWiringId++}`,boxId:first.end.boxId,kind:conductorKind(first.kind),endIds,x,y});return null;
}
export function installWireNut(s:Workbench,groupId:string) {
 const group=s.spliceGroups.find(g=>g.id===groupId);if(!group)return 'Bring loose ends together before adding a wire nut.';
 const ends=wireEnds(s);if(group.endIds.length<2||group.endIds.length>3||group.endIds.some(id=>{const w=ends.find(w=>w.end.id===id);return !w||w.end.termination||w.end.boxId!==group.boxId||conductorKind(w.kind)!==group.kind;}))return 'This connector requires two or three loose, same-type 14 AWG conductors.';
 const connector={id:`connector-${s.nextWiringId++}`,boxId:group.boxId,capacity:3 as const,kind:group.kind,endIds:[] as string[],x:group.x,y:group.y};s.connectors.push(connector);
 for(const id of group.endIds)connectEnd(s,id,connector.id);
 s.spliceGroups=s.spliceGroups.filter(g=>g.id!==groupId);return null;
}
export function removeWireNut(s:Workbench,id:string) {
 if(!s.connectors.some(c=>c.id===id))return 'Select a wire nut to remove.';
 disconnect(s,id);s.connectors=s.connectors.filter(c=>c.id!==id);return null;
}
export function moveWireNut(s:Workbench,id:string,x:number,y:number) {
 const c=s.connectors.find(c=>c.id===id);if(!c)return 'Select an installed wire nut.';
 c.x=Math.max(220,Math.min(390,x));c.y=Math.max(185,Math.min(500,y));return null;
}
