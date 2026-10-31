# Contact Book API

API REST de agenda de contactos hecha con Node.js y Express, con autenticación JWT y roles
(Tareas Prácticas 1 y 2).
Los datos viven en memoria: al reiniciar el servidor vuelven los 3 contactos de ejemplo y solo
queda el usuario admin inicial.

## Cómo correrla

Requisitos: Node.js 18 o superior.

```bash
npm install
cp .env.example .env   # luego editar .env (ver abajo)
npm start              # node src/server.js
npm run dev            # nodemon: reinicia solo al guardar cambios
```

Escucha en el puerto que indique `PORT` (`http://localhost:3000` con el `.env` de ejemplo).

### Configurar el `.env`

El archivo `.env` guarda los secretos y **no se sube al repositorio** (está en `.gitignore`).
`.env.example` sí se sube: muestra qué variables hacen falta, sin valores reales.

| Variable | Ejemplo | Para qué |
| --- | --- | --- |
| `PORT` | `3000` | puerto del servidor |
| `JWT_SECRET` | `un-secreto-largo-y-aleatorio` | clave con la que se firman los tokens; cambiarla por una larga y aleatoria |
| `JWT_EXPIRES_IN` | `1h` | cuánto dura un token |
| `ADMIN_EMAIL` | `admin@contactbook.com` | correo del admin que se crea al iniciar |
| `ADMIN_PASSWORD` | `Cambia-Esto-123` | contraseña de ese admin |

Para generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Si falta alguna variable, el servidor no arranca y dice cuál es.

### Paquetes (versiones instaladas)

| Paquete | Versión | Para qué |
| --- | --- | --- |
| express | 5.3.0 | servidor y rutas |
| express-validator | 7.3.2 | validar los cuerpos de las peticiones |
| helmet | 8.3.0 | cabeceras de seguridad |
| cors | 2.8.6 | permitir solo el origen `http://localhost:5173` |
| morgan | 1.12.1 | log de peticiones |
| express-rate-limit | 8.7.1 | límite de peticiones por IP |
| bcryptjs | 3.0.3 | guardar el hash de la contraseña y compararlo |
| jsonwebtoken | 9.0.3 | firmar y verificar los tokens |
| dotenv | 18.0.9 | cargar el `.env` en `process.env` |
| nodemon (dev) | 3.1.14 | recarga en desarrollo |

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| `member` | consultar, crear y editar contactos |
| `manager` | lo de `member`, y además eliminar contactos |
| `admin` | lo de `manager`, y además administrar usuarios |

Al registrarse todos son `member`; si el cuerpo trae `role`, se ignora. Solo un admin puede
cambiar un rol. El primer admin lo crea `seedAdmin()` al iniciar, con los datos del `.env`.

## Modelo de usuario

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | número | lo genera la API, autoincremental |
| `name` | texto | obligatorio, 2 a 50 caracteres |
| `email` | texto | obligatorio, correo válido y único (sin distinguir mayúsculas); repetido da `409` |
| `password` | texto | obligatorio al registrarse, mínimo 6 caracteres; nunca se guarda |
| `passwordHash` | texto | lo que sí se guarda: `bcrypt.hash(password, 10)`; nunca sale en una respuesta |
| `role` | texto | `member`, `manager` o `admin` |
| `createdAt` | fecha ISO | la genera la API |

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

Las rutas con token se llaman con el header `Authorization: Bearer <token>`.

| Método | Ruta | Qué hace | Acceso y rol | Códigos |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | crea un usuario `member`; responde `{ user, token }` | público | 201, 400, 409 |
| POST | `/auth/login` | inicia sesión; responde `{ user, token }` | público | 200, 400, 401, 429 |
| GET | `/auth/me` | el usuario del token | cualquier rol | 200, 401 |
| GET | `/admin/users` | lista los usuarios | admin | 200, 401, 403 |
| PATCH | `/admin/users/:id/role` | cambia el rol; cuerpo `{ "role": "manager" }` | admin | 200, 400, 401, 403, 404 |
| GET | `/contacts` | lista todos | member, manager, admin | 200, 401 |
| GET | `/contacts/:id` | uno por id | member, manager, admin | 200, 401, 404 |
| POST | `/contacts` | crea | member, manager, admin | 201, 400, 401, 409 |
| PUT | `/contacts/:id` | reemplaza el contacto completo | member, manager, admin | 200, 400, 401, 404, 409 |
| PATCH | `/contacts/:id/favorite` | alterna `favorite` (true ↔ false) | member, manager, admin | 200, 401, 404 |
| DELETE | `/contacts/:id` | borra | manager, admin | 204, 401, 403, 404 |
| GET | `/contacts/stats/summary` | totales por categoría y favoritos; exige `x-client-id` | member, manager, admin | 200, 400, 401 |

Además: cualquier ruta inexistente responde `404`, un JSON mal formado `400`, y pasar de 50
peticiones en 10 minutos a `/contacts` responde `429`.

### ¿Qué diferencia hay entre un 401 y un 403 en esta API?

**401** significa que la API no sabe quién eres: falta el token, está alterado o venció (o, en el
login, las credenciales no coinciden). **403** significa que sí sabe quién eres, pero tu rol no
alcanza: por ejemplo, un `member` con un token válido que intenta `DELETE /contacts/:id`.
Con un 401 hay que iniciar sesión; con un 403 volver a iniciarla no sirve, hace falta otro rol.

### Mensajes de autenticación

| Caso | Código | Respuesta |
| --- | --- | --- |
| Sin token | 401 | `{ "error": "Token requerido" }` |
| Token alterado o vencido | 401 | `{ "error": "Token inválido o expirado" }` |
| Email inexistente o contraseña incorrecta | 401 | `{ "error": "Credenciales inválidas" }` |
| Rol no permitido | 403 | `{ "error": "No tienes permisos" }` |
| 5 logins fallidos en 15 minutos desde la misma IP | 429 | `{ "error": "Demasiados intentos fallidos de inicio de sesión. Intenta de nuevo en 15 minutos." }` |

**El rol viaja dentro del token.** Si un admin cambia el rol de alguien, los tokens anteriores
siguen con el rol viejo hasta que venzan: esa persona debe iniciar sesión otra vez para recibir
uno con el rol nuevo.

**PUT reemplaza:** lo que no se envíe vuelve a su valor por defecto (`email` desaparece,
`category` pasa a `other`, `favorite` a `false`). `id` y `createdAt` se conservan.

Todos los errores salen con el mismo formato:

```json
{ "error": "mensaje claro de lo que pasó" }
```

### Ejemplos con curl

```bash
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"name":"Pedro Ruiz","email":"pedro@example.com","password":"secreto123"}'
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"pedro@example.com","password":"secreto123"}'

# Copiar el token de la respuesta (TOKEN es el del login):
curl http://localhost:3000/auth/me -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/contacts -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/contacts -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Ana Ruiz","phone":"809-555-0404","category":"friends"}'
curl -X PATCH http://localhost:3000/contacts/1/favorite -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/contacts/stats/summary -H "Authorization: Bearer $TOKEN" -H "x-client-id: mi-app"
curl -X DELETE http://localhost:3000/contacts/1 -H "Authorization: Bearer $TOKEN"   # 403 si es member
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
7. **Rutas** (`/auth`, `/admin` y `/contacts`), con sus middlewares de ruta:
   - **`verifyToken`** — lee `Authorization: Bearer <token>`, lo comprueba con `jwt.verify` y
     guarda `req.user = { id, role }`. Sin token, `401 Token requerido`; alterado o vencido,
     `401 Token inválido o expirado`. Va en todo `/contacts`, todo `/admin` y `/auth/me`.
   - **`checkRole(...roles)`** — función que devuelve un middleware. Va siempre después de
     `verifyToken`. Sin `req.user`, `401`; con un rol que no está en la lista, `403`. Se revisa
     antes de buscar el contacto: sin permiso no se revela si el id existe.
   - **`loginLimiter`** (`express-rate-limit`, solo en `POST /auth/login`) — 5 intentos fallidos
     cada 15 minutos por IP. Con `skipSuccessfulRequests: true` los login correctos no cuentan.
     Al pasarse llama a `next(new AppError(..., 429))`, como el limiter de `/contacts`.
   - **`requireClientId`** — solo en `GET /contacts/stats/summary`. Exige el header
     `x-client-id` (si falta, `400`) y lo guarda en `req.clientId`.
   - **`validateContact`, `validateRegister`, `validateLogin`, `validateRole`** — las reglas de
     express-validator más `handleValidation`, que junta los errores en un solo mensaje y pasa
     un `AppError` con `400`.
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
  server.js                      carga el .env, crea el admin y arranca el servidor
  app.js                         arma la app: middlewares, rutas y errores
  routes/                        auth, admin y contacts: qué URL va a qué controlador y con qué middlewares
  controllers/                   auth (register, login, me), admin (listUsers, updateRole), contacts
  data/contacts.data.js          arreglo en memoria: getAll, getById, create, update, remove
  data/users.data.js             arreglo en memoria: findByEmail, findById, findAll, create, updateRole, seedAdmin
  validators/                    reglas de express-validator de contacts y auth
  middlewares/                   verifyToken, checkRole, requestTimer, requireClientId, notFound, errorHandler
  utils/AppError.js              error con código HTTP
  utils/jwt.js                   signToken: firma { sub, role }
postman/ContactBook.postman_collection.json
.env.example                     variables necesarias, sin secretos reales
```

## Colección de Postman

`postman/ContactBook.postman_collection.json` (formato v2.1) prueba cada endpoint y cada código
de estado con los tres roles, con tests automáticos. Guarda los tokens en las variables
`{{tokenMember}}`, `{{tokenManager}}` y `{{tokenAdmin}}`.

1. Postman → **Import** → elegir el archivo.
2. Con el servidor recién iniciado (`npm start`), abrir la colección → **Run**. Van en orden:
   - **Auth:** el login del admin guarda `tokenAdmin` y el registro guarda `tokenMember`.
   - **Admin:** el admin asciende al segundo usuario y su nuevo login guarda `tokenManager`.
   - **Contacts:** el POST guarda el id creado en `newId` y las siguientes lo usan.
   - **Límite de login:** repite un login fallido hasta recibir el `429`.
3. Si el servidor no está en el puerto 3000, cambiar la variable `baseUrl` de la colección. Si el
   `.env` tiene otro admin, cambiar `adminEmail` y `adminPassword`.

También se puede correr desde la terminal con newman:

```bash
npx newman run postman/ContactBook.postman_collection.json
```

Para repetirla hay que reiniciar el servidor: los usuarios ya existirían (`409`) y el login quedó
bloqueado 15 minutos. El contador del límite vive en memoria, así que reiniciar también lo limpia.

La prueba de "token vencido" usa un token firmado con el `JWT_SECRET` de `.env.example`. Con otro
secreto también da `401`, pero por la firma; para ver el vencimiento real se puede poner
`JWT_EXPIRES_IN=5s`, iniciar sesión y esperar.

El `429` de `/contacts` no está en la colección (dejaría bloqueada la IP 10 minutos). Para verlo,
con el servidor recién iniciado:

```bash
for i in $(seq 1 51); do curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/contacts; done
```

Sin token, las primeras 50 dan `401` y la 51 da `429`, porque el límite se revisa antes que el token.
