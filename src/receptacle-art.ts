/** Original orthographic/exploded technical illustration, no wall plate.
 * Mounting centers match the workbench switch's yoke at the same scale. */
export function duplexReceptacle(id:string) {
  const screw=(x:number,y:number,color:string)=>`<ellipse cx="${x}" cy="${y}" rx="7" ry="9" fill="${color}" stroke="#65665b" stroke-width="1.2"/><path d="M${x-4} ${y+2}l8-4" stroke="#53554f" stroke-width="1.8"/>`;
  return `<g data-hardware="duplex-receptacle"><title>White 15-amp 125V NEMA 5-15R duplex receptacle, without wall plate</title>
    <path d="M32 7h39l6 13-7 17v24h8v164h-8v31l7 15-6 18H32l-6-18 7-15v-31h-8V61h8V37l-7-17Z" fill="#b8bcbc" stroke="#686d6b" stroke-width="1.4" data-hardware="mounting-yoke"/>
    <path d="M33 37h36M33 256h37M29 15h43M29 279h43" stroke="#e3e6e5" fill="none"/>
    ${[17,279].map(y=>`<g data-hardware="device-mounting-screw"><title>Steel mounting screw, not an electrical terminal</title><rect x="47" y="${y-8}" width="10" height="16" rx="5" fill="#666c69"/>${screw(52,y,'#c9cdcb')}</g>`).join('')}
    <path d="M27 62 36 53h47l15 14v159l-13 14H36l-9-13Z" fill="#d4d4cc" stroke="#696f6b" stroke-width="1.3"/>
    <path d="M83 53l15 14v159l-13 14V68Z" fill="#b1b4aa" stroke="#696f6b"/>
    ${(['hot','neutral'] as const).map(kind=>{const x=kind==='hot'?96:18,color=kind==='hot'?'#bf9b48':'#d0d5d5';return `<g data-tab-id="${id}.${kind}.tab" data-tab-intact="true"><title>Intact ${kind} break-off tab joining the matching terminals</title><path d="M${x-4} 91h8v109h-8Z" fill="${color}" stroke="#767767"/><path d="M${x-4} 142h8m-8 6h8" stroke="#746e55"/></g>${[91,200].map((y,i)=>`<g data-terminal-id="${id}.${kind}.${i===0?'upper':'lower'}" data-terminal-kind="${kind}" data-terminal-state="disconnected"><title>${kind==='hot'?'Brass hot':'Silver neutral'} ${i===0?'upper':'lower'} side terminal</title>${screw(x,y,color)}</g>`).join('')}`;}).join('')}
    <path d="M27 62h55v168H27Z" fill="#f5f5ef" stroke="#7b807b" stroke-width="1.4"/>
    ${[66,154].map(y=>`<g data-hardware="three-slot-face"><path d="M39 ${y}h30l12 13v38l-12 13H39l-12-13v-38Z" fill="#fffef8" stroke="#858a82" stroke-width="1.2"/><path d="M43 ${y+17}v19" stroke="#363d37" stroke-width="4"/><path d="M65 ${y+20}v13" stroke="#363d37" stroke-width="4"/><path d="M49 ${y+47}v-7a5 5 0 0 1 10 0v7Z" fill="#363d37"/></g>`).join('')}
    <path d="M48 145h12" stroke="#b6bcb3" stroke-width="1.2"/>
    <g data-terminal-id="${id}.ground" data-terminal-kind="ground" data-terminal-state="disconnected"><title>Green equipment-ground screw on mounting yoke</title><path d="M18 229h15v22H18Z" fill="#adb6aa" stroke="#6d7468"/>${screw(23,239,'#648c4e')}</g>
  </g>`;
}
