import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import { resolve, dirname } from 'node:path';
import { emptyState, transition } from '../tgcloud/lib/state.js';
import { ITEMS, COMBOS, productKeyboard, comboKeyboard } from '../tgcloud/lib/menu.js';

// A local SDK double exercises handlers and persistence conflict/replay paths.
// The actual SDK and migrations still require a cloud test after authentication.
async function harness() {
  const rows = new Map();
  const calls = [];
  let messageId = 100;
  let conflict = false;
  let sendHook;
  const api = new Proxy({}, { get: (_, method) => async params => {
    calls.push({ method, params });
    if (method === 'getMe') return { username: 'Almuerzin8orBot' };
    if (method === 'sendMessage' && sendHook) {
      const hook = sendHook;
      sendHook = null;
      await hook();
    }
    return { message_id: ++messageId };
  } });
  const column = () => {
    const c = {};
    for (const name of ['primaryKey', 'notNull', 'default']) c[name] = () => c;
    return c;
  };
  const eq = (col, value) => row => row[col] === value;
  const and = (...conditions) => row => conditions.every(condition => condition(row));
  const db = {
    insert: () => ({ values: row => ({ onConflictDoNothing: () => ({ run: async () => {
      if (!rows.has(row.chatId)) rows.set(row.chatId, structuredClone(row));
    } }) }) }),
    select: () => ({ from: () => ({ where: condition => ({ get: async () => {
      const row = [...rows.values()].find(condition);
      return row ? structuredClone(row) : null;
    } }) }) }),
    update: () => ({ set: values => ({ where: condition => ({ returning: () => ({ run: async () => {
      if (conflict) {
        conflict = false;
        const first = rows.values().next().value;
        first.revision++;
        first.state.items[ITEMS[0]] = (first.state.items[ITEMS[0]] || 0) + 1;
      }
      const row = [...rows.values()].find(condition);
      if (!row) return [];
      Object.assign(row, structuredClone(values));
      return [structuredClone(row)];
    } }) }) }) }),
  };
  const sdkDb = { eq, and, integer: column, json: column,
    table: (_, columns) => Object.fromEntries(Object.keys(columns).map(key => [key, key])) };
  const context = createContext({ console });
  const modules = new Map();
  async function load(path) {
    if (modules.has(path)) return modules.get(path);
    const exports = path === 'sdk' ? { api, db } : path === 'sdk/db' ? sdkDb : null;
    const mod = exports ? new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context }) : new SourceTextModule(await readFile(path, 'utf8'), { context, identifier: path });
    modules.set(path, mod);
    await mod.link((specifier, parent) => load(specifier.startsWith('sdk')
      ? specifier : resolve(dirname(parent.identifier), specifier)));
    return mod;
  }
  async function handler(name) {
    const mod = await load(resolve('tgcloud', 'handlers', `${name}.js`));
    await mod.evaluate();
    return mod.namespace.default;
  }
  const message = await handler('message');
  const callback = await handler('callback_query');
  let event = 0;
  const press = async (data, user = 1, menuId = rows.get(7)?.state.messageId, id = `q${++event}`) =>
    callback({ id, from: { id: user }, data, message: { chat: { id: 7 }, message_id: menuId, date: 1 } });
  const command = async (text, id = ++event, chat = 7) => message({ text, message_id: id, chat: { id: chat } });
  return { rows, calls, press, command, message, forceConflict: () => { conflict = true; }, setSendHook: hook => { sendHook = hook; } };
}

test('all menu buttons fit Telegram callback size and combos preserve the Python menu', () => {
  assert.equal(ITEMS.length, 14);
  assert.equal(COMBOS.length, 12);
  for (const keyboard of [productKeyboard('plus'), productKeyboard('minus'), comboKeyboard()]) {
    for (const button of keyboard.inline_keyboard.flat()) assert.ok(Buffer.byteLength(button.callback_data) <= 64);
  }
});
test('subtract never becomes negative; combos add both products', () => {
  const state = emptyState();
  transition(state, 'minus:0');
  assert.equal(state.items[ITEMS[0]], 0);
  transition(state, 'combo:0');
  assert.equal(state.items['🥃'], 1);
  assert.equal(state.items['🍅'], 1);
  assert.equal(transition(state, 'plus:999'), 'invalid');
});
test('empty confirmation, frozen confirmation, edit and deletion', () => {
  const state = emptyState();
  assert.equal(transition(state, 'confirm'), 'empty');
  transition(state, 'plus:0');
  transition(state, 'confirm');
  assert.equal(transition(state, 'plus:0'), 'locked');
  transition(state, 'edit');
  transition(state, 'plus:0');
  assert.equal(state.items[ITEMS[0]], 2);
  transition(state, 'confirm_delete');
  assert.deepEqual(state.items, {});
  assert.equal(state.confirmed, null);
});
test('group members share and edit the same confirmed order', async () => {
  const h = await harness();
  await h.command('/pedido');
  await h.press('plus:0', 1);
  await h.press('combo:0', 2);
  await h.press('confirm', 1);
  assert.equal(h.rows.get(7).state.confirmed['🥃'], 2);
  await h.press('edit', 2);
  await h.press('minus:0', 2);
  await h.press('confirm', 2);
  assert.equal(h.rows.get(7).state.confirmed['🥃'], 1);
});
test('duplicate deliveries do not add products twice', async () => {
  const h = await harness();
  await h.command('/pedido');
  const menu = h.rows.get(7).state.messageId;
  await h.press('plus:0', 1, menu, 'same');
  await h.press('plus:0', 1, menu, 'same');
  assert.equal(h.rows.get(7).state.items['🥃'], 1);
});
test('optimistic retry preserves another concurrent update', async () => {
  const h = await harness();
  await h.command('/pedido');
  h.forceConflict();
  await h.press('plus:0');
  assert.equal(h.rows.get(7).state.items['🥃'], 2);
});
test('old keyboards cannot modify a new order', async () => {
  const h = await harness();
  await h.command('/pedido');
  const old = h.rows.get(7).state.messageId;
  await h.command('/pedido');
  await h.press('plus:0', 1, old);
  assert.equal(h.rows.get(7).state.items['🥃'], undefined);
  assert.match(h.calls.at(-1).params.text, /antiguo/);
});
test('an old button arriving while the new menu is being sent cannot disable it', async () => {
  const h = await harness();
  await h.command('/pedido');
  const old = h.rows.get(7).state.messageId;
  h.setSendHook(() => h.press('plus:0', 1, old));
  await h.command('/pedido');
  assert.ok(h.rows.get(7).state.messageId);
  await h.press('plus:0');
  assert.equal(h.rows.get(7).state.items['🥃'], 1);
});
test('/edit reopens the shared order and deletion clears its confirmation', async () => {
  const h = await harness();
  await h.command('/pedido');
  await h.press('plus:0');
  await h.press('confirm');
  await h.command('/edit');
  assert.match(h.calls.filter(c => c.method === 'sendMessage').at(-1).params.text, /EDITANDO/);
  await h.press('confirm_delete');
  assert.equal(h.rows.get(7).state.confirmed, null);
  assert.equal(Object.keys(h.rows.get(7).state.items).length, 0);
});
test('commands targeted at other bots and non-text messages are ignored', async () => {
  const h = await harness();
  await h.command('/pedido@OtherBot');
  assert.equal(h.rows.size, 0);
  await h.message({ chat: { id: 7 }, photo: [] });
  assert.equal(h.calls.length, 1);
  await h.command('/pedido@Almuerzin8orBot');
  assert.ok(h.rows.has(7));
});
test('chats are isolated; help, legend and original joke are retained', async () => {
  const h = await harness();
  await h.command('/pedido');
  await h.press('plus:0');
  await h.command('/pedido', 40, 8);
  assert.equal(h.rows.get(8).state.items['🥃'], undefined);
  for (const command of ['/start', '/guia', '/leyenda', 'bocata lomo ya']) await h.command(command);
  assert.equal(h.calls.at(-1).method, 'sendPhoto');
});
