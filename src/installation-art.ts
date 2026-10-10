import { checkLessonCircuit, boxView, endConnection, type BoxId, type CablePort, type LessonCircuit, type LessonEnd, type Point } from './lesson-circuit.ts';
import { liftedLampholder, looseWireNut, nmBoxConnector, nmJacket, pulledToggle, steelDeviceBox, steelOctagonBox } from './hardware-art';

export const assemblySize = { width: 1100, height: 700 };
const positions: Record<BoxId, Record<string, Point>> = {
  switch: {
    'feed.hot.switch': { x: 235, y: 313 }, 'feed.neutral.switch': { x: 313, y: 373 }, 'feed.ground.switch': { x: 240, y: 472 },
    'load.hot.switch': { x: 267, y: 235 }, 'load.neutral.switch': { x: 336, y: 311 }, 'load.ground.switch': { x: 350, y: 414 },
    'switch.device-ground.splice': { x: 438, y: 493 }, 'switch.device-ground.terminal': { x: 607, y: 479 },
    'switch.box-ground.splice': { x: 432, y: 565 }, 'switch.box-ground.terminal': { x: 573, y: 570 },
  },
  fixture: {
    'load.hot.fixture': { x: 235, y: 232 }, 'load.neutral.fixture': { x: 304, y: 293 }, 'load.ground.fixture': { x: 247, y: 373 },
    'fixture.hot.splice': { x: 421, y: 250 }, 'fixture.hot.terminal': { x: 569, y: 225 },
    'fixture.neutral.splice': { x: 419, y: 365 }, 'fixture.neutral.terminal': { x: 590, y: 340 },
    'fixture.ground.splice': { x: 410, y: 474 }, 'fixture.ground.terminal': { x: 581, y: 457 },
    'fixture.box-ground.splice': { x: 233, y: 452 }, 'fixture.box-ground.terminal': { x: 366, y: 467 },
  },
};
export const terminalPositions: Record<string, Point> = {
  'switch.a': { x: 845.9, y: 263.9 }, 'switch.b': { x: 845.9, y: 408.2 },
  'switch.ground': { x: 718.5, y: 451.1 }, 'switch.box': { x: 218, y: 449 },
  'light.hot': { x: 730.5, y: 216.5 }, 'light.neutral': { x: 858, y: 210.5 },
  'light.ground': { x: 651, y: 225.5 }, 'light.box': { x: 191, y: 346 },
};

/** Port placement is derived from the existing circuit's physical wall/slot.
 * Main and cutaway drawings use this exact function and the same assembly. */
export function illustrationPort(box: BoxId, port: CablePort): Point {
  if (box === 'switch') return port.side === 'left'
    ? { x: 158, y: 168 + port.position * 358 }
    : { x: 158 + port.position * 220, y: 168 - port.position * 20 };
  return { x: 101, y: 201 + port.position * 147 };
}
export const mainPlacement = {
  switch: { x: 210, y: 320, scale: .8 },
  fixture: { x: 1020, y: 80, scale: .67 },
};
export function mainPort(state: LessonCircuit, box: BoxId, cableId: string) {
  const port = state.cables.find(c => c.id === cableId)!.ports.find(p => p.box === box)!;
  const local = illustrationPort(box, port), placement = mainPlacement[box];
  return { x: placement.x + local.x * placement.scale, y: placement.y + local.y * placement.scale };
}
const leader = (label: string | string[], x: number, y: number, points: string, anchor = 'start') =>
  `<g class="hw-callout"><polyline points="${points}" fill="none" stroke="#80867c" stroke-width="1.2"/><text x="${x}" y="${y}" text-anchor="${anchor}">${(Array.isArray(label) ? label : [label]).map((line,i) => `<tspan x="${x}" dy="${i ? 20 : 0}">${line}</tspan>`).join('')}</text></g>`;
function conductorPath(d: string, kind: LessonEnd['kind'], bare: boolean) {
  const color = bare ? '#ad7644' : kind === 'hot' ? '#30332f' : kind === 'neutral' ? '#faf9eb' : '#527452';
  return `<path d="${d}" fill="none" stroke="${bare ? '#6d5238' : '#626a5b'}" stroke-width="${bare ? 3.5 : 6.5}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${bare ? 2.8 : 4.8}" stroke-linecap="round"/>`;
}
const stripped = (a: Point, b: Point) => `<path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="#ad7644" stroke-width="2.8" stroke-linecap="round"/>`;

export function installationAssembly(state: LessonCircuit, box: BoxId, detail = false, selected?: Set<string>) {
  const view = boxView(state, box);
  const centers = new Map(view.connectors.map(c => {
    const points = c.members.map(id => positions[box][id]!);
    return [c.id, { x: points.reduce((n,p) => n+p.x,0)/points.length, y: points.reduce((n,p) => n+p.y,0)/points.length }];
  }));
  const destination = (e: LessonEnd): Point => {
    const terminal = state.terminations[e.id];
    if (terminal) return terminalPositions[terminal]!;
    const connector = view.connectors.find(c => c.members.includes(e.id));
    if (connector) { const p = centers.get(connector.id)!; return { x: p.x + connector.members.indexOf(e.id) * 2, y: p.y + 7 }; }
    return positions[box][e.id]!;
  };
  const targets = selected ? view.ends.map(e => {
    const p = destination(e), connected = endConnection(state,e.id);
    return `<g data-end="${e.id}" data-conductor-id="${e.conductor}" role="button" tabindex="0" aria-label="${e.label}" aria-pressed="${selected.has(e.id)}" class="d-end"><circle cx="${p.x}" cy="${p.y}" r="18" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="12" fill="none" stroke="${selected.has(e.id) ? '#c38412' : connected ? '#658465' : '#287bb0'}" stroke-width="2"/><title>${e.label}: ${connected ?? 'loose'}</title></g>`;
  }).join('') + view.terminals.map(t => { const p = terminalPositions[t.id]!; return `<g data-terminal="${t.id}" role="button" tabindex="0" aria-label="Connect to ${t.label}" class="d-terminal"><circle cx="${p.x}" cy="${p.y}" r="17" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="12" fill="none" stroke="#287bb0" class="d-terminal-focus"/><title>${t.label}</title></g>`; }).join('') : '';
  const cableWires = view.ends.filter(e => e.cable).map(e => {
    const port = illustrationPort(box, e.port!), top = e.port!.side === 'top';
    const p = top ? { x: port.x + e.offset! * .47, y: port.y + 56 }
      : { x: port.x + (box === 'fixture' ? 58 : 46), y: port.y + e.offset! * .47 };
    const end = destination(e), tip = endConnection(state,e.id) ? end : { x: end.x-14, y: end.y };
    const d = top ? `M${p.x} ${p.y}C${p.x} ${p.y+50} ${tip.x-30} ${tip.y-25} ${tip.x} ${tip.y}`
      : `M${p.x} ${p.y}C${p.x+50} ${p.y} ${tip.x-40} ${tip.y+20} ${tip.x} ${tip.y}`;
    return `<g data-end-id="${e.id}" data-conductor-id="${e.conductor}" data-end-state="${endConnection(state,e.id) ? 'connected' : 'loose'}"><title>${e.label} · ${e.id} · ${endConnection(state,e.id) ? 'connected' : 'loose stripped end'}</title>${conductorPath(d,e.kind,e.bare)}${stripped(tip,end)}</g>`;
  }).join('');
  const leads = state.leads.filter(l => view.ends.some(e => e.conductor === l.id)).map(l => {
    const a = view.ends.find(e => e.id === l.from)!, b = view.ends.find(e => e.id === l.to)!;
    const p = destination(a), q = destination(b);
    const start = endConnection(state,a.id) ? p : { x:p.x+14,y:p.y }, end = endConnection(state,b.id) ? q : { x:q.x-14,y:q.y };
    const d = `M${start.x} ${start.y}C${start.x+55} ${start.y+75} ${end.x+45} ${end.y+65} ${end.x} ${end.y}`;
    return `<g data-conductor-id="${l.id}" data-hardware="${l.kind === 'ground' ? 'grounding-pigtail' : 'fixture-lead'}"><title>${a.label.replace(' · splice end','')} · both ends ${endConnection(state,a.id) || endConnection(state,b.id) ? 'shown in their actual connection state' : 'loose'}</title>${conductorPath(d,l.kind,false)}<g data-end-id="${a.id}" data-end-state="${endConnection(state,a.id) ? 'connected' : 'loose'}">${stripped(p,start)}</g><g data-end-id="${b.id}" data-end-state="${endConnection(state,b.id) ? 'connected' : 'loose'}">${stripped(end,q)}</g></g>`;
  }).join('');
  const ports = view.ports.map(({cable,port}) => {
    const p = illustrationPort(box,port), top = port.side === 'top';
    const d = top ? `M${p.x} 10V${p.y+56}` : `M10 ${p.y}H${p.x+(box === 'fixture' ? 58 : 46)}`;
    return `<g data-cable-port="${cable.id}" data-box="${box}" data-side="${port.side}" data-port-position="${port.position}">${nmJacket(d,cable.id,17)}${nmBoxConnector(p.x,p.y,top)}${top ? `<ellipse cx="${p.x}" cy="${p.y+56}" rx="8" ry="3" fill="#aba586" stroke="#79765d"/>` : `<ellipse cx="${p.x+(box === 'fixture' ? 58 : 46)}" cy="${p.y}" rx="3" ry="8" fill="#aba586" stroke="#79765d"/>`}</g>`;
  }).join('');
  const connectors = view.connectors.map(c => { const p = centers.get(c.id)!; return `<g data-connector-id="${c.id}" ${selected ? `data-connector="${c.id}" role="button" tabindex="0" aria-label="Remove connector ${c.id}" class="d-connector"` : ''}>${looseWireNut(p.x,p.y).replace('shown as a loose part','joining its conductor members')}</g>`; }).join('');
  const body = box === 'switch' ? `<g transform="translate(90 70)">${steelDeviceBox()}</g><g class="hw-exploded-guide"><path d="M271 137 776 153M272 540 776 510" fill="none" stroke="#b9bdb2" stroke-width="1.2" stroke-dasharray="7 6"/></g><g transform="translate(660 130) scale(1.3)">${pulledToggle(state.switchOn)}</g>`
    : `<g transform="translate(75 70)">${steelOctagonBox()}</g><g class="hw-exploded-guide"><path d="M124 270 693 258.5M343 266 889.5 249.5" fill="none" stroke="#b9bdb2" stroke-width="1.2" stroke-dasharray="7 6"/></g><g transform="translate(645 185) scale(1.5)">${liftedLampholder()}</g>`;
  const annotations = !detail ? '' : box === 'switch'
    ? `<text x="90" y="36" class="hw-part-title"><tspan>STEEL SINGLE-GANG</tspan><tspan x="90" dy="21">DEVICE BOX</tspan></text><text x="660" y="74" class="hw-part-title">SINGLE-POLE TOGGLE · PULLED FORWARD</text>
      ${leader(['Recessed back','& formed sidewalls'],15,250,'146,278 155,278 170,291')}
      ${leader('Threaded mounting ear',420,108,'418,114 371,126 271,137')}
      ${leader('Two brass side terminals',913,335,'904,337 879,337 846,264')}
      <path d="M879 337 846 408" fill="none" stroke="#80867c" stroke-width="1.2"/>
      ${leader('Green screw on the metal yoke',773,595,'776,581 728,562 719,451')}
      ${leader('Steel-box bonding screw',90,628,'150,608 191,564 218,449')}
      <text x="435" y="650" class="hw-small-note">Grounding pigtails · add from the parts tray</text>
      <g data-uninstalled="true">${looseWireNut(988,620,-25)}<text x="925" y="674" class="hw-small-note">Loose wire connector</text></g>`
    : `<text x="75" y="36" class="hw-part-title">OCTAGONAL STEEL CEILING BOX</text><text x="645" y="133" class="hw-part-title">PORCELAIN KEYLESS HOLDER · LIFTED AWAY</text>
      ${leader('NM jacket ends inside the box',24,176,'31,183 104,207 159,244')}
      ${leader('Brass hot / silver neutral · rear terminals',614,90,'695,103 732,169 731,217')}
      <path d="M765 103 858 210" fill="none" stroke="#80867c" stroke-width="1.2"/>
      ${leader('Green ground on the steel strap',491,155,'534,163 584,193 651,226')}
      ${leader('Separate steel-box bond',75,591,'112,576 154,502 191,346')}
      <text x="390" y="593" class="hw-small-note">Fixture leads & separate bonding pigtails</text>
      <g data-uninstalled="true">${looseWireNut(992,615,-25)}<text x="925" y="672" class="hw-small-note">Loose wire connector</text></g>`;
  return `<g class="${box === 'fixture' && checkLessonCircuit(state).lightOn ? 'hw-lamp-on' : ''} ${box === 'switch' && state.switchOn ? 'hw-switch-on' : ''}" data-installation-box="${box}">${body}${ports}${cableWires}${leads}${connectors}${annotations}${targets}</g>`;
}

export function completeInstallation(state: LessonCircuit) {
  const outgoing = mainPort(state,'switch','load'), incoming = mainPort(state,'fixture','load'), feed = mainPort(state,'switch','feed');
  const routeY = incoming.y, bend = 34;
  const cable = `M${outgoing.x} ${outgoing.y}V${routeY+bend}Q${outgoing.x} ${routeY} ${outgoing.x+bend} ${routeY}H${incoming.x+39}`;
  return `<svg id="hardware-installation" viewBox="0 0 1780 960" role="group" aria-label="Exploded residential installation: supply, steel switch box with pulled-forward single-pole toggle, NM cable and octagonal ceiling box with lifted light holder">
    <g data-cable="feed" tabindex="0" role="button" aria-label="Select supply cable">${nmJacket(`M35 ${feed.y}H${feed.x+37}`,'feed',13.6)}</g><g data-cable="load" tabindex="0" role="button" aria-label="Select switch-to-fixture cable">${nmJacket(cable,'load',11.4)}</g>
    ${(['switch','fixture'] as BoxId[]).map(box => { const p = mainPlacement[box]; return `<g transform="translate(${p.x} ${p.y}) scale(${p.scale})">${installationAssembly(state,box)}</g>`; }).join('')}
    <text x="36" y="${feed.y-70}" class="hw-board-title">BRANCH-CIRCUIT SUPPLY</text><text x="36" y="${feed.y-43}" class="hw-board-note">120 V · black / white / bare ground</text>
    <text x="595" y="195" class="hw-cable-print">NM-B 14/2 WITH GROUND · SWITCH BOX → CEILING BOX</text>
    <text x="245" y="330" class="hw-board-title">STEEL SWITCH BOX</text><text x="742" y="365" class="hw-board-title">SINGLE-POLE SWITCH</text>
    <text x="1118" y="105" class="hw-board-title">CEILING BOX</text><text x="1461" y="181" class="hw-board-title">KEYLESS HOLDER</text>
    <g data-inspect-box="switch" tabindex="0" role="button" aria-label="Inspect switch assembly" class="hw-inspect"><rect x="245" y="400" width="320" height="378" fill="transparent" stroke="transparent"/><title>Inspect the box, pulled-forward switch, side terminals and loose conductor ends</title></g>
    <g data-inspect-box="fixture" tabindex="0" role="button" aria-label="Inspect ceiling fixture assembly" class="hw-inspect"><rect x="1050" y="140" width="258" height="225" fill="transparent" stroke="transparent"/><title>Inspect the octagonal box and lifted porcelain lamp holder</title></g>
    <text x="294" y="849" class="hw-open-label">INSPECT SWITCH ASSEMBLY ↗</text><text x="1117" y="470" class="hw-open-label">INSPECT CEILING ASSEMBLY ↗</text>
    <text x="40" y="925" class="hw-board-note">Exploded instructional view · connections reflect your wiring in both boxes · dashed lines indicate mounting alignment</text>
  </svg>`;
}
