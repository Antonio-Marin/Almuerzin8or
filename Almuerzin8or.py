import os
import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackContext, CallbackQueryHandler, MessageHandler, filters

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

COMBOS = {
    '🥃+🍅': ['🥃', '🍅'],
    '🥃+🐷': ['🥃', '🐷'],
    '☕+🍅': ['☕', '🍅'],
    '☕+🥐': ['☕', '🥐'],
    '☕+🥪': ['☕', '🥪'],
    '☕+🥬': ['☕', '🥬'],
    '☕+🥚': ['☕', '🥚'],
    '☕+🐷': ['☕', '🐷']
}

#Métodos
def create_action_keyboard():
    keyboard = [
        [InlineKeyboardButton('➕', callback_data='plus'), InlineKeyboardButton('➖', callback_data='minus')],
        [InlineKeyboardButton('🍽️ Combos', callback_data='combos')] 
    ]
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
    keyboard.append([InlineKeyboardButton('✅', callback_data='confirm')])

    return InlineKeyboardMarkup(keyboard)

def create_combo_keyboard():
    keyboard = []
    row = []
    for combo_name in COMBOS.keys():
        row.append(InlineKeyboardButton(combo_name, callback_data=f"combo_{combo_name}"))
        if len(row) == 2:
            keyboard.append(row)
            row = []

    if row:
        keyboard.append(row)
    
    keyboard.append([InlineKeyboardButton('↩️​', callback_data='back'), InlineKeyboardButton('❌', callback_data='delete')])
    keyboard.append([InlineKeyboardButton('✅', callback_data='confirm')])

    return InlineKeyboardMarkup(keyboard)

def create_order_summary():
    order_summary = "Tu pedido actual:\n"
    menu = list(MENU_ITEMS.keys())
    for item in menu:
        count = MENU_ITEMS[item]
        if count > 0:
            order_summary += f"{item} {MENU_TEXT.get(item, '')}: {count}\n"
    
    return order_summary

def create_confirmed_order_summary():
    order_summary = "📋 PEDIDO CONFIRMADO\n\n"

    for item in MENU_ITEMS:
        count = MENU_ITEMS[item]

        if count > 0:
            order_summary += f"{item} {MENU_TEXT.get(item, '')}: {count}\n"

    order_summary += "\nSi deseas editar el pedido, pulsa el lápiz ✏️"

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
    '   - Si pulsas ➖, los productos que selecciones se irán restando de tu pedido actual.\n'
    '   - Si pulsas "🍽️ Combos", se mostraran combos de productos para añadirlos a tu pedido actual.\n\n'
    'También tienes otras opciones importantes:\n'
    '   - ↩️: te permitirá cambiar entre añadir o eliminar productos.\n'
    '   - ❌: borrará todo el pedido actual si deseas comenzar desde cero.\n\n'
    '¡Sigue las instrucciones y disfruta organizando tu pedido!')

async def order_command(update: Update, context: CallbackContext):
    clean_menu_count()
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
    elif selected_action == 'combos':
        await query.edit_message_text(
            text=f"{order_summary}\nSelecciona un combo:",
            reply_markup=create_combo_keyboard()
        )
    elif selected_action.startswith('combo_'):
        combo_name = selected_action.replace('combo_', '')  # Extraer el nombre del combo
        if combo_name in COMBOS:
            for item in COMBOS[combo_name]:
                MENU_ITEMS[item] += 1  # Añadir los productos del combo al pedido

        order_summary = create_order_summary()
        await query.edit_message_text(
            text=f"{order_summary}\nCombo añadido. ¿Deseas agregar algo más?",
            reply_markup=create_combo_keyboard()
        )
    elif selected_action == 'back':
        await query.edit_message_text(
            text=f"{order_summary}\n¿Qué deseas hacer?",
            reply_markup=create_action_keyboard()
        )
    elif selected_action == 'confirm':
        if not any(MENU_ITEMS.values()):
            await query.edit_message_text(
                text="🥲 Vaya... pues yo creo que os vais a quedar con hambre.",
            )
            return

        order_summary = create_confirmed_order_summary()

        await query.edit_message_text(
            text=order_summary,
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton('✏️', callback_data='edit')]
            ])
        )
    elif selected_action == 'delete':
        await query.edit_message_text(
            text="⚠️ ¿Seguro que quieres eliminar el pedido?",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton('✅', callback_data='confirm_delete'),
                    InlineKeyboardButton('↩️', callback_data='cancel_delete')
                ]
            ])
        )
    elif selected_action == 'confirm_delete':
        clean_menu_count()
        order_summary = create_order_summary()

        await query.edit_message_text(
            text=f"{order_summary}\nTu pedido ha sido eliminado.\n¿Deseas hacer algo más?",
            reply_markup=create_action_keyboard()
        )
    elif selected_action == 'cancel_delete':
        order_summary = create_order_summary()

        await query.edit_message_text(
            text=f"{order_summary}\nContinúa con tu pedido:",
            reply_markup=create_action_keyboard()
        )
    elif selected_action in MENU_ITEMS:
        action = context.user_data.get('action')

        if action == 'plus':
            MENU_ITEMS[selected_action] += 1
        elif action == 'minus':
            if MENU_ITEMS[selected_action] > 0:
                MENU_ITEMS[selected_action] -= 1
            else:
                return

        # Generar resumen del pedido
        order_summary = create_order_summary()

        try:
            await query.edit_message_text(
                text=f"{order_summary}\nElige otro producto o vuelve:",
                reply_markup=create_product_keyboard()
            )
        except Exception as e:
            print(f"Error al actualizar el mensaje: {e}")


async def text_handler(update: Update, context: CallbackContext):
    user_message = update.message.text.lower()

    if "bocata lomo ya" in user_message:
        respuestas = [
            "No queda... Se comió el último el monje",
            "Llegaste tarde... el monje se ha zampado el último 😭",
            "Lo siento, el monje no deja ni las migas 😡",
            "¡Bocata de lomo agotado! Se lo llevó el monje...",
            "¿Un bocata de lomo? JAJA, el monje lo pidió antes que tú.",
        ]

        await update.message.reply_text(random.choice(respuestas))
        await update.message.reply_photo("https://pbs.twimg.com/media/Gdn_-3wWkAEQENt.jpg")

#Ejecución
if __name__ == '__main__':
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("leyenda", legend_command))
    application.add_handler(CommandHandler("guia", guide_command))
    application.add_handler(CommandHandler("pedido", order_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_handler))

    application.run_polling()
