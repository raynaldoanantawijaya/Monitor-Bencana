const request = require('supertest');
const app = require('../src/index');

describe('GET /weather/:province/:city', () => {
    it('should return 200 and weather data for a valid city', async () => {
        // Increase timeout for external API calls
        jest.setTimeout(30000);

        const res = await request(app).get('/weather/jawa-barat/bandung');

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('description', 'Bandung');
        expect(res.body.data).toHaveProperty('current_weather');
        expect(res.body.data).toHaveProperty('hourly');
    });

    it('should return 404 for invalid city', async () => {
        const res = await request(app).get('/weather/jawa-barat/invalid-city-name-xyz-123');
        expect(res.statusCode).toEqual(404);
    });
});
