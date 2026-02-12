const router = require('express').Router();
const controller = require('../controllers/weather');

/**
 * @swagger
 * /weather/coords/{lat}/{lon}:
 *   get:
 *     summary: Get weather by coordinates (Geolocation)
 *     description: Returns weather forecast and air quality for specific latitude/longitude coordinates. Ideal for browser geolocation integration.
 *     parameters:
 *       - in: path
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude (e.g., -7.575)
 *       - in: path
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude (e.g., 110.824)
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid coordinates
 */
router.get('/coords/:lat/:lon', controller.getByCoordinates);

// Province route removed

/**
 * @swagger
 * /weather/{province}/{city}:
 *   get:
 *     summary: Get weather forecast by city
 *     description: Returns weather forecast for a specific city using Open-Meteo.
 *     parameters:
 *       - in: path
 *         name: province
 *         required: true
 *         schema:
 *           type: string
 *         description: Province name (Ignored, keeping for compatibility)
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: City or Province not found
 */
router.get('/:province/:city', controller.getByCity);

module.exports = router;
