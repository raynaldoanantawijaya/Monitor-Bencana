const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const endpoints = [
    { name: 'Quake (Latest)', url: '/quake' },
    { name: 'Quake (Recent)', url: '/quake/recent' },
    { name: 'Tsunami Status', url: '/disaster/tsunami' },
    { name: 'Volcano Status', url: '/disaster/volcano' },
    { name: 'Flood Reports', url: '/disaster/flood' },
    { name: 'Weather (City)', url: '/weather/jawa-tengah/surakarta' },
    { name: 'Weather (Coords)', url: '/weather/coords/-7.57/110.82' }
];

async function testAll() {
    console.log("=== STARTING FULL SYSTEM TEST ===");
    console.log(`Target: ${BASE_URL}\n`);

    const results = await Promise.all(endpoints.map(async (ep) => {
        const start = Date.now();
        try {
            const res = await axios.get(`${BASE_URL}${ep.url}`);
            const duration = Date.now() - start;

            // Basic validation
            const isSuccess = res.status === 200 && res.data.success === true;
            const dataCount = Array.isArray(res.data.data) ? res.data.data.length : (res.data.data ? 1 : 0);

            return {
                name: ep.name,
                url: ep.url,
                status: res.status,
                success: isSuccess,
                records: dataCount,
                time: `${duration}ms`,
                error: null
            };
        } catch (e) {
            return {
                name: ep.name,
                url: ep.url,
                status: e.response ? e.response.status : 'ERR',
                success: false,
                records: 0,
                time: `${Date.now() - start}ms`,
                error: e.message
            };
        }
    }));

    console.table(results);
    console.log("\n=== TEST COMPLETE ===");
}

testAll();
