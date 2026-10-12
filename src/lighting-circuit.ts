import {branchGraph,wireEnds,wiringNodes} from './branch-wiring.ts';
import type {Workbench} from './cable-workbench-model.ts';
export type LightingStatus='correct'|'switch-open'|'power-off'|'open-hot'|'open-neutral'|'missing-ground'|'reversed-polarity'|'hot-neutral-short'|'hot-ground-short'|'breaker-tripped'|'unsupported';
export interface LightingResult {status:LightingStatus;message:string;volts:number;lightOn:boolean;safe:boolean;lampId?:string;switchId?:string;panelId?:string;breakerId?:string;faultLocation?:string;fault?:'hot-neutral-short'|'hot-ground-short'}
export const hasLighting=(s:Workbench)=>s.components.some(p=>p.kind==='lampholder');
/** Shared copper/termination graph, with the actual single-pole contact added.
 * The lamp is a load; it must never be a zero-resistance graph edge. */
export function evaluateLighting(s:Workbench,options:{prospective?:boolean}={}):LightingResult {
 const lamps=s.components.filter(p=>p.kind==='lampholder'),switches=s.components.filter(p=>p.kind==='switch'),panels=s.components.filter(p=>p.panel);
 const empty={volts:0,lightOn:false,safe:false};
 if(lamps.length!==1||switches.length!==1||panels.length!==1||!lamps[0]?.parentId||!switches[0]?.parentId)return {...empty,status:'unsupported',message:'This lighting lesson supports one panel, one single-pole switch and one mounted keyless lampholder.'};
 const lamp=lamps[0]!,sw=switches[0]!,panel=panels[0]!;
 const copper=branchGraph(s,{switches:true,closeSwitches:true,noBreakers:true});
 const feeds=panel.panel!.spaces.flatMap(p=>p.breaker?[p.breaker]:[]).filter(b=>[`${sw.id}.a`,`${sw.id}.b`,`${lamp.id}.hot`,`${lamp.id}.neutral`].some(t=>copper.same(t,b.terminalId)));
 if(feeds.length>1)return {...empty,status:'unsupported',message:'Multiple breaker feeds reach this lighting circuit. Turn power off and use one branch feed.'};
 const candidate=feeds[0]??panel.panel!.spaces[0]!.breaker!;
 const opts={breakersOn:true,breakerId:candidate.id};
 const graph=branchGraph(s,{...opts,switches:true,closeSwitches:options.prospective}),{same}=graph,source=graph.sources[0]!;
 const base={...empty,lampId:lamp.id,switchId:sw.id,panelId:panel.id,breakerId:candidate.id};
 const fault=same(source.h,source.n)?'hot-neutral-short':same(source.h,source.g)?'hot-ground-short':undefined;
 const mismatch=[...s.connections].reverse().find(c=>{const w=wireEnds(s).find(w=>w.end.id===c.fromId),n=wiringNodes(s).find(n=>n.id===c.toId);return w&&n&&((w.kind==='white'&&n.kind==='hot')||(w.kind==='black'&&n.kind!=='hot'));});
 if(candidate.tripped&&!options.prospective)return {...base,status:'breaker-tripped',message:`Breaker tripped: ${candidate.tripReason??'branch short detected'}. Turn power off, correct the short, then reset the breaker.`};
 if(fault)return {...base,status:fault,fault,faultLocation:mismatch?.toId??`${sw.id}.b`,message:fault==='hot-neutral-short'?'Hot conductor is shorted to neutral. Turn power off and separate the faulted conductors.':'Hot conductor is shorted to equipment ground. Turn power off and repair the fault.'};

 const closed=branchGraph(s,{...opts,switches:true,closeSwitches:true}),is=closed.same;
 const hot=is(`${lamp.id}.hot`,source.h),neutral=is(`${lamp.id}.neutral`,source.n),reversed=is(`${lamp.id}.hot`,source.n)&&is(`${lamp.id}.neutral`,source.h);
 const open=branchGraph(s,opts);
 const loadHot=`${lamp.id}.${reversed?'neutral':'hot'}`;
 const switched=!open.same(loadHot,source.h)&&((open.same(`${sw.id}.a`,source.h)&&open.same(`${sw.id}.b`,loadHot))||(open.same(`${sw.id}.b`,source.h)&&open.same(`${sw.id}.a`,loadHot)));
 if(same(source.n,source.g))return {...base,status:'unsupported',message:'Neutral and equipment ground are joined downstream. Ground cannot serve as the normal neutral return.'};
 if(!hot&&!reversed)return {...base,status:'open-hot',message:'Open hot: connect the breaker through both brass switch screws to the lampholder hot screw.'};
 if(!neutral&&!reversed)return {...base,status:'open-neutral',message:'Open neutral: the light cannot complete its circuit. Connect white to the panel neutral bar and silver lamp screw.'};
 if(!switched)return {...base,status:'unsupported',message:'The hot path bypasses the single-pole switch. This lighting lesson requires the switch to interrupt hot.'};
 const active=s.power&&candidate.on&&!candidate.tripped,contact=!!sw.switchClosed;
 const volts=active&&contact?120:0,lightOn=volts===120;
 if(reversed)return {...base,status:'reversed-polarity',volts,lightOn,message:'Incorrect polarity: the screw shell can be live. Turn power off; put black on brass and white on silver. The bulb is not destroyed.'};
 const bonded=is(`${sw.id}.ground`,source.g)&&is(`${sw.parentId}.box`,source.g)&&is(`${lamp.parentId}.box`,source.g);
 if(!bonded)return {...base,status:'missing-ground',volts,lightOn,message:'Missing ground bond: ground the switch and both metal boxes. Hot-neutral operation can still occur, but the assembly is unsafe.'};
 if(!active)return {...base,safe:true,status:'power-off',message:'Correct wiring: turn simulated power and the branch breaker on to test the light.'};
 if(!contact)return {...base,safe:true,status:'switch-open',message:'Correct circuit: breaker on, switch off, light off.'};
 return {...base,safe:true,status:'correct',volts:120,lightOn:true,message:'Correct circuit: breaker on, switch on, light illuminated.'};
}
export interface LightingFaultEvent {kind:'short';location:string;message:string}
export function settleLighting(s:Workbench):LightingFaultEvent|null {
 const r=evaluateLighting(s);if(!r.fault||!s.power)return null;
 const breaker=s.components.flatMap(p=>p.panel?.spaces??[]).find(p=>p.breaker?.id===r.breakerId)?.breaker;
 if(!breaker?.on||breaker.tripped)return null;
 breaker.on=false;breaker.tripped=true;breaker.tripReason=r.fault==='hot-neutral-short'?'hot conductor is shorted to neutral':'hot conductor is shorted to equipment ground';
 return {kind:'short',location:r.faultLocation??r.switchId!,message:`Breaker tripped: ${r.fault==='hot-neutral-short'?'hot conductor is shorted to neutral.':'hot conductor is shorted to equipment ground.'}`};
}
export function operateBreaker(s:Workbench,id:string):string|null {
 const breaker=s.components.flatMap(p=>p.panel?.spaces??[]).find(p=>p.breaker?.id===id)?.breaker;if(!breaker)return 'Unknown breaker.';
 if(breaker.tripped){
  if(s.power)return 'Turn simulated power off before resetting the breaker.';
  const graph=branchGraph(s,{switches:true,closeSwitches:true,breakersOn:true,breakerId:id});
  if(graph.sources.some(source=>graph.same(source.h,source.n)||graph.same(source.h,source.g)))return 'Breaker cannot reset: correct the short first.';
  const r=evaluateLighting(s,{prospective:true});
  if(r.status==='unsupported')return 'Breaker cannot reset: this wiring configuration cannot be evaluated.';
  breaker.tripped=false;breaker.tripReason=undefined;breaker.on=false;return 'Breaker reset to OFF. Turn it on after checking the repaired wiring.';
 }
 breaker.on=!breaker.on;return null;
}
