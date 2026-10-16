export const MENU = {
  '🥃': 'Cortado', '☕': 'Café con leche', '🧃': 'Zumo', '💧': 'Botella de agua',
  '🍅': 'Tostada con tomate', '🥖': 'Tostada con aceite', '🐟': 'Tostada con atún',
  '🐷': 'Bocadillo de jamón', '🥚': 'Bocadillo de tortilla', '🥐': 'Cruasán mixto',
  '🍫': 'Cruasán nutella', '🧁': 'Bizcocho', '🥪': 'Sándwich', '🥬': 'Sándwich vegetal',
};
export const ITEMS = Object.keys(MENU);
export const COMBOS = ['🥃', '☕'].flatMap(drink =>
  ['🍅', '🐷', '🥐', '🥪', '🥬', '🥚'].map(food => [drink, food]));
const button = (text, callback_data) => ({ text, callback_data });
const keyboard = inline_keyboard => ({ inline_keyboard });
const pairs = buttons => buttons.reduce((rows, b, i) => {
  if (i % 2 === 0) rows.push([]);
  rows[rows.length - 1].push(b);
  return rows;
}, []);
export const actionKeyboard = () => keyboard([
  [button('➕', 'plus'), button('➖', 'minus')], [button('🍽️ Combos', 'combos')],
]);
const footer = () => [[button('↩️', 'back'), button('❌', 'delete')], [button('✅', 'confirm')]];
export const productKeyboard = mode => keyboard([
  ...pairs(ITEMS.map((item, index) => button(item, `${mode}:${index}`))), ...footer(),
]);
export const comboKeyboard = () => keyboard([
  ...pairs(COMBOS.map((combo, index) => button(combo.join('+'), `combo:${index}`))), ...footer(),
]);
export const confirmedKeyboard = () => keyboard([[button('✏️', 'edit')]]);
export const deleteKeyboard = () => keyboard([
  [button('↩️', 'cancel_delete'), button('✅', 'confirm_delete')],
]);
export function summary(items, confirmed = false) {
  let text = confirmed ? '📋 PEDIDO CONFIRMADO\n\n' : 'Tu pedido actual:\n';
  for (const item of ITEMS) if (items[item] > 0) text += `${item} ${MENU[item]}: ${items[item]}\n`;
  if (confirmed) text += '\nSi deseas editar el pedido, pulsa el lápiz ✏️';
  return text;
}
export const WELCOME = '¡Hola! 👋 Soy Almuerzin8or, tu bot para organizar pedidos de almuerzo 🍽️\n\n'
  + '🥪 Usa /pedido para crear un pedido.\n📋 Confírmalo y edítalo cuando lo necesites.\n'
  + '📖 Usa /leyenda para consultar el menú.\n❓ Usa /guia para ver cómo funciona.\n\n'
  + '👥 En los grupos compartís el pedido: cualquiera puede añadir, quitar, confirmar o editar.\n\n'
  + '¡Vamos a por ese almuerzo! 😋';
export const GUIDE = '🍽️ Cómo organizar el almuerzo\n\n'
  + '/pedido comienza un pedido nuevo y vacía el anterior.\n'
  + '➕ Añade productos.\n➖ Resta productos, sin bajar de cero.\n🍽️ Combos añade bebida y comida.\n'
  + '✅ Confirma el pedido.\n✏️ o /edit permite editar el pedido confirmado.\n'
  + '↩️ Vuelve al menú anterior.\n❌ Elimina el pedido después de pedir confirmación.\n\n'
  + '👥 El pedido es compartido por todo el chat. Usa los botones del mensaje más reciente del pedido.';
