import './workbench.css';
import { steelDeviceBox, pulledToggle } from './hardware-art';
import { addPart, createWorkbench, deletePart, mountOffset, mountSwitch, partSize, snapTarget, workbenchHistory, worldPosition, type PartKind, type Workbench } from './workbench-model';

export function mountWorkbench() {
  const state = createWorkbench(), history = workbenchHistory(state);
  let selected: string | null = null;
  let drag: { id: string; before: Workbench; dx: number; dy: number; pointer: number; fromTray: boolean; moved: boolean } | null = null;
  let width = 1000, height = 700;
  const art = (kind: PartKind) => kind === 'box'
    ? `<g transform="scale(.65) translate(-48 -50)">${steelDeviceBox()}</g>`
    : `<g transform="scale(.956) translate(-35 0)">${pulledToggle()}</g>`;
  document.body.classList.add('workbench-page');
  document.querySelector('#app')!.innerHTML = `<main class="wb-shell"><header class="wb-header"><div><span>OLD CARPENTER · PHASE 3A</span><h1>Drag & snap workbench</h1></div><nav aria-label="Workbench actions"><button data-wb-action="undo">Undo</button><button data-wb-action="redo">Redo</button><button data-wb-action="delete">Delete</button><button data-wb-action="reset">Reset</button><a href="?">Wiring lesson ↗</a></nav></header><section class="wb-stage" aria-label="Assembly workbench"><svg id="wb-canvas" role="group" aria-label="Drag components onto this empty workbench"></svg><details class="wb-tray" open><summary>Parts tray</summary><p>Drag a part onto the bench</p><div>${(['box','switch'] as PartKind[]).map(kind => `<button class="wb-part" data-tray-part="${kind}" aria-label="Drag ${kind === 'box' ? 'steel electrical box' : 'single-pole switch'} from parts tray"><svg viewBox="0 0 ${partSize[kind].width} ${partSize[kind].height}" aria-hidden="true">${art(kind)}</svg><span>${kind === 'box' ? 'Steel box' : 'Toggle switch'}</span></button>`).join('')}</div></details><p class="wb-empty">Drag a steel box here, then drag a switch onto its mounting position.</p></section><footer><p id="wb-status" role="status">Empty workbench. Drag parts from the tray using a mouse or touch.</p><span>Assembly prototype · no electrical wiring yet</span></footer></main>`;
  const stage = document.querySelector<HTMLElement>('.wb-stage')!;
  const canvas = document.querySelector<SVGSVGElement>('#wb-canvas')!;
  const status = document.querySelector('#wb-status')!;
  function render() {
    const moving = state.components.find(p => p.id === drag?.id);
    const target = moving ? snapTarget(state,moving) : undefined;
    canvas.setAttribute('viewBox',`0 0 ${width} ${height}`);
    canvas.innerHTML = `${state.components.filter(p => !p.parentId).map(root => {
      return [root,...state.components.filter(p => p.parentId === root.id)].map(part => {
        const p = worldPosition(state,part), size = partSize[part.kind];
        return `<g data-component="${part.id}" data-kind="${part.kind}" data-parent="${part.parentId ?? ''}" data-x="${p.x}" data-y="${p.y}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${part.kind === 'box' ? 'Steel box' : 'Toggle switch'} ${part.id}${part.parentId ? ', mounted; drag to move assembly' : ', drag to move'}" aria-pressed="${selected === part.id}" class="wb-component"><rect width="${size.width}" height="${size.height}" fill="transparent"/>${art(part.kind)}${selected === part.id ? `<rect x="-5" y="-5" width="${size.width+10}" height="${size.height+10}" rx="4" class="wb-selected"/>` : ''}</g>`;
      }).join('');
    }).join('')}${target ? `<g data-snap-target="${target.id}" transform="translate(${target.x+mountOffset.x} ${target.y+mountOffset.y})" pointer-events="none"><rect x="-7" y="-7" width="122" height="316" rx="6" class="wb-snap"/><text x="0" y="-16" class="wb-snap-label">Release to mount</text></g>` : ''}`;
    document.querySelector<HTMLButtonElement>('[data-wb-action="undo"]')!.disabled = !history.canUndo || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="redo"]')!.disabled = !history.canRedo || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="delete"]')!.disabled = !selected || !!drag;
    document.querySelector<HTMLButtonElement>('[data-wb-action="reset"]')!.disabled = !state.components.length || !!drag;
    (document.querySelector('.wb-empty') as HTMLElement).hidden = state.components.length > 0;
  }
  const point = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX-r.left)*width/r.width, y: (e.clientY-r.top)*height/r.height }; };
  function begin(e: PointerEvent) {
    if (e.button !== 0 || drag) return;
    const target = e.target as Element;
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
    selected = part.id;
    drag = { id: part.id, before, dx: p.x-part.x, dy: p.y-part.y, pointer: e.pointerId, fromTray: !!tray, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    status.textContent = 'Drag to position. A green outline shows when a switch will mount.'; render();
  }
  function move(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return;
    e.preventDefault(); const p = point(e), part = state.components.find(c => c.id === drag!.id)!;
    const size = partSize[part.kind];
    part.x = Math.max(12,Math.min(width-size.width-12,p.x-drag.dx));
    part.y = Math.max(12,Math.min(height-size.height-12,p.y-drag.dy));
    drag.moved = true; render();
  }
  function finish(e: PointerEvent, cancel = false) {
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
    if (name === 'undo' || name === 'redo') history[name]();
    else if (name === 'delete' && selected) { const before = structuredClone(state); deletePart(state,selected); history.record(before); }
    else if (name === 'reset') { const before = structuredClone(state); state.components = []; history.record(before); }
    selected = null; status.textContent = `${name === 'reset' ? 'Workbench cleared. Undo restores your assembly.' : name === 'delete' ? 'Selected part deleted.' : name === 'undo' ? 'Last assembly action undone.' : 'Assembly action restored.'}`; render();
  }
  const header = document.querySelector('.wb-header')!;
  // Handle touch controls directly: preventing default on a component drag can
  // suppress the browser's subsequent compatibility click on touch devices.
  header.addEventListener('pointerdown',e => { const event = e as PointerEvent; if (event.pointerType === 'touch' && (event.target as Element).closest('[data-wb-action]')) event.preventDefault(); });
  header.addEventListener('pointerup',e => { const event = e as PointerEvent; const button = (event.target as Element).closest<HTMLButtonElement>('[data-wb-action]'); if (event.pointerType === 'touch' && button && !button.disabled) { event.preventDefault(); action(button.getAttribute('data-wb-action')!); } });
  header.addEventListener('click',e => { if ((e as PointerEvent).pointerType === 'touch') return; const name = (e.target as Element).closest('[data-wb-action]')?.getAttribute('data-wb-action'); if (name) action(name); });
  canvas.addEventListener('keydown',e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selected = (e.target as Element).closest('[data-component]')?.getAttribute('data-component') ?? null; render(); } });
  document.addEventListener('keydown',e => {
    if (e.key === 'Escape' && drag) { Object.assign(state,drag.before); drag = null; selected = null; render(); return; }
    if (e.ctrlKey || e.metaKey) { const key = e.key.toLowerCase(); if (key === 'z' || key === 'y') { e.preventDefault(); action(key === 'y' || e.shiftKey ? 'redo' : 'undo'); } }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); action('delete'); }
  });
  new ResizeObserver(() => { const r = stage.getBoundingClientRect(); width = r.width; height = r.height; render(); }).observe(stage);
  render();
}
