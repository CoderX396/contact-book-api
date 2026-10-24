# Contact Book API

API REST de agenda de contactos hecha con Node.js y Express (Tarea Práctica 1).
Los datos viven en memoria: al reiniciar el servidor vuelven los 3 contactos de ejemplo.

## Cómo correrla

Requisitos: Node.js 18 o superior.

```bash
npm install
npm start        # node src/server.js
npm run dev      # nodemon: reinicia solo al guardar cambios
```

Escucha en `http://localhost:3000`. Para otro puerto: `PORT=4000 npm start`.

### Paquetes (versiones instaladas)

| Paquete | Versión | Para qué |
| --- | --- | --- |
| express | 5.3.0 | servidor y rutas |
| express-validator | 7.3.2 | validar el cuerpo de POST y PUT |
| helmet | 8.3.0 | cabeceras de seguridad |
| cors | 2.8.6 | permitir solo el origen `http://localhost:5173` |
| morgan | 1.12.1 | log de peticiones |
| express-rate-limit | 8.7.1 | límite de peticiones por IP |
| nodemon (dev) | 3.1.14 | recarga en desarrollo |

## Modelo de contacto

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | número | lo genera la API, autoincremental, no se reutiliza |
| `name` | texto | obligatorio, 2 a 50 caracteres |
| `phone` | texto | obligatorio, 7 a 20 caracteres; solo dígitos, espacios, `-`, `(`, `)` y `+` |
| `email` | texto | opcional, correo válido |
| `category` | texto | opcional: `family`, `friends`, `work` u `other` (por defecto `other`) |
| `favorite` | booleano | opcional, `true` o `false` (por defecto `false`) |
| `createdAt` | fecha ISO | la genera la API |

**Teléfono único:** no puede haber dos contactos con el mismo `phone`. Se comparan solo los
dígitos, así que `809-555-0101` y `(809) 555 0101` cuentan como el mismo número.
Repetirlo al crear o actualizar devuelve `409`.

Si el cliente envía `id`, `createdAt` o campos desconocidos, se ignoran: el controlador usa
`matchedData()` de express-validator, que solo devuelve los campos validados.

## Endpoints

| Método | Ruta | Qué hace | Códigos |
| --- | --- | --- | --- |
| GET | `/contacts` | lista todos | 200 |
| GET | `/contacts/:id` | uno por id | 200, 404 |
| POST | `/contacts` | crea | 201, 400, 409 |
| PUT | `/contacts/:id` | reemplaza el contacto completo | 200, 400, 404, 409 |
| PATCH | `/contacts/:id/favorite` | alterna `favorite` (true ↔ false) | 200, 404 |
| DELETE | `/contacts/:id` | borra; exige `x-api-key: talendig-123` | 204, 401, 404 |
| GET | `/contacts/stats/summary` | totales por categoría y favoritos; exige `x-client-id` | 200, 400 |

Además: cualquier ruta inexistente responde `404`, un JSON mal formado `400`, y pasar de 50
peticiones en 10 minutos a `/contacts` responde `429`.

**PUT reemplaza:** lo que no se envíe vuelve a su valor por defecto (`email` desaparece,
`category` pasa a `other`, `favorite` a `false`). `id` y `createdAt` se conservan.

Todos los errores salen con el mismo formato:

```json
{ "error": "mensaje claro de lo que pasó" }
```

### Ejemplos con curl

```bash
curl http://localhost:3000/contacts
curl -X POST http://localhost:3000/contacts -H "Content-Type: application/json" -d '{"name":"Pedro Ruiz","phone":"809-555-0404","category":"friends"}'
curl -X PATCH http://localhost:3000/contacts/1/favorite
curl -X DELETE http://localhost:3000/contacts/1 -H "x-api-key: talendig-123"
curl http://localhost:3000/contacts/stats/summary -H "x-client-id: mi-app"
```

## Middlewares, en el orden de `src/app.js`

El orden importa porque Express pasa cada petición por los middlewares de arriba abajo.

1. **`helmet()`** — agrega cabeceras de seguridad (`Content-Security-Policy`,
   `X-Content-Type-Options: nosniff`, etc.) y quita `X-Powered-By`, que revelaba que el
   servidor usa Express.
2. **`cors({ origin: 'http://localhost:5173' })`** — el navegador solo deja que una página de
   ese origen (un frontend con Vite) lea las respuestas. La API siempre responde
   `Access-Control-Allow-Origin: http://localhost:5173`; si la página viene de otro origen, el
   navegador bloquea la respuesta. Postman y curl no aplican CORS, por eso a ellos no les afecta.
3. **`morgan('dev')`** — imprime en consola cada petición: método, ruta, código y tiempo.
4. **`express.json()`** — convierte el cuerpo JSON en `req.body`. Si el JSON está roto, lanza
   un error que `errorHandler` traduce a `400`.
5. **`requestTimer`** (propio) — guarda la hora de inicio y, con `res.on('finish')`, imprime
   `[timer] GET /contacts → 3.2ms` cuando la respuesta ya se envió. Se usa el evento porque
   `next()` regresa antes de que la respuesta salga.
6. **Rate limiter** (`express-rate-limit`, solo en `/contacts`) — 50 peticiones cada 10 minutos
   por IP. Al pasarse, en vez de responder él mismo, llama a `next(new AppError(..., 429))`
   para que el error salga con el formato de siempre. Informa el límite en las cabeceras
   `RateLimit` y `RateLimit-Policy`.
7. **Rutas** (`src/routes/contacts.routes.js`), con dos middlewares de ruta:
   - **`requireClientId`** — solo en `GET /contacts/stats/summary`. Exige el header
     `x-client-id` (si falta, `400`) y lo guarda en `req.clientId`.
   - **`validateApiKey`** — solo en `DELETE /contacts/:id`. Si `x-api-key` falta o no es
     `talendig-123`, `401`. Va antes del controlador: sin permiso no se revela si el id existe.
   - **`validateContact`** — las reglas de express-validator más `handleValidation`, que junta
     los errores en un solo mensaje y pasa un `AppError` con `400`.
8. **`notFound`** — si ninguna ruta respondió, pasa un `AppError` con `404`.
9. **`errorHandler`** — tiene 4 parámetros `(err, req, res, next)`; así Express sabe que es el
   manejador de errores. Es el único lugar que responde errores: usa el mensaje y el código
   del `AppError`, o un `500` genérico (sin detalles internos) para cualquier error inesperado,
   que sí se imprime completo en la consola.

**Reglas que se cumplen:** ningún controlador ni middleware responde errores con
`res.status().json()`; todos hacen `next(new AppError(mensaje, status))`. Y todo middleware
termina en `next()`, `next(error)` o una respuesta, así ninguna petición queda colgada.

## Estructura

```
src/
  server.js                      arranca el servidor con PORT
  app.js                         arma la app: middlewares, rutas y errores
  routes/contacts.routes.js      qué URL va a qué controlador y con qué middlewares
  controllers/contacts.controller.js   lógica de cada endpoint y regla del teléfono único
  data/contacts.data.js          arreglo en memoria: getAll, getById, create, update, remove
  validators/contacts.validators.js    reglas de express-validator
  middlewares/                   requestTimer, requireClientId, validateApiKey, notFound, errorHandler
  utils/AppError.js              error con código HTTP
postman/contact-book-api.postman_collection.json
```

## Colección de Postman

`postman/contact-book-api.postman_collection.json` (formato v2.1) tiene 22 peticiones que
prueban cada endpoint y cada código de estado, con tests automáticos.

1. Postman → **Import** → elegir el archivo.
2. Con el servidor recién iniciado (`npm start`), abrir la colección → **Run**.
   Van en orden: el POST guarda el id creado en la variable `newId` y las siguientes lo usan.
3. Si el servidor no está en el puerto 3000, cambiar la variable `baseUrl` de la colección.

También se puede correr desde la terminal con newman:

```bash
npx newman run postman/contact-book-api.postman_collection.json
```

El `429` no está en la colección (dejaría bloqueada la IP 10 minutos). Para verlo, con el
servidor recién iniciado:

```bash
for i in $(seq 1 51); do curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/contacts; done
```

Las primeras 50 dan `200` y la 51 da `429`.
