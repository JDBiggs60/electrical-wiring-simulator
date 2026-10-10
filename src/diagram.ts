import { createLessonHistory, historyButtons } from './lesson-history';
import './hardware-prototype.css';
import { completeInstallation } from './installation-art';
import './diagram.css';

import { steel, cavity, toggle, holder, knockout } from './diagram-art';
import { createHardwareCircuit, createLessonCircuit, checkLessonCircuit, setLessonPower, endConnection, type LessonCircuit } from './lesson-circuit';
import { mountLessonBox } from './lesson-view';

function mainCircuit(state: LessonCircuit, selectedCable: string | null):string {
  return `<svg id="diagram-board" viewBox="0 0 1360 670" role="group" aria-label="Interactive residential single-pole lighting circuit">
    <defs><marker id="d-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0l10 5-10 5" fill="#8b9dab"/></marker></defs>
    <text x="32" y="50" class="d-board-caption">120 V SINGLE-POLE LIGHTING CIRCUIT</text><text x="1320" y="50" text-anchor="end" class="d-board-small">${state.power ? 'TEST POWER ON' : 'TEST POWER OFF'} · LIGHT ${checkLessonCircuit(state).lightOn ? 'ON' : 'OFF'}</text>
    <path d="M0 510H373M545 353V208H1030" fill="none" stroke="#7b8991" stroke-width="22" stroke-linejoin="round"/>
    ${state.cables.map(c => `<g class="diagram-cable ${selectedCable===c.id?'cable-selected':''}" data-cable="${c.id}" tabindex="0" role="button" aria-pressed="${selectedCable===c.id}" aria-label="Select ${c.label}"><title>${c.label}: black, white, and bare ground. Select to inspect its conductors.</title><path d="${c.path}" fill="none" stroke="${selectedCable===c.id?'#d5a646':'#f0e8d2'}" stroke-width="18" stroke-linejoin="round"/></g>`).join('')}
    ${state.cables.flatMap(c=>c.ports.map(p=>`<circle data-cable-port="${c.id}" data-box="${p.box}" data-side="${p.side}" cx="${p.main.x}" cy="${p.main.y}" r="0"/>`)).join('')}
    <text x="38" y="408" class="d-source-title">120 V BRANCH SUPPLY</text><text x="38" y="434" class="d-description">From upstream circuit protection</text><text x="38" y="457" class="d-description">Black / white / bare ground</text><path d="M38 480h252" stroke="#8b9dab" stroke-width="1.5" marker-end="url(#d-arrow)"/>
    <text x="140" y="552" class="d-cable-label">NM-B 14/2 + GROUND</text><text x="736" y="177" class="d-cable-label">NM-B 14/2 + GROUND</text><text x="687" y="250" class="d-description">Black: switched hot · White: neutral</text><text x="687" y="276" class="d-description">Bare: equipment ground</text>
    <g data-open-diagram-box="switch" tabindex="0" role="button" aria-label="Open switch box wiring workspace" class="d-open-box"><title>Open the large switch-box wiring workspace</title>
      <rect x="337" y="320" width="278" height="298" rx="4" fill="${steel}" stroke="#778b99" stroke-width="2"/><rect x="353" y="336" width="246" height="266" fill="${cavity}" stroke="#9aabb6"/>
      ${knockout(364,408)}${knockout(586,420)}${knockout(586,551)}
      <rect x="328" y="495" width="36" height="30" rx="3" fill="#aabbc6" stroke="#728695"/><rect x="530" y="310" width="30" height="36" rx="3" fill="#aabbc6" stroke="#728695"/>
      <path d="M364 510h18M545 346v18" stroke="#f0e8d2" stroke-width="18"/>
      ${toggle(427,350,.98,state.switchOn)}
      <text x="342" y="263" class="d-box-title">SINGLE-GANG</text><text x="342" y="287" class="d-box-title">SWITCH BOX</text><text x="359" y="591" class="d-open-label">OPEN SWITCH BOX ↗</text>
      <rect x="337" y="320" width="278" height="298" rx="4" class="d-box-focus" fill="none" stroke="#287bb0" stroke-width="4"/>
    </g>
    <text x="663" y="393" class="d-callout-title">SINGLE-POLE TOGGLE SWITCH</text><text x="663" y="419" class="d-description">Two brass current terminals</text><text x="663" y="443" class="d-description">One green device ground</text><text x="663" y="467" class="d-description">Steel mounting hardware</text><path d="M642 405H570" stroke="#a1b0b9" stroke-width="1.5"/>
    <g data-open-diagram-box="fixture" tabindex="0" role="button" aria-label="Open fixture box wiring workspace" class="d-open-box"><title>Open the large ceiling fixture-box wiring workspace</title>
      <path d="M1041 107h178l55 55v150l-55 55h-178l-55-55V162Z" fill="${steel}" stroke="#778b99" stroke-width="2"/><path d="M1047 125h166l43 43v138l-43 43h-166l-43-43V168Z" fill="${cavity}" stroke="#9aabb6"/>
      ${knockout(1018,253)}${knockout(1241,253)}
      <rect x="979" y="192" width="37" height="32" rx="3" fill="#aabbc6" stroke="#728695"/><path d="M1016 208h17" stroke="#f0e8d2" stroke-width="18"/>
      <g class="${checkLessonCircuit(state).lightOn ? 'd-lamp-lit' : ''}">${holder(1130,218,1.15,checkLessonCircuit(state).lightOn)}</g>
      <text x="978" y="80" class="d-box-title">CEILING FIXTURE BOX</text><text x="1027" y="389" class="d-open-label">OPEN FIXTURE BOX ↗</text>
      <path d="M1041 107h178l55 55v150l-55 55h-178l-55-55V162Z" class="d-box-focus" fill="none" stroke="#287bb0" stroke-width="4"/>
    </g>
    <text x="1007" y="444" class="d-description">Octagonal steel box</text><text x="1007" y="468" class="d-description">Keyless holder + lightbulb</text>
    <text x="35" y="643" class="d-board-small">Select an NM cable or open a box to wire its individual conductors. Crossings do not make connections.</text>
  </svg>`;
}
export function mountDiagramPrototype(hardware = false) {
  const state = hardware ? createHardwareCircuit() : createLessonCircuit();
  const history = createLessonHistory(state);
  let selectedCable: string | null = null, checked = false;
  let message = 'Open the switch and fixture boxes to connect the loose conductor ends.';
  document.body.classList.add(hardware ? 'hardware-page' : 'diagram-page');
  document.querySelector('#app')!.innerHTML = `<main class="diagram-shell ${hardware ? 'hardware-sheet' : ''}"></main>`;
  const workspace = mountLessonBox(state, () => { checked = false; render(); }, hardware, history);
  function render() {
    const result = checkLessonCircuit(state);
    const cable = state.cables.find(c => c.id === selectedCable);
    document.querySelector('.diagram-shell')!.innerHTML = `<header class="diagram-header"><div><span>OLD CARPENTER · ELECTRICAL WIRING SIMULATOR</span><h1>Residential lighting circuit</h1></div><a class="diagram-trainer-link" href="?view=trainer" target="_blank" rel="noopener">Open working Phase 1 trainer ↗</a></header>
      <section class="diagram-review-note"><strong>Phase 2B · wire the circuit</strong><span>Start unwired. Select loose ends, join them with connectors, and attach them to electrical terminals. The incoming supply is the upstream boundary of this lesson.</span></section>
      <section class="diagram-workspace" aria-label="Residential circuit diagram"><div class="diagram-toolbar"><span>01 · SUPPLY → SWITCH BOX → CEILING FIXTURE</span><div><button data-review-box="switch">Open switch box</button><button data-review-box="fixture">Open fixture box</button></div></div><div class="${hardware ? 'hardware-board' : 'diagram-canvas'}">${hardware ? completeInstallation(state) : mainCircuit(state, selectedCable)}</div></section>
      <section class="d-cable-inspector" aria-label="Selected cable">${cable ? `<strong>${cable.label} · ID: ${cable.id}</strong><div>${cable.conductors.map(c => `<span><b>${c.kind === 'hot' ? 'Black' : c.kind === 'neutral' ? 'White' : 'Bare ground'}</b> · ${c.id}: ${state.ends.filter(e => e.conductor === c.id).map(e => `${e.box} end ${endConnection(state, e.id) ? 'connected' : 'loose'}`).join(' / ')}</span>`).join('')}</div><div>${cable.ports.map(p => `<button data-review-box="${p.box}">Open ${p.box} box · ${p.side} entry</button>`).join('')}</div>` : '<span>Select a visible NM cable to inspect its three conductors and box entries.</span>'}</section>
      <section class="d-circuit-controls">${historyButtons(history,'data-lesson-action')}<button data-lesson-action="check">Check circuit wiring</button><button data-lesson-action="power" aria-pressed="${state.power}">Turn test power ${state.power ? 'off' : 'on'}</button><button data-lesson-action="switch" aria-pressed="${state.switchOn}">Toggle wall switch · ${state.switchOn ? 'ON' : 'OFF'}</button><button data-lesson-action="reset" ${state.power ? 'disabled' : ''}>Reset to unwired</button><strong id="lesson-light" class="${result.lightOn ? 'light-on' : ''}" role="status">Test power ${state.power ? 'ON' : 'OFF'} · Light ${result.lightOn ? 'ON' : 'OFF'}</strong></section>
      <section class="d-circuit-feedback" aria-live="polite"><p>${message}</p>${checked ? `<strong>${result.valid ? 'Circuit correctly wired.' : 'Check these connections.'}</strong>${result.errors.length ? `<ul>${result.errors.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}<div class="d-continuity">${Object.entries(result.continuity).map(([kind, continuous]) => `<span>${kind}: ${continuous ? 'continuous' : 'open'}</span>`).join('')}</div>` : ''}</section>
      <footer class="diagram-footer"><span><i class="d-legend-cable"></i>NM-B cable · black hot, white neutral, bare equipment ground</span><span>Isolated teaching simulation · conductor crossings do not connect</span></footer>`;
  }
  const shell = document.querySelector('.diagram-shell')!;
  function activate(target: Element) {
    const box = target.closest('[data-review-box],[data-open-diagram-box],[data-inspect-box]');
    if (box) { workspace.open((box.getAttribute('data-review-box') ?? box.getAttribute('data-open-diagram-box') ?? box.getAttribute('data-inspect-box')) as 'switch' | 'fixture'); return; }
    const cable = target.closest('[data-cable]');
    if (cable) { selectedCable = cable.getAttribute('data-cable'); render(); shell.querySelector<HTMLElement>(`[data-cable="${selectedCable}"]`)?.focus(); return; }
    const action = target.closest('[data-lesson-action]')?.getAttribute('data-lesson-action');
    if (action === 'undo' || action === 'redo') { message = history[action](); checked = false; workspace.historyChanged(); }
    if (action === 'check') { checked = true; message = 'Continuity is calculated from your connections in both boxes.'; }
    if (action === 'power') { const error = setLessonPower(state, !state.power); checked = true; message = error ?? (state.power ? 'Test power is on. Operate the wall switch.' : 'Test power is off. You can edit connections.'); }
    if (action === 'switch') { state.switchOn = !state.switchOn; }
    if (action === 'reset' && !state.power) { Object.assign(state, (hardware ? createHardwareCircuit() : createLessonCircuit())); history.clear(); checked = false; message = 'Lesson reset. All conductor terminations are disconnected.'; }
    if (action) { render(); shell.querySelector<HTMLElement>(`[data-lesson-action="${action}"]`)?.focus(); }
  }
  shell.addEventListener('click', e => activate(e.target as Element));
  shell.addEventListener('keydown', e => { const event = e as KeyboardEvent; if ((event.key === 'Enter' || event.key === ' ') && (e.target as Element).matches('[data-cable],[data-open-diagram-box],[data-inspect-box]')) { event.preventDefault(); activate(e.target as Element); } });
  document.addEventListener('keydown', e => {
    const target = e.target as HTMLElement;
    if (!e.ctrlKey || e.altKey || target.matches('input,textarea,[contenteditable="true"]')) return;
    const key = e.key.toLowerCase();
    const action = key === 'z' ? (e.shiftKey ? 'redo' : 'undo') : key === 'y' ? 'redo' : null;
    if (!action) return;
    e.preventDefault(); message = history[action](); checked = false;
    workspace.historyChanged(message); render();
  });
  render();
}
