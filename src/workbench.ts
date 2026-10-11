import './workbench.css';
import { cableInspection } from './cable-inspection';
import { entryPosition, entryFree, nearestEntry, installCable, cableRoute, unmountSwitch, type CableEnd } from './cable-workbench-model';
import { steelDeviceBox, pulledToggle, nmJacket, nmBoxConnector } from './hardware-art';
import { addPart, createWorkbench, deletePart, mountOffset, mountSwitch, partSize, snapTarget, workbenchHistory, worldPosition, type PartKind, type Workbench } from './cable-workbench-model';

export function mountWorkbench(cableMode = false) {
  const state = createWorkbench(), history = workbenchHistory(state);
  let cableTool = false, inspectionId: string | null = null;
  let pending: { source: CableEnd; point: {x:number;y:number}; pointer: number | null; moved: boolean } | null = null;
  let selected: string | null = null;
  let drag: { id: string; before: Workbench; dx: number; dy: number; pointer: number; fromTray: boolean; moved: boolean } | null = null;
  let width = 1000, height = 700;
  const art = (kind: PartKind) => kind === 'box'
    ? `<g transform="scale(.65) translate(-48 -50)">${steelDeviceBox()}</g>`
    : `<g transform="scale(.956) translate(-35 0)">${pulledToggle()}</g>`;
  document.body.classList.add('workbench-page');
  document.querySelector('#app')!.innerHTML = `<main class="wb-shell"><header class="wb-header"><div><span>OLD CARPENTER · ${cableMode ? 'PHASE 3B' : 'PHASE 3A'}</span><h1>${cableMode ? 'Cable installation workbench' : 'Drag & snap workbench'}</h1></div><nav aria-label="Workbench actions"><button data-wb-action="undo">Undo</button><button data-wb-action="redo">Redo</button><button data-wb-action="delete">Delete</button><button data-wb-action="reset">Reset</button>${cableMode ? '<button data-wb-action="unmount" hidden>Unmount switch</button><button data-wb-action="inspect" hidden>Inspect box</button>' : ''}<a href="?">Wiring lesson ↗</a></nav></header><section class="wb-stage" aria-label="Assembly workbench"><svg id="wb-canvas" role="group" aria-label="Drag components onto this empty workbench"></svg><details class="wb-tray" open><summary>Parts tray</summary><p>Drag a part onto the bench</p><div>${(['box','switch'] as PartKind[]).map(kind => `<button class="wb-part" data-tray-part="${kind}" aria-label="Drag ${kind === 'box' ? 'steel electrical box' : 'single-pole switch'} from parts tray"><svg viewBox="0 0 ${partSize[kind].width} ${partSize[kind].height}" aria-hidden="true">${art(kind)}</svg><span>${kind === 'box' ? 'Steel box' : 'Toggle switch'}</span></button>`).join('')}${cableMode ? '<button class="wb-part wb-cable-part" data-cable-tool aria-label="14/2 NM-B cable tool"><svg viewBox="0 0 80 100" aria-hidden="true"><path d="M15 85V35Q15 15 40 15T65 35V85" fill="none" stroke="#777" stroke-width="14"/><path d="M15 85V35Q15 15 40 15T65 35V85" fill="none" stroke="#e9dfb9" stroke-width="11"/></svg><span>14/2 NM-B</span></button>' : ''}</div></details><p class="wb-empty">${cableMode ? 'Drag two boxes here. Select NM-B, then drag between the highlighted knockout entries.' : 'Drag a steel box here, then drag a switch onto its mounting position.'}</p><div class="wb-cable-label" hidden></div></section><footer><p id="wb-status" role="status">Empty workbench. Drag parts from the tray using a mouse or touch.</p><span>${cableMode ? 'Cable installation only · disconnected conductors' : 'Assembly prototype · no electrical wiring yet'}</span></footer></main>`;
  const stage = document.querySelector<HTMLElement>('.wb-stage')!;
  const canvas = document.querySelector<SVGSVGElement>('#wb-canvas')!;
  const status = document.querySelector('#wb-status')!;
  const inspection = document.createElement('dialog'); inspection.className = 'wb-inspection';
  inspection.innerHTML = '<header><h2>Box inspection</h2><button data-close-inspection>Return to workbench</button></header><div class="wb-inspection-art"></div>';
  if (cableMode) document.body.append(inspection);
  inspection.querySelector('[data-close-inspection]')!.addEventListener('click',()=>inspection.close());
  function inspect(id: string) { inspectionId=id; render(); if (!inspection.open) inspection.showModal(); }
  function render() {
    const moving = state.components.find(p => p.id === drag?.id);
    const target = moving ? snapTarget(state,moving) : undefined;
    canvas.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const cableTarget = pending ? nearestEntry(state,pending.point,pending.source) : null;
    const cablePaths = cableMode ? state.cables.map(c => { const route=cableRoute(state,c); const clipped=route.points.some(p=>p.x<0||p.y<0||p.x>width||p.y>height); return `<g data-installed-cable="${c.id}" data-from-box="${c.from.boxId}" data-to-box="${c.to.boxId}" data-from-entry="${c.from.entryId}" data-to-entry="${c.to.entryId}" data-route-issue="${route.issue||clipped}" role="button" tabindex="0" aria-label="Select ${c.id}, ${c.type}" class="wb-installed-cable"><path d="${route.path}" fill="none" stroke="${selected===c.id?'#a07b26':'transparent'}" stroke-width="23" stroke-linejoin="round"/>${nmJacket(route.path,c.id,10).replace('Switch box to ceiling box',`${c.from.boxId} to ${c.to.boxId}`)}${route.issue||clipped?`<text x="${entryPosition(state,c.from)!.x+12}" y="${entryPosition(state,c.from)!.y-28}" class="wb-route-warning">Routing issue · endpoints retained</text>`:''}<path d="${route.path}" fill="none" stroke="transparent" stroke-width="28" pointer-events="stroke"/></g>`; }).join('') : '';
    canvas.innerHTML = `${cablePaths}${state.components.filter(p => !p.parentId).map(root => {
      return [root,...state.components.filter(p => p.parentId === root.id)].map(part => {
        const p = worldPosition(state,part), size = partSize[part.kind];
        return `<g data-component="${part.id}" data-kind="${part.kind}" data-parent="${part.parentId ?? ''}" data-x="${p.x}" data-y="${p.y}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${part.kind === 'box' ? 'Steel box' : 'Toggle switch'} ${part.id}${part.parentId ? ', mounted; drag to move assembly' : ', drag to move'}" aria-pressed="${selected === part.id}" class="wb-component"><rect width="${size.width}" height="${size.height}" fill="transparent"/>${art(part.kind)}${cableMode && part.kind==='box' ? `<g data-inspect-box="${part.id}" role="button" tabindex="0" aria-label="Inspect ${part.id}" class="wb-inspect-icon"><circle cx="158" cy="16" r="15" fill="#fff" stroke="#668c55"/><text x="158" y="21" text-anchor="middle" font-size="15">⌕</text></g>` : ''}${selected === part.id ? `<rect x="-5" y="-5" width="${size.width+10}" height="${size.height+10}" rx="4" class="wb-selected"/>` : ''}</g>`;
      }).join('');
    }).join('')}${target ? `<g data-snap-target="${target.id}" transform="translate(${target.x+mountOffset.x} ${target.y+mountOffset.y})" pointer-events="none"><rect x="-7" y="-7" width="122" height="316" rx="6" class="wb-snap"/><text x="0" y="-16" class="wb-snap-label">Release to mount</text></g>` : ''}`;
    if (cableMode) {
      canvas.innerHTML += state.components.filter(p=>p.kind==='box').map(box => (['left','right'] as const).map(entryId=> {
        const end={boxId:box.id,entryId}, p=entryPosition(state,end)!, free=entryFree(state,end), active=cableTarget?.boxId===box.id && cableTarget.entryId===entryId;
        const occupied=state.cables.find(c=>[c.from,c.to].some(e=>e.boxId===box.id&&e.entryId===entryId));
        return `<g data-entry-box="${box.id}" data-entry="${entryId}" data-free="${free}" role="button" tabindex="0" aria-label="${box.id} ${entryId} knockout, ${free?'available':'occupied'}" class="wb-entry" transform="translate(${p.x} ${p.y})"><circle r="22" fill="transparent"/>${occupied?`<g transform="scale(.65)${p.side===1?' rotate(180)':''}">${nmBoxConnector(0,0)}</g>`:''}<circle r="${active?19:12}" fill="${free?'#e6f1df66':'transparent'}" stroke="${active?'#36752b':free?'#668c55':'#7e8580'}" stroke-width="${active?3:1.5}" stroke-dasharray="${free?'4 3':'0'}"/></g>`;
      }).join('')).join('');
      if (pending?.source.boxId) { const from=entryPosition(state,pending.source)!; const to=cableTarget?entryPosition(state,cableTarget)!:pending.point;
        canvas.innerHTML+=`<g pointer-events="none" data-cable-preview>${nmJacket(`M${from.x} ${from.y}H${from.x+from.side*48}V${to.y}H${to.x}`,'pending',10)}${cableTarget?`<text x="${to.x+24}" y="${to.y-22}" class="wb-snap-label">Release to install</text>`:''}</g>`; }
      const cable=state.cables.find(c=>c.id===selected), label=document.querySelector<HTMLElement>('.wb-cable-label')!;
      label.hidden=!cable; label.textContent=cable?`${cable.id} · ${cable.type} · ${cable.from.boxId} (${cable.from.entryId}) → ${cable.to.boxId} (${cable.to.entryId})${cableRoute(state,cable).issue?' · Routing obstructed; endpoints retained':''}`:'';
      const selectedPart=state.components.find(p=>p.id===selected), selectedBox=selectedPart?.kind==='box'?selectedPart:selectedPart?.parentId?state.components.find(p=>p.id===selectedPart.parentId):undefined;
      const mounted=selectedPart?.parentId?selectedPart:selectedBox?state.components.find(p=>p.parentId===selectedBox.id):undefined;
      document.querySelector<HTMLButtonElement>('[data-wb-action="unmount"]')!.hidden=!mounted;
      document.querySelector<HTMLButtonElement>('[data-wb-action="inspect"]')!.hidden=!selectedBox;
      document.querySelector('[data-cable-tool]')!.setAttribute('aria-pressed',String(cableTool));
      if (inspectionId) { inspection.querySelector('h2')!.textContent=`Inside ${inspectionId}`; inspection.querySelector('.wb-inspection-art')!.innerHTML=cableInspection(state,inspectionId); }
    }
    document.querySelector<HTMLButtonElement>('[data-wb-action="undo"]')!.disabled = !history.canUndo || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="redo"]')!.disabled = !history.canRedo || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="delete"]')!.disabled = !selected || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="reset"]')!.disabled = (!state.components.length && !state.cables.length) || !!drag;
    (document.querySelector('.wb-empty') as HTMLElement).hidden = state.components.length > 0;
  }
  const point = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX-r.left)*width/r.width, y: (e.clientY-r.top)*height/r.height }; };
  function begin(e: PointerEvent) {
    if (e.button !== 0 || drag) return;
    const target = e.target as Element;
    const inspectIcon=target.closest('[data-inspect-box]'); if (cableMode && inspectIcon) { e.preventDefault(); inspect(inspectIcon.getAttribute('data-inspect-box')!); return; }
    const cableEntry=target.closest('[data-entry-box]');
    const cableObject=target.closest('[data-installed-cable]');
    if (cableMode && cableObject) { e.preventDefault(); selected=cableObject.getAttribute('data-installed-cable'); render(); return; }
    if (cableMode && target.closest('[data-cable-tool]')) { e.preventDefault(); cableTool=true; pending={source:{boxId:'',entryId:'left'},point:point(e),pointer:e.pointerId,moved:false}; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); render(); return; }
    if (cableMode && cableEntry) {
      e.preventDefault(); const end: CableEnd={boxId:cableEntry.getAttribute('data-entry-box')!,entryId:cableEntry.getAttribute('data-entry') as CableEnd['entryId']};
      if (!entryFree(state,end)) { status.textContent='This knockout is occupied. Use a free entry or delete its cable.'; return; }
      if (pending?.source.boxId && pending.pointer===null) { const before=structuredClone(state); const error=installCable(state,pending.source,end); status.textContent=error??'NM-B cable installed. Inspect either box to see its loose conductors.'; if (!error) { history.record(before); pending=null;cableTool=false; } render(); return; }
      pending={source:end,point:point(e),pointer:e.pointerId,moved:false}; cableTool=true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); status.textContent='Drag to a free entry on another box. Escape cancels.'; render(); return;
    }
    const tray = target.closest('[data-tray-part]');
    const element = target.closest('[data-component]');
    if (!tray && !element) { if (target.closest('#wb-canvas')) { selected = null; render(); } return; }
    e.preventDefault();
    const before = structuredClone(state), p = point(e);
    let part;
    if (tray) {
      const kind = tray.getAttribute('data-tray-part') as PartKind, size = partSize[kind];
      part = addPart(state,kind,p.x-size.width/2,p.y-size.height/2);
    } else {
      const picked = state.components.find(part => part.id === element!.getAttribute('data-component'))!;
      part = state.components.find(part => part.id === picked.parentId) ?? picked;
    }
    selected = cableMode && element ? element.getAttribute('data-component') : part.id;
    drag = { id: part.id, before, dx: p.x-part.x, dy: p.y-part.y, pointer: e.pointerId, fromTray: !!tray, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    status.textContent = 'Drag to position. A green outline shows when a switch will mount.'; render();
  }
  function move(e: PointerEvent) {
    if (pending && (pending.pointer===e.pointerId || pending.pointer===null)) { e.preventDefault(); pending.point=point(e); pending.moved=true; render(); return; }
    if (!drag || e.pointerId !== drag.pointer) return;
    e.preventDefault(); const p = point(e), part = state.components.find(c => c.id === drag!.id)!;
    const size = partSize[part.kind];
    part.x = Math.max(12,Math.min(width-size.width-12,p.x-drag.dx));
    part.y = Math.max(12,Math.min(height-size.height-12,p.y-drag.dy));
    drag.moved = true; render();
  }
  function finish(e: PointerEvent, cancel = false) {
    if (pending && pending.pointer===e.pointerId) {
      if (cancel) { pending=null;status.textContent='Cable installation cancelled.';render();return; }
      const target=nearestEntry(state,point(e),pending.source.boxId?pending.source:undefined);
      if (!pending.source.boxId) { if (target) { pending.source=target;pending.pointer=null;status.textContent='Cable start selected. Drag or click a free entry on another box.'; } else { pending=null;status.textContent='NM-B selected. Drag between two free knockout entries.'; } }
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
      const box = snapTarget(state,part);
      if (box) mountSwitch(state,part,box);
      history.record(drag.before);
      status.textContent = box ? 'Switch mounted. Drag the box or switch to move the attached assembly.' : `${part.kind === 'box' ? 'Box' : 'Switch'} placed. ${part.kind === 'box' ? 'Drag a switch onto the box to mount it.' : 'Drag onto an empty box to mount.'}`;
    }
    drag = null; render();
  }
  document.querySelector('.wb-shell')!.addEventListener('pointerdown', e => begin(e as PointerEvent));
  window.addEventListener('pointermove',move,{ passive:false });
  window.addEventListener('pointerup',e => finish(e));
  window.addEventListener('pointercancel',e => finish(e,true));
  function action(name: string) {
    if (drag) return;
    if (name === 'inspect' && selected) { const part=state.components.find(p=>p.id===selected); const id=part?.kind==='box'?part.id:part?.parentId; if (id) inspect(id); return; }
    if (name === 'unmount' && selected) { const part=state.components.find(p=>p.id===selected); const child=part?.parentId?part:state.components.find(p=>p.parentId===selected); if (child) { const before=structuredClone(state); unmountSwitch(state,child); child.x=Math.min(width-120,child.x); history.record(before); } selected=null;status.textContent='Switch unmounted; box and cables retained.';render();return; }
    pending=null;
    if (name === 'undo' || name === 'redo') history[name]();
    else if (name === 'delete' && selected) { const before = structuredClone(state); deletePart(state,selected); history.record(before); }
    else if (name === 'reset') { const before = structuredClone(state); state.components = []; state.cables=[]; history.record(before); }
    selected = null; status.textContent = `${name === 'reset' ? 'Workbench cleared. Undo restores your assembly.' : name === 'delete' ? 'Selected part deleted.' : name === 'undo' ? 'Last assembly action undone.' : 'Assembly action restored.'}`; render();
  }
  const header = document.querySelector('.wb-header')!;
  // Handle touch controls directly: preventing default on a component drag can
  // suppress the browser's subsequent compatibility click on touch devices.
  header.addEventListener('pointerdown',e => { const event = e as PointerEvent; if (event.pointerType === 'touch' && (event.target as Element).closest('[data-wb-action]')) event.preventDefault(); });
  header.addEventListener('pointerup',e => { const event = e as PointerEvent; const button = (event.target as Element).closest<HTMLButtonElement>('[data-wb-action]'); if (event.pointerType === 'touch' && button && !button.disabled) { event.preventDefault(); action(button.getAttribute('data-wb-action')!); } });
  header.addEventListener('click',e => { if ((e as PointerEvent).pointerType === 'touch') return; const name = (e.target as Element).closest('[data-wb-action]')?.getAttribute('data-wb-action'); if (name) action(name); });
  canvas.addEventListener('dblclick',e=> { if (!cableMode) return; const id=(e.target as Element).closest('[data-component]')?.getAttribute('data-component'); const part=state.components.find(p=>p.id===id); if (part) inspect(part.kind==='box'?part.id:part.parentId??''); });
  canvas.addEventListener('keydown',e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const inspectIcon=(e.target as Element).closest('[data-inspect-box]'); if (inspectIcon && cableMode) { inspect(inspectIcon.getAttribute('data-inspect-box')!); return; } const entry=(e.target as Element).closest('[data-entry-box]'); if (entry && cableMode) { const end: CableEnd={boxId:entry.getAttribute('data-entry-box')!,entryId:entry.getAttribute('data-entry') as CableEnd['entryId']}; if (pending?.source.boxId && entryFree(state,end)) { const before=structuredClone(state); const error=installCable(state,pending.source,end); if (!error) { history.record(before);pending=null; } status.textContent=error??'Cable installed.'; } else if (entryFree(state,end)) pending={source:end,point:entryPosition(state,end)!,pointer:null,moved:false}; } else selected=(e.target as Element).closest('[data-component],[data-installed-cable]')?.getAttribute('data-component') ?? (e.target as Element).closest('[data-installed-cable]')?.getAttribute('data-installed-cable') ?? null; render(); } });
  document.addEventListener('keydown',e => {
    if (e.key === 'Escape' && pending) { pending=null;status.textContent='Cable installation cancelled.';render();return; }
    if (e.key === 'Escape' && drag) { Object.assign(state,drag.before); drag = null; selected = null; render(); return; }
    if (e.ctrlKey || e.metaKey) { const key = e.key.toLowerCase(); if (key === 'z' || key === 'y') { e.preventDefault(); action(key === 'y' || e.shiftKey ? 'redo' : 'undo'); } }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); action('delete'); }
  });
  new ResizeObserver(() => { const r = stage.getBoundingClientRect(); width = r.width; height = r.height; render(); }).observe(stage);
  render();
}
