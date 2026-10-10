import './hardware-prototype.css';
import { createLessonCircuit, type BoxId } from './lesson-circuit';
import { completeInstallation, installationAssembly } from './installation-art';

export function mountHardwarePrototype() {
  // One unwired installation, rendered at two scales. The approved lesson and
  // validator are preserved at ?view=lesson while these drawings await review.
  const state = createLessonCircuit();
  document.body.classList.add('hardware-page');
  document.querySelector('#app')!.innerHTML = `<main class="hardware-sheet">
    <header class="hardware-header"><div><p>OLD CARPENTER · ELECTRICAL WIRING SIMULATOR</p><h1>Residential wiring · hardware study</h1></div><a href="?view=lesson">Open working Phase 2B lesson ↗</a></header>
    <section class="hardware-review"><strong>Visual prototype for approval</strong><span>One single-pole switch and one light. Original technical illustrations; all conductor ends are disconnected.</span></section>
    <section class="hardware-drawing" aria-label="Full installation drawing"><div class="hardware-drawing-heading"><span>01 / COMPLETE INSTALLATION · EXPLODED VIEW</span><div><button data-inspect="switch">Inspect switch assembly</button><button data-inspect="fixture">Inspect ceiling fixture assembly</button></div></div><div class="hardware-board" tabindex="0" role="region" aria-label="Installation drawing; scroll horizontally on small screens">${completeInstallation(state)}</div><p class="hardware-scroll-hint">Scroll across the drawing to follow the installation →</p></section>
    <footer class="hardware-footer"><p>Inspect either assembly for the recessed box back, sidewalls, cable clamps, mounting hardware and exposed electrical terminals. Dashed lines show mounting alignment, not wires.</p><p>Drawings for approval · conductor editing remains in the working lesson · illustrations not to scale</p></footer>
    </main>
    <dialog id="hardware-detail" aria-labelledby="hardware-detail-title"><header><div><p>02 / HARDWARE DETAIL · SAME UNWIRED INSTALLATION</p><h2 id="hardware-detail-title"></h2></div><button id="hardware-detail-close">Return to installation</button></header><div id="hardware-detail-art" tabindex="0" role="region" aria-label="Enlarged assembly; scroll horizontally on small screens"></div><p class="hardware-scroll-hint">Scroll across to inspect the box and device →</p><p class="hardware-detail-note"></p></dialog>`;
  const dialog = document.querySelector<HTMLDialogElement>('#hardware-detail')!;
  let trigger: HTMLElement | null = null;
  function open(box: BoxId, source: HTMLElement) {
    trigger = source;
    document.querySelector('#hardware-detail-title')!.textContent = box === 'switch' ? 'Steel device box & pulled-forward toggle' : 'Octagonal ceiling box & lifted keyless holder';
    document.querySelector('#hardware-detail-art')!.innerHTML = `<svg viewBox="0 0 1100 700" role="group" aria-label="${box === 'switch' ? 'Detailed single-gang steel box and single-pole switch' : 'Detailed octagonal steel box and porcelain light holder'}" class="hardware-detail-svg">${installationAssembly(state,box,true)}</svg>`;
    document.querySelector('.hardware-detail-note')!.textContent = box === 'switch'
      ? 'Supply enters the left wall; the ceiling cable exits the top. Both current-carrying screws are brass and on the side of the switch body. The green yoke screw and the green steel-box screw are separate bonds. Silver mounting screws are mechanical hardware.'
      : 'The same ceiling cable enters the left wall. The porcelain holder is lifted away to expose its rear brass hot and silver neutral terminals. Equipment ground attaches to the steel mounting strap and separately to the steel box. Fixture leads, grounding pigtails and the sample connector are loose.';
    dialog.showModal(); document.body.classList.add('hardware-detail-open');
    document.querySelector<HTMLButtonElement>('#hardware-detail-close')!.focus();
  }
  document.querySelectorAll<HTMLElement>('[data-inspect],[data-inspect-box]').forEach(element => {
    const box = (element.getAttribute('data-inspect') ?? element.getAttribute('data-inspect-box')) as BoxId;
    element.addEventListener('click', () => open(box,element));
    if (element.matches('g')) element.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(box,element); } });
  });
  document.querySelector('#hardware-detail-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('hardware-detail-open'); trigger?.focus(); });
}
