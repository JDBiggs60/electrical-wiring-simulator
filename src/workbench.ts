import { wiringInspector } from './wiring-interaction';
import { mainWiring, terminalStateArt } from './wiring-view';
import { testReceptacle, pruneWiring } from './branch-wiring';
import { breakerPanel } from './panel-art';
import { duplexReceptacle } from './receptacle-art';
import './workbench.css';
import { isEnclosure, entryPosition, entryFree, nearestEntry, installCable, cableRoute, unmountSwitch, type CableEnd } from './cable-workbench-model';
import { steelDeviceBox, pulledToggle, nmJacket, nmBoxConnector } from './hardware-art';
import { addPart, createWorkbench, deletePart, mountOffset, mountSwitch, partSize, snapTarget, workbenchHistory, worldPosition, type PartKind, type Workbench } from './cable-workbench-model';

export function mountWorkbench(cableMode = false) {
  const state = createWorkbench(), history = workbenchHistory(state);
  let cableTool = false, inspectionId: string | null = null;
  let pending: { source: CableEnd; point: {x:number;y:number}; pointer: number | null; moved: boolean; parked?: boolean } | null = null;
  let selected: string | null = null;
  let drag: { id: string; before: Workbench; dx: number; dy: number; pointer: number; fromTray: boolean; moved: boolean } | null = null;
  let lastTap: {id:string;time:number;x:number;y:number} | null = null;
  let width = 1000, height = 700;
  const art = (kind: PartKind) => kind === 'box'
    ? `<g transform="scale(.65) translate(-48 -50)">${steelDeviceBox()}</g>`
    : kind === 'panel' ? breakerPanel('tray-panel') : kind === 'receptacle' ? duplexReceptacle('tray-receptacle') : `<g transform="scale(.956) translate(-35 0)">${pulledToggle()}</g>`;
  document.body.classList.add('workbench-page');
  document.querySelector('#app')!.innerHTML = `<main class="wb-shell"><header class="wb-header"><div><span>OLD CARPENTER · ${cableMode ? 'PHASE 3E' : 'PHASE 3A'}</span><h1>${cableMode ? 'Cable installation workbench' : 'Drag & snap workbench'}</h1></div><nav aria-label="Workbench actions"><button data-wb-action="undo">Undo</button><button data-wb-action="redo">Redo</button><button data-wb-action="delete">Delete</button><button data-wb-action="reset">Reset</button>${cableMode ? '<button data-wb-action="unmount" hidden>Unmount switch</button><button data-wb-action="inspect" hidden>Inspect box</button>' : ''}${cableMode?'<button data-wb-action="check">Check Wiring</button><button data-wb-action="power">Turn Simulated Power On</button>':''}<a href="?">Wiring lesson ↗</a></nav></header><section class="wb-stage" aria-label="Assembly workbench"><svg id="wb-canvas" role="group" aria-label="Drag components onto this empty workbench"></svg><details class="wb-tray" open><summary>Parts tray</summary><p>Drag a part onto the bench</p><div>${(cableMode ? ['box','switch','receptacle'] as PartKind[] : ['box','switch'] as PartKind[]).map(kind => `<button class="wb-part" data-tray-part="${kind}" aria-label="Drag ${kind === 'box' ? 'steel electrical box' : kind === 'receptacle' ? 'duplex receptacle' : 'single-pole switch'} from parts tray"><svg viewBox="0 0 ${partSize[kind].width} ${partSize[kind].height}" aria-hidden="true">${art(kind)}</svg><span>${kind === 'box' ? 'Steel box' : kind === 'receptacle' ? 'Duplex Receptacle' : 'Toggle switch'}</span></button>`).join('')}${cableMode ? '<button class="wb-part wb-cable-part" data-cable-tool aria-label="14/2 NM-B cable tool"><svg viewBox="0 0 80 100" aria-hidden="true"><path d="M15 85V35Q15 15 40 15T65 35V85" fill="none" stroke="#777" stroke-width="14"/><path d="M15 85V35Q15 15 40 15T65 35V85" fill="none" stroke="#e9dfb9" stroke-width="11"/></svg><span>14/2 NM-B</span></button>' : ''}</div>${cableMode?'<button class="wb-part wb-panel-part" data-tray-part="panel" aria-label="Drag breaker panel from parts tray"><svg viewBox="0 0 260 420" aria-hidden="true">'+breakerPanel('tray-panel')+'</svg><span>Breaker Panel<small>Advanced · isolated-neutral subpanel</small></span></button><p>Basic 120V lessons: use Wiring lesson ↗</p>':''}</details><p class="wb-empty">${cableMode ? 'Drag boxes or an advanced panel here. Select NM-B, then drag between the highlighted knockout entries.' : 'Drag a steel box here, then drag a switch onto its mounting position.'}</p><div class="wb-cable-label" hidden></div>${cableMode ? '<div class="wb-cable-guide" role="status"></div>' : ''}</section><footer><p id="wb-status" role="status">Empty workbench. Drag parts from the tray using a mouse or touch.</p><span data-main-tester>${cableMode ? 'Cable installation only · disconnected conductors' : 'Assembly prototype · no electrical wiring yet'}</span></footer></main>`;
  const stage = document.querySelector<HTMLElement>('.wb-stage')!;
  const canvas = document.querySelector<SVGSVGElement>('#wb-canvas')!;
  const status = document.querySelector('#wb-status')!;
  const inspection = document.createElement('dialog'); inspection.className = 'wb-inspection';
  inspection.innerHTML = '<header><h2>Box inspection</h2><button data-close-inspection>Return to workbench</button></header><div class="wb-inspection-art"></div>';
  if (cableMode) document.body.append(inspection);
  inspection.querySelector('[data-close-inspection]')!.addEventListener('click',()=>inspection.close());
  const wiring = cableMode ? wiringInspector(inspection,state,before=>history.record(before),()=>render(),()=>inspectionId) : null;
  function inspect(id: string) { inspectionId=id; render(); wiring?.render();if (!inspection.open) inspection.showModal(); }
  function render() {
    const moving = state.components.find(p => p.id === drag?.id);
    const target = moving ? snapTarget(state,moving) : undefined;
    canvas.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const cableTarget = pending ? nearestEntry(state,pending.point,pending.source) : null;
    const cablePaths = cableMode ? state.cables.map(c => { const route=cableRoute(state,c); const clipped=route.points.some(p=>p.x<0||p.y<0||p.x>width||p.y>height); return `<g data-installed-cable="${c.id}" data-connection-count="${state.connections.filter(e=>c.conductors.some(w=>w.ends.some(end=>end.id===e.fromId))).length}" data-conductor-ids="${c.conductors.map(w=>w.id).join(' ')}" data-from-box="${c.from.boxId}" data-to-box="${c.to.boxId}" data-from-entry="${c.from.entryId}" data-to-entry="${c.to.entryId}" data-route-issue="${route.issue||clipped}" role="button" tabindex="0" aria-label="Select ${c.id}, ${c.type}" class="wb-installed-cable"><path d="${route.path}" fill="none" stroke="${selected===c.id?'#a07b26':'transparent'}" stroke-width="23" stroke-linejoin="round"/>${nmJacket(route.path,c.id,10).replace('Switch box to ceiling box',`${c.from.boxId} to ${c.to.boxId}`)}${route.issue||clipped?`<text x="${entryPosition(state,c.from)!.x+12}" y="${entryPosition(state,c.from)!.y-28}" class="wb-route-warning">Routing issue · endpoints retained</text>`:''}<path d="${route.path}" fill="none" stroke="transparent" stroke-width="28" pointer-events="stroke"/></g>`; }).join('') : '';
    canvas.innerHTML = `${cablePaths}${state.components.filter(p => !p.parentId).map(root => {
      return [root,...state.components.filter(p => p.parentId === root.id)].map(part => {
        const p = worldPosition(state,part), size = partSize[part.kind];
        return `<g data-component="${part.id}" data-kind="${part.kind}" data-parent="${part.parentId ?? ''}" data-x="${p.x}" data-y="${p.y}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${part.kind === 'box' ? 'Steel box' : part.kind === 'panel' ? 'Breaker panel' : part.kind === 'receptacle' ? 'Duplex receptacle' : 'Toggle switch'} ${part.id}${part.parentId ? ', mounted; drag to move assembly' : ', drag to move'}" aria-pressed="${selected === part.id}" class="wb-component"><rect width="${size.width}" height="${size.height}" fill="transparent"/>${terminalStateArt(state,part.kind === 'panel' ? breakerPanel(part.id,state.connections.some(c=>part.terminals.some(t=>t.id===c.toId)),part) : part.kind === 'receptacle' ? duplexReceptacle(part.id) : art(part.kind).replaceAll('switch.',`${part.id}.`))}${cableMode && isEnclosure(part) ? `<g data-inspect-box="${part.id}" role="button" tabindex="0" aria-label="Inspect ${part.id}" class="wb-inspect-icon"><circle cx="158" cy="16" r="15" fill="#fff" stroke="#668c55"/><text x="158" y="21" text-anchor="middle" font-size="15">⌕</text></g>` : ''}${selected === part.id ? `<rect x="-5" y="-5" width="${size.width+10}" height="${size.height+10}" rx="4" class="wb-selected"/>` : ''}</g>`;
      }).join('');
    }).join('')}${target ? `<g data-snap-target="${target.id}" transform="translate(${target.x+mountOffset.x} ${target.y+mountOffset.y})" pointer-events="none"><rect x="-7" y="-7" width="122" height="316" rx="6" class="wb-snap"/><text x="0" y="-16" class="wb-snap-label">Release to mount</text></g>` : ''}`;
    if (cableMode) {
      canvas.innerHTML += mainWiring(state);
      canvas.innerHTML += state.components.filter(isEnclosure).map(box => (['left','right'] as const).map(entryId=> {
        const end={boxId:box.id,entryId}, p=entryPosition(state,end)!, free=entryFree(state,end), valid=free && (!pending?.source.boxId || pending.source.boxId!==box.id), ready=cableTool && valid, active=cableTarget?.boxId===box.id && cableTarget.entryId===entryId;
        const occupied=state.cables.find(c=>[c.from,c.to].some(e=>e.boxId===box.id&&e.entryId===entryId));
        return `<g data-entry-box="${box.id}" data-entry="${entryId}" data-free="${free}" data-entry-highlight="${ready}" role="button" tabindex="0" aria-label="${box.id} ${entryId} knockout, ${free?'available':'occupied'}" class="wb-entry" transform="translate(${p.x} ${p.y})"><circle r="25" fill="transparent"/>${occupied?`<g transform="scale(.65)${p.side===1?' rotate(180)':''}">${nmBoxConnector(0,0)}</g>`:''}<circle r="${active?23:ready?20:12}" fill="${ready?'#d7edc8':'transparent'}" stroke="${active?'#36752b':ready?'#4c842f':'#7e8580'}" stroke-width="${ready?3:1.5}" stroke-dasharray="${ready?'0':free?'4 3':'0'}"/></g>${ready?`<text x="${p.x+p.side*30}" y="${p.y-28}" text-anchor="${p.side===-1?'end':'start'}" class="wb-entry-label">${pending?.source.boxId?'Finish here':'Start here'}</text>`:''}`;
      }).join('')).join('');
      if (pending && !pending.source.boxId) {
        canvas.innerHTML+=`<g data-cable-draft role="button" tabindex="0" aria-label="Uninstalled NM-B cable; drag to a green box entry" transform="translate(${pending.point.x} ${pending.point.y})" class="wb-cable-draft" ${pending.pointer!==null?'pointer-events="none"':''}><rect x="-85" y="-16" width="180" height="52" fill="transparent" pointer-events="all"/>${nmJacket('M-75 0H55Q75 0 75 20','draft',12).replace('Switch box to ceiling box','Uninstalled cable draft')}<circle cx="75" cy="20" r="10" fill="#d7edc8" stroke="#4c842f" stroke-width="2"/></g><text x="${pending.point.x}" y="${pending.point.y+49}" text-anchor="middle" class="wb-entry-label">${cableTarget?'Release to start cable':'Drag to a green box entry'}</text>`;
      }
      if (pending?.source.boxId) { const from=entryPosition(state,pending.source)!; const to=cableTarget?entryPosition(state,cableTarget)!:pending.point;
        canvas.innerHTML+=`<g pointer-events="none" data-cable-preview>${nmJacket(`M${from.x} ${from.y}H${from.x+from.side*48}V${to.y}H${to.x}`,'pending',10)}${cableTarget?`<text x="${to.x+24}" y="${to.y-22}" class="wb-snap-label">Release to install</text>`:''}</g>`; }
      const cable=state.cables.find(c=>c.id===selected), label=document.querySelector<HTMLElement>('.wb-cable-label')!;
      label.hidden=!cable; label.textContent=cable?`${cable.id} · ${cable.type} · ${cable.from.boxId} (${cable.from.entryId}) → ${cable.to.boxId} (${cable.to.entryId})${cableRoute(state,cable).issue?' · Routing obstructed; endpoints retained':''}`:'';
      const selectedPart=state.components.find(p=>p.id===selected), selectedBox=selectedPart && isEnclosure(selectedPart)?selectedPart:selectedPart?.parentId?state.components.find(p=>p.id===selectedPart.parentId):undefined;
      const mounted=selectedPart?.parentId?selectedPart:selectedBox?state.components.find(p=>p.parentId===selectedBox.id):undefined;
      document.querySelector<HTMLButtonElement>('[data-wb-action="unmount"]')!.hidden=!mounted;
      document.querySelector('[data-wb-action="unmount"]')!.textContent=mounted?.terminals.some(t=>t.termination)?'Pull Device Out':mounted?.kind==='receptacle'?'Unmount receptacle':'Unmount switch';
      document.querySelector<HTMLButtonElement>('[data-wb-action="inspect"]')!.hidden=!selectedBox;
      document.querySelector('[data-wb-action="inspect"]')!.textContent=selectedBox?.kind==='panel'?'Inspect panel':'Inspect box';
      document.querySelector('[data-cable-tool]')!.setAttribute('aria-pressed',String(cableTool));
      document.querySelector('.wb-cable-guide')!.textContent = pending?.source.boxId
        ? '2. Move to a green entry on the other box. Release while dragging, or click to finish. Esc cancels.'
        : pending?.parked ? 'Drag this loose cable to a green entry on Box A, then finish at Box B. It is not installed yet.'
        : cableTool ? '1. Click and drag from a green entry on Box A to a green entry on Box B.'
        : 'Cable: select 14/2 NM-B, then drag between the green box entries. Move a box to move an installed cable.';
      if (inspectionId) { inspection.querySelector('h2')!.textContent=`Inside ${state.components.find(p=>p.id===inspectionId)?.kind==='panel'?'subpanel ':''}${inspectionId}`; wiring?.render(); }
    }
    if(cableMode){const t=testReceptacle(state);document.querySelector('[data-main-tester]')!.textContent=`${t.status} · ${t.volts}V`;document.querySelector('[data-wb-action="power"]')!.textContent=state.power?'Turn Simulated Power Off':'Turn Simulated Power On';}
    document.querySelector<HTMLButtonElement>('[data-wb-action="undo"]')!.disabled = !history.canUndo || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="redo"]')!.disabled = !history.canRedo || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="delete"]')!.disabled = !selected || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="reset"]')!.disabled = (!state.components.length && !state.cables.length) || !!drag;
    (document.querySelector('.wb-empty') as HTMLElement).hidden = state.components.length > 0;
    if(inspection.open)wiring?.render();
  }
  const point = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX-r.left)*width/r.width, y: (e.clientY-r.top)*height/r.height }; };
  function begin(e: PointerEvent) {
    if (e.button !== 0 || drag) return;
    const target = e.target as Element;
    const draft=target.closest('[data-cable-draft]');
    if (cableMode && draft && pending && !pending.source.boxId) { e.preventDefault(); pending.pointer=e.pointerId;pending.parked=false;pending.moved=false;pending.point=point(e);(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);render();return; }
    const inspectIcon=target.closest('[data-inspect-box]'); if (cableMode && inspectIcon) { e.preventDefault(); inspect(inspectIcon.getAttribute('data-inspect-box')!); return; }
    const cableEntry=target.closest('[data-entry-box]');
    const cableObject=target.closest('[data-installed-cable]');
    if (cableMode && cableObject) { e.preventDefault(); selected=cableObject.getAttribute('data-installed-cable'); render(); return; }
    if (cableMode && target.closest('[data-cable-tool]')) { e.preventDefault(); cableTool=true; pending={source:{boxId:'',entryId:'left'},point:point(e),pointer:e.pointerId,moved:false}; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); render(); return; }
    if (cableMode && cableEntry) {
      e.preventDefault(); const end: CableEnd={boxId:cableEntry.getAttribute('data-entry-box')!,entryId:cableEntry.getAttribute('data-entry') as CableEnd['entryId']};
      if (!entryFree(state,end)) { status.textContent='This knockout is occupied. Use a free entry or delete its cable.'; return; }
      if (pending?.source.boxId && pending.pointer===null && pending.source.boxId===end.boxId && pending.source.entryId===end.entryId) { pending.pointer=e.pointerId;pending.moved=false;pending.point=point(e);(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);render();return; }
      if (pending?.source.boxId && pending.pointer===null) { const before=structuredClone(state); const error=installCable(state,pending.source,end); status.textContent=error??'NM-B cable installed. Inspect either box to see its loose conductors.'; if (!error) { history.record(before); pending=null;cableTool=false; } render(); return; }
      pending={source:end,point:point(e),pointer:e.pointerId,moved:false}; cableTool=true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); status.textContent='Drag to a free entry on another box. Escape cancels.'; render(); return;
    }
    const tray = target.closest('[data-tray-part]');
    const element = target.closest('[data-component]');
    if (!tray && !element) { if (target.closest('#wb-canvas')) { selected = null; render(); } return; }
    e.preventDefault();
    pending=null;cableTool=false;
    const before = structuredClone(state), p = point(e);
    let part;
    if (tray) {
      const kind = tray.getAttribute('data-tray-part') as PartKind, size = partSize[kind];
      part = addPart(state,kind,p.x-size.width/2,p.y-size.height/2);
    } else {
      const picked = state.components.find(part => part.id === element!.getAttribute('data-component'))!;
      part = picked.pulledOut ? picked : state.components.find(part => part.id === picked.parentId) ?? picked;
    }
    selected = cableMode && element ? element.getAttribute('data-component') : part.id;
    drag = { id: part.id, before, dx: p.x-worldPosition(state,part).x, dy: p.y-worldPosition(state,part).y, pointer: e.pointerId, fromTray: !!tray, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    status.textContent = 'Drag to position. A green outline shows when a switch will mount.'; render();
  }
  function move(e: PointerEvent) {
    if (pending && (pending.pointer===e.pointerId || (pending.pointer===null && !!pending.source.boxId))) { e.preventDefault(); pending.point=point(e); pending.moved=true; render(); return; }
    if (!drag || e.pointerId !== drag.pointer) return;
    e.preventDefault(); const p = point(e), part = state.components.find(c => c.id === drag!.id)!;
    const size = partSize[part.kind];
    const parent=part.parentId?state.components.find(p=>p.id===part.parentId):undefined;
    part.x = Math.max(12,Math.min(width-size.width-12,p.x-drag.dx))-(parent?.x??0)-(part.pulledOut?200:0);
    part.y = Math.max(12,Math.min(height-size.height-12,p.y-drag.dy))-(parent?.y??0);
    drag.moved = true; render();
  }
  function finish(e: PointerEvent, cancel = false) {
    if (pending && pending.pointer===e.pointerId) {
      if (cancel) { pending=null;status.textContent='Cable installation cancelled.';render();return; }
      const target=nearestEntry(state,point(e),pending.source.boxId?pending.source:undefined);
      if (!pending.source.boxId) {
        if (target) { pending.source=target;pending.pointer=null;pending.parked=false;status.textContent='Cable start selected. Move to a green entry on the other box, then click to finish.'; }
        else if (pending.moved) { pending.pointer=null;pending.parked=true;pending.moved=false;status.textContent='Loose cable ready. Drag it to a green box entry to begin; Escape removes the unfinished draft.'; }
        else { pending=null;status.textContent='NM-B selected. Drag from a green entry on Box A to one on Box B.'; }
      }
      else if (target && pending.moved) { const before=structuredClone(state); const error=installCable(state,pending.source,target); if (!error) { history.record(before);selected=state.cables.at(-1)!.id; } status.textContent=error??'Cable installed. Inspect either box to see its loose conductors.';pending=null;cableTool=false; }
      else if (!pending.moved) { pending.pointer=null;status.textContent='Click a free knockout on another box to finish; Escape cancels.'; }
      else { pending=null;status.textContent='Cable installation cancelled: no valid free entry at the drop point.'; }
      render();return;
    }
    if (!drag || e.pointerId !== drag.pointer) return;
    const p = point(e), part = state.components.find(c => c.id === drag!.id)!;
    if (cancel || (drag.fromTray && (!drag.moved || p.x < 0 || p.y < 0 || p.x > width || p.y > height || (e.clientX < document.querySelector('.wb-tray')!.getBoundingClientRect().right && e.clientY < document.querySelector('.wb-tray')!.getBoundingClientRect().bottom)))) {
      Object.assign(state,drag.before); selected = null; status.textContent = 'Placement cancelled.';
    } else {
      const occupied = (part.kind === 'switch' || part.kind === 'receptacle') && !part.parentId && state.components.find(box => box.kind === 'box' && state.components.some(child => child.parentId === box.id) && Math.abs(part.x-box.x-mountOffset.x)<62 && Math.abs(part.y-box.y-mountOffset.y)<85);
      if (occupied) { Object.assign(state,drag.before);selected=null;drag=null;status.textContent='This box already contains a device. Unmount it first, or use an empty box.';render();return; }
      const box = snapTarget(state,part);
      if (box) mountSwitch(state,part,box);
      history.record(drag.before);
      status.textContent = box ? `${part.kind === 'receptacle' ? 'Receptacle' : 'Switch'} mounted. Drag the box or mounted device to move the attached assembly.` : `${part.kind === 'box' ? 'Box' : part.kind === 'panel' ? 'Panel' : part.kind === 'receptacle' ? 'Receptacle' : 'Switch'} placed. ${part.kind === 'panel' ? 'Double-click to inspect loose branch conductors.' : part.kind === 'box' ? 'Drag a switch or receptacle onto the box to mount it.' : 'Drag onto an empty box to mount.'}`;
    }
    const tapped = !cancel && !drag.fromTray && !drag.moved ? selected : null;
    drag = null; render();
    if (cableMode && tapped) {
      const now=performance.now(), part=state.components.find(p=>p.id===tapped)!;
      if (lastTap?.id===tapped && now-lastTap.time<450 && Math.hypot(part.x-lastTap.x,part.y-lastTap.y)<6) {
        lastTap=null;const enclosure=isEnclosure(part)?part.id:part.parentId;if(enclosure) inspect(enclosure);
      } else lastTap={id:tapped,time:now,x:part.x,y:part.y};
    } else lastTap=null;
  }
  document.querySelector('.wb-shell')!.addEventListener('pointerdown', e => begin(e as PointerEvent));
  window.addEventListener('pointermove',move,{ passive:false });
  window.addEventListener('pointerup',e => finish(e));
  window.addEventListener('pointercancel',e => finish(e,true));
  function action(name: string) {
    if (drag) return;
    if(name==='power'){const before=structuredClone(state);state.power=!state.power;history.record(before);render();return;}
    if(name==='check'){const t=testReceptacle(state);status.textContent=`${t.status}: ${t.message}`;render();return;}
    if (name === 'inspect' && selected) { const part=state.components.find(p=>p.id===selected); const id=part && isEnclosure(part)?part.id:part?.parentId; if (id) inspect(id); return; }
    if (name === 'unmount' && selected) { let pulled=false; const part=state.components.find(p=>p.id===selected); const child=part?.parentId?part:state.components.find(p=>p.parentId===selected); if (child) { const before=structuredClone(state); if(child.terminals.some(t=>t.termination)){child.pulledOut=true;pulled=true;}else unmountSwitch(state,child); child.x=Math.min(width-120,child.x); history.record(before); } selected=null;status.textContent=pulled?'Device pulled out; all conductors remain attached.':'Device unmounted; box and cables retained.';render();return; }
    pending=null;cableTool=false;
    if (name === 'undo' || name === 'redo') history[name]();
    else if (name === 'delete' && selected) { const before = structuredClone(state); deletePart(state,selected); history.record(before); }
    else if (name === 'reset') { const before = structuredClone(state); state.components = []; state.cables=[]; state.connections=[]; state.pigtails=[];state.connectors=[];state.spliceGroups=[];state.power=false; history.record(before); }
    pruneWiring(state);
    selected = null; status.textContent = `${name === 'reset' ? 'Workbench cleared. Undo restores your assembly.' : name === 'delete' ? 'Selected part deleted.' : name === 'undo' ? 'Last assembly action undone.' : 'Assembly action restored.'}`; render();
  }
  const header = document.querySelector('.wb-header')!;
  // Handle touch controls directly: preventing default on a component drag can
  // suppress the browser's subsequent compatibility click on touch devices.
  header.addEventListener('pointerdown',e => { const event = e as PointerEvent; if (event.pointerType === 'touch' && (event.target as Element).closest('[data-wb-action]')) event.preventDefault(); });
  header.addEventListener('pointerup',e => { const event = e as PointerEvent; const button = (event.target as Element).closest<HTMLButtonElement>('[data-wb-action]'); if (event.pointerType === 'touch' && button && !button.disabled) { event.preventDefault(); action(button.getAttribute('data-wb-action')!); } });
  header.addEventListener('click',e => { if ((e as PointerEvent).pointerType === 'touch') return; const name = (e.target as Element).closest('[data-wb-action]')?.getAttribute('data-wb-action'); if (name) action(name); });
  document.querySelector('[data-cable-tool]')?.addEventListener('click', e=> { if ((e as MouseEvent).detail===0) { cableTool=true;pending=null;render(); } });
  canvas.addEventListener('dblclick',e=> { if (!cableMode) return; const id=(e.target as Element).closest('[data-component]')?.getAttribute('data-component'); const part=state.components.find(p=>p.id===id); if (part) inspect(isEnclosure(part)?part.id:part.parentId??''); });
  canvas.addEventListener('keydown',e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const inspectIcon=(e.target as Element).closest('[data-inspect-box]'); if (inspectIcon && cableMode) { inspect(inspectIcon.getAttribute('data-inspect-box')!); return; } const entry=(e.target as Element).closest('[data-entry-box]'); if (entry && cableMode) { const end: CableEnd={boxId:entry.getAttribute('data-entry-box')!,entryId:entry.getAttribute('data-entry') as CableEnd['entryId']}; if (pending?.source.boxId && entryFree(state,end)) { const before=structuredClone(state); const error=installCable(state,pending.source,end); if (!error) { history.record(before);pending=null; } status.textContent=error??'Cable installed.'; } else if (entryFree(state,end)) { cableTool=true;pending={source:end,point:entryPosition(state,end)!,pointer:null,moved:false}; } } else selected=(e.target as Element).closest('[data-component],[data-installed-cable]')?.getAttribute('data-component') ?? (e.target as Element).closest('[data-installed-cable]')?.getAttribute('data-installed-cable') ?? null; render(); } });
  document.addEventListener('keydown',e => {
    if(inspection.open&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();wiring?.disconnectSelected();return;}
    if (e.key === 'Escape' && pending) { pending=null;cableTool=false;status.textContent='Cable installation cancelled.';render();return; }
    if (e.key === 'Escape' && drag) { Object.assign(state,drag.before); drag = null; selected = null; render(); return; }
    if (e.ctrlKey || e.metaKey) { const key = e.key.toLowerCase(); if (key === 'z' || key === 'y') { e.preventDefault(); action(key === 'y' || e.shiftKey ? 'redo' : 'undo'); } }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); action('delete'); }
  });
  new ResizeObserver(() => { const r = stage.getBoundingClientRect(); width = r.width; height = r.height; render(); }).observe(stage);
  render();
}
