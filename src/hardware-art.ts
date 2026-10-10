/** Original orthographic/oblique technical linework. Flat tones describe physical
 * faces; no photographs, textures, gradients, or simulated lighting are used. */
export const ink = '#424545';
export function metalScrew(x: number, y: number, kind: 'steel' | 'brass' | 'ground' = 'steel', side = false, radius = 7) {
  const fill = kind === 'brass' ? '#b79a50' : kind === 'ground' ? '#658465' : '#c9cccc';
  return `<g transform="translate(${x} ${y})${side ? ' skewY(-14) scale(.76 1)' : ''}" data-screw-kind="${kind}">
    <ellipse cx="2" cy="2" rx="${radius + 2}" ry="${radius + 1}" fill="#828585" stroke="${ink}" stroke-width="1"/>
    <circle r="${radius}" fill="${fill}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M${-radius + 2} 0H${radius - 2}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M-2 -3v6" stroke="${ink}" stroke-width=".8"/>
  </g>`;
}
const keyhole = (x: number, y: number) => `<path d="M${x - 5} ${y + 3}a9 9 0 1 1 10 0v13h-10Z" fill="#757878" stroke="${ink}" stroke-width="1.2"/><path d="M${x - 2} ${y + 8}v6" stroke="#d4d7d7" stroke-width="1.2"/>`;
const knockout = (x: number, y: number, rx = 24, ry = 24, rotate = 0) => `<g transform="translate(${x} ${y}) rotate(${rotate})" data-hardware="knockout">
  <ellipse rx="${rx}" ry="${ry}" fill="#b7baba" stroke="#646767" stroke-width="1.3"/>
  <ellipse rx="${rx - 4}" ry="${ry - 4}" fill="none" stroke="#e1e4e4" stroke-width="1"/>
  <path d="M0 ${-ry}v5M0 ${ry - 5}v5" stroke="#505353" stroke-width="2"/>
  <path d="M${-rx + 6} 4Q0 ${ry - 2} ${rx - 7} 3" fill="none" stroke="#969999" stroke-width="1"/>
  </g>`;

/** Open 2 × 3 inch device-box proportions; folded ears are on the front rim.
 * Interior wall polygons terminate at the recessed back, rather than a flat fill. */
export function steelDeviceBox() {
  return `<g data-hardware="steel-device-box"><title>Open steel single-gang device box: recessed back, formed sidewalls, front mounting ears and cable knockouts</title>
    <path d="M72 80 282 61 310 75V429l-20 30L68 480 48 462V112Z" fill="#abaeae" stroke="${ink}" stroke-width="2"/>
    <path d="M48 112 72 80V443L48 462Z" fill="#9da0a0" stroke="${ink}" stroke-width="1.3"/>
    <path d="M282 61 310 75V429l-20 30V87Z" fill="#878a8a" stroke="${ink}" stroke-width="1.3"/>
    <path d="M68 98 288 78V436L68 456Z" fill="#949797" stroke="${ink}" stroke-width="2"/>
    <path data-hardware="box-back" d="M105 123 262 108V397L105 412Z" fill="#ced1d1" stroke="#6e7171" stroke-width="1.4"/>
    <path data-hardware="box-sidewall" d="M68 98 105 123V412L68 456Z" fill="#a4a7a7" stroke="#646767" stroke-width="1.3"/>
    <path data-hardware="box-sidewall" d="M288 78 262 108V397l26 39Z" fill="#8b8e8e" stroke="#616464" stroke-width="1.3"/>
    <path data-hardware="box-sidewall" d="M68 98 288 78 262 108 105 123Z" fill="#b8bbbb" stroke="#747777" stroke-width="1.3"/>
    <path data-hardware="box-sidewall" d="M68 456 288 436 262 397 105 412Z" fill="#c1c4c4" stroke="#747777" stroke-width="1.3"/>
    <path d="M66 97 289 77v360L67 458V97M72 104v343M282 87v341" fill="none" stroke="#dee1e1" stroke-width="2"/>
    <path d="M105 123V412M262 108V397M107 410l154-15" fill="none" stroke="#848787" stroke-width="1"/>
    ${knockout(182,202,31,34,-5)}${knockout(184,308,31,34,-5)}
    ${knockout(87,217,11,27,-4)}${knockout(274,300,8,24)}
    ${keyhole(132,152)}${keyhole(235,365)}
    <path d="M153 91V65l8-11 37-4 8 8v27l-12 4V68l-29 3v22Z" fill="#c7caca" stroke="${ink}" stroke-width="1.4" data-hardware="mounting-tab"/>
    <path d="M159 85 201 81M168 61l24-2" fill="none" stroke="#7e8181" stroke-width="1.2"/>
    <ellipse cx="181" cy="67" rx="7" ry="5" transform="rotate(-5 181 67)" fill="#626565" stroke="#484b4b"/>
    <path d="M154 449v27l7 8 37-4 9-9v-24l-13 2v20l-28 3v-25Z" fill="#c7caca" stroke="${ink}" stroke-width="1.4" data-hardware="mounting-tab"/>
    <ellipse cx="182" cy="470" rx="7" ry="5" transform="rotate(-5 182 470)" fill="#626565" stroke="#484b4b"/>
    <path d="M110 391l34-3v-24l-34 3Z" fill="#b5b8b8" stroke="#7f8282" stroke-width="1"/>
    <path d="M115 376l23-2M118 391l-5 9" stroke="#959898" stroke-width="1"/>
    <g data-terminal-id="switch.box" data-terminal-kind="ground" data-terminal-location="recessed-box-back"><title>Green bonding screw on the recessed steel box back; separate from the switch grounding screw</title>${metalScrew(128,379,'ground')}</g>
    <path d="M52 136v30m0 220v25M303 113v41m0 214v34" stroke="#686b6b" stroke-width="1"/>
  </g>`;
}

/** The dark moulded body projects behind the ivory face. Both current screws
 * occupy the same exposed side; the green screw belongs to the metal yoke. */
export function pulledToggle(on?: boolean) {
  return `<g data-hardware="single-pole-toggle"><title>Standard single-pole toggle switch, pulled forward from the box. Two brass side terminals and a separate green yoke grounding screw.</title>
    <path d="M58 48 118 42 147 56v190l-29 20-63-8Z" fill="#5c5f5f" stroke="${ink}" stroke-width="1.7"/>
    <path d="M118 42 147 56v190l-29 20Z" fill="#454848" stroke="#333636" stroke-width="1.5"/>
    <path d="M60 51 117 44v216l-57-4Z" fill="#737367" stroke="${ink}" stroke-width="1.2"/>
    <path d="M147 82h-14v37h14M147 189h-14v39h14" fill="#a38b50" stroke="#3d4040" stroke-width="1.2"/>
    <path d="M50 36V13l13-8 52-4 12 9v24l-13 3v228l16 1v34l-14 10-56 6-13-10v-30l13-4V38Z" fill="#c8cbcb" stroke="#606363" stroke-width="1.7" data-hardware="mounting-yoke"/>
    <path d="M51 15 64 9l48-4M51 30l65-7M52 291l71-6M65 305l49-5M64 39v222M112 35v224" fill="none" stroke="#8f9292" stroke-width="1"/>
    <path d="M39 15h12v20H39Zm88-9h11v24h-11M35 291h16v18H35Zm94-11h14v22h-14" fill="#bdc0c0" stroke="#696c6c" stroke-width="1.2" data-hardware="mounting-ear"/>
    <path d="M76 12l22-2q7 0 7 6t-7 6l-22 2q-7 0-7-6t7-6ZM76 286l22-2q7 0 7 6t-7 6l-22 2q-7 0-7-6t7-6Z" fill="#7d8080" stroke="#535656" stroke-width="1"/>
    <path d="M74 41 103 38v25l-29 3Zm0 211 29-3v19l-29 3Z" fill="#afb2b2" stroke="#7e8181"/>
    <circle cx="89" cy="53" r="3" fill="#6c6f6f"/><circle cx="89" cy="259" r="3" fill="#6c6f6f"/>
    <path d="M64 68 111 64l6 6v165l-7 7-47 4-5-7V75Z" fill="#f4edce" stroke="#8b8e8e" stroke-width="1.5"/>
    <path d="M66 74 108 70v165l-41 4Z" fill="#fbf7e5" stroke="#d2ccb0" stroke-width="1"/>
    <path d="M76 116 100 113v73l-24 3Z" fill="#8b8b72" stroke="#717474" stroke-width="1.5"/>
    <g data-hardware="toggle-lever" transform="translate(0 ${on === undefined ? 0 : on ? -12 : 12})"><path d="M80 129 98 126l7 8v37l-6 8-21 2Z" fill="#fff8dc" stroke="#9d9c7f" stroke-width="1.3"/>
    <path d="M98 126v45l-20 10M82 133l16-3" fill="none" stroke="#c7c0a0" stroke-width="1"/>
    </g><text x="87" y="97" text-anchor="middle" class="hw-device-stamp" transform="rotate(-5 87 97)">ON</text>
    <text x="88" y="215" text-anchor="middle" class="hw-device-stamp" transform="rotate(-5 88 215)">OFF</text>
    <g data-terminal-id="switch.a" data-terminal-kind="hot" data-terminal-location="body-right-side"><title>Brass current-carrying screw A on the side of the switch body</title>${metalScrew(143,103,'brass',true,10)}</g>
    <g data-terminal-id="switch.b" data-terminal-kind="hot" data-terminal-location="body-right-side"><title>Brass current-carrying screw B on the same side of the switch body</title>${metalScrew(143,214,'brass',true,10)}</g>
    <path d="M52 228l-13 2v30l13 1Z" fill="#a8abab" stroke="#6d7070" stroke-width="1"/>
    <g data-terminal-id="switch.ground" data-terminal-kind="ground" data-terminal-location="metal-yoke-left"><title>Green equipment grounding screw on the metal yoke, separate from both brass current terminals</title>${metalScrew(45,247,'ground',true,8)}</g>
    ${[18,292].map(y => `<g data-hardware="loose-mounting-screw"><path d="M89 ${y-22}v21" stroke="#676a6a" stroke-width="5"/><path d="M85 ${y-18}l8-4m-8 10 8-4m-8 10 8-4m-8 10 8-4" stroke="#cacdcd" stroke-width="1.1"/>${metalScrew(89,y,'steel',false,8)}</g>`).join('')}
  </g>`;
}

export function steelOctagonBox() {
  const front = '84 72 231 72 290 131 290 278 231 336 84 336 26 278 26 131';
  const back = '105 96 218 96 261 139 261 252 218 294 105 294 62 252 62 139';
  return `<g data-hardware="steel-octagon-box"><title>Steel octagonal ceiling outlet box with visible rim, eight formed sidewalls, recessed back, fixture mounting ears and cable knockouts</title>
    <path d="M102 44h146l59 59v147l-59 58H102l-58-58V103Z" fill="#a4a7a7" stroke="${ink}" stroke-width="2"/>
    <path d="M102 44 84 72h147l17-28ZM248 44l59 59-17 28-59-59ZM307 103v147l-17 28V131Z" fill="#8d9090" stroke="${ink}" stroke-width="1.3"/>
    <polygon points="${front}" fill="#abaeae" stroke="${ink}" stroke-width="2"/>
    <polygon points="${back}" fill="#ced1d1" stroke="#6d7070" stroke-width="1.3" data-hardware="box-back"/>
    <path data-hardware="box-sidewall" d="M84 72h147l-13 24H105ZM231 72l59 59-29 8-43-43ZM290 131v147l-29-26V139ZM290 278l-59 58-13-42 43-42ZM231 336H84l21-42h113ZM84 336l-58-58 36-26 43 42ZM26 278V131l36 8v113ZM26 131l58-59 21 24-43 43Z" fill="#a8abab" stroke="#707373" stroke-width="1.3"/>
    <path d="M231 72l59 59v147l-59 58" fill="none" stroke="#e2e5e5" stroke-width="2"/>
    <path d="M84 336l-58-58V131l58-59" fill="none" stroke="#d4d7d7" stroke-width="2"/>
    <path d="M105 96h113l43 43v113l-43 42H105l-43-42V139Z" fill="none" stroke="#abaeae" stroke-width="2"/>
    ${knockout(159,178,36,36)}${knockout(278,205,9,26)}${knockout(44,224,11,25)}
    ${keyhole(100,150)}${keyhole(213,247)}
    <path d="M28 179h25l14 14v25l-19 7H28Z" fill="#bec1c1" stroke="#6e7171" stroke-width="1.4" data-hardware="fixture-mounting-ear"/>
    <path d="M291 174h-28l-15 17v24l18 6h25Z" fill="#bec1c1" stroke="#6e7171" stroke-width="1.4" data-hardware="fixture-mounting-ear"/>
    <ellipse cx="49" cy="200" rx="6" ry="8" fill="#6a6d6d" stroke="#4f5252"/><ellipse cx="268" cy="196" rx="6" ry="8" fill="#6a6d6d" stroke="#4f5252"/>
    <path d="M102 265h29v21h-29Z" fill="#b6b9b9" stroke="#828585" stroke-width="1"/>
    <g data-terminal-id="light.box" data-terminal-kind="ground" data-terminal-location="recessed-box-back"><title>Green steel ceiling-box bonding screw on the recessed back</title>${metalScrew(116,276,'ground')}</g>
    <path d="m36 130 17-12m225 151-16 16M126 324h12m93-260h-11" stroke="#808383" stroke-width="1.4"/>
  </g>`;
}

/** Porcelain keyless holder with a bonded metal mounting strap. Ground is on
 * that strap, not on the non-conductive porcelain shell. The bulb hangs below. */
export function liftedLampholder() {
  return `<g data-hardware="porcelain-keyless-holder"><title>Porcelain keyless lamp holder with steel mounting strap, rear brass hot and silver neutral screws, and an unlit screw-base bulb</title>
    <path d="M7 25 177 17l17 20-1 19L9 65-6 47Z" fill="#c2c5c5" stroke="#686b6b" stroke-width="1.5" data-hardware="fixture-mounting-strap"/>
    <path d="M-3 36h25v17H-3ZM166 30h24v17h-24" fill="#a3a6a6" stroke="#616464" stroke-width="1"/>
    <ellipse cx="10" cy="45" rx="8" ry="5" fill="#707373"/><ellipse cx="178" cy="38" rx="8" ry="5" fill="#707373"/>
    <g data-terminal-id="light.ground" data-terminal-kind="ground" data-terminal-location="steel-mounting-strap"><title>Green fixture equipment-ground screw on the metal mounting strap, not the porcelain</title>${metalScrew(4,27,'ground',false,7)}</g>
    <path d="M4 52Q10 34 86 28 173 23 191 44v15Q160 100 99 105 40 105 4 69Z" fill="#edeada" stroke="#777a7a" stroke-width="1.6"/>
    <ellipse cx="98" cy="50" rx="94" ry="23" transform="rotate(-3 98 50)" fill="#faf8ee" stroke="#878a8a" stroke-width="1.7"/>
    <ellipse cx="98" cy="48" rx="78" ry="16" transform="rotate(-3 98 48)" fill="none" stroke="#d0cdbd" stroke-width="1.2"/>
    <path d="M5 62Q98 114 191 54M38 81Q99 112 162 76" fill="none" stroke="#c4c1af" stroke-width="1.2"/>
    <path d="M59 93Q94 108 135 92l-4 24-10 9-54-2-9-10Z" fill="#f3f0e3" stroke="#858575" stroke-width="1.4"/>
    <ellipse cx="94" cy="114" rx="37" ry="9" fill="#e4e1d1" stroke="#878a8a" stroke-width="1"/>
    <path d="M66 117h55v16q-26 13-55-1Z" fill="#b9b8a6" stroke="#747777" stroke-width="1.1"/>
    <path d="m67 121 52-1m-51 5 51-1m-50 5 49-1" stroke="#7a7d7d" stroke-width="1.1"/>
    <path d="M69 131c-4 25-22 38-27 67-5 35 18 63 54 63s59-28 52-63c-6-29-24-42-28-67q-24 9-51 0Z" fill="#f8f8ee" stroke="#777a7a" stroke-width="1.6" data-hardware="lightbulb"/>
    <path d="M78 134v49l14 16m20-65v49l-15 16M82 183l9 7 6-7 7 7" fill="none" stroke="#848787" stroke-width="1.1"/>
    <path d="M67 159q-24 41-9 62m64-66q21 33 15 62" fill="none" stroke="#d1d4d4" stroke-width="2"/>
    <path d="M78 251q20 7 37-3" fill="none" stroke="#dadddd" stroke-width="1.2"/>
    <path d="M47 34v-13l13-4 8 10v8M130 30V16l15-3 9 10v8" fill="#abaeae" stroke="#646767" stroke-width="1"/>
    <g data-terminal-id="light.hot" data-terminal-kind="hot" data-terminal-location="holder-rear"><title>Brass hot terminal on the rear of the lamp holder</title>${metalScrew(57,21,'brass',false,8)}</g>
    <g data-terminal-id="light.neutral" data-terminal-kind="neutral" data-terminal-location="holder-rear"><title>Silver neutral terminal on the rear of the lamp holder; neutral serves the threaded shell</title>${metalScrew(142,17,'steel',false,8)}</g>
    <path d="M25 49l15-1m116-5 15-1" stroke="#989b9b" stroke-width="4"/>${metalScrew(32,49)}${metalScrew(163,43)}
  </g>`;
}

/** A twist-on connector drawn as a loose part unless members are actually joined. */
export function looseWireNut(x: number, y: number, rotation = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rotation})" data-hardware="wire-nut"><title>Twist-on wire connector, shown as a loose part</title>
    <path d="M-12 7-9-22q0-6 9-6t9 6l3 29Z" fill="#d4b058" stroke="#6c603b" stroke-width="1.3"/>
    <path d="M-12-10-20-6v8l9-2M12-10l8 4v8l-9-2" fill="#c6a14c" stroke="#6c603b" stroke-width="1"/>
    <path d="M-6-22-8 3M0-24V4M6-22 8 3" fill="none" stroke="#f0d896" stroke-width="1.2"/>
    <ellipse cy="7" rx="12" ry="4" fill="#8b7950" stroke="#6c603b"/><ellipse cy="7" rx="6" ry="2" fill="#444747"/>
  </g>`;
}

/** NM-B's flat outer jacket stays intact up to its box connector. */
export function nmJacket(path: string, cableId: string, width = 17) {
  return `<g data-cable-id="${cableId}" data-hardware="nm-jacket"><title>${cableId === 'feed' ? 'Incoming supply' : 'Switch box to ceiling box'} · NM-B 14/2 with black, white, and bare ground inside one jacket</title>
    <path d="${path}" fill="none" stroke="#737676" stroke-width="${width + 2}" stroke-linejoin="round" stroke-linecap="butt"/>
    <path d="${path}" fill="none" stroke="#e9dfb9" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="butt"/>
    <path d="${path}" fill="none" stroke="#fcf7dd" stroke-width="${width - 7}" stroke-linejoin="round" stroke-linecap="butt"/>
  </g>`;
}

/** Locknut, threaded throat, saddle and two clamping screws are functional shapes. */
export function nmBoxConnector(x: number, y: number, top = false) {
  return `<g transform="translate(${x} ${y})${top ? ' rotate(90)' : ''}" data-hardware="nm-box-connector"><title>NM cable connector with threaded throat, steel locknut and two-screw saddle clamp</title>
    <path d="M-19-14h37v28h-37Z" fill="#a2a5a5" stroke="#616464" stroke-width="1.2"/>
    <path d="M-6-17h6v34h-6ZM4-18h6v36H4Z" fill="#d0d3d3" stroke="#767979" stroke-width="1"/>
    <path d="M-14-20h14v40h-14Z" fill="#c2c5c5" stroke="#6a6d6d" stroke-width="1.1"/>
    <path d="M-24-20-32-14v28l8 6h7v-8h-6v-24h6v-8Z" fill="#c0c3c3" stroke="#686b6b" stroke-width="1.3"/>
    <path d="M-21-25h-10v50h10" fill="none" stroke="#7e8181" stroke-width="3"/>
    ${metalScrew(-26,-19,'steel',false,5)}${metalScrew(-26,19,'steel',false,5)}
    <path d="M1-14 4-11m-3 6 3 3m-3 6 3 3m-3 6 3 3" stroke="#797c7c" stroke-width="1"/>
  </g>`;
}
