import './style.css';

// Preserve both working lessons while the new hardware drawings await approval.
const view = new URLSearchParams(window.location.search).get('view');
if (view === 'trainer') {
  await import('./trainer');
} else if (view === 'lesson') {
  const { mountDiagramPrototype } = await import('./diagram');
  mountDiagramPrototype();
} else {
  const { mountHardwarePrototype } = await import('./hardware-prototype');
  mountHardwarePrototype();
}
