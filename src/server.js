// Solo arranca el servidor. La app vive en app.js por separado para poder
// importarla en pruebas sin abrir un puerto.
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Contact Book API escuchando en http://localhost:${PORT}`);
});
