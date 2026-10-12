import type {Workbench} from './cable-workbench-model.ts';
/** Local assembly checks, derived from actual graph edges. These do not assert
 * an upstream connection to a powered source; Check Wiring tests that separately. */
export function groundingState(s:Workbench,boxId:string) {
 const parent=new Map<string,string>();
 const find=(id:string):string=>{const p=parent.get(id);if(!p){parent.set(id,id);return id;}if(p===id)return id;const root=find(p);parent.set(id,root);return root;};
 const join=(a:string,b:string)=>parent.set(find(a),find(b));
 const same=(a:string,b:string)=>find(a)===find(b);
 for(const c of s.connections)join(c.fromId,c.toId);
 for(const p of s.pigtails)join(p.ends[0]!.id,p.ends[1]!.id);
 const bare=s.cables.filter(c=>c.from.boxId===boxId||c.to.boxId===boxId).flatMap(c=>c.conductors.filter(w=>w.kind==='bare').map(w=>w.ends.find(e=>e.boxId===boxId)!));
 const tails=s.pigtails.filter(p=>p.boxId===boxId),devices=s.components.filter(p=>p.parentId===boxId&&p.terminals.some(t=>t.kind==='ground'));
 const required=[...bare.map(e=>e.id),...tails.map(p=>p.ends[0]!.id)];
 const nuts=s.connectors.filter(c=>c.boxId===boxId&&c.kind==='ground');
 const reference=bare[0]?.id;
 const splice=!!reference&&tails.some(p=>p.role==='box')&&devices.every(d=>tails.some(p=>p.role==='device'&&(!p.deviceId||p.deviceId===d.id)))&&required.every(id=>s.connections.some(c=>c.fromId===id&&nuts.some(n=>n.id===c.toId)))&&required.every(id=>same(id,reference));
 const device=!!reference&&devices.length>0&&devices.every(d=>same(`${d.id}.ground`,reference));
 const box=!!reference&&same(`${boxId}.box`,reference);
 return {splice,device,box,deviceCount:devices.length,bareCount:bare.length};
}
export function groundingGuide(s:Workbench,boxId:string) {
 const g=groundingState(s,boxId),deviceLabel=s.components.find(p=>p.parentId===boxId)?.kind==='switch'?'Switch':'Device';
 return `<aside class="wb-ground-guide" aria-label="Grounding progress"><div class="wb-ground-progress">${[['splice',g.splice,'Ground splice complete','Ground splice incomplete'],['device',g.device,`${deviceLabel} ground continuous`,`${deviceLabel} ground path incomplete`],['box',g.box,'Steel box bonded','Steel-box ground path incomplete']].filter(([kind])=>kind!=='device'||g.deviceCount>0).map(([kind,done,yes,no])=>`<span data-ground-status="${kind}" data-complete="${done}">${done?'✓':'○'} ${done?yes:no}</span>`).join('')}<small>Local connections · use Check Wiring for supply continuity</small></div><details><summary>Grounding steps: two pigtails → ground wire nut → two grounding screws</summary><ol><li>Find the labeled <strong>incoming bare</strong> and <strong>outgoing bare</strong> ends. Incoming/outgoing labels follow cable installation direction.</li><li>${g.deviceCount?'Choose <strong>Add device ground pigtail</strong> (once per device), then ':''}choose <strong>Add box bond pigtail</strong> and <strong>Add ground connector</strong>. Drag the cable bare ends and each pigtail’s <strong>splice end</strong> onto that wire nut. Splice ends remain loose until you attach them.</li><li>${g.deviceCount?'The <strong>device pigtail screw end</strong> is already attached to the device’s <strong>green ground screw</strong>. ':''}The separate <strong>box bond screw end</strong> is already attached to the steel box’s <strong>BOX BOND screw</strong>. ${g.deviceCount?'':'The porcelain fixture has no ground terminal.'}</li></ol><p>A missing pigtail must be created first. Mounting screws are mechanical; they cannot accept conductors. Use suitable separate connectors if the displayed wire-nut capacity is exceeded.</p></details></aside>`;
}
