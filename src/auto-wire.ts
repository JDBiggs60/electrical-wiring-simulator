import {connectEnd,disconnect,wireEnds,addPigtail,addConnector,groupEnds,installWireNut,testReceptacle} from './branch-wiring.ts';
import {evaluateLighting} from './lighting-circuit.ts';
import type {Workbench,InstalledCable} from './cable-workbench-model.ts';
/** Plan and validate on a clone: rejected layouts never acquire partial wiring. */
export function autoWireCircuit(state:Workbench):string {
 if(state.power)return 'Turn simulated power OFF before using Auto Wire Circuit.';
 const s=structuredClone(state),panels=s.components.filter(p=>p.kind==='panel'),devices=s.components.filter(p=>['receptacle','switch','lampholder'].includes(p.kind));
 const receptacle=devices.length===1&&devices[0]?.kind==='receptacle',lighting=devices.length===2&&devices.some(p=>p.kind==='switch')&&devices.some(p=>p.kind==='lampholder');
 if(panels.length!==1)return 'Auto Wire needs exactly one breaker panel. Add a panel or remove additional panels.';
 if(!receptacle&&!lighting)return 'Supported layouts: one mounted duplex receptacle, or one mounted single-pole switch and one keyless lampholder. Add the missing devices or remove extra devices.';
 if(devices.some(p=>!p.parentId))return 'Mount each device in its own compatible steel box before using Auto Wire.';
 const panel=panels[0]!,load=devices.find(p=>p.kind===(receptacle?'receptacle':'switch'))!,lamp=devices.find(p=>p.kind==='lampholder');
 const box=s.components.find(p=>p.id===load.parentId),ceiling=lamp?s.components.find(p=>p.id===lamp.parentId):undefined;
 if(box?.kind!=='box'||(lamp&&ceiling?.kind!=='ceiling')||s.components.length!==(receptacle?3:5))return 'Use one single-gang steel device box, and for lighting one separate steel ceiling box. Remove extra or incompatible parts.';
 const between=(a:string,b:string)=>s.cables.filter(c=>[c.from.boxId,c.to.boxId].includes(a)&&[c.from.boxId,c.to.boxId].includes(b));
 const feeds=between(panel.id,box.id),legs=ceiling?between(box.id,ceiling.id):[];
 if(feeds.length!==1||(ceiling&&legs.length!==1)||s.cables.length!==(receptacle?1:2))return 'Install exactly one NM-B cable from panel to device box'+(ceiling?', and one from switch box to ceiling box.':'.')+' Remove extra or ambiguous cable routes.';
 if(s.cables.some(c=>c.type!=='14/2 NM-B with ground'||c.conductors.length!==3||['black','white','bare'].some(k=>c.conductors.filter(w=>w.kind===k).length!==1)))return 'Use complete 14/2 NM-B cables with separate black, white and bare conductors. No wiring was changed.';
 const feed=feeds[0]!,leg=legs[0];
 const end=(c:InstalledCable,kind:string,boxId:string)=>{const wires=c.conductors.filter(w=>w.kind===kind);if(wires.length!==1)throw new Error('Each cable must contain exactly one black, white and bare conductor.');const ends=wires[0]!.ends.filter(e=>e.boxId===boxId);if(ends.length!==1)throw new Error('Cable endpoints do not match their actual enclosures.');return ends[0]!.id;};
 try{
  // Preserve a valid existing branch choice; otherwise use the first free 15A slot.
  const feedEnd=end(feed,'black',panel.id),existing=s.connections.find(c=>c.fromId===feedEnd)?.toId;
  const breakers=panel.panel!.spaces.flatMap(p=>p.breaker?[p.breaker]:[]);
  const breaker=breakers.find(b=>b.terminalId===existing)??breakers.find(b=>!s.connections.some(c=>c.toId===b.terminalId));
  if(!breaker)throw new Error('No available 15A branch breaker. Free a branch terminal first.');
  const expectedTails=devices.filter(p=>p.kind!=='lampholder').map(p=>({boxId:p.parentId!,deviceId:p.id}));
  const allowed=s.pigtails.every(t=>t.role==='box'?[box.id,ceiling?.id].includes(t.boxId):expectedTails.some(e=>e.boxId===t.boxId&&(!t.deviceId||t.deviceId===e.deviceId)));
  if(!allowed||s.pigtails.some((t,i)=>s.pigtails.slice(0,i).some(o=>o.boxId===t.boxId&&o.role===t.role)))throw new Error('Extra or ambiguous grounding pigtails: remove duplicates before Auto Wire.');
  for(const {end:e}of wireEnds(s))if(e.termination)disconnect(s,e.id);
  s.connections=[];for(const p of s.components)for(const t of p.terminals)t.termination=null;
  for(const c of s.connectors)c.endIds=[];s.spliceGroups=[];
  const attach=(e:string,t:string)=>{const error=connectEnd(s,e,t);if(error)throw new Error(error);};
  attach(feedEnd,breaker.terminalId);attach(end(feed,'white',panel.id),`${panel.id}.neutral.1`);attach(end(feed,'bare',panel.id),`${panel.id}.ground.1`);
  attach(end(feed,'black',box.id),`${load.id}.${receptacle?'hot.upper':'a'}`);
  if(receptacle)attach(end(feed,'white',box.id),`${load.id}.neutral.upper`);
  else {
   attach(end(leg!,'black',box.id),`${load.id}.b`);attach(end(leg!,'black',ceiling!.id),`${lamp!.id}.hot`);attach(end(leg!,'white',ceiling!.id),`${lamp!.id}.neutral`);
   const neutrals=s.connectors.filter(c=>c.boxId===box.id&&c.kind==='neutral');if(neutrals.length>1)throw new Error('Multiple neutral wire nuts are ambiguous. Leave one neutral connector in the switch box.');
   if(neutrals[0]){attach(end(feed,'white',box.id),neutrals[0].id);attach(end(leg!,'white',box.id),neutrals[0].id);}
   else {const error=groupEnds(s,end(feed,'white',box.id),end(leg!,'white',box.id),250,180);if(error)throw new Error(error);const error2=installWireNut(s,s.spliceGroups[0]!.id);if(error2)throw new Error(error2);}
  }
  for(const enclosure of [box,...(ceiling?[ceiling]:[])]){
   const device=enclosure===box?load:undefined;
   for(const role of [...(device?['device' as const]:[]),'box' as const]){
    let tail=s.pigtails.find(t=>t.boxId===enclosure.id&&t.role===role);
    if(!tail){const error=addPigtail(s,enclosure.id,role);if(error)throw new Error(error);tail=s.pigtails.find(t=>t.boxId===enclosure.id&&t.role===role)!;}
    attach(tail.ends[1]!.id,role==='device'?`${device!.id}.ground`:`${enclosure.id}.box`);
   }
   let nuts=s.connectors.filter(c=>c.boxId===enclosure.id&&c.kind==='ground');if(nuts.length>1)throw new Error('Multiple ground connectors are ambiguous. Leave one ground connector per box.');
   if(!nuts.length){const error=addConnector(s,enclosure.id);if(error)throw new Error(error);nuts=s.connectors.filter(c=>c.boxId===enclosure.id&&c.kind==='ground');}
   for(const c of s.cables.filter(c=>[c.from.boxId,c.to.boxId].includes(enclosure.id)))attach(end(c,'bare',enclosure.id),nuts[0]!.id);
   for(const t of s.pigtails.filter(t=>t.boxId===enclosure.id))attach(t.ends[0]!.id,nuts[0]!.id);
  }
  // Validate the generated electrical graph with power temporarily enabled only
  // on a separate test clone. Operating controls on the real board stay untouched.
  const test=structuredClone(s);test.power=true;const p=test.components.find(p=>p.id===panel.id)!;const testBreaker=p.panel!.spaces.find(space=>space.breaker?.id===breaker.id)!.breaker!;testBreaker.on=true;testBreaker.tripped=false;
  if(lighting)test.components.find(p=>p.id===load.id)!.switchClosed=true;
  const result=lighting?evaluateLighting(test):testReceptacle(test,load.id);
  if(!result.safe||result.volts!==120)throw new Error('The existing validator could not confirm this circuit. No wiring was changed.');
  Object.assign(state,s);
  return `Auto Wire complete using ${breaker.id}: ${receptacle?'receptacle':'switch-controlled light'}, neutral, device ground and every steel-box bond connected. Power remains OFF. Inspect the wiring, then turn the breaker and simulated power on to test.`;
 }catch(error){return `Auto Wire could not complete: ${(error as Error).message} No wiring was changed.`;}
}
