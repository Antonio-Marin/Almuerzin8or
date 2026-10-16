import { api } from 'sdk';
import { changeOrder } from '../lib/orders.js';
import { transition } from '../lib/state.js';
import { summary, actionKeyboard, productKeyboard, comboKeyboard, confirmedKeyboard, deleteKeyboard } from '../lib/menu.js';

export default async function (query) {
  if (!query.message?.chat || !query.data || query.message.date === 0) {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: 'Abre un pedido con /pedido.' });
    return;
  }
  const chatId = query.message.chat.id;
  const changed = await changeOrder(chatId, `callback:${query.id}`, state => {
    if (state.messageId !== query.message.message_id) return 'stale';
    return transition(state, query.data);
  });
  const notices = {
    stale: 'Este menú es antiguo. Usa el mensaje más reciente del pedido.',
    empty: '🥲 Vaya... pues yo creo que os vais a quedar con hambre.',
    missing: '🥲 No encuentro ningún pedido confirmado para editar.',
    invalid: 'Producto desconocido. Abre de nuevo el menú.',
    locked: 'Pulsa ✏️ para editar el pedido confirmado.',
  };
  await api.answerCallbackQuery({ callback_query_id: query.id,
    ...(notices[changed.result] && { text: notices[changed.result] }) });
  if (changed.duplicate || notices[changed.result]) return;
  const { state } = changed;
  let text = `${summary(state.items)}\n¿Qué deseas hacer?`;
  let reply_markup = actionKeyboard();
  if (state.confirmed) {
    text = summary(state.confirmed, true);
    reply_markup = confirmedKeyboard();
  } else if (query.data === 'delete') {
    text = '⚠️ ¿Seguro que quieres eliminar el pedido?';
    reply_markup = deleteKeyboard();
  } else if (changed.result === 'edit') {
    text = `✏️ EDITANDO PEDIDO\n\n${summary(state.items)}\n¿Qué deseas modificar?`;
  } else if (query.data === 'combos' || changed.result === 'combo') {
    text = `${summary(state.items)}\nSelecciona un combo:`;
    reply_markup = comboKeyboard();
  } else if (['plus', 'minus'].includes(query.data) || ['plus', 'minus'].includes(changed.result)) {
    const mode = query.data === 'minus' || changed.result === 'minus' ? 'minus' : 'plus';
    text = `${summary(state.items)}\n${mode === 'plus' ? '➕ Añadir' : '➖ Quitar'} productos:`;
    reply_markup = productKeyboard(mode);
  } else if (changed.result === 'deleted') {
    text = `${summary(state.items)}\nTu pedido ha sido eliminado.\n¿Deseas hacer algo más?`;
  }
  try {
    await api.editMessageText({ chat_id: chatId, message_id: query.message.message_id, text, reply_markup });
  } catch (error) {
    if (!(error.code === 400 && error.description?.includes('message is not modified'))) throw error;
  }
}
