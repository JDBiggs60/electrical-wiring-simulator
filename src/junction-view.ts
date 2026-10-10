import { checkJunction, createJunction, joinEnds, junctionEnds, removeConnector, setPigtail, type EndId } from './junction';

const endPoints: Record<EndId, {x:number;y:number}> = {
  'a.hot':{x:210,y:265}, 'a.neutral':{x:300,y:370}, 'a.ground':{x:390,y:505},
  'b.hot':{x:790,y:265}, 'b.neutral':{x:700,y:370}, 'b.ground':{x:610,y:505},
  'pigtail.end':{x:520,y:555},
};
const copper = '#c48b55';
export function mountJunctionBox(onClose: () => void) {
  const state = createJunction();
  const selected = new Set<EndId>();
  let power = false, switchOn = false, checked = false;
  let message = 'Select two matching cable ends, then use Join with connector. Start with the black pair.';
  const dialog = document.createElement('dialog');
  dialog.className = 'junction-dialog'; dialog.setAttribute('aria-labelledby','junction-title');
  document.body.append(dialog);
  const allowed = () => {if(!power)return true;message='Turn test power off before changing conductors, connectors or the grounding pigtail.';render();return false;};
  const getEnds = () => (Object.keys(junctionEnds) as EndId[]).filter(id => id !== 'pigtail.end' || state.pigtail);
  function pick(id: EndId) {
    if (!allowed()) return;
    if(state.connectors.some(c=>c.members.includes(id))) {message='This end is already inside a connector. Remove that connector first to change its members.';render();return;}
    if(selected.has(id))selected.delete(id);else selected.add(id);
    message=selected.size ? `${selected.size} end${selected.size===1?'':'s'} selected. Add the other ends, then join them.` : 'Selection cleared. Choose conductor ends to join.';
    render();
  }
  function artwork(): string {
    const connectorPositions = new Map(state.connectors.map(c => {
      const points=c.members.map(id=>endPoints[id]);
      return [c.id,{x:Math.max(360,Math.min(640,points.reduce((n,p)=>n+p.x,0)/points.length)),y:Math.max(250,Math.min(535,points.reduce((n,p)=>n+p.y,0)/points.length))}];
    }));
    const wires = getEnds().map(id => {
      const meta=junctionEnds[id], c=state.connectors.find(c=>c.members.includes(id));
      const center=c ? connectorPositions.get(c.id)! : null;
      const end=center ? {x:center.x-12+c!.members.indexOf(id)*10,y:center.y+10} : endPoints[id];
      const isA=id.startsWith('a.'), tail=id==='pigtail.end';
      const offset=meta.kind==='hot'?-18:meta.kind==='neutral'?0:18;
      const start=tail ? (state.boxAttached ? {x:850,y:565} : {x:806,y:515}) : {x:(isA?265:735)+offset*(isA?1:-1),y:163};
      const color=tail?'#45925e':meta.kind==='hot'?'#24292b':meta.kind==='neutral'?'#fff9e8':copper;
      const d=tail ? `M${start.x} ${start.y} C${start.x-30} 620 ${end.x+60} 620 ${end.x} ${end.y}` : `M${start.x} ${start.y} C${start.x} ${end.y-75} ${end.x} ${end.y-65} ${end.x} ${end.y-14}`;
      const tip=tail ? '' : `<path d="M${end.x} ${end.y-14}v14" stroke="${copper}" stroke-width="7" stroke-linecap="round"/>`;
      return `<g data-end="${id}" role="button" tabindex="0" aria-label="${meta.label}" aria-pressed="${selected.has(id)}" class="conductor-end ${selected.has(id)?'end-selected':''}"><title>${meta.label}${c ? ` · Connector ${c.id}` : ' · free stripped end'}</title><path d="${d}" fill="none" stroke="#1e2d34" stroke-opacity=".5" stroke-width="${meta.kind==='ground'&&!tail?9:13}"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${meta.kind==='ground'&&!tail?6:10}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${meta.kind==='hot'?'#859298':meta.kind==='neutral'?'#fffef8':'#efc99f'}" stroke-opacity=".5" stroke-width="2"/>
        ${tip}${tail?`<path d="M${end.x} ${end.y+3}l-8-11" stroke="${copper}" stroke-width="7" stroke-linecap="round"/>`:''}
        <circle cx="${end.x}" cy="${end.y}" r="25" fill="transparent"/><circle cx="${end.x}" cy="${end.y}" r="21" fill="none" class="end-ring" stroke="${selected.has(id)?'#f4b747':'#89a8b8'}" stroke-width="3" ${c?'opacity="0"':''}/>
        ${!c?`<text x="${end.x}" y="${end.y+40}" text-anchor="middle" class="end-label">${tail?'PIGTAIL':`${isA?'A':'B'} · ${meta.kind==='hot'?'BLACK':meta.kind==='neutral'?'WHITE':'BARE'}`}</text>`:''}
      </g>`;
    }).join('');
    const connectors=state.connectors.map(c=>{
      const p=connectorPositions.get(c.id)!;
      return `<g data-connector-graphic="${c.id}"><title>Connector ${c.id}: ${c.members.map(id=>junctionEnds[id].label).join(', ')}</title><path d="M${p.x-28} ${p.y+7}l11-55h34l11 55Z" fill="url(#nut-plastic)" stroke="#79552a" stroke-width="2"/><path d="M${p.x-8} ${p.y-39}l-6 35m22-35 6 35" stroke="#ffe1a0" stroke-width="4"/><ellipse cx="${p.x}" cy="${p.y+7}" rx="28" ry="5" fill="#72502b"/><text x="${p.x}" y="${p.y-62}" text-anchor="middle" class="end-label">CONNECTOR ${c.id}</text><text x="${p.x}" y="${p.y+35}" text-anchor="middle" class="end-label">${c.members.length} ENDS JOINED</text></g>`;
    }).join('');
    const mountScrew=(x:number,y:number)=>`<circle cx="${x}" cy="${y}" r="8" fill="#c6ced0" stroke="#546772"/><path d="M${x-5} ${y}h10" stroke="#546772" stroke-width="2"/>`;
    return `<svg id="junction-workspace" viewBox="0 0 1000 680" role="group" aria-label="Interactive steel junction box wiring workspace"><defs><linearGradient id="box-steel" x2="1" y2="1"><stop stop-color="#b7c3c9"/><stop offset=".45" stop-color="#778994"/><stop offset="1" stop-color="#c8d1d5"/></linearGradient><linearGradient id="sheath" x2="1"><stop stop-color="#beb399"/><stop offset=".45" stop-color="#f7eed9"/><stop offset="1" stop-color="#d2c6ac"/></linearGradient><linearGradient id="nut-plastic" x2="1"><stop stop-color="#b47727"/><stop offset=".45" stop-color="#e8b34a"/><stop offset="1" stop-color="#ca8b2e"/></linearGradient></defs>
      <rect x="80" y="63" width="850" height="584" rx="14" fill="url(#box-steel)" stroke="#4c606c" stroke-width="4"/><path d="M106 93h798v526H106Z" fill="#465b67" stroke="#d1dadf" stroke-width="3"/><path d="M115 103h780v505H115Z" fill="#526874" stroke="#344b59" stroke-width="3"/>
      ${[125,884].map(x=>[270,430].map(y=>`<circle cx="${x}" cy="${y}" r="24" fill="url(#box-steel)" stroke="#304958" stroke-width="3"/><circle cx="${x}" cy="${y}" r="17" fill="none" stroke="#6a808c"/><path d="M${x-5} ${y-22}h10" stroke="#526b78" stroke-width="3"/>`).join('')).join('')}
      ${mountScrew(95,80)}${mountScrew(915,80)}${mountScrew(95,630)}${mountScrew(915,630)}
      ${[265,735].map((x,i)=>`<rect x="${x-33}" y="0" width="66" height="163" rx="5" fill="url(#sheath)" stroke="#a49980" stroke-width="2"/><text x="${x}" y="24" text-anchor="middle" class="cable-label">CABLE ${i===0?'A':'B'}</text><text x="${x}" y="44" text-anchor="middle" class="cable-label">14/2 NM-B</text><rect x="${x-45}" y="77" width="90" height="33" rx="5" fill="url(#box-steel)" stroke="#4c6471" stroke-width="2"/>${mountScrew(x-31,94)}${mountScrew(x+31,94)}<ellipse cx="${x}" cy="164" rx="32" ry="6" fill="#9b8f77"/>`).join('')}
      <text x="500" y="132" text-anchor="middle" class="box-caption">STEEL JUNCTION BOX · LID REMOVED</text><text x="500" y="155" text-anchor="middle" class="box-small">Sheath ends inside the box; conductors remain individually insulated or bare.</text>
      ${wires}${connectors}
      ${state.pigtail?`<circle cx="${state.boxAttached?850:806}" cy="${state.boxAttached?565:515}" r="15" fill="none" stroke="${copper}" stroke-width="6"/>`:''}
      <g data-bond="box" tabindex="0" role="button" aria-label="${state.boxAttached?'Detach':'Attach'} grounding pigtail at box screw" aria-pressed="${state.boxAttached}" aria-disabled="${power||!state.pigtail}" class="box-bond"><title>Green steel-box bonding screw. Separate from any device grounding terminal.</title><circle cx="850" cy="565" r="20" fill="#759785" stroke="#243e33"/><circle cx="850" cy="565" r="13" fill="#4e955e" stroke="#22432b"/><path d="M841 565h18m-9-6v12" stroke="#1d4c2c" stroke-width="3"/><circle cx="850" cy="565" r="29" class="bond-focus" fill="none" stroke="#f3bf58" stroke-width="3"/></g>
      <text x="850" y="603" text-anchor="middle" class="end-label">BOX BOND · ${state.boxAttached?'ATTACHED':'NOT ATTACHED'}</text><text x="500" y="663" text-anchor="middle" class="box-small exterior-caption">Crossing lines do not join. Only connector membership and the attached box bond create continuity.</text>
    </svg>`;
  }
  function render() {
    const active=document.activeElement as HTMLElement|null;
    const focusKey=active?.getAttribute('data-end')?'data-end':active?.getAttribute('data-pick')?'data-pick':active?.getAttribute('data-action')?'data-action':active?.getAttribute('data-remove-connector')?'data-remove-connector':active?.getAttribute('data-bond')?'data-bond':null;
    const focusValue=focusKey?active?.getAttribute(focusKey):null;
    const result=checkJunction(state,power,switchOn);
    dialog.innerHTML=`<header class="junction-header"><div><span>JUNCTION BOX PROTOTYPE · HANDS-ON SPLICING</span><h2 id="junction-title">Make the connections inside the box</h2></div><button data-action="close" class="junction-close">Close box</button></header>
      <div class="junction-layout"><section class="junction-canvas"><div class="junction-canvas-heading"><span>NM CABLE A / SUPPLY → JUNCTION → NM CABLE B / LOAD</span><span>${state.connectors.length} CONNECTORS</span></div>${artwork()}<div class="junction-legend"><span><i class="j-black"></i>Black: hot</span><span><i class="j-white"></i>White: neutral</span><span><i class="j-bare"></i>Bare: equipment ground</span><span><i class="j-green"></i>Green: bonding pigtail</span></div><p>Select the exposed conductor ends. Their copper tips are deliberately separated until you join them.</p></section>
      <aside class="junction-tools"><h3>Wire this junction</h3><ol><li>Join A black to B black.</li><li>Join A white to B white.</li><li>Add a grounding pigtail. Join its free end to both bare grounds.</li><li>Attach its other end at the green box screw.</li></ol><div class="end-picker" aria-label="Individual conductor ends">${getEnds().map(id=>`<button data-pick="${id}" aria-pressed="${selected.has(id)}" class="${selected.has(id)?'picked':''}"><i class="${id==='pigtail.end'?'j-green':junctionEnds[id].kind==='hot'?'j-black':junctionEnds[id].kind==='neutral'?'j-white':'j-bare'}"></i>${junctionEnds[id].label}${state.connectors.some(c=>c.members.includes(id))?' · joined':''}</button>`).join('')}</div>
      <div class="junction-selection" role="status">${selected.size?`Selected: ${[...selected].map(id=>junctionEnds[id].label).join(' + ')}`:'No ends selected'}</div><button data-action="join" class="junction-primary" ${power?'disabled':''}>Join with connector</button><button data-action="clear" ${power?'disabled':''}>Clear selection</button><div class="junction-pigtail"><button data-action="pigtail" ${power?'disabled':''}>${state.pigtail?'Remove':'Add'} grounding pigtail</button><button data-action="bond" ${power||!state.pigtail?'disabled':''}>${state.boxAttached?'Detach pigtail from':'Attach pigtail to'} box screw</button></div>
      <h3>Your connectors</h3><div class="junction-connectors">${state.connectors.length?state.connectors.map(c=>`<div><strong>Connector ${c.id}</strong><span>${c.members.map(id=>junctionEnds[id].label).join(' + ')}</span><button data-remove-connector="${c.id}" ${power?'disabled':''} aria-label="Remove connector ${c.id}">Remove</button></div>`).join(''):'<p>No connectors yet. Wire crossings create no connections.</p>'}</div>
      <button data-action="check" class="junction-primary">Check junction wiring</button><div class="junction-feedback ${checked?(result.valid?'pass':'fault'):''}" role="status" aria-live="polite"><strong>${checked?(result.valid?'Junction correctly connected.':'Check these connections.'):'Ready to connect.'}</strong><p>${message}</p>${checked&&result.errors.length?`<ul>${result.errors.map(e=>`<li>${e}</li>`).join('')}</ul>`:''}</div>
      ${checked?`<div class="junction-continuity">${Object.entries(result.continuity).map(([kind,connected])=>`<span>${kind==='box'?'Steel box bond':kind[0]!.toUpperCase()+kind.slice(1)+' path'}: <strong>${connected?'continuous':'open'}</strong></span>`).join('')}</div>`:''}
      <div class="junction-test"><h3>Test the circuit</h3><p>Cable B feeds a fixed single-pole switch and light outside this box. Your splices determine whether that test circuit can operate.</p><button data-action="power">Turn test power ${power?'off':'on'}</button><button data-action="switch" aria-pressed="${switchOn}">Toggle test switch</button><div class="junction-lamp ${result.lightOn?'lit':''}" aria-live="polite">Test power ${power?'ON':'OFF'} · Test light ${result.lightOn?'ON':'OFF'}</div></div><p class="junction-footnote">Virtual twist-on connectors illustrate splice membership, not a particular product rating. This prototype tests one box, not a complete installation.</p></aside></div>`;
    if (focusKey && focusValue) dialog.querySelector<HTMLElement>(`[${focusKey}="${focusValue}"]`)?.focus();
  }
  function bond() {if(!allowed())return;if(!state.pigtail){message='Add a grounding pigtail first, then attach its box end here.';render();return;}state.boxAttached=!state.boxAttached;checked=false;message=state.boxAttached?'The pigtail box end is attached. Its free end must also be joined to the equipment grounds.':'The pigtail box end is detached. The steel box is not bonded through this connection.';render();}
  dialog.addEventListener('click',event=>{
    const target=event.target as Element;
    const end=target.closest('[data-end]')?.getAttribute('data-end')??target.closest('[data-pick]')?.getAttribute('data-pick');
    if(end){pick(end as EndId);return;}
    if(target.closest('[data-bond]')){bond();return;}
    const remove=target.closest('[data-remove-connector]')?.getAttribute('data-remove-connector');
    if(remove){if(!allowed())return;removeConnector(state,Number(remove));checked=false;message='Connector removed. Those conductor ends are free again.';render();return;}
    const action=target.closest('[data-action]')?.getAttribute('data-action');
    if(action==='close'){dialog.close();return;}
    if(action==='check'){checked=true;message=checkJunction(state).valid?'All three cable paths are continuous and the steel box has its own grounding bond. You can now test power.':'Match conductor purposes and check both ends of the bonding pigtail.';render();return;}
    if(action==='power'){
      if(power){power=false;message='Test power is off. Connections can be changed.';}else{const r=checkJunction(state);checked=true;if(!r.valid){message='Test power stays off. Correct the wiring first.';}else{power=true;selected.clear();message='Test power is on. Use the test switch to operate the light.';}}render();return;
    }
    if(action==='switch'){switchOn=!switchOn;render();return;}
    if(!action||!allowed())return;
    if(action==='join'){const error=joinEnds(state,[...selected]);if(error)message=error;else{selected.clear();checked=false;message='Connector installed. It now joins these conductor ends electrically. Check wiring to verify their purposes.';}}
    if(action==='clear'){selected.clear();message='Selection cleared.';}
    if(action==='pigtail'){setPigtail(state,!state.pigtail);selected.delete('pigtail.end');checked=false;message=state.pigtail?'Grounding pigtail added. Join its free end to the bare grounds and attach the other end to the green box screw.':'Grounding pigtail removed. The steel box needs a separate bond.';}
    if(action==='bond'){bond();return;}
    render();
  });
  dialog.addEventListener('keydown',event=>{
    const target=event.target as Element;
    if(event.key!=='Enter'&&event.key!==' ')return;
    const end=target.closest('[data-end]')?.getAttribute('data-end');
    if(end){event.preventDefault();pick(end as EndId);}
    else if(target.closest('[data-bond]')){event.preventDefault();bond();}
  });
  dialog.addEventListener('close',()=>{document.body.classList.remove('junction-open');onClose();});
  return {
    open(){render();dialog.showModal();document.body.classList.add('junction-open');dialog.querySelector<HTMLButtonElement>('.junction-close')?.focus();},
    summary(){return { connectors:state.connectors.length, valid:checkJunction(state).valid };},
  };
}
