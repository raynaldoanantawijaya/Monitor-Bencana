const request = require('supertest');
const app = require('../src/index');

describe('GET /quake', () => {
    it('should return 200 and earthquake data', async () => {
        const res = await request(app).get('/quake');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('tanggal');
        expect(res.body.data).toHaveProperty('jam');
        expect(res.body.data).toHaveProperty('coordinates');
        expect(res.body.data).toHaveProperty('magnitude');
    });
});
