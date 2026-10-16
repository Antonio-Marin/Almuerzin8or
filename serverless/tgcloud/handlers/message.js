import { api } from 'sdk';
import { MENU, WELCOME, GUIDE, actionKeyboard, summary } from '../lib/menu.js';
import { changeOrder, readOrder } from '../lib/orders.js';
import { emptyState, transition } from '../lib/state.js';

export default async function (message) {
  if (!message.text || !message.chat) return;
  const chatId = message.chat.id;
  const send = (text, reply_markup) => api.sendMessage({ chat_id: chatId, text, ...(reply_markup && { reply_markup }) });
  const commandMatch = /^\/([a-z]+)(?:@([a-z0-9_]+))?(?:\s|$)/i.exec(message.text);
  if (commandMatch?.[2]) {
    const me = await api.getMe();
    if (commandMatch[2].toLowerCase() !== me.username.toLowerCase()) return;
  }
  const command = commandMatch?.[1].toLowerCase();
  if (command === 'start') return await send(WELCOME);
  if (command === 'leyenda') return await send('Aquí tienes el significado de cada emoticono:\n'
    + Object.entries(MENU).map(([emoji, name]) => `${emoji}: ${name}`).join('\n'));
  if (command === 'guia') return await send(GUIDE);
  if (command === 'pedido' || command === 'edit') {
    if (command === 'edit' && !(await readOrder(chatId))?.state.confirmed) {
      return await send('🥲 No tienes ningún pedido confirmado para editar.');
    }
    const changed = await changeOrder(chatId, `message:${message.message_id}`, state => {
      if (command === 'pedido') {
        Object.assign(state, { ...emptyState(), events: state.events });
        state.commandId = message.message_id;
        return 'new';
      }
      const result = transition(state, 'edit');
      if (result !== 'missing') {
        state.messageId = null;
        state.commandId = message.message_id;
      }
      return result;
    });
    if (changed.duplicate) return;
    if (changed.result === 'missing') return await send('🥲 No tienes ningún pedido confirmado para editar.');
    const sent = await send(command === 'pedido' ? '¿Qué deseas hacer?'
      : `✏️ EDITANDO PEDIDO\n\n${summary(changed.state.items)}\n¿Qué deseas modificar?`, actionKeyboard());
    await changeOrder(chatId, null, state => {
      // A later command wins if it arrived while sendMessage was running.
      if (state.messageId === null && state.commandId === message.message_id) state.messageId = sent.message_id;
    });
    return;
  }
  if (!command && message.text.toLowerCase().includes('bocata lomo ya')) {
    const responses = [
      'No queda... Se comió el último el monje',
      'Llegaste tarde... el monje se ha zampado el último 😭',
      'Lo siento, el monje no deja ni las migas 😡',
      '¡Bocata de lomo agotado! Se lo llevó el monje...',
      '¿Un bocata de lomo? JAJA, el monje lo pidió antes que tú.',
    ];
    await send(responses[Math.floor(Math.random() * responses.length)]);
    await api.sendPhoto({ chat_id: chatId, photo: 'https://pbs.twimg.com/media/Gdn_-3wWkAEQENt.jpg' });
  }
}
