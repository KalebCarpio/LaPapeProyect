# La Pape - Backend (Express + MongoDB)

API para autenticación con confirmación de correo y 2FA usada por el frontend Next.js.

## Variables de entorno principales

- `MONGODB_URI`: cadena de conexión a MongoDB.
- `JWT_SECRET`: clave usada para firmar tokens.
- `FRONTEND_ORIGINS`: lista de orígenes permitidos (separados por coma) para CORS.
- `PORT`: puerto de escucha (por defecto 4000).

## Evitar arranques lentos en hosts gratuitos

Proveedores como Render, Railway o Koyeb apagan instancias gratuitas tras unos minutos sin tráfico, provocando retrasos de 30-60 s en la siguiente solicitud. El servidor admite un **ping de keep-alive opcional** para reducir ese tiempo:

1. Define en el panel del host una variable `KEEP_ALIVE_URL` apuntando a una ruta pública del backend (por ejemplo `https://tu-backend.onrender.com/health`).
2. Opcional: ajusta el intervalo con `KEEP_ALIVE_INTERVAL_MINUTES` (por defecto 14 minutos para Render). Usa un valor mayor que 1 para no sobrepasar límites de uso.
3. Despliega de nuevo. Mientras la instancia siga encendida, el backend se auto-pingeará cada intervalo para evitar que se duerma.

> Nota: si el proveedor fuerza la hibernación no hay manera de evitarla sin pasar a un plan de pago; en ese caso la recomendación es subir de plan o usar un monitor externo (UptimeRobot, BetterStack, etc.) con un intervalo moderado.

## Scripts

- `npm run dev`: nodemon con recarga en caliente.
- `npm start`: arranque en producción.
- `npm test`: marcador de posición.

## Despliegue en Render (paso a paso)

Render detecta monorepos automáticamente, pero para evitar errores de sintaxis por versiones de Node no soportadas sigue estos pasos al crear o actualizar el servicio:

1. **Ruta raíz del servicio:** selecciona la carpeta `la-pape-backend` como _Root Directory_ al crear el servicio web.
2. **Versión de Node:** Render lee el fichero `.nvmrc`; deja el valor `22.21.0` o configúralo en la variable `NODE_VERSION` del servicio para forzar Node 22.
3. **Comando de build:** `npm install` (Render lo detecta por defecto, no hace falta compilar).
4. **Comando de start:** `npm start`.
5. **Limpiar caché si ya existe el servicio:** pulsa “Clear build cache” en Render y vuelve a desplegar para que tome la versión de Node correcta y el código actualizado.
6. **Variables de entorno requeridas:** define al menos `MONGODB_URI` y `JWT_SECRET`. Añade `FRONTEND_ORIGINS` con la URL de Vercel y `http://localhost:3000` separadas por comas.
7. **Comprobar logs iniciales:** tras el deploy revisa la primera línea del log; debe mostrar `Node version: v22.x` antes de iniciar la conexión a MongoDB.

Si Render intenta usar otra versión (por ejemplo v25) normalmente es porque no leyó la raíz correcta o mantiene caché antigua; los pasos 1 y 5 obligan a refrescar la configuración.
