/** Shared by the junction prototype and complete circuit lesson. */
export function connectorSelection<T extends string>(members: T[], present: (id: T) => boolean, occupied: (id: T) => boolean): { members: T[]; error: string | null } {
  const unique = [...new Set(members)];
  const error = unique.length < 2 || unique.length > 4
    ? 'Select two to four free conductor ends for this virtual connector.'
    : unique.some(id => !present(id)) ? 'That conductor is not present in this box.'
    : unique.some(occupied) ? 'Remove the existing connection before changing its conductor ends.' : null;
  return { members: unique, error };
}
