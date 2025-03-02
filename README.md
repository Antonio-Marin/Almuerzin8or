# Almuerzin8or
Almuerzin8or es un bot de Telegram que simplifica la gestión de pedidos de almuerzo en grupos. Permite a los usuarios seleccionar su comida mediante emojis y actualiza el pedido en tiempo real, facilitando la organización y evitando confusiones.

## Construcción de la Imagen

Para crear la imagen de **Almuerzin8or**, ejecuta el siguiente comando en el directorio donde hayas clonado el repositorio:

```bash
docker build -t almuerzin8or .
```
El bot tiene su token de Telegram oculto por seguridad. Para ejecutarlo, proporciona tu token:

```bash
docker run -d --name almuerzin8or -e ALMUERZIN8OR_KEY="TOKEN" almuerzin8or
