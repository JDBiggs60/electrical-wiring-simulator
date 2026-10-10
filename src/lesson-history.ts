import type { LessonCircuit } from './lesson-circuit';

type Wiring = Omit<LessonCircuit, 'power' | 'switchOn'>;
/** One history for the installation, not one stack per box. Power and switch
 * operation are not wiring actions, and wiring history cannot change live power. */
export function createLessonHistory(state: LessonCircuit) {
  const past: Wiring[] = [], future: Wiring[] = [];
  const snapshot = (): Wiring => {
    const { power: _power, switchOn: _switch, ...wiring } = state;
    return structuredClone(wiring);
  };
  return {
    get canUndo() { return !state.power && past.length > 0; },
    get canRedo() { return !state.power && future.length > 0; },
    perform(action: () => void) {
      const before = snapshot();
      action();
      if (JSON.stringify(before) !== JSON.stringify(snapshot())) {
        past.push(before); future.length = 0; return true;
      }
      return false;
    },
    undo() {
      if (state.power) return 'Turn test power off before undoing wiring.';
      const previous = past.pop();
      if (!previous) return 'No wiring action to undo.';
      future.push(snapshot()); Object.assign(state, structuredClone(previous));
      return 'Undid the last wiring action.';
    },
    redo() {
      if (state.power) return 'Turn test power off before redoing wiring.';
      const next = future.pop();
      if (!next) return 'No wiring action to redo.';
      past.push(snapshot()); Object.assign(state, structuredClone(next));
      return 'Restored the last undone wiring action.';
    },
    clear() { past.length = 0; future.length = 0; },
  };
}
export type LessonHistory = ReturnType<typeof createLessonHistory>;
export function historyButtons(history: LessonHistory, attribute: string) {
  return `<button ${attribute}="undo" ${history.canUndo ? '' : 'disabled'} title="Undo last wiring action (Ctrl+Z)">Undo</button><button ${attribute}="redo" ${history.canRedo ? '' : 'disabled'} title="Redo wiring action (Ctrl+Y or Ctrl+Shift+Z)">Redo</button>`;
}
