import './diagram.css';

const steel = '#cbd5dc', cavity = '#edf1f3', copper = '#b87945';
const screw = (x: number,y: number,color='#bac7cf') => `<g><circle cx="${x}" cy="${y}" r="7" fill="${color}" stroke="#52616b" stroke-width="1.5"/><path d="M${x-4} ${y}h8" stroke="#52616b" stroke-width="1.5"/></g>`;
const terminal = (x:number,y:number,ground=false) => `<g class="diagram-device-terminal"><title>${ground?'Green device grounding screw':'Brass current-carrying screw'}</title>${screw(x,y,ground?'#5b9869':'#d8af50')}</g>`;
function toggle(x:number,y:number,scale=1):string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><title>Single-pole toggle: two brass current terminals, one green ground on its steel yoke. Silver mounting hardware is mechanical only.</title><path d="M32 0h46v32h12v155h14v24H78v39H32v-39H21V32h11Z" fill="#b5c4ce" stroke="#73838e" stroke-width="2"/><rect x="19" y="40" width="78" height="141" rx="5" fill="#504d45"/><rect x="35" y="38" width="45" height="155" rx="5" fill="#fff9e9" stroke="#a69f8d" stroke-width="2"/><rect x="45" y="77" width="25" height="76" rx="3" fill="#736e60"/><path d="M50 113l-2 28h20l-2-28Z" fill="#fff8e3" stroke="#ada48f" stroke-width="2"/><text x="57" y="65" text-anchor="middle" class="d-device-text">ON</text><text x="57" y="177" text-anchor="middle" class="d-device-text">OFF</text><g class="diagram-mounting-hardware"><title>Steel mounting screws — not electrical terminals</title>${screw(55,16)}${screw(55,233)}</g>${terminal(19,70)}${terminal(19,146)}${terminal(94,200,true)}</g>`;
}
function holder(x:number,y:number,scale=1):string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><title>Keyless porcelain light holder mounted to the ceiling box</title><ellipse cx="0" cy="39" rx="77" ry="55" fill="#fffdf1" stroke="#acaea7" stroke-width="2"/><ellipse cx="0" cy="39" rx="56" ry="37" fill="none" stroke="#dad8ca"/>${screw(-61,40)}${screw(61,40)}<rect x="-25" y="0" width="50" height="53" rx="6" fill="#8b8d86" stroke="#69726f"/><path d="M-22 30h44m-44 8h44m-44 8h44" stroke="#c6c8bd" stroke-width="3"/><path d="M-25 29C-26 10-43 5-43-23a43 43 0 0 1 86 0C43 5 26 10 25 29Z" fill="#fff6cc" stroke="#bbb496" stroke-width="2"/><path d="M-12 22v-21l9 8 9-8 7 8v13" fill="none" stroke="#b7a56b" stroke-width="2"/></g>`;
}
function knockout(x:number,y:number,r=12):string {return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#8e9fa9" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r-4}" fill="none" stroke="#b3bfc6"/>`;}
function nut(x:number,y:number):string {return `<g><path d="M${x-14} ${y}l6-29h16l6 29Z" fill="#e0a23c" stroke="#996724"/><path d="M${x-5} ${y-22}l-3 17m12-17 3 17" stroke="#ffdb8b" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="14" ry="3" fill="#835b2d"/></g>`;}
function conductor(d:string,color:string,width=5):string {return `<path d="${d}" fill="none" stroke="#82919b" stroke-width="${width+2}" stroke-opacity=".5"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;}
function mainCircuit():string {
  return `<svg id="diagram-board" viewBox="0 0 1360 670" role="group" aria-label="Complete residential single-pole lighting layout visual prototype">
    <defs><marker id="d-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0l10 5-10 5" fill="#8b9dab"/></marker></defs>
    <text x="32" y="50" class="d-board-caption">120 V SINGLE-POLE LIGHTING CIRCUIT</text><text x="1320" y="50" text-anchor="end" class="d-board-small">LAYOUT REVIEW · NOT ENERGIZED</text>
    <path d="M0 510H373M545 353V208H1030" fill="none" stroke="#7b8991" stroke-width="22" stroke-linejoin="round"/>
    <g class="diagram-cable"><title>Supply NM-B 14/2 cable: black insulated hot, white insulated neutral, and bare equipment ground. Visual layout only.</title><path d="M0 510H373" fill="none" stroke="#f0e8d2" stroke-width="18"/></g>
    <g class="diagram-cable"><title>Switch-box to fixture-box NM-B 14/2 cable: black switched hot, white neutral, and bare equipment ground. Visual layout only.</title><path d="M545 353V208H1030" fill="none" stroke="#f0e8d2" stroke-width="18" stroke-linejoin="round"/></g>
    <text x="38" y="408" class="d-source-title">120 V BRANCH SUPPLY</text><text x="38" y="434" class="d-description">From upstream circuit protection</text><text x="38" y="457" class="d-description">Black / white / bare ground</text><path d="M38 480h252" stroke="#8b9dab" stroke-width="1.5" marker-end="url(#d-arrow)"/>
    <text x="140" y="552" class="d-cable-label">NM-B 14/2 + GROUND</text><text x="736" y="177" class="d-cable-label">NM-B 14/2 + GROUND</text><text x="687" y="250" class="d-description">Black: switched hot · White: neutral</text><text x="687" y="276" class="d-description">Bare: equipment ground</text>
    <g data-open-diagram-box="switch" tabindex="0" role="button" aria-label="Open switch box layout close-up" class="d-open-box"><title>Open the large switch-box layout preview</title>
      <rect x="337" y="320" width="278" height="298" rx="4" fill="${steel}" stroke="#778b99" stroke-width="2"/><rect x="353" y="336" width="246" height="266" fill="${cavity}" stroke="#9aabb6"/>
      ${knockout(364,408)}${knockout(586,420)}${knockout(586,551)}
      <rect x="328" y="495" width="36" height="30" rx="3" fill="#aabbc6" stroke="#728695"/><rect x="530" y="310" width="30" height="36" rx="3" fill="#aabbc6" stroke="#728695"/>
      <path d="M364 510h18M545 346v18" stroke="#f0e8d2" stroke-width="18"/>
      ${toggle(427,350,.98)}
      <text x="342" y="263" class="d-box-title">SINGLE-GANG</text><text x="342" y="287" class="d-box-title">SWITCH BOX</text><text x="359" y="591" class="d-open-label">OPEN SWITCH BOX ↗</text>
      <rect x="337" y="320" width="278" height="298" rx="4" class="d-box-focus" fill="none" stroke="#287bb0" stroke-width="4"/>
    </g>
    <text x="663" y="393" class="d-callout-title">SINGLE-POLE TOGGLE SWITCH</text><text x="663" y="419" class="d-description">Two brass current terminals</text><text x="663" y="443" class="d-description">One green device ground</text><text x="663" y="467" class="d-description">Steel mounting hardware</text><path d="M642 405H570" stroke="#a1b0b9" stroke-width="1.5"/>
    <g data-open-diagram-box="fixture" tabindex="0" role="button" aria-label="Open fixture box layout close-up" class="d-open-box"><title>Open the large ceiling fixture-box layout preview</title>
      <path d="M1041 107h178l55 55v150l-55 55h-178l-55-55V162Z" fill="${steel}" stroke="#778b99" stroke-width="2"/><path d="M1047 125h166l43 43v138l-43 43h-166l-43-43V168Z" fill="${cavity}" stroke="#9aabb6"/>
      ${knockout(1018,253)}${knockout(1241,253)}
      <rect x="979" y="192" width="37" height="32" rx="3" fill="#aabbc6" stroke="#728695"/><path d="M1016 208h17" stroke="#f0e8d2" stroke-width="18"/>
      ${holder(1130,218,1.15)}
      <text x="978" y="80" class="d-box-title">CEILING FIXTURE BOX</text><text x="1027" y="389" class="d-open-label">OPEN FIXTURE BOX ↗</text>
      <path d="M1041 107h178l55 55v150l-55 55h-178l-55-55V162Z" class="d-box-focus" fill="none" stroke="#287bb0" stroke-width="4"/>
    </g>
    <text x="1007" y="444" class="d-description">Octagonal steel box</text><text x="1007" y="468" class="d-description">Keyless holder + lightbulb</text>
    <text x="35" y="643" class="d-board-small">NM cable connects the boxes. Inside each box, individual conductors will connect to devices and splices.</text>
  </svg>`;
}
function closeUp(box:'switch'|'fixture'):string {
  const cable=(x:number,label:string)=>`<rect x="${x-27}" y="0" width="54" height="152" rx="3" fill="#f0e8d2" stroke="#b1a997"/><rect x="${x-40}" y="70" width="80" height="28" rx="3" fill="#adbdc7" stroke="#718592"/>${screw(x-27,84)}${screw(x+27,84)}<text x="${x}" y="28" text-anchor="middle" class="d-wire-note">${label}</text>`;
  if(box==='switch')return `<svg class="d-closeup-svg" viewBox="0 0 950 690" role="img" aria-label="Switch box layout: two NM cables, separate device and box grounds, neutral splice, and two brass switch screws">
    <rect x="88" y="73" width="774" height="560" rx="5" fill="${steel}" stroke="#738997" stroke-width="3"/><rect x="109" y="96" width="732" height="516" fill="${cavity}" stroke="#a0afb9" stroke-width="2"/>
    ${knockout(133,330,21)}${knockout(817,330,21)}${cable(250,'FROM SUPPLY')}${cable(705,'TO FIXTURE')}
    ${conductor('M233 154C233 230 340 250 409 319','#24282c')}${conductor('M690 154C690 235 550 220 550 300V353Q550 372 340 372V395H409','#24282c')}
    ${conductor('M250 154C250 280 240 390 230 495','#fffdf4')}${conductor('M705 154C705 400 773 565 280 565Q230 565 242 495','#fffdf4')}
    ${conductor('M267 154C267 240 171 253 171 520Q171 575 580 542',copper,4)}${conductor('M722 154V491Q722 535 590 542',copper,4)}
    ${conductor('M602 542Q690 606 768 552','#448852')}${conductor('M592 542Q538 598 484 449','#448852')}
    ${toggle(390,249)}${nut(234,491)}${nut(593,540)}${terminal(768,552,true)}
    <text x="250" y="306" class="d-wire-note">A · BRASS / LINE*</text><text x="250" y="421" class="d-wire-note">B · BRASS / LOAD*</text><text x="501" y="457" class="d-wire-note">GREEN DEVICE GROUND</text>
    <text x="167" y="464" class="d-wire-note">NEUTRAL SPLICE</text><text x="550" y="510" class="d-wire-note">GROUND SPLICE</text><text x="684" y="590" class="d-wire-note">STEEL BOX BOND</text>
    <text x="110" y="665" class="d-description">Reference routing · *either brass screw can receive line · neutral never connects to this switch</text>
  </svg>`;
  return `<svg class="d-closeup-svg" viewBox="0 0 1100 690" role="img" aria-label="Ceiling fixture box layout: NM sheath, black and white fixture lead splices, equipment ground and separate steel box bond">
    <path d="M171 72h384l67 67v387l-67 77H171l-74-77V139Z" fill="${steel}" stroke="#738997" stroke-width="3"/><path d="M179 94h365l55 55v368l-55 65H179l-58-65V149Z" fill="${cavity}" stroke="#a0afb9" stroke-width="2"/>
    ${knockout(147,318,21)}${knockout(575,318,21)}${cable(293,'FROM SWITCH')}
    ${conductor('M275 154C275 258 306 260 315 302','#24282c')}${conductor('M293 154C293 327 362 343 366 400','#fffdf4')}${conductor('M311 154C311 374 420 446 420 499',copper,4)}
    ${conductor('M327 302C403 328 665 208 846 255','#24282c')}${conductor('M378 400C442 421 729 297 862 255','#fffdf4')}${conductor('M432 499C515 563 739 352 879 255','#448852')}${conductor('M445 499Q506 575 551 519','#448852')}
    ${nut(321,298)}${nut(372,396)}${nut(431,496)}${terminal(551,519,true)}${holder(860,214,1.2)}
    <text x="696" y="104" class="d-box-title">FIXTURE LIFTED FOR VIEW</text><text x="735" y="369" class="d-description">Black / white / green fixture leads</text><text x="249" y="278" class="d-wire-note">SWITCHED HOT SPLICE</text><text x="300" y="376" class="d-wire-note">NEUTRAL SPLICE</text><text x="376" y="475" class="d-wire-note">GROUND SPLICE</text><text x="491" y="558" class="d-wire-note">BOX BOND</text><text x="128" y="650" class="d-description">Cable sheath ends inside the box · equipment ground bonds the fixture and steel box separately</text>
  </svg>`;
}
export function mountDiagramPrototype() {
  document.body.classList.add('diagram-page');
  document.querySelector('#app')!.innerHTML=`<main class="diagram-shell"><header class="diagram-header"><div><span>OLD CARPENTER · ELECTRICAL WIRING SIMULATOR</span><h1>Residential lighting circuit</h1></div><a class="diagram-trainer-link" href="?view=trainer" target="_blank" rel="noopener">Open working Phase 1 trainer ↗</a></header>
    <section class="diagram-review-note"><strong>Phase 2 · visual layout prototype</strong><span>Review the arrangement and open either box. Conductor editing and live circuit behavior will be added after layout approval.</span></section>
    <section class="diagram-workspace" aria-label="Residential circuit diagram"><div class="diagram-toolbar"><span>01 · SUPPLY → SWITCH BOX → CEILING FIXTURE</span><div><button data-review-box="switch">Open switch box</button><button data-review-box="fixture">Open fixture box</button></div></div><div class="diagram-canvas">${mainCircuit()}</div></section>
    <footer class="diagram-footer"><span><i class="d-legend-cable"></i>NM-B cable · black hot, white neutral, bare equipment ground</span><span>Layout only · existing simulator and tests preserved</span></footer></main>
    <dialog id="diagram-closeup" aria-labelledby="diagram-closeup-title"><header><div><span>VISUAL PROTOTYPE · REFERENCE ROUTING ONLY</span><h2 id="diagram-closeup-title"></h2></div><button id="diagram-close">Return to circuit</button></header><div id="diagram-closeup-art"></div><p class="diagram-closeup-note">This view previews the future wiring workspace. The connections illustrated here are not editable or simulated yet. The working junction-box prototype remains in the Phase 1 trainer.</p></dialog>`;
  const dialog=document.querySelector<HTMLDialogElement>('#diagram-closeup')!;
  function open(box:'switch'|'fixture') {
    document.querySelector('#diagram-closeup-title')!.textContent=box==='switch'?'Inside the single-gang switch box':'Inside the ceiling fixture box';
    document.querySelector('#diagram-closeup-art')!.innerHTML=closeUp(box);
    dialog.showModal();document.body.classList.add('d-dialog-open');document.querySelector<HTMLButtonElement>('#diagram-close')!.focus();
  }
  document.querySelectorAll('[data-review-box],[data-open-diagram-box]').forEach(element=>{
    const box=(element.getAttribute('data-review-box')??element.getAttribute('data-open-diagram-box')) as 'switch'|'fixture';
    element.addEventListener('click',()=>open(box));
    if(element.hasAttribute('data-open-diagram-box'))element.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'||e.key===' '){e.preventDefault();open(box);}});
  });
  document.querySelector('#diagram-close')!.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>document.body.classList.remove('d-dialog-open'));
}
