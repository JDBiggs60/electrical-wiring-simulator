import './style.css';

const view = new URLSearchParams(window.location.search).get('view');
if (view === 'cables') {
  const { mountWorkbench } = await import('./workbench');
  mountWorkbench(true);
} else if (view === 'workbench') {
  const { mountWorkbench } = await import('./workbench');
  mountWorkbench();
} else if (view === 'trainer') {
  await import('./trainer');
} else if (view === 'study') {
  const { mountHardwarePrototype } = await import('./hardware-prototype');
  mountHardwarePrototype();
} else {
  const { mountDiagramPrototype } = await import('./diagram');
  mountDiagramPrototype(view !== 'lesson');
}
