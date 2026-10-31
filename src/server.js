require('dotenv').config(); // primera línea: el resto del código ya encuentra process.env lleno

// Solo arranca el servidor. La app vive en app.js por separado para poder
// importarla en pruebas sin abrir un puerto.
const app = require('./app');
const { seedAdmin } = require('./data/users.data');

const PORT = process.env.PORT || 3000;

// Sin estas variables, firmar tokens o crear el admin fallaría más tarde con un
// error confuso. Es mejor no arrancar y decir qué falta.
const required = ['JWT_SECRET', 'JWT_EXPIRES_IN', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Faltan variables en el .env: ${missing.join(', ')}. Vea .env.example.`);
  process.exit(1);
}

// Se abre el puerto cuando el admin ya existe (bcrypt.hash es asíncrono).
seedAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`Contact Book API escuchando en http://localhost:${PORT}`);
  });
});
