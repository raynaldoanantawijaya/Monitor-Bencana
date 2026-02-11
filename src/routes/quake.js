const router = require('express').Router();
const controller = require('../controllers/quake');

/**
 * @swagger
 * /quake:
 *   get:
 *     summary: Get latest earthquake data
 *     description: Returns the most recent earthquake data from BMKG.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   nullable: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tanggal:
 *                       type: string
 *                     jam:
 *                       type: string
 *                     datetime:
 *                       type: string
 *                     coordinates:
 *                       type: string
 *                     lintang:
 *                       type: string
 *                     bujur:
 *                       type: string
 *                     magnitude:
 *                       type: string
 *                     kedalaman:
 *                       type: string
 *                     wilayah:
 *                       type: string
 *                     potensi:
 *                       type: string
 *                     dirasakan:
 *                       type: string
 *                     shakemap:
 *                       type: string
 */
router.get('/', controller.get);

/**
 * @swagger
 * /quake/recent:
 *   get:
 *     summary: Get list of recent major earthquakes (M 5.0+)
 *     description: Returns a list of the last 15 significant earthquakes.
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/recent', controller.getRecent);

/**
 * @swagger
 * /quake/felt:
 *   get:
 *     summary: Get list of felt earthquakes
 *     description: Returns a list of the last 15 earthquakes felt by the public.
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/felt', controller.getFelt);

module.exports = router;
