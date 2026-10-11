import { breakerPanel } from './panel-art';
import { nmBoxConnector,nmJacket } from './hardware-art';
import { inspectBox,entriesFor,type Workbench } from './cable-workbench-model';
export function panelInspection(state:Workbench,id:string) {
  const panel=state.components.find(p=>p.id===id)!;
  const cables=inspectBox(state,id);
  return `<svg viewBox="0 0 1000 850" role="group" aria-label="Subpanel branch wiring workspace"><g transform="translate(230 110) scale(1.5)">${breakerPanel(panel.id,true,panel)}${cables.map(({cable,entry,conductors},i)=>{
    const p=entriesFor(panel)[entry.entryId],inside=p.x-p.side*27;
    return `<g data-inspect-cable="${cable.id}" data-entry-id="${entry.entryId}" data-box-id="${id}">${nmJacket(`M${p.x+p.side*80} ${p.y}H${inside}`,cable.id,11).replace('Switch box to ceiling box',`${cable.from.boxId} to ${cable.to.boxId}`)}<g transform="translate(${p.x} ${p.y}) scale(.65)${p.side===1?' rotate(180)':''}">${nmBoxConnector(0,0)}</g>${conductors.map((c,j)=>{
      const end=c.ends.find(e=>e.boxId===id)!,x=92+j*20,y=322+i*15;
      return `<g data-conductor-id="${c.id}" data-end-id="${end.id}" data-termination="disconnected"><title>${c.id} · ${end.id} · loose ${c.kind} conductor</title><path d="M${inside} ${p.y+(j-1)*7}C${inside-p.side*18} ${p.y+40} ${x} ${y-32} ${x} ${y}" fill="none" stroke="#686b5e" stroke-width="${j===2?3:5}"/><path d="M${inside} ${p.y+(j-1)*7}C${inside-p.side*18} ${p.y+40} ${x} ${y-32} ${x} ${y}" fill="none" stroke="${j===0?'#262e28':j===1?'#fffef3':'#ae7847'}" stroke-width="${j===2?2:3.5}"/><path d="M${x} ${y}v9" stroke="#ae7847" stroke-width="2.5"/></g>`;
    }).join('')}<text x="${p.side===-1?-85:275}" y="${p.y-24}" font-size="9">${cable.id} · ${entry.entryId}</text></g>`;
  }).join('')}</g><text x="120" y="50" font-size="22">Advanced branch-circuit workspace · six-space subpanel</text><text x="120" y="77" font-size="14">Neutral isolated · ground bar factory bonded to enclosure · protected simulated feed</text><text x="120" y="775" font-size="16">Black, white and bare conductor ends are loose. No student wiring or power applied.</text></svg><p>${cables.length?cables.map(({cable})=>`${cable.id} · ${cable.type} · loose black / white / bare`).join('<br>'):'No branch cables installed. Drag NM-B between a panel entry and a box entry.'}</p>`;
}
