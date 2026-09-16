# Almuerzin8or 🍽️

**Almuerzin8or** es un bot de Telegram para gestionar pedidos de almuerzo de forma sencilla y rápida, especialmente pensado para grupos.

Permite seleccionar productos mediante emojis, añadir combos, modificar cantidades y confirmar el pedido antes de finalizarlo.

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

## 🛠️ Construcción de la imagen

Para crear la imagen de **Almuerzin8or**, ejecuta el siguiente comando en el directorio donde hayas clonado el repositorio:

```bash
docker build -t almuerzin8or .
```

## 🚀 Ejecución

El token de Telegram se proporciona mediante una variable de entorno para evitar incluirlo directamente en el código.

```bash
docker run -d \
  --name almuerzin8or \
  -e ALMUERZIN8OR_KEY="TOKEN" \
  almuerzin8or
```

Sustituye `TOKEN` por el token de tu bot de Telegram.
