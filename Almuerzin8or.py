from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, CallbackContext, CallbackQueryHandler

TOKEN = '7615655095:AAEfqRg5b2F6WCs8Hiab7_q4TTGyBcRFWzA'
MENU_ITEMS = {
    '🥃': 0,
    '☕': 0,
    '🧃': 0,
    '🍅': 0,
    '🥖': 0,
    '🐷': 0,
    '🥚': 0,
    '🥐': 0,
    '🍫': 0,
    '🥪': 0,
    '🥬': 0,
    '❌': 0
}
MENU_TEXT = {
    '🥃': 'Cortado',
    '☕': 'Café con leche',
    '🧃': 'Zumo',
    '🍅': 'Tostada con tomate',
    '🥖': 'Tostada con aceite',
    '🐷': 'Bocadillo de jamón',
    '🥚': 'Bocadillo de tortilla',
    '🥐': 'Cruasán mixto',
    '🍫': 'Cruasán nutella',
    '🥪': 'Sándwich',
    '🥬': 'Sándwich vegetal'
}

#Métodos
def create_menu_keyboard():
    keyboard = []
    row = []

    for emoji in MENU_ITEMS.keys():
        row.append(InlineKeyboardButton(emoji, callback_data=emoji))
        if len(row) == 3:
            keyboard.append(row)
            row = []

    if row:
        keyboard.append(row)

    return InlineKeyboardMarkup(keyboard)

def create_order_summary():
    order_summary = "Tu pedido actual:\n"
    menu = list(MENU_ITEMS.keys())[:-1]
    for item in menu:
        count = MENU_ITEMS[item]
        if(count > 0):
            order_summary += f"{item} {MENU_TEXT.get(item, '')}: {count}\n"
    
    return order_summary

def clean_menu_count():
    for item in MENU_ITEMS:
        MENU_ITEMS[item] = 0

#Comandos
async def start_command(update, context: CallbackContext):
    clean_menu_count()
    await update.message.reply_text('¡Hola! Soy tu bot de pedidos de almuerzo. Usa /leyenda para ver el menu y /pedido para hacer tu pedido.')

async def legend_command(update, context: CallbackContext):
    legend = "Aquí tienes el significado de cada emoticono:\n"
    for emoji, description in MENU_TEXT.items():
        legend += f"{emoji}: {description}\n"
    await update.message.reply_text(legend)

async def order_command(update: Update, context: CallbackContext):
    order_summary = create_order_summary()
    sent_message = await update.message.reply_text(
        text=order_summary,
        reply_markup=create_menu_keyboard()
    )


async def button_callback(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()

    selected_item = query.data

    if selected_item in MENU_ITEMS:
        if selected_item == '❌':
            clean_menu_count()
        else:
            MENU_ITEMS[selected_item] += 1
            

    order_summary = create_order_summary()

    await query.edit_message_text(
        text=order_summary,
        reply_markup=create_menu_keyboard()
    )

#Ejecución
if __name__ == '__main__':
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("leyenda", legend_command))
    application.add_handler(CommandHandler("pedido", order_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.run_polling()