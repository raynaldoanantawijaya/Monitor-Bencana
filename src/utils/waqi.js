const axios = require('axios');

// WAQI API Token - Using 'demo' for specific stations like A416908 (Solo Manahan)
const TOKEN = 'demo';

const getStationAQI = async (stationId) => {
    try {
        // Example: https://api.waqi.info/feed/@A416908/?token=demo
        const url = `https://api.waqi.info/feed/@${stationId}/?token=${TOKEN}`;
        const response = await axios.get(url);

        if (response.data && response.data.status === 'ok') {
            return response.data.data;
        } else {
            console.warn('WAQI API returned non-ok status or empty data:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Error in getStationAQI:', error.message);
        return null;
    }
};

module.exports = { getStationAQI };
