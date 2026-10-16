import { table, integer, json } from 'sdk/db';

export const orders = table('almuerzin8or_orders', {
  chatId: integer('chat_id').primaryKey(),
  revision: integer('revision').notNull().default(0),
  state: json('state').notNull(),
});
