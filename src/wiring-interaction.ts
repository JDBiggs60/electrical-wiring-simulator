import type {Workbench} from './cable-workbench-model';
import {connectEnd,disconnect,wireEnds,wiringNodes,addPigtail,addConnector,pullDevice,mountPulledDevice,testReceptacle} from './branch-wiring';
import {wiringInspection,wiringLayout,type Point} from './wiring-view';
export function wiringInspector(dialog:HTMLDialogElement,s:Workbench,record:(before:Workbench)=>void,update:()=>void,getId:()=>string|null) {
 let selected:string|null=null,draft:{endId:string;point:Point;target:string|null;pointer:number}|null=null,deviceDrag:{point:Point;pointer:number;offset:Point}|null=null;
 const controls=document.createElement('div');controls.className='wb-wire-controls';controls.innerHTML='<button data-wire-action="pull">Pull Device Out</button><button data-wire-action="device-tail">Add device ground pigtail</button><button data-wire-action="box-tail">Add box bond pigtail</button><button data-wire-action="connector">Add ground connector</button><button data-wire-action="disconnect">Disconnect</button><button data-wire-action="undo">Undo</button><button data-wire-action="redo">Redo</button><button data-wire-action="reset">Reset Wiring</button><button data-wire-action="check">Check Wiring</button><button data-wire-action="power">Turn Simulated Power On</button><span data-breaker-controls></span><p class="wb-wire-message" role="status">Pull the receptacle out before wiring. Drag black to brass, white to silver; join bare ground and two pigtails in a connector.</p>';
 dialog.querySelector('header')!.after(controls);const message=controls.querySelector('.wb-wire-message')!;
 function render(){const id=getId();if(!id||!s.components.some(p=>p.id===id))return;const panel=s.components.find(p=>p.id===id)?.kind==='panel';
  for(const a of ['pull','device-tail','box-tail','connector'])controls.querySelector<HTMLButtonElement>(`[data-wire-action="${a}"]`)!.hidden=panel;
  controls.querySelector<HTMLButtonElement>('[data-wire-action="undo"]')!.disabled=!historyCan('undo');controls.querySelector<HTMLButtonElement>('[data-wire-action="redo"]')!.disabled=!historyCan('redo');
  controls.querySelector('[data-wire-action="power"]')!.textContent=s.power?'Turn Simulated Power Off':'Turn Simulated Power On';
  controls.querySelector('[data-breaker-controls]')!.innerHTML=panel?s.components.find(p=>p.id===id)!.panel!.spaces.filter(p=>p.breaker).map(p=>`<button data-breaker="${p.breaker!.id}">15A breaker ${p.position}: ${p.breaker!.on?'ON':'OFF'}</button>`).join(''):'';
  dialog.querySelector('.wb-inspection-art')!.innerHTML=wiringInspection(s,id,selected,draft??undefined,deviceDrag?.point);
 }
 // The existing shared workbench buttons are the history authority.
 const historyCan=(action:string)=>!document.querySelector<HTMLButtonElement>(`.wb-header [data-wb-action="${action}"]`)!.disabled;
 const point=(e:PointerEvent):Point=>{const svg=dialog.querySelector<SVGSVGElement>('[data-wiring-canvas]')!,p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());return{x:p.x,y:p.y};};
 const nearest=(p:Point,endId:string,compatible=true)=>{const wire=wireEnds(s).find(w=>w.end.id===endId)!;let best:string|null=null,distance=30;for(const [id,pos]of wiringLayout(s,getId()!).targets){const node=wiringNodes(s).find(n=>n.id===id);if(!node||node.boxId!==wire.end.boxId||(compatible&&(wire.kind==='bare')!==(node.kind==='ground')))continue;const d=Math.hypot(pos.x-p.x,pos.y-p.y);if(d<distance){distance=d;best=id;}}return best;};
 dialog.addEventListener('pointerdown',e=>{if(e.button!==0)return;const el=e.target as Element;if(el.closest('button'))return;
  const end=el.closest('[data-drag-end]')?.getAttribute('data-drag-end'),target=el.closest('[data-wire-target]')?.getAttribute('data-wire-target'),wire=el.closest('[data-wiring-wire]')?.getAttribute('data-wiring-wire');
  const attached=target?s.connections.find(c=>c.toId===target)?.fromId:undefined;
  const endId=end??(target&&!s.connectors.some(c=>c.id===target)?attached:undefined);
  if(endId){e.preventDefault();selected=endId;draft={endId,point:point(e),target:null,pointer:e.pointerId};dialog.setPointerCapture(e.pointerId);render();return;}
  if(target||wire){selected=wire??target!;message.textContent='Selected. Drag the copper end to reconnect, or choose Disconnect.';render();return;}
  const device=el.closest('[data-inspection-device]');if(device&&s.components.find(p=>p.id===device.getAttribute('data-inspection-device'))?.pulledOut){e.preventDefault();const start=wiringLayout(s,getId()!).d,p=point(e);deviceDrag={point:start,pointer:e.pointerId,offset:{x:p.x-start.x,y:p.y-start.y}};dialog.setPointerCapture(e.pointerId);render();}
 });
 dialog.addEventListener('pointermove',e=>{if(draft&&draft.pointer===e.pointerId){e.preventDefault();draft.point=point(e);draft.target=nearest(draft.point,draft.endId);render();}else if(deviceDrag?.pointer===e.pointerId){const p=point(e);deviceDrag.point={x:p.x-deviceDrag.offset.x,y:p.y-deviceDrag.offset.y};render();}});
 function finish(e:PointerEvent,cancel=false){if(draft?.pointer===e.pointerId){const before=structuredClone(s);const target=cancel?null:nearest(point(e),draft.endId)??nearest(point(e),draft.endId,false);const error=target?connectEnd(s,draft.endId,target):'No valid target. Use an electrical terminal or ground connector; mounting screws do not accept wires.';if(!error)record(before);const wire=wireEnds(s).find(w=>w.end.id===draft!.endId),node=wiringNodes(s).find(t=>t.id===target);const wrong=node&&wire&&((wire.kind==='black'&&node.kind==='neutral')||(wire.kind==='white'&&node.kind==='hot'));message.textContent=error??(wrong?'Insulated conductor attached to the wrong polarity terminal. Check Wiring will identify the fault.':'Conductor connected. The shared circuit continuity has been updated.');draft=null;update();render();}else if(deviceDrag?.pointer===e.pointerId){const before=structuredClone(s),l=wiringLayout(s,getId()!),p=point(e);if(!cancel&&p.x>l.base.x-20&&p.x<l.base.x+280&&p.y>l.base.y-30&&p.y<l.base.y+460){mountPulledDevice(s,getId()!);record(before);message.textContent='Receptacle mounted; all wires remain attached.';}else message.textContent='Return the receptacle to the green mounting outline.';deviceDrag=null;update();render();}}
 dialog.addEventListener('pointerup',e=>finish(e));dialog.addEventListener('pointercancel',e=>finish(e,true));
 controls.addEventListener('click',e=>{const button=(e.target as Element).closest<HTMLButtonElement>('button');if(!button)return;const id=getId()!;const name=button.dataset.wireAction;const before=structuredClone(s);let error:string|null=null;
  if(name==='undo'||name==='redo'){document.querySelector<HTMLButtonElement>(`.wb-header [data-wb-action="${name}"]`)!.click();selected=null;render();return;}
  if(button.dataset.breaker){for(const p of s.components)for(const space of p.panel?.spaces??[])if(space.breaker?.id===button.dataset.breaker)space.breaker.on=!space.breaker.on;}
  else if(name==='pull')error=pullDevice(s,id);
  else if(name==='device-tail'||name==='box-tail')error=addPigtail(s,id,name==='device-tail'?'device':'box');
  else if(name==='connector')error=addConnector(s,id);
  else if(name==='disconnect')error=disconnect(s,selected??'');
  else if(name==='reset'){for(const {end}of wireEnds(s))end.termination=null;for(const p of s.components)for(const t of p.terminals)t.termination=null;s.connections=[];s.pigtails=[];s.connectors=[];s.power=false;for(const p of s.components)for(const b of p.panel?.spaces??[])if(b.breaker)b.breaker.on=false;}
  else if(name==='power')s.power=!s.power;
  else if(name==='check'){const t=testReceptacle(s);message.textContent=`${t.status}: ${t.message}`;render();return;}
  if(!error)record(before);message.textContent=error??(name==='pull'?'Receptacle pulled out. Drag conductor ends to its side terminals.':name?.includes('tail')?'Pigtail created with two loose ends. Join one to the ground connector and the other to its grounding screw.':'Shared circuit updated.');update();render();
 });
 dialog.addEventListener('close',()=>{draft=null;deviceDrag=null;selected=null;});
 return {render,disconnectSelected:()=>{const before=structuredClone(s);const error=disconnect(s,selected??'');if(!error)record(before);message.textContent=error??'Disconnected.';update();render();}};
}
