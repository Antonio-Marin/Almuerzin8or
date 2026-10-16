# Almuerzin8or 🍽️

**Almuerzin8or** es un bot de Telegram para gestionar pedidos de almuerzo de forma sencilla y rápida, especialmente pensado para grupos.

Permite seleccionar productos mediante emojis, añadir combos, modificar cantidades y confirmar el pedido antes de finalizarlo.

## 💬 Prueba el bot

El bot está disponible para que cualquier usuario pueda probarlo en Telegram: **[Abrir @Almuerzin8or_bot](https://t.me/Almuerzin8or_bot)**.

## ✨ Funcionalidades

* 🥪 Creación de pedidos mediante botones.
* ➕ Añadir productos al pedido.
* ➖ Restar productos del pedido.
* 🍽️ Combos de productos.
* 📋 Resumen del pedido antes y después de confirmarlo.
* ✅ Confirmación del pedido.
* ✏️ Edición de pedidos confirmados.
* ❌ Eliminación del pedido con confirmación.
* 📖 Leyenda con todos los productos disponibles.

> En los grupos, todos los usuarios comparten el mismo pedido. Cualquier miembro puede añadir, quitar, confirmar o editar productos.

## 🤖 Comandos

| Comando    | Descripción                                       |
| ---------- | ------------------------------------------------- |
| `/start`   | Muestra la bienvenida y las opciones disponibles. |
| `/pedido`  | Comienza un nuevo pedido.                         |
| `/edit`    | Permite editar un pedido confirmado.              |
| `/leyenda` | Muestra el significado de los emojis del menú.    |
| `/guia`    | Explica cómo utilizar el bot.                     |

## 📁 Versiones del proyecto

El proyecto incluye dos versiones del bot:

* **Python con Docker**: versión original, situada en la carpeta `python/`, con ejecución mediante Docker.
* **Telegram Serverless**: adaptación a JavaScript, situada en la carpeta `serverless/`, con pedidos persistentes en la base de datos de Telegram.

## 🐍 Ejecución con Python y Docker

### 🛠️ Construcción de la imagen

Para crear la imagen de **Almuerzin8or**, ejecuta el siguiente comando en el directorio donde hayas clonado el repositorio:

```bash
docker build -t almuerzin8or ./python
```

### 🚀 Ejecución

El token de Telegram se proporciona mediante una variable de entorno para evitar incluirlo directamente en el código.

```bash
docker run -d \
  --name almuerzin8or \
  -e ALMUERZIN8OR_KEY="TOKEN" \
  almuerzin8or
```

Sustituye `TOKEN` por el token de tu bot de Telegram.

## ☁️ Telegram Serverless

La carpeta `serverless/` contiene una adaptación del bot a JavaScript para ejecutarse directamente en la infraestructura de Telegram. El código se activa cuando llega un mensaje o se pulsa un botón, sin necesidad de mantener un servidor propio encendido.

Esta versión guarda los pedidos y sus confirmaciones en la base de datos de Telegram, de modo que se conservan entre ejecuciones y pueden editarse de forma compartida dentro de cada chat.

 Si te interesa como levantar tu propio bot de forma permanente y sin un servidor físico te recomiendo que le eches un vistazo a la [documentación oficial de Telegram Serverless](https://core.telegram.org/bots/serverless).
