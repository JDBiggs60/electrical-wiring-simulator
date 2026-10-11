import {gangCount,partSize} from './workbench-model.ts';
import {nmJacket,nmBoxConnector,looseWireNut} from './hardware-art.ts';
import {straightSteelBox,terminalDevice} from './wiring-hardware-art.ts';
import {breakerPanel} from './panel-art.ts';
import {entriesFor,inspectBox,type Workbench} from './cable-workbench-model.ts';
import {wireEnds,wiringNodes,testReceptacle} from './branch-wiring.ts';
export interface Point {x:number;y:number}
export function terminalStateArt(s:Workbench,art:string) {
 return art.replace(/ data-terminal-state="[^"]*"/g,'').replace(/data-terminal-id="([^"]+)"/g,(all,id)=>`${all} data-terminal-state="${s.components.flatMap(p=>p.terminals).find(t=>t.id===id)?.termination?'connected':'disconnected'}"`);
}
export function wiringLayout(s:Workbench,id:string,deviceDraft?:Point & {id?:string}) {
 const enclosure=s.components.find(p=>p.id===id)!;const panel=enclosure.kind==='panel',base={x:panel?230:140,y:panel?100:90,scale:panel?1.5:1.9};
 const devices=s.components.filter(p=>p.parentId===id),device=devices[0],multi=gangCount(enclosure)>1;
 const positions=new Map(devices.map((p,i)=>[p.id,{x:deviceDraft&&(!deviceDraft.id||deviceDraft.id===p.id)?deviceDraft.x:multi?(gangCount(enclosure)===3?1050:780)+i*240:690,y:deviceDraft&&(!deviceDraft.id||deviceDraft.id===p.id)?deviceDraft.y:130,scale:1.35}]));const d=positions.get(device?.id??'')??{x:690,y:130,scale:1.35};
 const targets=new Map<string,Point>();for(const p of s.components.filter(p=>p.id===id||p.parentId===id))for(const t of p.terminals){const pos=p.id===id?base:positions.get(p.id)!;targets.set(t.id,{x:pos.x+t.x*pos.scale,y:pos.y+t.y*pos.scale});}
 s.connectors.filter(c=>c.boxId===id).forEach(c=>targets.set(c.id,panel?{x:c.x,y:c.y}:connectorPoint(c)));
 const wires=inspectBox(s,id).flatMap(({cable,entry,conductors},i)=>{
  const p=entriesFor(enclosure)[entry.entryId];return conductors.map((w,j)=>{const end=w.ends.find(e=>e.boxId===id)!;return {id:end.id,kind:w.kind,origin:{x:base.x+(p.x-p.side*30)*base.scale,y:base.y+(p.y+(j-1)*7)*base.scale},loose:{x:panel?370+j*44:245+i*120,y:panel?640+i*35:240+j*65},wireId:w.id,cableId:cable.id};});
 });
 s.pigtails.filter(w=>w.boxId===id).forEach((w,i)=>{const start={x:300+i*25,y:430+i*35};w.ends.forEach((e,j)=>wires.push({id:e.id,kind:'bare',origin:start,loose:{x:j?365+Math.floor(i/2)*80:(i?290:225)+Math.floor(i/2)*80,y:440+(i%2)*65+j*25},wireId:w.id,cableId:''}));});
 const ends=new Map(wires.map(w=>[w.id,w.loose]));for(const w of wires){const to=wireEnds(s).find(e=>e.end.id===w.id)?.end.termination;if(to&&targets.has(to)){const pos=targets.get(to)!;const c=s.connectors.find(c=>c.id===to);ends.set(w.id,c?{x:pos.x+(c.endIds.indexOf(w.id)-(c.endIds.length-1)/2)*12,y:pos.y+15}:pos);}}
 for(const g of s.spliceGroups.filter(g=>g.boxId===id)){const p=connectorPoint(g);g.endIds.forEach((end,i)=>ends.set(end,{x:p.x+(i-(g.endIds.length-1)/2)*20,y:p.y}));}
 return {enclosure,device,devices,positions,base,d,targets,wires,ends};
}
export function wiringInspection(s:Workbench,id:string,selected:string|null,draft?:{endId:string;point:Point;target:string|null},deviceDraft?:Point & {id?:string}) {
 const l=wiringLayout(s,id,deviceDraft),{enclosure,device,devices,positions,base,targets,wires,ends}=l,panel=enclosure.kind==='panel';
 const body=panel?breakerPanel(id,true,enclosure):straightSteelBox(enclosure);

 const tester=testReceptacle(s,device?.kind==='receptacle'?device.id:undefined);
 return `<svg data-wiring-canvas viewBox="0 0 ${gangCount(enclosure)>1?(gangCount(enclosure)===3?1050:780)+gangCount(enclosure)*240:1000} ${panel?800:720}" role="group" aria-label="Direct branch-circuit wiring workspace"><g transform="translate(${base.x} ${base.y}) scale(${base.scale})">${terminalStateArt(s,body)}${inspectBox(s,id).map(({cable,entry})=>{const p=entriesFor(enclosure)[entry.entryId];return `<g data-inspect-cable="${cable.id}" data-entry-id="${entry.entryId}">${nmJacket(`M${p.x+p.side*75} ${p.y}H${p.x-p.side*30}`,cable.id,11)}<g transform="translate(${p.x} ${p.y}) scale(.65)${p.side===1?' rotate(180)':''}">${nmBoxConnector(0,0)}</g></g>`;}).join('')}</g>
 ${devices.map(p=>{const pos=positions.get(p.id)!;return `<g data-inspection-device="${p.id}" transform="translate(${pos.x} ${pos.y}) scale(${pos.scale})">${terminalStateArt(s,terminalDevice(p))}</g>${p.pulledOut?`<rect data-device-mount-target="${p.id}" x="${base.x+p.x*base.scale}" y="${base.y+p.y*base.scale}" width="${partSize[p.kind].width*base.scale}" height="${partSize[p.kind].height*base.scale}" class="wb-snap"/>`:''}<text x="${pos.x-35}" y="35" font-size="16">${p.kind==='lampholder'?'Porcelain keyless lampholder':p.kind==='receptacle'?'Duplex receptacle':'Single-pole switch'} · ${p.id}</text><text x="${pos.x-35}" y="55" font-size="12">${p.kind==='lampholder'?'Brass: hot · Silver: neutral · Bond steel box separately':'Brass: hot · '+(p.kind==='receptacle'?'Silver: neutral · ':'')+'Green: ground'}</text>`;}).join('')}

 ${wires.map(w=>{const end=draft?.endId===w.id?draft.point:ends.get(w.id)!;const connection=s.connections.find(c=>c.fromId===w.id);const nut=connection?s.connectors.find(c=>c.id===connection.toId):undefined;const route=panel?panelWireRoute(w.origin,end,base,w.kind,wires.indexOf(w)):boxWireRoute(w.origin,end,connection?.toId??null,l,wires.indexOf(w),!!nut);const tail=s.pigtails.find(t=>t.id===w.wireId);const role=tail?`${tail.role==='device'?'Device ground pigtail':'Steel-box bond pigtail'} · ${w.id.endsWith('.splice')?'splice end':'grounding screw end'}`:w.id;const color=w.kind==='black'?'#30362f':w.kind==='white'?'#fffdee':'#b57d48';return `<g data-conductor-id="${w.wireId}" data-end-id="${w.id}" data-termination="${connection?'connected':'disconnected'}" data-connection-target="${connection?.toId??''}" data-wiring-wire="${w.id}"><title>${role} · ${w.kind} · ${connection?'attached to '+connection.toId:'loose, drag its copper end'}</title><path d="${route}" fill="none" stroke="${selected===w.id?'#d19d24':'#656a5e'}" stroke-width="${selected===w.id?10:6}"/><path d="${route}" fill="none" stroke="${color}" stroke-width="${w.kind==='bare'?3:4}"/><path d="M${end.x} ${end.y}h9" stroke="#b57d48" stroke-width="3"/></g>`;}).join('')}

 ${s.connectors.filter(c=>c.boxId===id).map(c=>{const p=panel?c:connectorPoint(c);return `<g data-wire-target="${c.id}" data-wire-nut="${c.id}" ${c.kind==='ground'?`data-ground-connector="${c.id}"`:''} role="button" tabindex="0" aria-label="${c.kind} wire nut ${c.id}"><title>Drag ${c.kind} wire nut · ${c.endIds.length}/${c.capacity} conductors</title>${looseWireNut(p.x,p.y)}<circle data-move-wire-nut="${c.id}" cx="${p.x}" cy="${p.y}" r="24" fill="transparent"/><text class="wb-nut-tooltip" x="${p.x}" y="${p.y-38}" text-anchor="middle" font-size="12" pointer-events="none">${c.kind} · ${c.endIds.length}/${c.capacity} · drag cap</text></g>`;}).join('')}



 <text x="${panel?230:175}" y="${panel?65:65}" font-size="16">${panel?'Subpanel · isolated neutral / bonded ground':'Steel box · splices and bonds stay inside'}</text>

 ${s.pigtails.filter(t=>t.boxId===id).map((t,i)=>`<text x="480" y="${535+i*20}" font-size="11" pointer-events="none">${t.role==='device'?'Device ground → green screw':'Box bond → steel screw'}</text>`).join('')}
 ${[...targets].filter(([id])=>!s.connectors.some(c=>c.id===id)).map(([id,p])=>{const node=wiringNodes(s).find(t=>t.id===id)!;return `<g data-wire-target="${id}" role="button" tabindex="0" aria-label="${id} ${node.kind} electrical terminal"><circle cx="${p.x}" cy="${p.y}" r="22" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="${draft?.target===id?16:11}" fill="none" stroke="${draft?.target===id?'#458438':s.connections.some(c=>c.toId===id)?'#567b48':'#bd9c56'}" stroke-width="${draft?.target===id?4:2}" stroke-dasharray="${draft?.target===id?'0':'3 3'}" pointer-events="none"/></g>`;}).join('')} ${wires.map(w=>{const end=draft?.endId===w.id?draft.point:ends.get(w.id)!;return `<g data-drag-end="${w.id}" role="button" tabindex="0" aria-label="Drag ${s.pigtails.find(t=>t.id===w.wireId)?.role??w.kind} ${w.id} conductor end"><circle cx="${end.x}" cy="${end.y}" r="${s.connectors.some(c=>c.endIds.includes(w.id))?8:18}" fill="transparent"/><circle cx="${end.x}" cy="${end.y}" r="${s.connectors.some(c=>c.endIds.includes(w.id))?4:7}" fill="#b57d48" stroke="${draft?.target===w.id?'#458438':selected===w.id?'#aa761d':'#f7f3df'}" stroke-width="2"/></g>`;}).join('')} ${s.spliceGroups.filter(g=>g.boxId===id).map(group=>{const g={...group,...connectorPoint(group)};return `<g data-splice-group="${g.id}"><rect x="${g.x-44}" y="${g.y-30}" width="88" height="76" rx="12" fill="none" stroke="#bb9130" stroke-dasharray="5 3"/><foreignObject x="${g.x-80}" y="${g.y+35}" width="160" height="66"><button xmlns="http://www.w3.org/1999/xhtml" data-install-wire-nut="${g.id}">Install wire nut · ${g.endIds.length} × 14 AWG</button></foreignObject><text x="${g.x}" y="${g.y-40}" text-anchor="middle" font-size="12" pointer-events="none">Grouped only · not connected</text></g>`;}).join('')}
 <text x="140" y="${panel?760:690}" font-size="14">Drag ends to terminals, or bring matching loose ends together and install a wire nut.</text></svg><p data-branch-tester data-status="${tester.status}"><strong>${device?.kind==='lampholder'?'Fixture terminal assembly':tester.status+' · '+tester.volts+'V'}</strong> — ${device?.kind==='lampholder'?'Hot and neutral connections share the circuit graph. Bond the steel box separately. Lamp operation will be added in a later phase.':tester.message}</p>`;
}
export function mainWiring(s:Workbench) {
 const world=(id:string):Point=>{const p=s.components.find(p=>p.id===id)!;const parent=s.components.find(c=>c.id===p.parentId);return{x:p.x+(parent?.x??0)+(p.pulledOut?200:0),y:p.y+(parent?.y??0)};};
 const target=(id:string):Point|null=>{for(const p of s.components){const t=p.terminals.find(t=>t.id===id);if(t){const pos=world(p.id);return{x:pos.x+t.x,y:pos.y+t.y};}}const c=s.connectors.find(c=>c.id===id);if(c){const pos=world(c.boxId);const q=connectorPoint(c);return{x:pos.x+(q.x-140)/1.9,y:pos.y+(q.y-90)/1.9};}return null;};
 return `<g data-main-wiring pointer-events="none">${s.connectors.map(c=>{const p=world(c.boxId),q=connectorPoint(c);return `<g data-main-connector="${c.id}">${looseWireNut(p.x+(q.x-140)/1.9,p.y+(q.y-90)/1.9)}</g>`;}).join('')}${wireEnds(s).filter(w=>w.end.termination).map(w=>{const to=target(w.end.termination!)!;let from:Point;const c=s.cables.find(c=>c.conductors.some(v=>v.id===w.wireId));if(c){const end=c.from.boxId===w.end.boxId?c.from:c.to,box=s.components.find(p=>p.id===end.boxId)!,p=entriesFor(box)[end.entryId];from={x:box.x+p.x-p.side*30,y:box.y+p.y};}else{const box=world(w.end.boxId);from={x:box.x+80,y:box.y+240};}const box=s.components.find(p=>p.id===w.end.boxId)!;const route=box.kind==='panel'?panelWireRoute(from,to,{x:box.x,y:box.y,scale:1},w.kind,wireEnds(s).findIndex(e=>e.end.id===w.end.id)):`M${from.x} ${from.y}Q${from.x+50} ${to.y+15} ${to.x} ${to.y}`;return `<g data-main-end="${w.end.id}" data-connection-target="${w.end.termination}"><path d="${route}" fill="none" stroke="#666b60" stroke-width="5"/><path d="${route}" fill="none" stroke="${w.kind==='black'?'#30372e':w.kind==='white'?'#fffef0':'#b17e49'}" stroke-width="${w.kind==='bare'?2:3}"/></g>`;}).join('')}</g>`;
}

/** Side gutters and the lower wiring trough avoid breaker bodies and protected source. */
export function panelRoutePoints(origin:Point,end:Point,base:{x:number;y:number;scale:number},kind:string,lane=0):Point[] {
 const local=(p:Point)=>({x:(p.x-base.x)/base.scale,y:(p.y-base.y)/base.scale});const a=local(origin),b=local(end),offset=(lane%6)*1.4;
 const startLeft=a.x<130,targetLeft=kind==='white'||(kind==='black'&&b.x<130),left=20+offset,right=244-offset,bottom=326+offset;
 const gutter=startLeft?left:right,exit=targetLeft?left:right;
 const points=[a,{x:gutter,y:a.y}];
 if(startLeft!==targetLeft)points.push({x:gutter,y:bottom},{x:exit,y:bottom});
 points.push({x:exit,y:b.y});
 // Approach breaker outputs from their outer sides, away from handles and labels.
 if(kind==='black')points.push({x:targetLeft?62:202,y:b.y});
 points.push(b);return points.map(p=>({x:base.x+p.x*base.scale,y:base.y+p.y*base.scale}));
}
export function panelWireRoute(origin:Point,end:Point,base:{x:number;y:number;scale:number},kind:string,lane=0) {
 const p=panelRoutePoints(origin,end,base,kind,lane);let d=`M${p[0]!.x} ${p[0]!.y}`;
 for(let i=1;i<p.length-1;i++){const a=p[i-1]!,b=p[i]!,c=p[i+1]!,before=Math.hypot(b.x-a.x,b.y-a.y),after=Math.hypot(c.x-b.x,c.y-b.y),r=Math.min(8*base.scale,before/2,after/2);if(!before||!after){d+=`L${b.x} ${b.y}`;continue;}const x=b.x+(a.x-b.x)*r/before,y=b.y+(a.y-b.y)*r/before,u=b.x+(c.x-b.x)*r/after,v=b.y+(c.y-b.y)*r/after;d+=`L${x} ${y}Q${b.x} ${b.y} ${u} ${v}`;}
 return d+`L${end.x} ${end.y}`;
}

/** Legacy connector coordinates are projected inside the box without changing
 * connection state or discarding a student's stored placement. */
export function connectorPoint(c:{x:number;y:number}) {return{x:Math.max(220,Math.min(390,c.x)),y:Math.max(185,Math.min(500,c.y))};}
export function boxWireRoute(origin:Point,end:Point,targetId:string|null,l:ReturnType<typeof wiringLayout>,lane:number,nut=false) {
 const owner=l.devices.find(p=>p.terminals.some(t=>t.id===targetId)),deviceTerminal=owner?.terminals.find(t=>t.id===targetId),pos=owner?l.positions.get(owner.id)!:l.d;
 if(deviceTerminal){const right=deviceTerminal.kind==='hot',spread=(lane%5)*12;
  if(right){const upper=deviceTerminal.y<150,rail=upper?115-spread:605+spread/2,outside=pos.x+165*pos.scale;return `M${origin.x} ${origin.y}C${origin.x+45} ${origin.y} ${origin.x+45} ${rail} ${origin.x+90} ${rail}H${outside-18}Q${outside} ${rail} ${outside} ${rail+(upper?18:-18)}V${end.y+(upper?-18:18)}Q${outside} ${end.y} ${outside-18} ${end.y}L${end.x} ${end.y}`;}
  const approach=end.x-55;if(l.devices.length>1){const rail=deviceTerminal.y<150?95-(lane%5)*8:620+(lane%5)*5;return `M${origin.x} ${origin.y}Q${origin.x+35} ${rail} ${origin.x+65} ${rail}H${approach}V${end.y}H${end.x}`;}return `M${origin.x} ${origin.y}C${origin.x+40} ${origin.y+15} ${approach-25} ${end.y} ${approach} ${end.y}L${end.x} ${end.y}`;
 }
 return `M${origin.x} ${origin.y}C${origin.x+(origin.x<end.x?35:-35)} ${origin.y+25} ${nut?end.x:end.x-30} ${nut?end.y+45:end.y-20} ${end.x} ${end.y}`;
}
