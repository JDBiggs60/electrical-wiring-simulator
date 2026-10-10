import { steel, cavity, toggle, holder, knockout, screw, nut, conductor } from './diagram-art';
import { boxView, checkLessonCircuit, disconnectLessonEnd, endConnection, joinLessonEnds, removeLessonConnector, setLessonPower, terminateLessonEnd, type BoxId, type LessonCircuit, type LessonEnd, type Point } from './lesson-circuit.ts';

/** The selection / connector / removal workflow is shared with the junction prototype.
 * This view receives the overview's state, so reopening a box never resets its wiring. */
export function mountLessonBox(state: LessonCircuit, onChange: () => void) {
  const dialog = document.createElement('dialog');
  dialog.id = 'diagram-closeup'; dialog.setAttribute('aria-labelledby', 'diagram-closeup-title');
  document.body.append(dialog);
  let box: BoxId = 'switch', checked = false;
  const selected = new Set<string>();
  let message = '';
  const color = (e: LessonEnd) => e.bare ? '#b87945' : e.kind === 'hot' ? '#24282c' : e.kind === 'neutral' ? '#fffdf4' : '#448852';
  function artwork(): string {
    const view = boxView(state, box);
    const centers = new Map(view.connectors.map(c => {
      const points = c.members.map(id => state.ends.find(e => e.id === id)!.free);
      const center = { x: points.reduce((n, p) => n + p.x, 0) / points.length, y: points.reduce((n, p) => n + p.y, 0) / points.length };
      // Keep a splice connector beside the switch body, where there is box space.
      if (box === 'switch' && center.x > 365 && center.x < 525 && center.y > 220 && center.y < 520) center.x = 310;
      return [c.id, center];
    }));
    const destination = (e: LessonEnd): Point => {
      const terminal = state.terminals.find(t => t.id === state.terminations[e.id]);
      if (terminal) return terminal.point;
      const c = view.connectors.find(c => c.members.includes(e.id));
      if (c) { const p = centers.get(c.id)!; return { x: p.x - 12 + c.members.indexOf(e.id) * 8, y: p.y + 3 }; }
      return e.free;
    };
    const cableWires = view.ends.filter(e => e.cable).map(e => {
      const p = e.port!.closeup, to = destination(e);
      const from = e.port!.side === 'left' ? { x: p.x + 43, y: p.y + e.offset! } : { x: p.x + e.offset!, y: p.y + 55 };
      const d = e.port!.side === 'left' ? `M${from.x} ${from.y}C${from.x + 80} ${from.y} ${to.x - 65} ${to.y} ${to.x} ${to.y}`
        : `M${from.x} ${from.y}C${from.x} ${from.y + 100} ${to.x} ${to.y - 70} ${to.x} ${to.y}`;
      return `<g data-conductor-path="${e.conductor}">${conductor(d, color(e), e.bare ? 4 : 6)}</g>`;
    }).join('');
    const leadWires = state.leads.filter(l => view.ends.some(e => e.conductor === l.id)).map(l => {
      const a = view.ends.find(e => e.id === l.from)!, b = view.ends.find(e => e.id === l.to)!;
      const p = destination(a), q = destination(b);
      return `<g data-conductor-path="${l.id}">${conductor(`M${p.x} ${p.y}C${p.x + 35} ${p.y + 65} ${q.x + 20} ${q.y + 65} ${q.x} ${q.y}`, color(a), 6)}</g>`;
    }).join('');
    const tips = view.ends.map(e => {
      const p = destination(e), connection = endConnection(state, e.id);
      return `<g data-end="${e.id}" data-conductor-id="${e.conductor}" tabindex="0" role="button" aria-label="${e.label}" aria-pressed="${selected.has(e.id)}" class="d-end ${selected.has(e.id) ? 'end-selected' : ''}"><title>${e.label} · ${e.id} · ${connection ? 'connected' : 'disconnected'}</title>
        ${!connection ? `<path d="M${p.x - 9} ${p.y}h18" stroke="#b87945" stroke-width="6" stroke-linecap="round"/>` : ''}
        <circle cx="${p.x}" cy="${p.y}" r="23" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="17" fill="none" stroke="${selected.has(e.id) ? '#c38412' : '#577d98'}" stroke-width="3" opacity="${connection && !selected.has(e.id) ? 0 : 1}"/>
        ${!connection && e.cable ? `<text x="${p.x}" y="${p.y + 35}" text-anchor="middle" class="d-wire-note">${e.kind === 'hot' ? 'BLACK' : e.kind === 'neutral' ? 'WHITE' : 'BARE'}</text>` : ''}</g>`;
    }).join('');
    const ports = view.ports.map(({ cable, port }) => {
      const p = port.closeup;
      const jacket = port.side === 'left' ? `<rect x="0" y="${p.y - 27}" width="${p.x + 43}" height="54" fill="#f0e8d2" stroke="#b1a997"/><rect x="${p.x - 14}" y="${p.y - 40}" width="28" height="80" fill="#adbdc7" stroke="#718592"/>`
        : `<rect x="${p.x - 27}" y="0" width="54" height="${p.y + 55}" fill="#f0e8d2" stroke="#b1a997"/><rect x="${p.x - 40}" y="${p.y - 14}" width="80" height="28" fill="#adbdc7" stroke="#718592"/>`;
      return `<g data-cable-port="${cable.id}" data-box="${box}" data-side="${port.side}"><title>${cable.label} · ${port.side} entry in both views</title>${jacket}<text x="${port.side === 'top' ? p.x : 80}" y="${port.side === 'top' ? 30 : p.y - 48}" text-anchor="middle" class="d-wire-note">${cable.id === 'feed' ? 'FROM SUPPLY' : box === 'switch' ? 'TO FIXTURE' : 'FROM SWITCH'}</text></g>`;
    }).join('');
    const terminals = view.terminals.map(t => `<g data-terminal="${t.id}" class="diagram-device-terminal d-terminal" role="button" tabindex="0" aria-label="Connect to ${t.label}"><title>${t.label} · ${t.id}</title><circle cx="${t.point.x}" cy="${t.point.y}" r="23" fill="transparent"/>${screw(t.point.x, t.point.y, t.kind === 'ground' ? '#5b9869' : t.kind === 'neutral' ? '#bac7cf' : '#d8af50')}<circle cx="${t.point.x}" cy="${t.point.y}" r="19" fill="none" stroke="#287bb0" class="d-terminal-focus"/></g>`).join('');
    const connectors = view.connectors.map(c => {
      const p = centers.get(c.id)!;
      return `<g data-connector="${c.id}" role="button" tabindex="0" aria-label="Remove connector ${c.id}" class="d-connector"><title>Connector ${c.id}: ${c.members.map(id => state.ends.find(e => e.id === id)!.label).join(', ')}</title>${nut(p.x, p.y)}<text x="${p.x}" y="${p.y - 40}" text-anchor="middle" class="d-wire-note">C${c.id}</text></g>`;
    }).join('');
    const body = box === 'switch' ? `<rect x="88" y="73" width="774" height="560" rx="5" fill="${steel}" stroke="#738997" stroke-width="3"/><rect x="109" y="96" width="732" height="516" fill="${cavity}" stroke="#a0afb9" stroke-width="2"/>${knockout(133,330,21)}${knockout(817,330,21)}${toggle(390,249,1,state.switchOn)}<text x="275" y="316" class="d-wire-note">BRASS A</text><text x="275" y="394" class="d-wire-note">BRASS B</text><text x="465" y="488" class="d-wire-note">DEVICE GROUND</text><text x="675" y="595" class="d-wire-note">STEEL BOX BOND</text>`
      : `<path d="M171 72h384l67 67v387l-67 77H171l-74-77V139Z" fill="${steel}" stroke="#738997" stroke-width="3"/><path d="M179 94h365l55 55v368l-55 65H179l-58-65V149Z" fill="${cavity}" stroke="#a0afb9" stroke-width="2"/>${knockout(147,318,21)}${knockout(575,318,21)}${holder(860,214,1.2,checkLessonCircuit(state).lightOn)}<text x="700" y="104" class="d-box-title">FIXTURE LIFTED FOR VIEW</text><text x="790" y="360" class="d-wire-note">HOT / NEUTRAL / GROUND</text><text x="485" y="565" class="d-wire-note">STEEL BOX BOND</text>`;
    return `<svg class="d-closeup-svg" viewBox="0 0 ${box === 'switch' ? 950 : 1100} 690" role="group" aria-label="Interactive ${box} box wiring workspace">${body}${ports}${cableWires}${leadWires}${tips}${connectors}${terminals}<text x="110" y="665" class="d-description">Select an end, then a screw; select 2–4 ends to join. Wire crossings never connect.</text></svg>`;
  }
  function render() {
    const active = document.activeElement;
    const key = active?.getAttribute('data-end') ? 'data-end' : active?.getAttribute('data-pick') ? 'data-pick' : active?.getAttribute('data-terminal') ? 'data-terminal' : active?.getAttribute('data-action') ? 'data-action' : null;
    const focusValue = key ? active?.getAttribute(key) : null;
    const view = boxView(state, box), result = checkLessonCircuit(state);
    dialog.innerHTML = `<header><div><span>PHASE 2B · CONNECT CONDUCTOR ENDS</span><h2 id="diagram-closeup-title">${box === 'switch' ? 'Inside the single-gang switch box' : 'Inside the ceiling fixture box'}</h2></div><button id="diagram-close" data-action="close">Return to circuit</button></header>
      <div class="d-box-workspace"><section class="d-box-art"><div id="diagram-closeup-art">${artwork()}</div><p class="d-box-help">${box === 'switch' ? 'Supply enters from the left. The fixture cable exits at the top. Use separate neutral and ground connectors; bond the device and steel box with their pigtails.' : 'The cable enters from the left. Join black, white, and ground to the matching fixture leads. Attach each lead’s terminal end and the separate box bond.'}</p></section>
      <aside class="d-box-tools"><h3>1. Select conductor ends</h3><div class="d-end-picker">${view.ends.map(e => `<button data-pick="${e.id}" aria-pressed="${selected.has(e.id)}" class="${selected.has(e.id) ? 'picked' : ''}"><i style="background:${color(e)}"></i>${e.label}<small>${endConnection(state, e.id) ? 'connected' : 'loose'}</small></button>`).join('')}</div>
      <p class="d-selection" role="status">${selected.size ? 'Selected: ' + [...selected].map(id => state.ends.find(e => e.id === id)!.label).join(' + ') : 'No ends selected'}</p>
      <div class="d-box-actions"><button data-action="join" ${state.power ? 'disabled' : ''}>Join with connector</button><button data-action="clear">Clear selection</button><button data-action="disconnect" ${state.power ? 'disabled' : ''}>Disconnect selected ends</button></div>
      <h3>2. Attach one selected end</h3><div class="d-terminal-picker">${view.terminals.map(t => `<button data-terminal="${t.id}" ${state.power ? 'disabled' : ''}>Connect to ${t.label}<small>${Object.values(state.terminations).includes(t.id) ? 'occupied' : 'empty'}</small></button>`).join('')}</div>
      <h3>Your connectors</h3><div class="d-connector-list">${view.connectors.length ? view.connectors.map(c => `<div><b>Connector ${c.id}</b><span>${c.members.map(id => state.ends.find(e => e.id === id)!.label).join(' + ')}</span><button data-remove-connector="${c.id}" ${state.power ? 'disabled' : ''}>Remove connector ${c.id}</button></div>`).join('') : '<p>No connectors installed.</p>'}</div>
      <div class="d-box-actions"><button data-action="check">Check circuit wiring</button><button data-action="power">Turn test power ${state.power ? 'off' : 'on'}</button><button data-action="switch" aria-pressed="${state.switchOn}">Toggle wall switch · ${state.switchOn ? 'ON' : 'OFF'}</button></div>
      <div class="d-box-feedback" aria-live="polite"><p>${message}</p><strong>Test power ${state.power ? 'ON' : 'OFF'} · Light ${result.lightOn ? 'ON' : 'OFF'}</strong>${checked ? `<p>${result.valid ? 'Circuit correctly wired.' : 'Check connections in both boxes.'}</p>${result.errors.length ? `<ul>${result.errors.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}<div class="d-continuity">${Object.entries(result.continuity).map(([kind, continuous]) => `<span>${kind}: ${continuous ? 'continuous' : 'open'}</span>`).join('')}</div>` : ''}</div></aside></div>
      <p class="diagram-closeup-note">Both boxes and the main diagram share one circuit. All ends start disconnected; only terminal attachments and connector membership make electrical connections. Silver mounting screws are mechanical hardware.</p>`;
    if (key && focusValue) dialog.querySelector<HTMLElement>(`[${key}="${focusValue}"]`)?.focus();
  }
  function activate(target: Element) {
    const end = target.closest('[data-end],[data-pick]');
    if (end) {
      if (state.power) { message = 'Turn test power off before selecting conductor ends.'; render(); return; }
      const id = end.getAttribute('data-end') ?? end.getAttribute('data-pick')!;
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      message = 'Choose a screw for one end, or select two to four free ends and join with a connector.';
      render(); return;
    }
    const terminal = target.closest('[data-terminal]')?.getAttribute('data-terminal');
    if (terminal) {
      const error = selected.size === 1 ? terminateLessonEnd(state, [...selected][0]!, terminal) : 'Select exactly one conductor end, then its terminal.';
      message = error ?? 'Conductor attached to the electrical terminal.';
      if (!error) { selected.clear(); checked = false; onChange(); }
      render(); return;
    }
    const remove = target.closest('[data-remove-connector],[data-connector]');
    if (remove) {
      const error = removeLessonConnector(state, Number(remove.getAttribute('data-remove-connector') ?? remove.getAttribute('data-connector')));
      message = error ?? 'Connector removed. Its conductor ends are loose again.';
      if (!error) { selected.clear(); checked = false; onChange(); }
      render(); return;
    }
    const action = target.closest('[data-action]')?.getAttribute('data-action');
    if (action === 'close') { dialog.close(); return; }
    if (action === 'clear') selected.clear();
    if (action === 'join') { const error = joinLessonEnds(state, box, [...selected]); message = error ?? 'Connector installed. Its members now share continuity.'; if (!error) { selected.clear(); checked = false; onChange(); } }
    if (action === 'disconnect') {
      if (!selected.size) message = 'Select the connected ends to disconnect.';
      else { const errors = [...selected].map(id => disconnectLessonEnd(state, id)).filter(Boolean); message = errors[0] ?? 'Selected terminations disconnected; selected connectors removed.'; if (!errors.length) { selected.clear(); checked = false; onChange(); } }
    }
    if (action === 'check') { checked = true; message = 'Checking the complete circuit, including the other box.'; }
    if (action === 'power') { message = setLessonPower(state, !state.power) ?? (state.power ? 'Test power on. Operate the switch.' : 'Test power off. Wiring can be edited.'); checked = true; selected.clear(); onChange(); }
    if (action === 'switch') { state.switchOn = !state.switchOn; onChange(); }
    if (action) render();
  }
  dialog.addEventListener('click', e => activate(e.target as Element));
  dialog.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && (e.target as Element).matches('g[role="button"]')) { e.preventDefault(); activate(e.target as Element); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('d-dialog-open'); onChange(); });
  return { open(id: BoxId) { box = id; selected.clear(); checked = false; message = 'All changes here update the same circuit shown in the main diagram.'; render(); dialog.showModal(); document.body.classList.add('d-dialog-open'); dialog.querySelector<HTMLButtonElement>('#diagram-close')!.focus(); } };
}
