import os
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackContext, CallbackQueryHandler


TOKEN = os.environ.get('ALMUERZIN8OR_KEY')

MENU_ITEMS = {
    '🥃': 0,
    '☕': 0,
    '🧃': 0,
    '💧​': 0,
    '🍅': 0,
    '🥖': 0,
    '🐟​': 0,
    '🐷': 0,
    '🥚': 0,
    '🥐': 0,
    '🍫': 0,
    '🧁​':0,
    '🥪': 0,
    '🥬': 0,
}
MENU_TEXT = {
    '🥃': 'Cortado',
    '☕': 'Café con leche',
    '🧃': 'Zumo',
    '💧​': 'Botella de agua',
    '🍅': 'Tostada con tomate',
    '🥖': 'Tostada con aceite',
    '🐟​': 'Tostada con atún',
    '🐷': 'Bocadillo de jamón',
    '🥚': 'Bocadillo de tortilla',
    '🥐': 'Cruasán mixto',
    '🍫': 'Cruasán nutella',
    '🧁​': 'Bizcocho',
    '🥪': 'Sándwich',
    '🥬': 'Sándwich vegetal'
}

#Métodos
def create_action_keyboard():
    keyboard = [[InlineKeyboardButton('➕', callback_data='plus'), InlineKeyboardButton('➖', callback_data='minus')]]
    return InlineKeyboardMarkup(keyboard)

def create_product_keyboard():
    keyboard = []
    row = []

    for emoji in MENU_ITEMS.keys():
        row.append(InlineKeyboardButton(emoji, callback_data=emoji))
        if len(row) == 2:
            keyboard.append(row)
            row = []

    if row:
        keyboard.append(row)

    keyboard.append([InlineKeyboardButton('↩️​', callback_data='back'), InlineKeyboardButton('❌', callback_data='delete')])

    return InlineKeyboardMarkup(keyboard)

def create_order_summary():
    order_summary = "Tu pedido actual:\n"
    menu = list(MENU_ITEMS.keys())
    for item in menu:
        count = MENU_ITEMS[item]
        if count > 0:
            order_summary += f"{item} {MENU_TEXT.get(item, '')}: {count}\n"
    
    return order_summary

def clean_menu_count():
    for item in MENU_ITEMS:
        MENU_ITEMS[item] = 0

#Comandos
async def start_command(update, context: CallbackContext):
    clean_menu_count()
    await update.message.reply_text(
    '¡Hola! Soy tu bot de pedidos de almuerzo. Usa /leyenda para ver el menú y /pedido para hacer tu pedido. '
    'Si tienes alguna duda, utiliza /guia para ver cómo funciona el proceso de pedido.')

async def legend_command(update, context: CallbackContext):
    legend = "Aquí tienes el significado de cada emoticono:\n"
    for emoji, description in MENU_TEXT.items():
        legend += f"{emoji}: {description}\n"
    await update.message.reply_text(legend)

async def guide_command(update, context: CallbackContext):
    await update.message.reply_text(
    'A la hora de empezar tu pedido se te mostrarán dos emoticonos:\n'
    '   - Si pulsas ➕, los siguientes productos que selecciones se irán sumando a tu pedido.\n'
    '   - Si pulsas ➖, los productos que selecciones se irán restando de tu pedido actual.\n\n'
    'También tienes otras opciones importantes:\n'
    '   - ↩️: te permitirá cambiar entre añadir o eliminar productos.\n'
    '   - ❌: borrará todo el pedido actual si deseas comenzar desde cero.\n\n'
    '¡Sigue las instrucciones y disfruta organizando tu pedido!')

async def order_command(update: Update, context: CallbackContext):
    sent_message = await update.message.reply_text(
        text="¿Qué deseas hacer?",
        reply_markup=create_action_keyboard()
    )


async def button_callback(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()

    selected_action = query.data
    order_summary = create_order_summary()

    if selected_action == 'plus' or selected_action == 'minus':
        context.user_data['action'] = selected_action
        await query.edit_message_text(
            text=f"{order_summary}\nElige un producto:",
            reply_markup=create_product_keyboard()
        )
    elif selected_action == 'back':
        await query.edit_message_text(
            text=f"{order_summary}\n¿Qué deseas hacer?",
            reply_markup=create_action_keyboard()
        )
    elif selected_action == 'delete':
        # Eliminar todo el pedido
        clean_menu_count()
        order_summary = create_order_summary()  # Actualiza después de eliminar
        await query.edit_message_text(
            text=f"{order_summary}\nTu pedido ha sido eliminado.\n¿Deseas hacer algo más?",
            reply_markup=create_action_keyboard()
        )
    elif selected_action in MENU_ITEMS:
        action = context.user_data.get('action')

        if action == 'plus':
            MENU_ITEMS[selected_action] += 1
        elif action == 'minus' and MENU_ITEMS[selected_action] > 0:
            MENU_ITEMS[selected_action] -= 1

        order_summary = create_order_summary()
        await query.edit_message_text(
            text=f"{order_summary}\nElige otro producto o vuelve:",
            reply_markup=create_product_keyboard()
        )


#Ejecución
if __name__ == '__main__':
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("leyenda", legend_command))
    application.add_handler(CommandHandler("guia", guide_command))
    application.add_handler(CommandHandler("pedido", order_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.run_polling()
