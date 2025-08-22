const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Middleware para convertir IDs a números
server.use((req, res, next) => {
  // Interceptar POST requests
  if (req.method === 'POST') {
    // Asegurar que los datos numéricos sean números
    if (req.body) {
      if (req.body.price) req.body.price = Number(req.body.price);
      if (req.body.stock) req.body.stock = Number(req.body.stock);
      if (req.body.id) req.body.id = Number(req.body.id);
    }
  }

  // Interceptar PUT requests
  if (req.method === 'PUT') {
    if (req.body) {
      if (req.body.price) req.body.price = Number(req.body.price);
      if (req.body.stock) req.body.stock = Number(req.body.stock);
      if (req.body.id) req.body.id = Number(req.body.id);
    }
  }

  next();
});

// Middleware para transformar respuestas
server.use((req, res, next) => {
  // Interceptar respuestas GET
  const originalSend = res.send;
  res.send = function(data) {
    try {
      let jsonData = JSON.parse(data);

      // Si es un array de productos
      if (Array.isArray(jsonData)) {
        jsonData = jsonData.map(item => ({
          ...item,
          id: Number(item.id),
          price: Number(item.price),
          stock: Number(item.stock)
        }));
      }
      // Si es un solo producto
      else if (jsonData && jsonData.id) {
        jsonData = {
          ...jsonData,
          id: Number(jsonData.id),
          price: Number(jsonData.price),
          stock: Number(jsonData.stock)
        };
      }

      return originalSend.call(this, JSON.stringify(jsonData));
    } catch (e) {
      return originalSend.call(this, data);
    }
  };
  next();
});

server.use(middlewares);
server.use(router);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
  console.log('Numeric ID conversion enabled');
});
