const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BMKG Data API (Unofficial)',
            version: '1.0.0',
            description: 'API for Indonesian Weather (per City/Province) and Earthquake data, sourced from BMKG Open Data.',
        },
        servers: [
            {
                url: process.env.BASE_URL || 'http://localhost:3000',
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Files containing annotations
};

const specs = swaggerJsDoc(options);
module.exports = specs;
