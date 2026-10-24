// Mide cuánto tarda cada petición. No puede medir "después de next()", porque
// next() regresa antes de que se envíe la respuesta; por eso escucha el evento
// 'finish', que Node emite cuando la respuesta ya salió completa.
const requestTimer = (req, res, next) => {
  const start = process.hrtime.bigint(); // reloj de alta precisión, en nanosegundos

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`[timer] ${req.method} ${req.originalUrl} → ${ms.toFixed(1)}ms`);
  });

  next(); // sin esto la petición se quedaría colgada aquí
};

module.exports = requestTimer;
