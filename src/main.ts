import './style.css';
import { createNMExample, evaluateBoxWiring, type BoxWiring } from './box-wiring';
import { evaluateCircuit, terminals, type TerminalId, type Wire, type WireColor } from './circuit';

const icons = {
  bolt: '<path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
  bulb: '<path d="M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>',
  plug: '<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-6 6v5M9 8v3m6-3v3"/>',
};
const icon = (name: keyof typeof icons) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;

function partThumbnail(kind: string): string {
  const art: Record<string, string> = {
    panel: '<rect x="9" y="3" width="30" height="42" rx="2" fill="#8c969b" stroke="#4b565e"/><rect x="13" y="8" width="22" height="29" fill="#3e474e"/><path d="M17 14h14m-14 8h14m-14 8h14" stroke="#adb7bd" stroke-width="3"/><path d="M14 41h6m8 0h6" stroke="#d2dce0" stroke-width="2"/>',
    switch: '<path d="M19 3h11v42H19Z" fill="#b8c1c5" stroke="#68777e"/><rect x="14" y="11" width="21" height="27" rx="2" fill="#e8e8da" stroke="#868a81"/><rect x="21" y="17" width="7" height="14" rx="1" fill="#fffef2" stroke="#b7b9ae"/><circle cx="12" cy="17" r="3" fill="#be9344"/><circle cx="12" cy="32" r="3" fill="#be9344"/><circle cx="35" cy="39" r="3" fill="#467a47"/>',
    'three-way': '<path d="M19 3h11v42H19Z" fill="#b8c1c5" stroke="#68777e"/><rect x="14" y="11" width="21" height="27" rx="2" fill="#e8e8da" stroke="#868a81"/><rect x="21" y="17" width="7" height="14" fill="#fffef2" stroke="#b7b9ae"/><circle cx="12" cy="17" r="3" fill="#3c4145"/><circle cx="37" cy="17" r="3" fill="#be9344"/><circle cx="37" cy="31" r="3" fill="#be9344"/><circle cx="12" cy="39" r="3" fill="#467a47"/>',
    outlet: '<path d="M19 2h11v44H19Z" fill="#b8c1c5" stroke="#68777e"/><rect x="12" y="8" width="25" height="32" rx="4" fill="#eeede2" stroke="#949990"/><path d="M18 13v6m11-6v5m-11 10v6m11-6v5" stroke="#4c5354" stroke-width="2"/><path d="M22 23q3-4 5 0m-5 15q3-4 5 0" fill="none" stroke="#4c5354" stroke-width="2"/><circle cx="9" cy="16" r="2.5" fill="#d6dce0"/><circle cx="40" cy="16" r="2.5" fill="#be9344"/><circle cx="9" cy="30" r="2.5" fill="#d6dce0"/><circle cx="40" cy="30" r="2.5" fill="#be9344"/><circle cx="9" cy="38" r="2.5" fill="#467a47"/>',
    light: '<circle cx="24" cy="30" r="15" fill="#e8e9dc" stroke="#8b9597"/><path d="M20 32h8v6h-8Z" fill="#8b9393"/><path d="M20 32c0-8-8-8-8-17a12 12 0 0 1 24 0c0 9-8 9-8 17Z" fill="#fff9d4" stroke="#b4b8a4"/><path d="M19 36h10" stroke="#5f6a6f"/>',
    box: '<rect x="7" y="7" width="35" height="35" rx="3" fill="#b6bfc1" stroke="#6c7b82"/><rect x="12" y="12" width="25" height="25" fill="#727e85"/><circle cx="24" cy="24" r="8" fill="none" stroke="#bfc9cd"/><circle cx="7" cy="24" r="4" fill="#8a979d" stroke="#52626c"/>',
    nuts: '<path d="m5 37 7-25h12l7 25Z" fill="#d99e36" stroke="#9a6c27"/><path d="m25 39 6-19h9l6 19Z" fill="#c58b2b" stroke="#98642d"/><path d="m14 17-3 15m9-15 4 15m9-8-2 12m5-12 3 12" stroke="#edc16b" stroke-width="2"/>',
  };
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${art[kind] ?? ''}</svg>`;
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header class="masthead">
  <div class="brand"><span class="brand-mark">${icon('plug')}</span><div><span class="brand-name">OLD CARPENTER <span>WORKSHOP</span></span><span class="brand-caption">RESIDENTIAL ELECTRICAL TRAINING</span></div></div>
  <div class="header-meta"><span class="phase-tag">DESIGN PREVIEW</span><span>Electrical Wiring Simulator</span></div>
</header>
<main class="workspace">
  <section class="page-intro"><div><div class="eyebrow">RESIDENTIAL WIRING LAB · MODULE 01</div><h1>Single-pole lighting circuit</h1><p>Wire the branch circuit. Verify every connection. Energize and test.</p></div><span class="lesson-counter"><span>TRAINING STATION</span> 01</span></section>
  <div class="workspace-grid">
    <aside class="panel toolbox" aria-labelledby="toolbox-title">
      <div class="panel-heading"><span class="panel-number">01</span><h2 id="toolbox-title">Toolbox</h2></div>
      <p class="panel-subtitle">Select a conductor. Connect at the terminal screws.</p>
      <div class="section-label">CONDUCTORS</div>
      <div class="wire-tools" role="group" aria-label="Wire color">
        <button class="wire-tool active" data-color="hot" aria-pressed="true"><span class="wire-swatch hot"></span><span><strong>Hot wire</strong><small>Black · carries power</small></span><span class="selection-dot"></span></button>
        <button class="wire-tool" data-color="neutral" aria-pressed="false"><span class="wire-swatch neutral"></span><span><strong>Neutral wire</strong><small>White · return path</small></span><span class="selection-dot"></span></button>
        <button class="wire-tool" data-color="ground" aria-pressed="false"><span class="wire-swatch ground"></span><span><strong>Ground wire</strong><small>Green · protective bond</small></span><span class="selection-dot"></span></button>
      </div>
      <div class="tool-tip"><span class="mini-number">i</span><p>Select a wire, then click two terminals. You can also drag between terminals.</p></div>
      <div class="section-label component-label">PARTS &amp; EQUIPMENT</div>
      <div class="parts-palette">
      <div class="component-item"><span class="part-graphic">${partThumbnail('panel')}</span><div><strong>Branch circuit panel</strong><small>6 spaces · 2 installed</small></div><span class="part-state">MOUNTED</span></div>
      <div class="component-item"><span class="part-graphic">${partThumbnail('switch')}</span><div><strong>Single-pole switch</strong><small>2 brass terminals + ground</small></div><span class="part-state">MOUNTED</span></div>
      <div class="component-item"><span class="part-graphic">${partThumbnail('light')}</span><div><strong>Light fixture</strong><small>Hot / neutral / ground</small></div><span class="part-state">MOUNTED</span></div>
      <button class="component-item future-part" disabled><span class="part-graphic">${partThumbnail('three-way')}</span><span><strong>Three-way switch</strong><small>Common + 2 travelers</small></span><span class="part-state">FUTURE</span></button>
      <button class="component-item future-part" disabled><span class="part-graphic">${partThumbnail('outlet')}</span><span><strong>Duplex receptacle</strong><small>Hot / neutral / ground</small></span><span class="part-state">FUTURE</span></button>
      <button class="component-item future-part" disabled><span class="part-graphic">${partThumbnail('box')}</span><span><strong>Junction box</strong><small>Splices &amp; pigtails</small></span><span class="part-state">FUTURE</span></button>
      <div class="component-item"><span class="part-graphic">${partThumbnail('nuts')}</span><span><strong>Wire nuts &amp; pigtails</strong><small>Inspect in NM cable example</small></span><span class="part-state">EXAMPLE</span></div>
      </div>
      <div class="connections-heading"><span class="section-label">YOUR CONNECTIONS</span><span id="wire-count">0</span></div>
      <div id="wire-list" class="wire-list"><p class="empty-wires">Your connections will appear here.</p></div>
    </aside>
    <section class="bench-panel" aria-labelledby="bench-title">
      <div class="bench-heading"><div><span class="section-label">120 V BRANCH CIRCUIT TRAINER</span><h2 id="bench-title">Residential practice board</h2></div><span id="power-status" class="status-pill"><span></span>Power off</span></div>
      <div class="wiring-modes" role="group" aria-label="Wiring exercise mode"><button id="terminal-mode" aria-pressed="true">Terminal wiring</button><button id="nm-example" aria-pressed="false">Load NM cable example</button><span>Inspect cable conductors, splices and box bonds</span></div>
      <div class="bench-toolbar"><span id="connection-prompt" role="status">Black wire selected · choose a terminal</span><button id="cancel-wire" class="text-button" hidden>Cancel</button></div>
      <div class="board-wrap"><svg id="board" viewBox="0 0 900 640" aria-label="Interactive wiring board" role="group"></svg></div>
      <div class="bench-footer"><span><span class="terminal-example"></span>Click a terminal to connect</span><span>Drag device headers to reposition</span></div>
      <section class="box-inspector" aria-labelledby="box-inspector-title"><div class="inspector-heading"><h3 id="box-inspector-title">Inside the boxes</h3><div><button data-inspect="switch" aria-expanded="false">Inspect switch box</button><button data-inspect="light" aria-expanded="false">Inspect fixture box</button></div></div><div id="box-detail" aria-live="polite"><p>Open a box view to inspect the mounting hardware and connections. Load the NM cable example to examine working splices.</p></div></section>
      <div class="under-bench"><span class="small-badge">CIRCUIT NOTE</span><p>The switch opens the hot path. A/B brass screws are interchangeable. Neutral returns to the source; ground bonds the equipment.</p></div>
    </section>
    <aside class="panel lesson-panel" aria-labelledby="lesson-title">
      <div class="panel-heading"><span class="panel-number">02</span><h2>Lesson guide</h2></div>
      <div class="lesson-label">EXERCISE 01 · BRANCH CIRCUITS</div>
      <h2 id="lesson-title" class="lesson-title">Simple light circuit</h2>
      <p class="lesson-description">Wire a 15 A lighting branch circuit with one single-pole switch and one fixture. Verify the circuit before energizing.</p>
      <div class="learning-objective"><span>${icon('bulb')}</span><p><strong>Your goal</strong>Control the fixture through the hot conductor. Provide a direct neutral return and bond both devices.</p></div>
      <div class="section-label">HOW IT WORKS</div>
      <ol class="key-points"><li><span class="point-dot hot-dot"></span><div><strong>Hot carries power.</strong><p>Black wire runs from Breaker 1 through the switch to the light. A/B line and load labels are instructional: either brass screw can take line.</p></div></li><li><span class="point-dot neutral-dot"></span><div><strong>Neutral completes the path.</strong><p>White wire connects the neutral bar directly to the light.</p></div></li><li><span class="point-dot ground-dot"></span><div><strong>Ground protects metal parts.</strong><p>Green or bare wire bonds the switch and fixture to ground. It never replaces neutral.</p></div></li></ol>
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
let boxWiring: BoxWiring | null = null;
let inspectedBox: 'switch' | 'light' | null = null;
function currentResult() { return boxWiring ? evaluateBoxWiring(boxWiring, power, switchOn) : evaluateCircuit(wires, power, switchOn); }
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
function routedWirePath(wire: Wire): string {
  let from = wire.from, to = wire.to;
  if (terminals[to].component === 'panel') [from, to] = [to, from];
  const a = point(from), b = point(to);
  let points: Point[];
  if (wire.color === 'hot' && terminals[from].component === 'panel' && terminals[to].component === 'switch') {
    const corridor = Math.min(a.x + 65, b.x - 30);
    points = [a, { x: corridor, y: a.y }, { x: corridor, y: b.y }, b];
  } else {
    const baseLane = wire.color === 'hot' ? 488 : wire.color === 'neutral' ? 526 : terminals[to].component === 'switch' ? 558 : 586;
    const lane = Math.max(baseLane, a.y + 30, b.y + 30);
    const offset = wire.color === 'ground' && terminals[from].component === 'panel' ? (terminals[to].component === 'switch' ? -16 : 16) : 0;
    points = offset ? [a, { x: a.x + offset, y: a.y + 24 }, { x: a.x + offset, y: lane }, { x: b.x, y: lane }, b]
      : [a, { x: a.x, y: lane }, { x: b.x, y: lane }, b];
  }
  let d = `M${points[0]!.x},${points[0]!.y}`;
  for (let i = 1; i < points.length-1; i++) {
    const prev = points[i-1]!, corner = points[i]!, next = points[i+1]!;
    const incoming = Math.hypot(corner.x-prev.x, corner.y-prev.y), outgoing = Math.hypot(next.x-corner.x, next.y-corner.y);
    const r = Math.min(10, incoming / 2, outgoing / 2);
    if (!incoming || !outgoing) continue;
    const before = { x: corner.x+(prev.x-corner.x)*r/incoming, y: corner.y+(prev.y-corner.y)*r/incoming };
    const after = { x: corner.x+(next.x-corner.x)*r/outgoing, y: corner.y+(next.y-corner.y)*r/outgoing };
    d += ` L${before.x},${before.y} Q${corner.x},${corner.y} ${after.x},${after.y}`;
  }
  return `${d} L${b.x},${b.y}`;
}
function screw(x: number, y: number): string {
  return `<g><circle cx="${x}" cy="${y}" r="5" fill="#b7b7ac" stroke="#686d66"/><path d="M${x-3},${y}h6" stroke="#636862" stroke-width="1.5"/></g>`;
}
function deviceLabel(x: number, y: number, title: string, subtitle: string, device?: string): string {
  const width = device === 'light' ? 182 : 155;
  return `<g ${device ? `data-move="${device}" class="device-drag"` : ''}><rect x="${x}" y="${y}" width="${width}" height="43" rx="2" fill="#24323c" stroke="#60717d" filter="url(#label-shadow)"/><rect x="${x}" y="${y}" width="4" height="43" fill="#dfa232"/><text x="${x+11}" y="${y+17}" class="device-label">${title}</text><text x="${x+11}" y="${y+33}" class="device-subtitle">${subtitle}</text>${device ? `<text x="${x+width-14}" y="${y+19}" fill="#9cabaf" font-size="16">⠿</text>` : ''}</g>`;
}
function panelGraphic(): string {
  return `<g class="panel-device">
    <rect x="45" y="80" width="285" height="436" rx="4" fill="url(#panel-metal)" stroke="#4d5c66" stroke-width="3" filter="url(#device-shadow)"/>
    <path d="M53 94h269v411H53Z" fill="none" stroke="#e0e6e6" stroke-width="2"/><path d="M56 133V99h263v34" fill="#42515c" stroke="#849298"/>
    <text x="70" y="116" class="panel-brand">6-SPACE LOAD CENTER</text><text x="70" y="128" class="breaker-caption">BRANCH CIRCUITS · TRAINING CUTAWAY</text>
    <rect x="64" y="140" width="247" height="260" fill="#343d45" stroke="#1a252d" stroke-width="2"/>
    ${[0,1].map(n => {const y=155+n*64, on=n===0 && power;return `<g><rect x="75" y="${y}" width="156" height="50" rx="2" fill="#19232a" stroke="#74818a"/><rect x="81" y="${y+5}" width="53" height="40" fill="#313c43"/><text x="88" y="${y+19}" class="breaker-number">15</text><text x="88" y="${y+35}" class="breaker-caption">AMP</text><rect x="146" y="${y+8}" width="32" height="34" rx="2" fill="#0e1519" stroke="#505c61"/><rect x="${on ? 157 : 149}" y="${y+13}" width="16" height="24" rx="2" fill="${on ? '#d79b33' : '#778187'}"/><text x="188" y="${y+20}" class="breaker-caption">${on ? 'ON' : 'OFF'}</text><text x="188" y="${y+36}" class="breaker-caption">${n===0 ? 'B1' : 'B2'}</text><text x="88" y="${y+59}" class="breaker-caption">BREAKER ${n+1} · ${n===0 ? 'LIGHTING' : 'RESERVED'}</text><path d="M231 ${y+24}h34" stroke="#191c1c" stroke-width="6"/><text x="252" y="${y+9}" class="panel-terminal-label">HOT ${n+1}</text></g>`;}).join('')}
    ${[0,1,2,3].map(n => {const y=284+n*27;return `<rect x="77" y="${y}" width="219" height="23" rx="1" fill="#65727b" stroke="#8d9a9f"/><path d="M84 ${y+6}h204" stroke="#75838b"/><text x="89" y="${y+16}" class="spare-label">${n+3} — SPARE / BLANK FILLER</text>`;}).join('')}
    <rect x="77" y="411" width="83" height="48" rx="2" fill="#d7ddde" stroke="#87969d"/><rect x="207" y="411" width="85" height="48" rx="2" fill="#80938c" stroke="#526d60"/>
    ${screw(90,422)}${screw(147,422)}${screw(218,422)}${screw(279,422)}
    <text x="119" y="477" text-anchor="middle" class="tiny-label">NEUTRAL BAR</text><text x="250" y="477" text-anchor="middle" class="tiny-label">GROUND BAR</text>
    <text x="188" y="497" text-anchor="middle" class="fine-label">Separate bars · upstream supply not shown</text>
    ${screw(55,90)}${screw(320,90)}${screw(55,505)}${screw(320,505)}
    <path d="M45 153h-6v32h6m0 245h-6v32h6" fill="#76858c" stroke="#4f626c"/>

  </g>`;
}
function switchGraphic(): string {
  const {x,y} = positions.switch;
  return `<g>${deviceLabel(x, y-58, 'SINGLE-POLE SWITCH', '2 brass screws · 1 ground', 'switch')}
    <title>Residential single-pole toggle switch: two brass current terminals and one green screw bonded to the metal grounding yoke. No neutral connection.</title>
    <rect x="${x-8}" y="${y+24}" width="140" height="185" rx="3" fill="url(#panel-metal)" stroke="#6b7b80" stroke-width="2"/>
    <rect x="${x+1}" y="${y+33}" width="122" height="167" rx="2" fill="#354149" stroke="#9ca7a8"/>
    <rect x="${x+19}" y="${y+38}" width="81" height="141" rx="6" fill="#302d27" stroke="#171918" stroke-width="2"/>
    <path d="M${x+38} ${y}h48v35h10v137h-10v9h32v24H${x+86}v26H${x+38}v-52h-9V${y+35}h9Z" transform="translate(0 0)" fill="url(#switch-metal)" stroke="#78888e" filter="url(#device-shadow)"/>
    <rect x="${x+53}" y="${y+9}" width="18" height="14" rx="7" fill="#354149" stroke="#7d8b90"/>
    <rect x="${x+53}" y="${y+208}" width="18" height="14" rx="7" fill="#354149" stroke="#7d8b90"/>
    <g class="mounting-hardware"><title>Steel device mounting screws: mechanical fasteners, not wiring terminals.</title>${screw(x+62,y+16)}${screw(x+62,y+214)}</g>
    <path d="M${x-4} ${y+37}v158h131M${x+3} ${y+38}h119" fill="none" stroke="#e3e8e8" stroke-width="2"/><circle cx="${x+9}" cy="${y+110}" r="8" fill="none" stroke="#7a898e"/><circle cx="${x+115}" cy="${y+110}" r="8" fill="none" stroke="#7a898e"/>
    <rect x="${x+4}" y="${y+58}" width="29" height="24" rx="3" fill="#a78035" stroke="#634a21"/>
    <rect x="${x+4}" y="${y+136}" width="29" height="24" rx="3" fill="#a78035" stroke="#634a21"/>
    <rect x="${x+35}" y="${y+38}" width="54" height="143" rx="7" fill="url(#toggle-ivory)" stroke="#a79d83" stroke-width="2"/>
    <path d="M${x+41} ${y+46}h42m-42 126h42" stroke="#fffbee" stroke-width="2"/>
    <g data-action="switch" class="switch-toggle" role="button" tabindex="0" aria-label="Toggle light switch" aria-pressed="${switchOn}">
      <rect x="${x+46}" y="${y+71}" width="32" height="72" rx="4" fill="#645d4d" stroke="#ada082"/>
      <path d="M${x+52} ${y+108}l-2 ${switchOn ? -28 : 28}h24l-2 ${switchOn ? 28 : -28}Z" fill="url(#toggle-ivory)" stroke="#aa9b7e" stroke-width="2"/>
      <path d="M${x+50} ${y+(switchOn ? 80 : 136)}l3 ${switchOn ? -5 : 5}h18l3 ${switchOn ? 5 : -5}Z" fill="#fff9e7" stroke="#c6b999"/>
      <text x="${x+62}" y="${y+61}" text-anchor="middle" class="tiny-label">ON</text>
      <text x="${x+62}" y="${y+163}" text-anchor="middle" class="tiny-label">OFF</text>
    </g>
    <text x="${x-5}" y="${y+48}" class="terminal-caption">A · LINE*</text><text x="${x-5}" y="${y+126}" class="terminal-caption">B · LOAD*</text><text x="${x+92}" y="${y+171}" class="terminal-caption">G</text>
    <text x="${x+64}" y="${y+242}" text-anchor="middle" class="board-note">SWITCH ${switchOn ? 'ON' : 'OFF'}</text></g>`;
}
function lightGraphic(on: boolean): string {
  const {x,y} = positions.light;
  return `<g>${deviceLabel(x, y-43, 'LIGHT FIXTURE', 'Porcelain holder · bonded box', 'light')}
    ${on ? `<circle cx="${x+91}" cy="${y+96}" r="110" fill="url(#light-glow)" class="bulb-glow"/>` : ''}
    <path d="M${x+42} ${y+49}h98l17 18v89l-17 18H${x+42}l-17-18V${y+67}Z" fill="url(#panel-metal)" stroke="#76828b" stroke-width="2"/>
    <ellipse cx="${x+91}" cy="${y+124}" rx="79" ry="23" fill="#8f806f" opacity=".22"/>
    <circle cx="${x+91}" cy="${y+101}" r="73" fill="url(#fixture-ceramic)" stroke="#c7bfad" filter="url(#device-shadow)"/><circle cx="${x+91}" cy="${y+101}" r="59" fill="none" stroke="#d1c9b7"/>
    ${screw(x+34,y+102)}${screw(x+148,y+102)}
    <rect x="${x+65}" y="${y+103}" width="52" height="39" rx="7" fill="#8d8b7d" stroke="#737468"/><path d="M${x+68} ${y+111}h46m-46 9h46m-46 9h46" stroke="#b9b6a3" stroke-width="3"/>
    <path d="M${x+65},${y+108} C${x+67},${y+95} ${x+47},${y+88} ${x+48},${y+64} C${x+48},${y+10} ${x+134},${y+10} ${x+134},${y+64} C${x+135},${y+88} ${x+115},${y+95} ${x+117},${y+108}Z" fill="${on ? 'url(#lit-bulb)' : 'url(#unlit-bulb)'}" stroke="${on ? '#d7a447' : '#ccc6b2'}" stroke-width="2"/>
    <path d="M${x+78},${y+104}v-25l8 7 10-12 9 8v22" fill="none" stroke="${on ? '#fff8c2' : '#b8ad8c'}" stroke-width="2.5"/><path d="M${x+61},${y+52}q5-17 24-20" fill="none" stroke="#fffef4" stroke-width="5" stroke-linecap="round" opacity=".65"/>
    <path d="M${x+49},${y+159}v23H${x+23}v38" fill="none" stroke="#252a2c" stroke-width="4"/><path d="M${x+91},${y+159}v61" fill="none" stroke="#f9f8ee" stroke-width="4"/><path d="M${x+141},${y+152}v30h18v38" fill="none" stroke="#3c8950" stroke-width="4"/>
    <rect x="${x+4}" y="${y+206}" width="174" height="47" rx="5" fill="#cbc8b3" stroke="#939582"/>
    <text x="${x+23}" y="${y+198}" text-anchor="middle" class="terminal-caption">HOT</text><text x="${x+91}" y="${y+198}" text-anchor="middle" class="terminal-caption">NEUTRAL</text><text x="${x+159}" y="${y+198}" text-anchor="middle" class="terminal-caption">GROUND</text>
    <text x="${x+91}" y="${y+274}" text-anchor="middle" class="board-note">LIGHT ${on ? 'ON' : 'OFF'}</text></g>`;
}
function terminalGraphic(id: TerminalId): string {
  const p = point(id), t = terminals[id], selected = selectedTerminal === id;
  if (id.startsWith('switch.')) {
    const ground = t.kind === 'ground';
    return `<g data-terminal="${id}" class="terminal ${selected ? 'selected' : ''}" role="button" tabindex="0" aria-label="${t.label}" aria-pressed="${selected}"><title>${t.label} · ${ground ? 'Green grounding screw on metal yoke' : 'Brass current-carrying screw'}</title><circle cx="${p.x}" cy="${p.y}" r="18" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="12" fill="${ground ? '#325c35' : '#876323'}" stroke="#333b32"/><circle cx="${p.x}" cy="${p.y}" r="10" fill="url(#${ground ? 'green' : 'brass'}-screw)" stroke="${ground ? '#244d2b' : '#70521e'}"/><path d="M${p.x-7} ${p.y}h14m-7-4v8" stroke="${ground ? '#173c24' : '#634714'}" stroke-width="2"/><path d="M${p.x-6} ${p.y-5}q6-4 12 0" fill="none" stroke="${ground ? '#b0d193' : '#fff0ad'}" stroke-width="1.5"/><circle cx="${p.x}" cy="${p.y}" r="15" fill="none" stroke="${selected ? '#f4bd5b' : 'transparent'}" stroke-width="3"/><circle cx="${p.x}" cy="${p.y}" r="17" class="focus-ring" fill="none" stroke="#266b73" stroke-width="3"/></g>`;
  }
  const fill = t.kind === 'hot' ? '#c39a4e' : t.kind === 'neutral' ? '#e0e0d5' : '#44794b';
  return `<g data-terminal="${id}" class="terminal ${selected ? 'selected' : ''}" role="button" tabindex="0" aria-label="${t.label}" aria-pressed="${selected}"><title>${t.label} · ${names[t.kind]} wire</title><circle cx="${p.x}" cy="${p.y}" r="18" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="13" fill="${selected ? '#f4bd5b' : '#f4e9cb'}" stroke="${selected ? '#8c591b' : '#82735c'}" stroke-width="${selected ? 3 : 1}"/><circle cx="${p.x}" cy="${p.y}" r="9" fill="${fill}" stroke="#635c4a"/><path d="M${p.x-5},${p.y}h10" stroke="#5d573e" stroke-width="2"/><circle cx="${p.x}" cy="${p.y}" r="15" class="focus-ring" fill="none" stroke="#266b73" stroke-width="3"/></g>`;
}
function cableGraphic(): string {
  const s = positions.switch, l = positions.light;
  const paths = [
    `M188,493 V545 Q188,555 198,555 H${s.x+20} Q${s.x+35},555 ${s.x+35},540 V${s.y+198}`,
    `M${s.x+111},${s.y+198} V570 Q${s.x+111},580 ${s.x+126},580 H${l.x+81} Q${l.x+91},580 ${l.x+91},570 V${l.y+172}`,
  ];
  return `<g class="nm-cables"><title>Two 14/2 NM-B cables: black, white, and bare equipment ground inside each sheath.</title>${paths.map(d => `<path d="${d}" fill="none" stroke="#796e5a" stroke-width="18" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#e7dfc7" stroke-width="14" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#f9f4e2" stroke-opacity=".65" stroke-width="3" stroke-linejoin="round"/>`).join('')}
    <text x="350" y="546" class="board-note">14/2 NM-B + GROUND</text><text x="593" y="570" class="board-note">14/2 NM-B + GROUND</text>
    ${[s.x+35,s.x+111].map(x => `<rect x="${x-12}" y="${s.y+202}" width="24" height="11" rx="2" fill="url(#panel-metal)" stroke="#65767d"/>${screw(x-7,s.y+207)}${screw(x+7,s.y+207)}`).join('')}
    <rect x="${l.x+78}" y="${l.y+156}" width="26" height="15" rx="3" fill="url(#panel-metal)" stroke="#65767d"/>
    <text x="${s.x+2}" y="${s.y+262}" class="fine-label">Sheath ends inside box · inspect below</text>
  </g>`;
}
function boxDiagram(box: 'switch' | 'light', layout: BoxWiring): string {
  const p: Record<string, Point> = box === 'switch' ? {
    'feed.out.hot': {x:88,y:110}, 'feed.out.neutral': {x:100,y:110}, 'feed.out.ground': {x:112,y:110},
    'load.in.hot': {x:286,y:110}, 'load.in.neutral': {x:298,y:110}, 'load.in.ground': {x:310,y:110},
    'switch.a': {x:174,y:170}, 'switch.b': {x:174,y:245}, 'switch.ground': {x:254,y:305},
    'switch.ground.tail': {x:292,y:345}, 'switch.box.tail': {x:304,y:345}, 'switch.box': {x:364,y:340},
  } : {
    'load.out.hot': {x:82,y:110}, 'load.out.neutral': {x:94,y:110}, 'load.out.ground': {x:106,y:110},
    'fixture.hot.lead': {x:192,y:222}, 'fixture.neutral.lead': {x:222,y:282}, 'fixture.ground.lead': {x:256,y:342},
    'fixture.box.tail': {x:268,y:342}, 'light.hot': {x:430,y:150}, 'light.neutral': {x:455,y:150},
    'light.ground': {x:480,y:150}, 'light.box': {x:310,y:342},
  };
  const splicePoints: Record<string, Point> = box === 'switch'
    ? {'switch-neutral':{x:100,y:298},'switch-ground':{x:286,y:343}}
    : {'fixture-hot':{x:186,y:220},'fixture-neutral':{x:216,y:280},'fixture-ground':{x:250,y:340}};
  for (const splice of layout.splices.filter(s => s.box === box)) {
    const center = splicePoints[splice.id]!;
    splice.members.forEach((member,i) => {p[member] = {x:center.x-6+i*12,y:center.y+5};});
  }
  const stroke = (kind: WireColor, bare = false) => bare ? '#c68a54' : colors[kind];
  const line = (a: Point,b: Point,kind: WireColor, bare = false, connected = true) => `<path d="M${a.x} ${a.y} C${a.x} ${a.y+32} ${b.x-24} ${b.y} ${b.x} ${b.y}" fill="none" stroke="#151e23" stroke-width="7" opacity=".45"/><path d="M${a.x} ${a.y} C${a.x} ${a.y+32} ${b.x-24} ${b.y} ${b.x} ${b.y}" fill="none" stroke="${stroke(kind,bare)}" stroke-width="4" ${connected ? '' : 'stroke-dasharray="5 7" opacity=".4"'}/>`;
  const feeds = box === 'switch' ? [{id:'feed.out',x:100},{id:'load.in',x:298}] : [{id:'load.out',x:94}];
  const shell = box === 'switch' ? '<rect x="35" y="55" width="360" height="325" rx="8"/>' : '<path d="M70 55h218l47 47v224l-47 54H70l-40-54V102Z"/>';
  const wiresInside = feeds.map(feed => `<rect x="${feed.x-18}" y="20" width="36" height="65" rx="4" fill="#ede4cd" stroke="#a99d81"/><rect x="${feed.x-27}" y="53" width="54" height="16" rx="3" fill="#aab5bb" stroke="#61727c"/><text x="${feed.x}" y="14" text-anchor="middle" class="inspection-label">${feed.id === 'feed.out' ? 'FROM PANEL' : feed.id === 'load.in' ? 'TO FIXTURE' : 'FROM SWITCH'}</text>${(['hot','neutral','ground'] as WireColor[]).map((kind,i) => line({x:feed.x-12+i*12,y:85},{x:feed.x-12+i*12,y:110},kind,kind==='ground')).join('')}`).join('');
  const leads = layout.leads.filter(c => p[c.from] && p[c.to]).map(c => `<g><title>${c.label}${c.connected ? '' : ' · disconnected'}</title>${line(p[c.from]!,p[c.to]!,c.kind,c.bare,c.connected)}</g>`).join('');
  const spliceWires = layout.splices.filter(s => s.box === box).map(s => s.members.map(member => {
    // The cable end and splice end are two drawing locations for the same conductor end.
    const original = feeds.find(f => member.startsWith(f.id));
    if (!original) return '';
    const kind = member.split('.').at(-1) as WireColor;
    const i = ['hot','neutral','ground'].indexOf(kind);
    const enabled = layout.cables.flatMap(c => c.conductors).find(c => c.from === member || c.to === member)?.connected ?? true;
    return line({x:original.x-12+i*12,y:110},p[member]!,kind,kind==='ground',enabled);
  }).join('')).join('');
  const nuts = layout.splices.filter(s => s.box === box).map(s => {
    const c = splicePoints[s.id]!, y = c.y-(s.connected ? 0 : 24);
    return `<g data-splice-graphic="${s.id}"><title>${s.label} · ${s.connected ? 'connected' : 'open — separate conductor ends'}</title><path d="M${c.x-14} ${y}l6-28h16l6 28Z" fill="${s.connected ? '#e3a135' : '#b8bdbe'}" stroke="#775623" stroke-width="2"/><path d="M${c.x-5} ${y-22}l-3 17m12-17 3 17" stroke="#ffe0a0" stroke-width="2"/><ellipse cx="${c.x}" cy="${y}" rx="14" ry="3" fill="#6d4a24"/><text x="${c.x-15}" y="${c.y+27}" class="inspection-label">${s.id.includes('neutral') ? 'NEUTRAL' : s.id.includes('ground') ? 'GROUND' : 'SWITCHED HOT'}${s.connected ? '' : ' · OPEN'}</text></g>`;
  }).join('');
  const hardware = box === 'switch' ? `<path d="M195 120h40v23h12v152h21v23h-33v32h-40v-32h-12V143h12Z" fill="#b9c3c7" stroke="#697d86"/><rect x="193" y="148" width="45" height="143" rx="6" fill="#eee5cf" stroke="#a39b89"/><rect x="205" y="185" width="21" height="71" rx="3" fill="#5a584d"/><path d="M209 218l-2 ${switchOn ? -24 : 24}h17l-2 ${switchOn ? 24 : -24}Z" fill="#fff5da" stroke="#a89d81"/>${screw(215,131)}${screw(215,339)}<text x="150" y="156" class="inspection-label">BRASS A</text><text x="150" y="230" class="inspection-label">BRASS B</text><text x="252" y="285" class="inspection-label">GREEN / YOKE</text><text x="350" y="322" class="inspection-label">BOX BOND</text>`
    : `<circle cx="455" cy="102" r="55" fill="#eee9d8" stroke="#b9b29e"/><circle cx="455" cy="102" r="29" fill="#8a887a"/><path d="M434 95h42m-42 10h42" stroke="#c4c0ab" stroke-width="4"/>${screw(411,102)}${screw(499,102)}<text x="455" y="32" text-anchor="middle" class="inspection-label">FIXTURE LIFTED FOR VIEW</text><text x="455" y="179" text-anchor="middle" class="inspection-label">BLACK / WHITE / GREEN LEADS</text><text x="293" y="322" class="inspection-label">BOX BOND</text>`;
  const ends = box === 'switch' ? ['switch.a','switch.b','switch.ground','switch.box'] : ['light.box'];
  const screws = ends.map(id => {const c=p[id]!,ground=id.includes('ground')||id.endsWith('.box');return `<circle cx="${c.x}" cy="${c.y}" r="9" fill="${ground ? '#4a8850' : '#d4ad55'}" stroke="${ground ? '#254b2d' : '#70521e'}"/><path d="M${c.x-5} ${c.y}h10m-5-3v6" stroke="${ground ? '#193d22' : '#6d4e16'}" stroke-width="1.5"/>`;}).join('');
  return `<svg class="inspection-diagram" viewBox="0 0 ${box==='switch'?440:560} 420" role="img" aria-label="${box==='switch'?'Single-gang steel switch box with brass terminals, neutral pass-through, ground splice and separate device and box pigtails':'Octagonal steel fixture box with spliced fixture leads and separate metal-box grounding pigtail'}"><g fill="#52616a" stroke="#a1afb5" stroke-width="4">${shell}</g><g fill="none" stroke="#87979f" stroke-width="2"><circle cx="52" cy="215" r="12"/><circle cx="${box==='switch'?380:320}" cy="215" r="12"/></g>${wiresInside}${spliceWires}${leads}${hardware}${nuts}${screws}<text x="40" y="402" class="inspection-label">Sheath ends inside box · exposed conductors stay inside</text></svg>`;
}
function renderInspector() {
  document.querySelectorAll<HTMLButtonElement>('[data-inspect]').forEach(button => button.setAttribute('aria-expanded',String(button.dataset.inspect === inspectedBox)));
  const detail = document.querySelector('#box-detail')!;
  const expanded = detail.querySelector<HTMLDetailsElement>('.conductor-details')?.open ?? false;
  const focused = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
  const focusKey = focused?.dataset.splice ? 'splice' : focused?.dataset.conductor ? 'conductor' : null;
  const focusId = focusKey ? focused?.dataset[focusKey] : null;
  if (!inspectedBox) {detail.innerHTML = '<p>Open a box view to inspect the mounting hardware and connections. Load the NM cable example to examine working splices.</p>';return;}
  const box = inspectedBox, example = boxWiring ?? createNMExample();
  detail.innerHTML = `<div class="inspection-content"><div>${boxDiagram(box,example)}</div><div class="inspection-notes"><h4>${box==='switch'?'Single-gang steel switch box':'Octagonal steel fixture box'}</h4><p>${box==='switch'?'Two brass screws carry line and switched hot. The green screw bonds the steel yoke. Silver mounting screws only fasten the device. Neutral passes through a wire nut without touching the switch. Incoming and outgoing black conductors terminate directly on brass screws; they do not need hot pigtails in this example.':'The fixture is lifted to reveal its black and white leads spliced to the cable conductors. Equipment ground bonds the fixture and steel box. The porcelain holder and its mounting screws do not substitute for that bond.'}</p><p>NM-B contains black, white and bare ground. The sheath enters through a cable clamp and ends inside the box. Short green leads are grounding pigtails.</p>${boxWiring ? '<p class="inspection-state">Working cable example · connections affect the circuit</p>' : '<p class="inspection-state">Reference cutaway · load the NM cable example to test these splices</p>'}
    <div class="splice-controls">${example.splices.filter(s => s.box === box).map(s => `<div class="splice-row"><span><strong>${s.label}</strong><small>${s.members.length} conductor ends · ${s.connected?'connected':'open'}</small></span><button data-splice="${s.id}" ${!boxWiring||power?'disabled':''}>${s.connected?'Open':'Reconnect'} splice</button></div>`).join('')}</div>
    ${boxWiring ? `<details class="conductor-details" ${expanded ? 'open' : ''}><summary>Inspect individual conductors &amp; leads</summary>${[...example.cables.flatMap(c => c.conductors),...example.leads].filter(c => box==='switch' ? c.id.startsWith('feed.')||c.id.startsWith('load.')||c.id.startsWith('switch-') : c.id.startsWith('load.')||c.id.startsWith('fixture-')).map(c => `<div class="splice-row"><span>${c.label}</span><button data-conductor="${c.id}" ${power?'disabled':''}>${c.connected?'Disconnect':'Reconnect'}</button></div>`).join('')}</details>` : ''}
    </div></div>`;
  if (focusKey && focusId) detail.querySelector<HTMLButtonElement>(`[data-${focusKey}="${focusId}"]`)?.focus();
}

function render() {
  const active = document.activeElement?.getAttribute('data-terminal');
  const result = currentResult();
  board.innerHTML = `<defs>
    <filter id="device-shadow" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="2" dy="6" stdDeviation="5" flood-color="#3c2e1d" flood-opacity=".21"/></filter>
    <filter id="label-shadow"><feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#665236" flood-opacity=".14"/></filter>
    <linearGradient id="panel-metal" x2="1" y2="1"><stop stop-color="#d2d9dc"/><stop offset=".5" stop-color="#a6b1b8"/><stop offset="1" stop-color="#7e8d96"/></linearGradient>
    <linearGradient id="switch-metal"><stop stop-color="#aeb9bc"/><stop offset=".5" stop-color="#e2e8e8"/><stop offset="1" stop-color="#8a979d"/></linearGradient>
    <linearGradient id="brass-screw" x2="1" y2="1"><stop stop-color="#fff0a7"/><stop offset=".45" stop-color="#d5ad52"/><stop offset="1" stop-color="#93691e"/></linearGradient>
    <linearGradient id="green-screw" x2="1" y2="1"><stop stop-color="#a3c58a"/><stop offset=".45" stop-color="#528b47"/><stop offset="1" stop-color="#285534"/></linearGradient>
    <linearGradient id="toggle-ivory" x2="0" y2="1"><stop stop-color="#fff9e9"/><stop offset="1" stop-color="#ded2b5"/></linearGradient>
    <radialGradient id="fixture-ceramic"><stop stop-color="#fffef5"/><stop offset="1" stop-color="#e6e0ce"/></radialGradient>
    <radialGradient id="unlit-bulb"><stop stop-color="#fbf9e9"/><stop offset="1" stop-color="#ddd8c4"/></radialGradient>
    <radialGradient id="lit-bulb"><stop stop-color="#fffef3"/><stop offset=".65" stop-color="#ffeeb1"/><stop offset="1" stop-color="#f6ce68"/></radialGradient>
    <radialGradient id="light-glow"><stop stop-color="#ffe57d" stop-opacity=".7"/><stop offset="1" stop-color="#ffe57d" stop-opacity="0"/></radialGradient>
    <pattern id="board-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M0 5q14-4 28 0M0 22q14 3 28 0" fill="none" stroke="#9c7950" stroke-opacity=".12"/></pattern>
  </defs>
  <rect x="7" y="9" width="886" height="620" rx="3" fill="#34434e" stroke="#1a2933" stroke-width="4"/><rect x="22" y="26" width="856" height="588" rx="2" fill="#cdb38a" stroke="#8d7656" stroke-width="2"/><rect x="23" y="27" width="854" height="586" fill="url(#board-grid)"/><g stroke="#9d8058" stroke-opacity=".18" fill="none">${[110,210,330,460,590].map(y => `<path d="M23 ${y}C260 ${y-18} 400 ${y+14} 878 ${y-2}"/>`).join('')}</g>
  <path d="M14 35h872M14 595h872" stroke="#e5d4b2"/><text x="37" y="53" class="board-caption">OCW / RESIDENTIAL ELECTRICAL TRAINER</text><text x="858" y="53" text-anchor="end" class="board-caption">120V MODEL · POWER ${power ? 'ON' : 'OFF'}</text>
  ${screw(15,18)}${screw(885,18)}${screw(15,620)}${screw(885,620)}
  <text x="369" y="112" class="board-note">01 / SUPPLY → SWITCH → LOAD</text><text x="369" y="131" class="fine-label">Click terminal screws · mounting screws are not connections</text>
  ${boxWiring ? cableGraphic() : ''}
  ${panelGraphic()}${switchGraphic()}${lightGraphic(result.lightOn)}
  <g id="wires">${(boxWiring ? [] : wires).map(w => {const d = routedWirePath(w);return `<g data-wire="${w.id}" class="wire-connection"><title>${names[w.color]} wire: ${terminals[w.from].label} to ${terminals[w.to].label}. Select to remove.</title><path d="${d}" fill="none" stroke="${selectedWire === w.id ? '#efad35' : '#73664d'}" stroke-opacity="${selectedWire === w.id ? 1 : .8}" stroke-width="${selectedWire === w.id ? 10 : 7}"/><path d="${d}" fill="none" stroke="${colors[w.color]}" stroke-width="5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="transparent" stroke-width="17" class="wire-hit"/></g>`;}).join('')}</g>
  <path id="preview-wire" d="${selectedTerminal && ghost ? wirePath(point(selectedTerminal), ghost) : ''}" fill="none" stroke="${colors[selectedColor]}" stroke-width="4" stroke-dasharray="7 5" pointer-events="none"/>
  ${Object.keys(terminals).map(id => terminalGraphic(id as TerminalId)).join('')}<text x="369" y="608" class="fine-label">WIRE CROSSINGS ARE NOT JOINTS · CONNECTIONS OCCUR AT TERMINALS ONLY</text>`;
  if (active) board.querySelector<SVGGElement>(`[data-terminal="${active}"]`)?.focus();
  const status = document.querySelector('#power-status')!;
  status.classList.toggle('energized', power);
  status.innerHTML = `<span></span>Power ${power ? 'on' : 'off'}`;
  const powerButton = document.querySelector<HTMLButtonElement>('#power')!;
  powerButton.setAttribute('aria-pressed', String(power));
  powerButton.classList.toggle('on', power);
  powerButton.querySelector('span')!.textContent = `Turn power ${power ? 'off' : 'on'}`;
  document.querySelector('#wire-count')!.textContent = String(boxWiring ? boxWiring.cables.length : wires.length);
  document.querySelector('#wire-list')!.innerHTML = boxWiring ? '<p class="empty-wires">2 NM-B cables · black, white and bare ground.<br>Device leads, wire nuts and grounding pigtails are inside the boxes. Inspect a box to test each connection.</p>' : wires.length ? wires.map(w => `<div class="wire-row ${selectedWire === w.id ? 'selected-row' : ''}"><span class="wire-dot" style="background:${colors[w.color]}"></span><div><strong>${shortName(w.from)} → ${shortName(w.to)}</strong><small>${names[w.color]} wire</small></div><button data-remove="${w.id}" aria-label="Remove ${names[w.color].toLowerCase()} wire from ${terminals[w.from].label} to ${terminals[w.to].label}" ${power ? 'disabled' : ''}>×</button></div>`).join('') : '<p class="empty-wires">Your connections will appear here.</p>';
  document.querySelector('#connection-prompt')!.textContent = power ? 'Power is on · turn it off before changing wires' : boxWiring ? 'NM cable example · inspect a box to test continuity' : selectedTerminal ? `${shortName(selectedTerminal)} selected · choose the other end` : selectedWire ? 'Wire selected · press Delete or use × to remove' : `${names[selectedColor]} wire selected · choose a terminal`;
  document.querySelector<HTMLButtonElement>('#cancel-wire')!.hidden = !selectedTerminal && !selectedWire;
  document.querySelector('#terminal-mode')!.setAttribute('aria-pressed', String(!boxWiring));
  document.querySelector('#nm-example')!.setAttribute('aria-pressed', String(!!boxWiring));
  renderInspector();
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
  const result = currentResult();
  if (result.valid) report('You’ve built a complete circuit!', [`Breaker 1 feeds the light through the switch. White returns to neutral; green bonds both devices. ${!power ? 'Turn power on, then toggle the switch.' : switchOn ? 'The closed switch completes the hot path: your light is on.' : 'The open switch interrupts the hot path: your light is off.'}`], 'success');
  else report('Let’s check these connections.', result.errors, 'error');
}
function editingAllowed(): boolean {
  if (!power) return true;
  report('Power off first.', ['Turn power off before adding, removing, or moving wiring components.']);return false;
}
function connect(from: TerminalId, to: TerminalId) {
  if (!editingAllowed()) return;
  if (boxWiring) { report('Cable example active.', ['Use the box inspector to open or reconnect splices. Choose Terminal wiring to return to your click-to-connect exercise.']); return; }
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
  if (boxWiring) { inspectedBox = terminals[id].component === 'light' ? 'light' : 'switch'; renderInspector(); report('Inspect the cable connections.', ['Use the inspector controls to open a splice or disconnect a conductor. Terminal wiring keeps your original click-to-connect exercise.']); return; }
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
  if (boxWiring) return;
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
  const result = currentResult();
  if (!result.valid) {report('Power stays off. Fix the wiring first.', result.errors, 'error');return;}
  power = true;selectedTerminal = null;selectedWire = null;ghost = null;render();reportCircuit();
});
document.querySelector('#nm-example')!.addEventListener('click', () => {
  if (!editingAllowed()) return;
  boxWiring = createNMExample(); selectedTerminal = null; selectedWire = null; ghost = null;
  inspectedBox = 'switch'; switchOn = false; render();
  report('NM cable example loaded.', ['This is a complete reference circuit. Inspect a box, open a splice, then check wiring to see the interrupted path. Your terminal-wiring exercise is preserved.']);
});
document.querySelector('#terminal-mode')!.addEventListener('click', () => {
  if (!editingAllowed()) return;
  boxWiring = null; selectedTerminal = null; selectedWire = null; ghost = null; render();
  report('Terminal wiring exercise.', ['Your click-to-connect wiring is restored. The box inspector remains available as a reference cutaway.']);
});
document.querySelector('.box-inspector')!.addEventListener('click', event => {
  const target = event.target as Element;
  const inspect = target.closest<HTMLButtonElement>('[data-inspect]');
  if (inspect) {
    const box = inspect.dataset.inspect as 'switch' | 'light';
    inspectedBox = inspectedBox === box ? null : box; renderInspector(); return;
  }
  const splice = target.closest<HTMLButtonElement>('[data-splice]')?.dataset.splice;
  const conductor = target.closest<HTMLButtonElement>('[data-conductor]')?.dataset.conductor;
  if ((!splice && !conductor) || !boxWiring || !editingAllowed()) return;
  const connection = splice ? boxWiring.splices.find(s => s.id === splice) : [...boxWiring.cables.flatMap(c => c.conductors), ...boxWiring.leads].find(c => c.id === conductor);
  if (connection) {connection.connected = !connection.connected; render(); reportCircuit();}
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
  power = false;switchOn = false;boxWiring = null;inspectedBox = null;wires = [];nextId = 1;selectedTerminal = null;selectedWire = null;selectedColor = 'hot';hintIndex = 0;ghost = null;gesture = null;
  positions.switch = {...originalPositions.switch};positions.light = {...originalPositions.light};render();
  report('A fresh start.', ['Power is off and all wires are cleared. Start with the black hot path from Breaker 1.']);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {selectedTerminal = null;selectedWire = null;ghost = null;render();}
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedWire !== null && !(event.target instanceof HTMLInputElement)) {event.preventDefault();removeWire(selectedWire);}
});
render();
