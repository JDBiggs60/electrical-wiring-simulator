import './style.css';
import { evaluateCircuit, terminals, type TerminalId, type Wire, type WireColor } from './circuit';

const icons = {
  bolt: '<path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
  bulb: '<path d="M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>',
  plug: '<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-6 6v5M9 8v3m6-3v3"/>',
};
const icon = (name: keyof typeof icons) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header class="masthead">
  <div class="brand"><span class="brand-mark">${icon('plug')}</span><div><span class="brand-name">OLD CARPENTER <span>WORKSHOP</span></span><span class="brand-caption">Learn by doing. Build with confidence.</span></div></div>
  <div class="header-meta"><span class="phase-tag">PHASE 01</span><span>Electrical Wiring Simulator</span></div>
</header>
<main class="workspace">
  <section class="page-intro"><div><div class="eyebrow">THE WIRING WORKBENCH</div><h1>A little practice. A lightbulb moment.</h1><p>Build your first circuit, one connection at a time.</p></div><span class="lesson-counter">01 <span>/ LESSON</span></span></section>
  <div class="workspace-grid">
    <aside class="panel toolbox" aria-labelledby="toolbox-title">
      <div class="panel-heading"><span class="panel-number">01</span><h2 id="toolbox-title">Toolbox</h2></div>
      <p class="panel-subtitle">Everything you need for this circuit.</p>
      <div class="section-label">WIRE SELECTION</div>
      <div class="wire-tools" role="group" aria-label="Wire color">
        <button class="wire-tool active" data-color="hot" aria-pressed="true"><span class="wire-swatch hot"></span><span><strong>Hot wire</strong><small>Black · carries power</small></span><span class="selection-dot"></span></button>
        <button class="wire-tool" data-color="neutral" aria-pressed="false"><span class="wire-swatch neutral"></span><span><strong>Neutral wire</strong><small>White · return path</small></span><span class="selection-dot"></span></button>
        <button class="wire-tool" data-color="ground" aria-pressed="false"><span class="wire-swatch ground"></span><span><strong>Ground wire</strong><small>Green · protective bond</small></span><span class="selection-dot"></span></button>
      </div>
      <div class="tool-tip"><span class="mini-number">i</span><p>Select a wire, then click two terminals. You can also drag between terminals.</p></div>
      <div class="section-label component-label">ON YOUR BENCH</div>
      <div class="component-item"><span class="component-icon">${icon('bolt')}</span><div><strong>6-space breaker panel</strong><small>2 installed · 4 spare</small></div></div>
      <div class="component-item"><span class="component-icon switch-mini">I / O</span><div><strong>Single-pole switch</strong><small>2 brass screws + ground</small></div></div>
      <div class="component-item"><span class="component-icon">${icon('bulb')}</span><div><strong>Light fixture</strong><small>Hot, neutral & ground</small></div></div>
      <div class="connections-heading"><span class="section-label">YOUR CONNECTIONS</span><span id="wire-count">0</span></div>
      <div id="wire-list" class="wire-list"><p class="empty-wires">Your connections will appear here.</p></div>
    </aside>
    <section class="bench-panel" aria-labelledby="bench-title">
      <div class="bench-heading"><div><span class="section-label">PRACTICE AREA</span><h2 id="bench-title">Your wiring board</h2></div><span id="power-status" class="status-pill"><span></span>Power off</span></div>
      <div class="bench-toolbar"><span id="connection-prompt" role="status">Black wire selected · choose a terminal</span><button id="cancel-wire" class="text-button" hidden>Cancel</button></div>
      <div class="board-wrap"><svg id="board" viewBox="0 0 900 640" aria-label="Interactive wiring board" role="group"></svg></div>
      <div class="bench-footer"><span><span class="terminal-example"></span>Click a terminal to connect</span><span>Drag device headers to reposition</span></div>
      <div class="under-bench"><span class="small-badge">LEARN THE WHY</span><p>A complete circuit gives current a path out <em>and</em> a path back.</p></div>
    </section>
    <aside class="panel lesson-panel" aria-labelledby="lesson-title">
      <div class="panel-heading"><span class="panel-number">02</span><h2>Lesson guide</h2></div>
      <div class="lesson-label">LESSON 01 · BEGINNER</div>
      <h2 id="lesson-title" class="lesson-title">Simple light circuit</h2>
      <p class="lesson-description">Connect a single switch to a light. Give it power, flip the switch, and see your circuit come to life.</p>
      <div class="learning-objective"><span>${icon('bulb')}</span><p><strong>Your goal</strong>Make the switch control the light, with safe neutral and ground paths.</p></div>
      <div class="section-label">HOW IT WORKS</div>
      <ol class="key-points"><li><span class="point-dot hot-dot"></span><div><strong>Hot carries power.</strong><p>Black wire runs from Breaker 1 through the switch to the light.</p></div></li><li><span class="point-dot neutral-dot"></span><div><strong>Neutral completes the path.</strong><p>White wire connects the neutral bar directly to the light.</p></div></li><li><span class="point-dot ground-dot"></span><div><strong>Ground protects metal parts.</strong><p>Green or bare wire bonds the switch and fixture to ground. It never replaces neutral.</p></div></li></ol>
      <div class="lesson-controls"><button id="power" class="power-button" aria-pressed="false">${icon('bolt')}<span>Turn power on</span></button><button id="check" class="check-button">${icon('check')}Check my wiring</button><div class="secondary-controls"><button id="hint">${icon('bulb')}Hint</button><button id="reset">${icon('reset')}Reset</button></div></div>
      <div id="feedback" class="feedback" role="status" aria-live="polite"><strong>Ready when you are.</strong><p>Start with the black hot wire. Keep power off while you make connections.</p></div>
      <div class="scope-note">A simplified learning model. The panel’s upstream supply and bonding are omitted; neutral and ground stay separate here. Practice only—never use this as an installation guide.</div>
    </aside>
  </div>
  <footer class="page-footer"><span>OLD CARPENTER WORKSHOP <span class="footer-separator">/</span> A hands-on approach to understanding electricity.</span><span>Built to learn. Not for live wiring.</span></footer>
</main>`;

const board = document.querySelector<SVGSVGElement>('#board')!;
const feedback = document.querySelector<HTMLDivElement>('#feedback')!;
const positions = { switch: { x: 416, y: 205 }, light: { x: 635, y: 190 } };
const originalPositions = JSON.parse(JSON.stringify(positions)) as typeof positions;
const colors: Record<WireColor, string> = { hot: '#273031', neutral: '#fffaf0', ground: '#38945b' };
const names: Record<WireColor, string> = { hot: 'Black', neutral: 'White', ground: 'Green' };
let wires: Wire[] = [];
let nextId = 1;
let selectedColor: WireColor = 'hot';
let selectedTerminal: TerminalId | null = null;
let selectedWire: number | null = null;
let power = false;
let switchOn = false;
let hintIndex = 0;
type Point = { x: number; y: number };
let gesture: { start: Point; terminal?: TerminalId; device?: 'switch' | 'light'; origin?: Point; moved: boolean } | null = null;
let ghost: Point | null = null;

function point(id: TerminalId): Point {
  const s = positions.switch, l = positions.light;
  const points: Record<TerminalId, Point> = {
    'panel.hot1': { x: 280, y: 179 }, 'panel.hot2': { x: 280, y: 243 },
    'panel.neutral': { x: 119, y: 436 }, 'panel.ground': { x: 250, y: 436 },
    'switch.a': { x: s.x + 14, y: s.y + 70 }, 'switch.b': { x: s.x + 14, y: s.y + 148 },
    'switch.ground': { x: s.x + 108, y: s.y + 190 },
    'light.hot': { x: l.x + 23, y: l.y + 230 }, 'light.neutral': { x: l.x + 91, y: l.y + 230 },
    'light.ground': { x: l.x + 159, y: l.y + 230 },
  };
  return points[id];
}
function wirePath(a: Point, b: Point): string {
  if (Math.abs(a.y - b.y) < 45) {
    const bend = Math.max(a.y, b.y) + 50;
    return `M${a.x},${a.y} C${a.x},${bend} ${b.x},${bend} ${b.x},${b.y}`;
  }
  const bend = Math.max(65, Math.abs(b.x - a.x) * .48);
  return `M${a.x},${a.y} C${a.x},${a.y + bend} ${b.x},${b.y + bend} ${b.x},${b.y}`;
}
function screw(x: number, y: number): string {
  return `<g><circle cx="${x}" cy="${y}" r="5" fill="#b7b7ac" stroke="#686d66"/><path d="M${x-3},${y}h6" stroke="#636862" stroke-width="1.5"/></g>`;
}
function deviceLabel(x: number, y: number, title: string, subtitle: string, device?: string): string {
  return `<g ${device ? `data-move="${device}" class="device-drag"` : ''}><rect x="${x}" y="${y}" width="${device === 'light' ? 182 : 130}" height="43" rx="5" fill="#fcf6e9" filter="url(#label-shadow)"/><text x="${x+10}" y="${y+17}" class="device-label">${title}</text><text x="${x+10}" y="${y+33}" class="device-subtitle">${subtitle}</text>${device ? `<text x="${x + (device === 'light' ? 162 : 110)}" y="${y+19}" fill="#b8aa96" font-size="17">⠿</text>` : ''}</g>`;
}
function panelGraphic(): string {
  return `<g class="panel-device"><rect x="53" y="87" width="270" height="423" rx="9" fill="url(#panel-metal)" stroke="#818b88" stroke-width="2" filter="url(#device-shadow)"/><rect x="67" y="103" width="242" height="28" rx="3" fill="#4b5a56"/><text x="80" y="122" class="panel-brand">BRANCH CIRCUIT PANEL</text><rect x="68" y="143" width="240" height="253" rx="4" fill="#a4aea9" stroke="#86938c"/>
    <g><rect x="83" y="156" width="148" height="48" rx="4" fill="#343d3d"/><text x="95" y="176" class="breaker-number">01</text><text x="95" y="194" class="breaker-caption">LIGHT CIRCUIT · 15A</text><rect x="181" y="166" width="31" height="23" rx="3" fill="${power ? '#d6a24e' : '#1d2424'}" stroke="#5f6764"/><path d="M${power ? 202 : 189},171v13" stroke="${power ? '#48331a' : '#989c95'}" stroke-width="3"/><path d="M231 179h33" stroke="#444b47" stroke-width="6"/><text x="249" y="163" class="tiny-label">HOT</text></g>
    <g><rect x="83" y="220" width="148" height="48" rx="4" fill="#343d3d"/><text x="95" y="240" class="breaker-number">02</text><text x="95" y="258" class="breaker-caption">FUTURE CIRCUIT · 15A</text><rect x="181" y="230" width="31" height="23" rx="3" fill="#1d2424" stroke="#5f6764"/><path d="M189 235v13" stroke="#989c95" stroke-width="3"/><path d="M231 243h33" stroke="#444b47" stroke-width="6"/></g>
    ${[0, 1, 2, 3].map((n) => {const x = n % 2 === 0 ? 84 : 198, y = 291 + Math.floor(n / 2) * 48;return `<rect x="${x}" y="${y}" width="97" height="37" rx="3" fill="#9ba7a0" stroke="#79887f"/><path d="M${x+8},${y+18}h81" stroke="#8d9b92"/><text x="${x+12}" y="${y+23}" class="spare-label">0${n+3} · SPARE</text>`;}).join('')}
    <rect x="82" y="410" width="78" height="48" rx="4" fill="#dbded5" stroke="#8e9690"/><rect x="211" y="410" width="78" height="48" rx="4" fill="#b8cdb9" stroke="#7c9781"/>
    ${screw(97,421)}${screw(141,421)}${screw(226,421)}${screw(272,421)}
    <text x="119" y="479" text-anchor="middle" class="tiny-label">NEUTRAL</text><text x="250" y="479" text-anchor="middle" class="tiny-label">GROUND</text><text x="188" y="499" text-anchor="middle" class="fine-label">Separate bars · upstream supply omitted</text>
    ${screw(62,96)}${screw(314,96)}${screw(62,501)}${screw(314,501)}
    <rect x="81" y="533" width="215" height="44" rx="4" fill="#fcf6e9" filter="url(#label-shadow)"/><text x="95" y="552" class="device-label">THE SOURCE</text><text x="95" y="568" class="device-subtitle">Use Breaker 1 for this lesson</text></g>`;
}
function switchGraphic(): string {
  const {x,y} = positions.switch;
  return `<g>${deviceLabel(x, y-58, 'SINGLE-POLE SWITCH', 'Interrupts the hot conductor', 'switch')}
    <rect x="${x+36}" y="${y}" width="53" height="231" rx="7" fill="url(#switch-metal)" stroke="#8b9385" filter="url(#device-shadow)"/><rect x="${x+24}" y="${y+34}" width="80" height="147" rx="8" fill="#ddd7c5" stroke="#aaa891"/><rect x="${x+30}" y="${y+45}" width="68" height="125" rx="6" fill="#f1e9d5" stroke="#c5bea7"/>
    <title>Mounting screws at top and bottom are not wiring terminals.</title>${screw(x+62,y+16)}${screw(x+62,y+214)}
    <rect x="${x+4}" y="${y+58}" width="30" height="24" rx="4" fill="#ac8542"/><rect x="${x+4}" y="${y+136}" width="30" height="24" rx="4" fill="#ac8542"/><rect x="${x+93}" y="${y+176}" width="25" height="24" rx="4" fill="#527e54"/>
    <g data-action="switch" class="switch-toggle" role="button" tabindex="0" aria-label="Toggle light switch" aria-pressed="${switchOn}"><rect x="${x+40}" y="${y+58}" width="48" height="100" rx="5" fill="#998f78" stroke="#827a65"/><rect x="${x+45}" y="${y+62}" width="38" height="92" rx="3" fill="#c2b69b"/><path d="M${x+47},${y+(switchOn ? 72 : 106)}h34v32h-34Z" fill="url(#toggle-ivory)" stroke="#c6b999"/><text x="${x+64}" y="${y+55}" text-anchor="middle" class="tiny-label">ON</text><text x="${x+64}" y="${y+169}" text-anchor="middle" class="tiny-label">OFF</text></g>
    <text x="${x-5}" y="${y+48}" class="terminal-caption">A</text><text x="${x-5}" y="${y+126}" class="terminal-caption">B</text><text x="${x+92}" y="${y+171}" class="terminal-caption">G</text>
    <text x="${x+64}" y="${y+255}" text-anchor="middle" class="board-note">SWITCH ${switchOn ? 'ON' : 'OFF'}</text></g>`;
}
function lightGraphic(on: boolean): string {
  const {x,y} = positions.light;
  return `<g>${deviceLabel(x, y-43, 'LIGHT FIXTURE', 'A complete path makes it shine', 'light')}
    ${on ? `<circle cx="${x+91}" cy="${y+96}" r="110" fill="url(#light-glow)" class="bulb-glow"/>` : ''}
    <ellipse cx="${x+91}" cy="${y+124}" rx="79" ry="23" fill="#8f806f" opacity=".22"/>
    <circle cx="${x+91}" cy="${y+101}" r="73" fill="url(#fixture-ceramic)" stroke="#c7bfad" filter="url(#device-shadow)"/><circle cx="${x+91}" cy="${y+101}" r="59" fill="none" stroke="#d1c9b7"/>
    ${screw(x+34,y+102)}${screw(x+148,y+102)}
    <rect x="${x+65}" y="${y+103}" width="52" height="39" rx="7" fill="#8d8b7d" stroke="#737468"/><path d="M${x+68} ${y+111}h46m-46 9h46m-46 9h46" stroke="#b9b6a3" stroke-width="3"/>
    <path d="M${x+65},${y+108} C${x+67},${y+95} ${x+47},${y+88} ${x+48},${y+64} C${x+48},${y+10} ${x+134},${y+10} ${x+134},${y+64} C${x+135},${y+88} ${x+115},${y+95} ${x+117},${y+108}Z" fill="${on ? 'url(#lit-bulb)' : 'url(#unlit-bulb)'}" stroke="${on ? '#d7a447' : '#ccc6b2'}" stroke-width="2"/>
    <path d="M${x+78},${y+104}v-25l8 7 10-12 9 8v22" fill="none" stroke="${on ? '#fff8c2' : '#b8ad8c'}" stroke-width="2.5"/><path d="M${x+61},${y+52}q5-17 24-20" fill="none" stroke="#fffef4" stroke-width="5" stroke-linecap="round" opacity=".65"/>
    <path d="M${x+49},${y+159}v23H${x+23}v38M${x+91},${y+159}v61M${x+131},${y+159}v23h28v38" fill="none" stroke="#918976" stroke-width="3"/>
    <rect x="${x+4}" y="${y+206}" width="174" height="47" rx="5" fill="#e9dfc9" stroke="#c4b69a"/>
    <text x="${x+23}" y="${y+198}" text-anchor="middle" class="terminal-caption">HOT</text><text x="${x+91}" y="${y+198}" text-anchor="middle" class="terminal-caption">NEUTRAL</text><text x="${x+159}" y="${y+198}" text-anchor="middle" class="terminal-caption">GROUND</text>
    <text x="${x+91}" y="${y+279}" text-anchor="middle" class="board-note">LIGHT ${on ? 'ON' : 'OFF'}</text></g>`;
}
function terminalGraphic(id: TerminalId): string {
  const p = point(id), t = terminals[id], selected = selectedTerminal === id;
  const fill = t.kind === 'hot' ? '#c39a4e' : t.kind === 'neutral' ? '#e0e0d5' : '#44794b';
  return `<g data-terminal="${id}" class="terminal ${selected ? 'selected' : ''}" role="button" tabindex="0" aria-label="${t.label}" aria-pressed="${selected}"><title>${t.label} · ${names[t.kind]} wire</title><circle cx="${p.x}" cy="${p.y}" r="18" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="13" fill="${selected ? '#f4bd5b' : '#f4e9cb'}" stroke="${selected ? '#8c591b' : '#82735c'}" stroke-width="${selected ? 3 : 1}"/><circle cx="${p.x}" cy="${p.y}" r="9" fill="${fill}" stroke="#635c4a"/><path d="M${p.x-5},${p.y}h10" stroke="#5d573e" stroke-width="2"/><circle cx="${p.x}" cy="${p.y}" r="15" class="focus-ring" fill="none" stroke="#266b73" stroke-width="3"/></g>`;
}
function render() {
  const active = document.activeElement?.getAttribute('data-terminal');
  const result = evaluateCircuit(wires, power, switchOn);
  board.innerHTML = `<defs>
    <filter id="device-shadow" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="2" dy="6" stdDeviation="5" flood-color="#3c2e1d" flood-opacity=".21"/></filter>
    <filter id="label-shadow"><feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#665236" flood-opacity=".14"/></filter>
    <linearGradient id="panel-metal" x2="1" y2="1"><stop stop-color="#d7ddd5"/><stop offset=".5" stop-color="#c5cec6"/><stop offset="1" stop-color="#b4bfb6"/></linearGradient>
    <linearGradient id="switch-metal"><stop stop-color="#c7cbbd"/><stop offset=".5" stop-color="#e6e8d9"/><stop offset="1" stop-color="#a1aa99"/></linearGradient>
    <linearGradient id="toggle-ivory" x2="0" y2="1"><stop stop-color="#fff9e9"/><stop offset="1" stop-color="#ded2b5"/></linearGradient>
    <radialGradient id="fixture-ceramic"><stop stop-color="#fffef5"/><stop offset="1" stop-color="#e6e0ce"/></radialGradient>
    <radialGradient id="unlit-bulb"><stop stop-color="#fbf9e9"/><stop offset="1" stop-color="#ddd8c4"/></radialGradient>
    <radialGradient id="lit-bulb"><stop stop-color="#fffef3"/><stop offset=".65" stop-color="#ffeeb1"/><stop offset="1" stop-color="#f6ce68"/></radialGradient>
    <radialGradient id="light-glow"><stop stop-color="#ffe57d" stop-opacity=".7"/><stop offset="1" stop-color="#ffe57d" stop-opacity="0"/></radialGradient>
    <pattern id="board-grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="1" fill="#9c8261" opacity=".25"/></pattern>
  </defs>
  <rect x="17" y="22" width="866" height="596" rx="9" fill="#b79a73" opacity=".25"/><rect x="12" y="15" width="876" height="600" rx="8" fill="#eee0c5" stroke="#c3ad89" stroke-width="2"/><rect x="13" y="16" width="874" height="598" rx="8" fill="url(#board-grid)"/>
  <path d="M14 35h872M14 595h872" stroke="#e5d4b2"/><text x="37" y="53" class="board-caption">OLD CARPENTER / WIRING PRACTICE BOARD</text><text x="858" y="53" text-anchor="end" class="board-caption">120V MODEL · POWER ${power ? 'ON' : 'OFF'}</text>
  ${screw(30,33)}${screw(870,33)}${screw(30,597)}${screw(870,597)}
  ${panelGraphic()}${switchGraphic()}${lightGraphic(result.lightOn)}
  <g id="wires">${wires.map(w => {const d = wirePath(point(w.from), point(w.to));return `<g data-wire="${w.id}" class="wire-connection"><title>${names[w.color]} wire: ${terminals[w.from].label} to ${terminals[w.to].label}. Select to remove.</title><path d="${d}" fill="none" stroke="${selectedWire === w.id ? '#d79e40' : '#78654d'}" stroke-opacity="${selectedWire === w.id ? 1 : .45}" stroke-width="${selectedWire === w.id ? 10 : 7}"/><path d="${d}" fill="none" stroke="${colors[w.color]}" stroke-width="4.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="transparent" stroke-width="17" class="wire-hit"/></g>`;}).join('')}</g>
  <path id="preview-wire" d="${selectedTerminal && ghost ? wirePath(point(selectedTerminal), ghost) : ''}" fill="none" stroke="${colors[selectedColor]}" stroke-width="4" stroke-dasharray="7 5" pointer-events="none"/>
  ${Object.keys(terminals).map(id => terminalGraphic(id as TerminalId)).join('')}`;
  if (active) board.querySelector<SVGGElement>(`[data-terminal="${active}"]`)?.focus();
  const status = document.querySelector('#power-status')!;
  status.classList.toggle('energized', power);
  status.innerHTML = `<span></span>Power ${power ? 'on' : 'off'}`;
  const powerButton = document.querySelector<HTMLButtonElement>('#power')!;
  powerButton.setAttribute('aria-pressed', String(power));
  powerButton.classList.toggle('on', power);
  powerButton.querySelector('span')!.textContent = `Turn power ${power ? 'off' : 'on'}`;
  document.querySelector('#wire-count')!.textContent = String(wires.length);
  document.querySelector('#wire-list')!.innerHTML = wires.length ? wires.map(w => `<div class="wire-row ${selectedWire === w.id ? 'selected-row' : ''}"><span class="wire-dot" style="background:${colors[w.color]}"></span><div><strong>${shortName(w.from)} → ${shortName(w.to)}</strong><small>${names[w.color]} wire</small></div><button data-remove="${w.id}" aria-label="Remove ${names[w.color].toLowerCase()} wire from ${terminals[w.from].label} to ${terminals[w.to].label}" ${power ? 'disabled' : ''}>×</button></div>`).join('') : '<p class="empty-wires">Your connections will appear here.</p>';
  document.querySelector('#connection-prompt')!.textContent = power ? 'Power is on · turn it off before changing wires' : selectedTerminal ? `${shortName(selectedTerminal)} selected · choose the other end` : selectedWire ? 'Wire selected · press Delete or use × to remove' : `${names[selectedColor]} wire selected · choose a terminal`;
  document.querySelector<HTMLButtonElement>('#cancel-wire')!.hidden = !selectedTerminal && !selectedWire;
  document.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(el => {const active = el.dataset.color === selectedColor;el.classList.toggle('active', active);el.setAttribute('aria-pressed', String(active));});
}
function shortName(id: TerminalId): string {
  const labels: Record<TerminalId, string> = { 'panel.hot1': 'Breaker 1', 'panel.hot2': 'Breaker 2', 'panel.neutral': 'Neutral bar', 'panel.ground': 'Ground bar', 'switch.a': 'Switch A', 'switch.b': 'Switch B', 'switch.ground': 'Switch ground', 'light.hot': 'Light hot', 'light.neutral': 'Light neutral', 'light.ground': 'Light ground' };
  return labels[id];
}
function report(title: string, messages: string[], kind: 'info' | 'success' | 'error' = 'info') {
  feedback.className = `feedback ${kind}`;
  feedback.replaceChildren();
  const heading = document.createElement('strong'); heading.textContent = title; feedback.append(heading);
  if (messages.length > 1) {
    const list = document.createElement('ul');
    messages.forEach(message => {const item = document.createElement('li');item.textContent = message;list.append(item);});feedback.append(list);
  } else {const p = document.createElement('p');p.textContent = messages[0] ?? '';feedback.append(p);}
}
function reportCircuit() {
  const result = evaluateCircuit(wires, power, switchOn);
  if (result.valid) report('You’ve built a complete circuit!', [`Breaker 1 feeds the light through the switch. White returns to neutral; green bonds both devices. ${!power ? 'Turn power on, then toggle the switch.' : switchOn ? 'The closed switch completes the hot path: your light is on.' : 'The open switch interrupts the hot path: your light is off.'}`], 'success');
  else report('Let’s check these connections.', result.errors, 'error');
}
function editingAllowed(): boolean {
  if (!power) return true;
  report('Power off first.', ['Turn power off before adding, removing, or moving wiring components.']);return false;
}
function connect(from: TerminalId, to: TerminalId) {
  if (!editingAllowed()) return;
  if (from === to) {selectedTerminal = null;ghost = null;render();return;}
  if (wires.some(w => (w.from === from && w.to === to) || (w.from === to && w.to === from))) {
    report('Those terminals are already connected.', ['Remove the existing wire first if you want to change its color.']);
  } else {
    wires.push({ id: nextId++, from, to, color: selectedColor });
    report('Connection added.', [`${names[selectedColor]} wire: ${shortName(from)} → ${shortName(to)}. Use “Check my wiring” when you’re ready.`]);
  }
  selectedTerminal = null; selectedWire = null; ghost = null;render();
}
function chooseTerminal(id: TerminalId) {
  if (!editingAllowed()) return;
  if (selectedTerminal) connect(selectedTerminal, id);
  else {selectedTerminal = id;selectedWire = null;render();}
}
function toggleSwitch() {
  switchOn = !switchOn; render();
  if (power) reportCircuit();
  else report(`Switch ${switchOn ? 'on' : 'off'}.`, ['The switch can close the hot path, but the light stays off until power is on and all connections are correct.']);
}
function removeWire(id: number) {
  if (!editingAllowed()) return;
  wires = wires.filter(w => w.id !== id);selectedWire = null;selectedTerminal = null;render();
  report('Wire removed.', ['Make a new connection or check the remaining circuit.']);
}
function svgPoint(event: PointerEvent): Point {
  const p = board.createSVGPoint();p.x = event.clientX;p.y = event.clientY;
  const converted = p.matrixTransform(board.getScreenCTM()!.inverse());return { x: converted.x, y: converted.y };
}
board.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const target = event.target as Element;
  const terminal = target.closest<SVGGElement>('[data-terminal]')?.dataset.terminal as TerminalId | undefined;
  const device = target.closest<SVGGElement>('[data-move]')?.dataset.move as 'switch' | 'light' | undefined;
  if (!terminal && !device) return;
  if (!editingAllowed()) return;
  const start = svgPoint(event);
  gesture = { start, terminal, device, origin: device ? {...positions[device]} : undefined, moved: false };
  board.setPointerCapture(event.pointerId); event.preventDefault();
});
board.addEventListener('pointermove', event => {
  const p = svgPoint(event);
  if (gesture) {
    if (Math.hypot(p.x-gesture.start.x, p.y-gesture.start.y) > 5) gesture.moved = true;
    if (!gesture.moved) return;
    if (gesture.terminal) {selectedTerminal = gesture.terminal;ghost = p;board.querySelector('#preview-wire')!.setAttribute('d', wirePath(point(selectedTerminal), p));}
    else if (gesture.device && gesture.origin) {
      const device = gesture.device;
      positions[device] = { x: Math.min(device === 'light' ? 693 : 738, Math.max(345, gesture.origin.x + p.x - gesture.start.x)), y: Math.min(320, Math.max(145, gesture.origin.y + p.y - gesture.start.y)) };
      render();
    }
  } else if (selectedTerminal) {ghost = p;board.querySelector('#preview-wire')!.setAttribute('d', wirePath(point(selectedTerminal), p));}
});
board.addEventListener('pointerup', event => {
  if (!gesture) return;
  const current = gesture;gesture = null;
  if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
  if (current.terminal && !current.moved) chooseTerminal(current.terminal);
  else if (current.terminal) {
    const p = svgPoint(event);
    const destination = (Object.keys(terminals) as TerminalId[]).find(id => Math.hypot(point(id).x-p.x, point(id).y-p.y) <= 20);
    if (destination && destination !== current.terminal) connect(current.terminal, destination);
    else {selectedTerminal = current.terminal;ghost = null;render();}
  }
});
board.addEventListener('pointercancel', () => {gesture = null;ghost = null;selectedTerminal = null;render();});
board.addEventListener('click', event => {
  const target = event.target as Element;
  if (target.closest('[data-action="switch"]')) toggleSwitch();
  const id = target.closest<SVGGElement>('[data-wire]')?.dataset.wire;
  if (id) {selectedWire = Number(id);selectedTerminal = null;ghost = null;render();}
});
board.addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target as Element;
  const terminal = target.closest<SVGGElement>('[data-terminal]')?.dataset.terminal as TerminalId | undefined;
  if (terminal) {event.preventDefault();chooseTerminal(terminal);}
  else if (target.closest('[data-action="switch"]')) {event.preventDefault();toggleSwitch();board.querySelector<SVGGElement>('[data-action="switch"]')?.focus();}
});
document.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(button => button.addEventListener('click', () => {selectedColor = button.dataset.color as WireColor;selectedWire = null;render();}));
document.querySelector('#wire-list')!.addEventListener('click', event => {const id = (event.target as Element).closest<HTMLButtonElement>('[data-remove]')?.dataset.remove;if (id) removeWire(Number(id));});
document.querySelector('#cancel-wire')!.addEventListener('click', () => {selectedTerminal = null;selectedWire = null;ghost = null;render();});
document.querySelector('#power')!.addEventListener('click', () => {
  if (power) {power = false;render();report('Power is off.', ['The circuit is de-energized. You can safely change your simulated wiring.']);return;}
  const result = evaluateCircuit(wires);
  if (!result.valid) {report('Power stays off. Fix the wiring first.', result.errors, 'error');return;}
  power = true;selectedTerminal = null;selectedWire = null;ghost = null;render();reportCircuit();
});
document.querySelector('#check')!.addEventListener('click', reportCircuit);
const hints = [
  'Select black. Connect Breaker 1’s HOT output to brass terminal A on the switch. (A and B are interchangeable.)',
  'Still using black, connect brass terminal B on the switch to the light’s HOT connection. The switch must interrupt this path.',
  'Select white. Connect the panel’s NEUTRAL bar directly to light NEUTRAL. This switch has no neutral terminal.',
  'Select green. Connect the panel GROUND bar to the switch’s green ground screw, then to the light’s GROUND connection. Both devices need a bond.',
  'Check your wiring, turn power on, then click the switch’s toggle. The light should follow the switch. Turn power off before making changes.',
];
document.querySelector('#hint')!.addEventListener('click', () => {report(`A little guidance · ${hintIndex+1} of ${hints.length}`, [hints[hintIndex]!]);hintIndex = (hintIndex+1) % hints.length;});
document.querySelector('#reset')!.addEventListener('click', () => {
  power = false;switchOn = false;wires = [];nextId = 1;selectedTerminal = null;selectedWire = null;selectedColor = 'hot';hintIndex = 0;ghost = null;gesture = null;
  positions.switch = {...originalPositions.switch};positions.light = {...originalPositions.light};render();
  report('A fresh start.', ['Power is off and all wires are cleared. Start with the black hot path from Breaker 1.']);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {selectedTerminal = null;selectedWire = null;ghost = null;render();}
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedWire !== null && !(event.target instanceof HTMLInputElement)) {event.preventDefault();removeWire(selectedWire);}
});
render();
