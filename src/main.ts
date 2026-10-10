import './style.css';

// Keep the working trainer available while the new layout awaits review.
if (new URLSearchParams(window.location.search).get('view') === 'trainer') {
  await import('./trainer');
} else {
  const { mountDiagramPrototype } = await import('./diagram');
  mountDiagramPrototype();
}
