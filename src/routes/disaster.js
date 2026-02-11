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

/**
 * @swagger
 * /disaster/volcano:
 *   get:
 *     summary: Get Volcano Activity List
 *     description: Scrapes MAGMA Indonesia for volcano status (Level I-IV). Returns static links if scraping fails.
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/volcano', controller.getVolcanoStatus);

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
router.get('/flood', controller.getFloodReports);

module.exports = router;
