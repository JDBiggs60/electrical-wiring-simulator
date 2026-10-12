import type {LightingFaultEvent} from './lighting-circuit.ts';
/** Local, reusable event presentation; no circuit edges or damage are created. */
export function faultEvents(){
 let sound=false,audio:AudioContext|undefined;
 return {
  get sound(){return sound;},toggleSound(){sound=!sound;return sound;},
  show(event:LightingFaultEvent){
   document.querySelectorAll('.wb-fault-flash').forEach(e=>e.remove());
   const scope=document.querySelector('dialog[open]')??document;
   const target=[...scope.querySelectorAll(`[data-wire-target="${event.location}"],[data-terminal-id="${event.location}"]`)].find(e=>e.getBoundingClientRect().width>0)??scope.querySelector('[data-hardware="six-space-panel"]')??document.querySelector('[data-kind="panel"]');
   if(target){const r=target.getBoundingClientRect(),flash=document.createElement('div');flash.className='wb-fault-flash';flash.setAttribute('role','status');flash.setAttribute('aria-label',event.message);flash.style.left=`${r.x+r.width/2}px`;flash.style.top=`${r.y+r.height/2}px`;(document.querySelector('dialog[open]')??document.body).append(flash);setTimeout(()=>flash.remove(),900);}
   if(sound){try{audio??=new AudioContext();void audio.resume();const tone=audio.createOscillator(),gain=audio.createGain();tone.type='square';tone.frequency.setValueAtTime(120,audio.currentTime);gain.gain.setValueAtTime(.025,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);tone.connect(gain);gain.connect(audio.destination);tone.start();tone.stop(audio.currentTime+.08);}catch{/* Visual feedback remains available without audio. */}}
  }
 };
}
