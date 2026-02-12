const router = require('express').Router();
const controller = require('../controllers/nearby');

/**
 * @swagger
 * /disaster/nearby:
 *   get:
 *     summary: Get Nearby Disaster Status (GPS)
 *     description: Calculates distance to nearest Earthquake and Flood based on user coordinates.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: User Latitude
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: User Longitude
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/nearby', controller.getNearbyDisasters);

module.exports = router;
