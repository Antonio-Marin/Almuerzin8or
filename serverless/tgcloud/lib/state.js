import { ITEMS, COMBOS } from './menu.js';

export const emptyState = () => ({ items: {}, confirmed: null, messageId: null, commandId: null, events: [] });
export const hasItems = items => Object.values(items).some(count => count > 0);

export function transition(state, action) {
  if (action === 'confirm') {
    if (!hasItems(state.items)) return 'empty';
    state.confirmed = { ...state.items };
    return 'confirmed';
  }
  if (action === 'edit') {
    if (!state.confirmed) return 'missing';
    state.items = { ...state.confirmed };
    state.confirmed = null;
    return 'edit';
  }
  if (action === 'confirm_delete') {
    state.items = {};
    state.confirmed = null;
    return 'deleted';
  }
  const match = /^(plus|minus|combo):(\d+)$/.exec(action);
  if (!match) return 'menu';
  if (state.confirmed) return 'locked';
  const [, mode, indexText] = match;
  const index = Number(indexText);
  const selection = mode === 'combo' ? COMBOS[index] : ITEMS[index] && [ITEMS[index]];
  if (!selection) return 'invalid';
  for (const item of selection) {
    state.items[item] = Math.max(0, (state.items[item] || 0) + (mode === 'minus' ? -1 : 1));
  }
  return mode;
}
