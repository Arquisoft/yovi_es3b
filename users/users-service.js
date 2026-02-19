const express = require('express');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const {connectMongo} = require("./mongo") //con esto declaramos la dependencia
const User = require("./models/User")

const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

try {
  const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log(e);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
//Nos intentamos conectar a mongo
connectMongo().catch((e) => {
  console.error("[users] Mongo connection error:", e);
  process.exit(1);
});
//esto lo que hace basicamente es mostrarte todos los usuarios, es para verificar si funciona
app.get("/users", async (_req, res) => {
  const users = await User.find({}, { username: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(50);
  res.json(users);
});

app.post('/createuser', async (req, res) => {
  const username = req.body && req.body.username;
  try {
    // Simulate a 1 second delay to mimic processing/network latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await User.create({ username }); //creamos un documento para que se almacene en mongodb

    const message = `Hello ${username}! welcome to the course!`;
    res.json({ message });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


if (require.main === module) {
  app.listen(port,'0.0.0.0', () => {
    console.log(`User Service listening on port ${port}`)
  })
}

module.exports = app
