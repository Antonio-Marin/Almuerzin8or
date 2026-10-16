import { db } from 'sdk';
import { eq, and } from 'sdk/db';
import { orders } from '../schema.js';
import { emptyState } from './state.js';

export async function readOrder(chatId) {
  return await db.select().from(orders).where(eq(orders.chatId, chatId)).get();
}

// Compare-and-swap prevents simultaneous button presses losing products.
// change must be pure: it may be evaluated again after a conflict.
export async function changeOrder(chatId, eventId, change) {
  await db.insert(orders).values({ chatId, revision: 0, state: emptyState() })
    .onConflictDoNothing({ target: orders.chatId }).run();
  for (let attempt = 0; attempt < 12; attempt++) {
    const row = await readOrder(chatId);
    if (eventId && row.state.events.includes(eventId)) return { duplicate: true };
    const state = JSON.parse(JSON.stringify(row.state));
    const result = change(state);
    if (eventId) state.events = [...state.events, eventId].slice(-100);
    const changed = await db.update(orders).set({ state, revision: row.revision + 1 })
      .where(and(eq(orders.chatId, chatId), eq(orders.revision, row.revision)))
      .returning().run();
    if (changed.length) return { state, result, revision: row.revision + 1 };
  }
  throw new Error('El pedido está ocupado. Vuelve a intentarlo.');
}
