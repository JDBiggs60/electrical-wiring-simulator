import './style.css';

const view = new URLSearchParams(window.location.search).get('view');
if (view === 'trainer') {
  await import('./trainer');
} else if (view === 'study') {
  const { mountHardwarePrototype } = await import('./hardware-prototype');
  mountHardwarePrototype();
} else {
  const { mountDiagramPrototype } = await import('./diagram');
  mountDiagramPrototype(view !== 'lesson');
}
