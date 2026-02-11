require('dotenv').config();
const app = require('express')();
const weatherRoute = require('./routes/weather');
const quakeRoute = require('./routes/quake');
const disasterRoute = require('./routes/disaster');
const responseCreator = require('./utils/responseCreator');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || '';

app.use(cors());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
  next();
});

app.use('/weather', weatherRoute);
app.use('/quake', quakeRoute);
app.use('/disaster', disasterRoute);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  return res.status(200).send({
    maintainer: 'Van Helsing',
    source: 'https://github.com/raynaldoanantawijaya/Monitor-Bencana',
    documentation: `${BASE_URL}/api-docs`,
    endpoint: {
      quake: `${BASE_URL}/quake`,
      weather: {
        province: {
          example: `${BASE_URL}/weather/jawa-barat`,
        },
        city: {
          example: `${BASE_URL}/weather/jawa-barat/bandung`,
        },
      },
    },
  });
});

app.all('*', (req, res) => {
  return res.status(404).send(responseCreator({ message: 'Not found' }));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
