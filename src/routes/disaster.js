const router = require('express').Router();
const controller = require('../controllers/disaster');

/**
 * @swagger
 * /disaster/tsunami:
 *   get:
 *     summary: Get Tsunami Potential Status
 *     description: Returns WARNING if the latest earthquake has "Berpotensi Tsunami", otherwise NORMAL.
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/tsunami', controller.getTsunamiStatus);

// Volcano route removed

/**
 * @swagger
 * /disaster/flood:
 *   get:
 *     summary: Get Flood Report Links
 *     description: Returns a list of regional flood maps/reports from PetaBencana.id.
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/flood', (req, res, next) => {
    res.set('Cache-Control', 'no-store'); // Ensure realtime
    next();
}, controller.getFloodReports);

module.exports = router;
