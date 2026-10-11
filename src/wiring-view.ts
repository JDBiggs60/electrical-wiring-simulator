import {steelDeviceBox,pulledToggle,nmJacket,nmBoxConnector,looseWireNut} from './hardware-art.ts';
import {duplexReceptacle} from './receptacle-art.ts';
import {breakerPanel} from './panel-art.ts';
import {entriesFor,inspectBox,type Workbench} from './cable-workbench-model.ts';
import {wireEnds,wiringNodes,testReceptacle} from './branch-wiring.ts';
export interface Point {x:number;y:number}
export function terminalStateArt(s:Workbench,art:string) {
 return art.replace(/ data-terminal-state="[^"]*"/g,'').replace(/data-terminal-id="([^"]+)"/g,(all,id)=>`${all} data-terminal-state="${s.components.flatMap(p=>p.terminals).find(t=>t.id===id)?.termination?'connected':'disconnected'}"`);
}
export function wiringLayout(s:Workbench,id:string) {
 const enclosure=s.components.find(p=>p.id===id)!;const panel=enclosure.kind==='panel',base={x:panel?230:180,y:100,scale:1.5};
 const device=s.components.find(p=>p.parentId===id),d=device?.pulledOut?{x:650,y:140,scale:1.2}:{x:base.x+35*base.scale,y:base.y-6*base.scale,scale:base.scale};
 const targets=new Map<string,Point>();for(const p of s.components.filter(p=>p.id===id||p.parentId===id))for(const t of p.terminals){const pos=p.id===id?base:d;targets.set(t.id,{x:pos.x+t.x*pos.scale,y:pos.y+t.y*pos.scale});}
 s.connectors.filter(c=>c.boxId===id).forEach(c=>targets.set(c.id,{x:c.x,y:c.y}));
 const wires=inspectBox(s,id).flatMap(({cable,entry,conductors},i)=>{
  const p=entriesFor(enclosure)[entry.entryId];return conductors.map((w,j)=>{const end=w.ends.find(e=>e.boxId===id)!;return {id:end.id,kind:w.kind,origin:{x:base.x+(p.x-p.side*30)*base.scale,y:base.y+(p.y+(j-1)*7)*base.scale},loose:{x:panel?370+j*44:440+i*80,y:panel?640+i*35:240+j*70},wireId:w.id,cableId:cable.id};});
 });
 s.pigtails.filter(w=>w.boxId===id).forEach((w,i)=>{const start={x:360+i*180,y:570};w.ends.forEach((e,j)=>wires.push({id:e.id,kind:'bare',origin:start,loose:{x:start.x+(j?60:-60),y:520},wireId:w.id,cableId:''}));});
 const ends=new Map(wires.map(w=>[w.id,w.loose]));for(const w of wires){const to=wireEnds(s).find(e=>e.end.id===w.id)?.end.termination;if(to&&targets.has(to)){const pos=targets.get(to)!;const c=s.connectors.find(c=>c.id===to);ends.set(w.id,c?{x:pos.x+(c.endIds.indexOf(w.id)-(c.endIds.length-1)/2)*12,y:pos.y+15}:pos);}}
 for(const g of s.spliceGroups.filter(g=>g.boxId===id))g.endIds.forEach((end,i)=>ends.set(end,{x:g.x+(i-(g.endIds.length-1)/2)*20,y:g.y}));
 return {enclosure,device,base,d,targets,wires,ends};
}
export function wiringInspection(s:Workbench,id:string,selected:string|null,draft?:{endId:string;point:Point;target:string|null},deviceDraft?:Point) {
 const l=wiringLayout(s,id),{enclosure,device,base,d,targets,wires,ends}=l,panel=enclosure.kind==='panel';
 const body=panel?breakerPanel(id,true,enclosure):`<g transform="scale(.65) translate(-48 -50)">${steelDeviceBox().replaceAll('switch.',`${id}.`)}</g>`;
 const deviceArt=device?device.kind==='receptacle'?duplexReceptacle(device.id):pulledToggle().replaceAll('switch.',`${device.id}.`):'';
 const tester=testReceptacle(s,device?.kind==='receptacle'?device.id:undefined);
 return `<svg data-wiring-canvas viewBox="0 0 1000 800" role="group" aria-label="Direct branch-circuit wiring workspace"><g transform="translate(${base.x} ${base.y}) scale(${base.scale})">${terminalStateArt(s,body)}${inspectBox(s,id).map(({cable,entry})=>{const p=entriesFor(enclosure)[entry.entryId];return `<g data-inspect-cable="${cable.id}" data-entry-id="${entry.entryId}">${nmJacket(`M${p.x+p.side*75} ${p.y}H${p.x-p.side*30}`,cable.id,11)}<g transform="translate(${p.x} ${p.y}) scale(.65)${p.side===1?' rotate(180)':''}">${nmBoxConnector(0,0)}</g></g>`;}).join('')}</g>
 ${device?`<g data-inspection-device="${device.id}" transform="translate(${deviceDraft?.x??d.x} ${deviceDraft?.y??d.y}) scale(${d.scale})">${terminalStateArt(s,deviceArt)}</g>${device.pulledOut?`<rect data-device-mount-target x="${base.x+35*base.scale}" y="${base.y-6*base.scale}" width="162" height="453" class="wb-snap"/><text x="${base.x}" y="65" font-size="15">Drag the pulled-out device onto the green outline to mount.</text>`:''}`:''}
 ${wires.map(w=>{const end=draft?.endId===w.id?draft.point:ends.get(w.id)!;const connection=s.connections.find(c=>c.fromId===w.id);const nut=connection?s.connectors.find(c=>c.id===connection.toId):undefined;const route=panel?panelWireRoute(w.origin,end,base,w.kind,wires.indexOf(w)): `M${w.origin.x} ${w.origin.y}C${w.origin.x+60} ${w.origin.y+25} ${nut?end.x:end.x-40} ${nut?end.y+60:end.y-30} ${end.x} ${end.y}`;const color=w.kind==='black'?'#30362f':w.kind==='white'?'#fffdee':'#b57d48';return `<g data-conductor-id="${w.wireId}" data-end-id="${w.id}" data-termination="${connection?'connected':'disconnected'}" data-connection-target="${connection?.toId??''}" data-wiring-wire="${w.id}"><title>${w.id} · ${w.kind} · ${connection?'attached to '+connection.toId:'loose, drag its copper end'}</title><path d="${route}" fill="none" stroke="${selected===w.id?'#d19d24':'#656a5e'}" stroke-width="${selected===w.id?10:6}"/><path d="${route}" fill="none" stroke="${color}" stroke-width="${w.kind==='bare'?3:4}"/><path d="M${end.x} ${end.y}h9" stroke="#b57d48" stroke-width="3"/></g>`;}).join('')}
 ${wires.map(w=>{const end=draft?.endId===w.id?draft.point:ends.get(w.id)!;return `<g data-drag-end="${w.id}" role="button" tabindex="0" aria-label="Drag ${w.id} ${w.kind} conductor end"><circle cx="${end.x}" cy="${end.y}" r="18" fill="transparent"/><circle cx="${end.x}" cy="${end.y}" r="8" fill="#b57d48" stroke="${draft?.target===w.id?'#458438':selected===w.id?'#aa761d':'#f7f3df'}" stroke-width="2"/></g>`;}).join('')}
 ${s.connectors.filter(c=>c.boxId===id).map(c=>`<g data-wire-target="${c.id}" data-wire-nut="${c.id}" ${c.kind==='ground'?`data-ground-connector="${c.id}"`:''} role="button" tabindex="0" aria-label="${c.kind} wire nut ${c.id}">${looseWireNut(c.x,c.y)}<circle cx="${c.x}" cy="${c.y}" r="26" fill="transparent"/><rect data-move-wire-nut="${c.id}" x="${c.x-25}" y="${c.y+18}" width="50" height="22" rx="5" fill="#f4e1ad" stroke="#887c54"/><text x="${c.x}" y="${c.y+33}" text-anchor="middle" font-size="11" pointer-events="none">Drag</text><text x="${c.x}" y="${c.y+55}" text-anchor="middle" font-size="13" pointer-events="none">${c.kind} · ${c.endIds.length}/${c.capacity}</text></g>`).join('')}
 ${s.spliceGroups.filter(g=>g.boxId===id).map(g=>`<g data-splice-group="${g.id}"><rect x="${g.x-44}" y="${g.y-30}" width="88" height="76" rx="12" fill="none" stroke="#bb9130" stroke-dasharray="5 3"/><foreignObject x="${g.x-80}" y="${g.y+35}" width="160" height="66"><button xmlns="http://www.w3.org/1999/xhtml" data-install-wire-nut="${g.id}">Install wire nut · ${g.endIds.length} × 14 AWG</button></foreignObject><text x="${g.x}" y="${g.y-40}" text-anchor="middle" font-size="12">Grouped only · not connected</text></g>`).join('')}

 ${s.pigtails.filter(w=>w.boxId===id).map((w,i)=>`<text x="${360+i*180}" y="592" text-anchor="middle" font-size="12">${w.role==='device'?'Device ground pigtail':'Steel-box bond pigtail'}</text><text x="${300+i*180}" y="500" text-anchor="middle" font-size="10">Splice end</text><text x="${420+i*180}" y="500" text-anchor="middle" font-size="10">${w.role==='device'?'Device end':'Box end'}</text>`).join('')}
 ${[...targets].filter(([id])=>!s.connectors.some(c=>c.id===id)).map(([id,p])=>{const node=wiringNodes(s).find(t=>t.id===id)!;return `<g data-wire-target="${id}" role="button" tabindex="0" aria-label="${id} ${node.kind} electrical terminal"><circle cx="${p.x}" cy="${p.y}" r="22" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="${draft?.target===id?16:11}" fill="none" stroke="${draft?.target===id?'#458438':s.connections.some(c=>c.toId===id)?'#567b48':'#bd9c56'}" stroke-width="${draft?.target===id?4:2}" stroke-dasharray="${draft?.target===id?'0':'3 3'}" pointer-events="none"/></g>`;}).join('')}
 <text x="120" y="760" font-size="14">Drag ends to terminals, or bring matching loose ends together and install a wire nut.</text></svg><p data-branch-tester data-status="${tester.status}"><strong>${tester.status} · ${tester.volts}V</strong> — ${tester.message}</p>`;
}
export function mainWiring(s:Workbench) {
 const world=(id:string):Point=>{const p=s.components.find(p=>p.id===id)!;const parent=s.components.find(c=>c.id===p.parentId);return{x:p.x+(parent?.x??0)+(p.pulledOut?200:0),y:p.y+(parent?.y??0)};};
 const target=(id:string):Point|null=>{for(const p of s.components){const t=p.terminals.find(t=>t.id===id);if(t){const pos=world(p.id);return{x:pos.x+t.x,y:pos.y+t.y};}}const c=s.connectors.find(c=>c.id===id);if(c){const pos=world(c.boxId);return{x:pos.x+(c.x-180)/1.5,y:pos.y+(c.y-100)/1.5};}return null;};
 return `<g data-main-wiring pointer-events="none">${s.connectors.map(c=>{const p=world(c.boxId);return `<g data-main-connector="${c.id}">${looseWireNut(p.x+(c.x-180)/1.5,p.y+(c.y-100)/1.5)}</g>`;}).join('')}${wireEnds(s).filter(w=>w.end.termination).map(w=>{const to=target(w.end.termination!)!;let from:Point;const c=s.cables.find(c=>c.conductors.some(v=>v.id===w.wireId));if(c){const end=c.from.boxId===w.end.boxId?c.from:c.to,box=s.components.find(p=>p.id===end.boxId)!,p=entriesFor(box)[end.entryId];from={x:box.x+p.x-p.side*30,y:box.y+p.y};}else{const box=world(w.end.boxId);from={x:box.x+80,y:box.y+240};}const box=s.components.find(p=>p.id===w.end.boxId)!;const route=box.kind==='panel'?panelWireRoute(from,to,{x:box.x,y:box.y,scale:1},w.kind,wireEnds(s).findIndex(e=>e.end.id===w.end.id)):`M${from.x} ${from.y}Q${from.x+50} ${to.y+15} ${to.x} ${to.y}`;return `<g data-main-end="${w.end.id}" data-connection-target="${w.end.termination}"><path d="${route}" fill="none" stroke="#666b60" stroke-width="5"/><path d="${route}" fill="none" stroke="${w.kind==='black'?'#30372e':w.kind==='white'?'#fffef0':'#b17e49'}" stroke-width="${w.kind==='bare'?2:3}"/></g>`;}).join('')}</g>`;
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
