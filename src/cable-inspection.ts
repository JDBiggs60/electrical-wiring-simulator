import { duplexReceptacle } from './receptacle-art';
import { steelDeviceBox, pulledToggle, nmBoxConnector, nmJacket } from './hardware-art';
import { entries, inspectBox, type Workbench } from './cable-workbench-model';
export function cableInspection(state: Workbench,boxId:string) {
  const box = state.components.find(p => p.id === boxId);
  if (!box) return '<p>This box has been removed. Undo to restore it.</p>';
  const device=state.components.find(p=>p.parentId===boxId);
  const cables = inspectBox(state,boxId);
  return `<svg viewBox="0 0 1000 750" aria-label="Installed cables and disconnected conductors in ${boxId}" role="group"><g transform="translate(170 100) scale(1.8)"><g transform="scale(.65) translate(-48 -50)">${steelDeviceBox()}</g>${cables.map(({cable,entry,conductors},i) => {
    const p = entries[entry.entryId], inside = p.x-p.side*30;
    return `<g data-inspect-cable="${cable.id}" data-entry-id="${entry.entryId}" data-box-id="${boxId}">${nmJacket(`M${p.x+p.side*75} ${p.y}H${inside}`,cable.id,11).replace('Switch box to ceiling box',`${cable.from.boxId} to ${cable.to.boxId}`)}<g transform="translate(${p.x} ${p.y}) scale(.65)${p.side === 1 ? ' rotate(180)' : ''}">${nmBoxConnector(0,0)}</g>${conductors.map((c,index) => {
      const y = p.y+(index-1)*7, x = 70+index*23, endY = 65+i*120+index*30;
      const end = c.ends.find(e => e.boxId === boxId)!;
      const path = `M${inside} ${y}C${inside-p.side*28} ${y} ${x+30} ${endY} ${x} ${endY}`;
      return `<g data-conductor-id="${c.id}" data-end-id="${end.id}" data-termination="disconnected"><title>${c.id}: loose, disconnected</title><path d="${path}" fill="none" stroke="#655e51" stroke-width="${index===2?2.3:4}"/><path d="${path}" fill="none" stroke="${index===0?'#30332f':index===1?'#fffcee':'#ad7644'}" stroke-width="${index===2?1.8:3}"/><path d="M${x} ${endY}h-9" stroke="#ad7644" stroke-width="2.5"/></g>`;
    }).join('')}<text x="${p.side===-1?-83:180}" y="${p.y-20}" font-size="10">${cable.id} · ${entry.entryId} entry</text></g>`;
  }).join('')}</g>${device ? `<g transform="translate(680 175) scale(1.2)">${device.kind==='receptacle'?duplexReceptacle(device.id):pulledToggle()}</g><text x="650" y="610" font-size="14">${device.kind==='receptacle'?'Receptacle':'Switch'} pulled forward for inspection<tspan x="650" dy="22">No conductor terminations</tspan></text>` : ''}<text x="170" y="685" font-size="16">All black, white and bare ends are loose. No splices, bonds or power.</text></svg><p>${cables.length ? cables.map(({cable})=>`${cable.id} · ${cable.type} · ${cable.from.boxId} → ${cable.to.boxId}`).join('<br>') : 'No cables installed in this box.'}</p>`;
}
