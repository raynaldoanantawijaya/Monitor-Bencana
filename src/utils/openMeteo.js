const axios = require('axios');

const searchCity = async (city) => {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`;
        const response = await axios.get(url);

        if (!response.data.results || response.data.results.length === 0) {
            return null;
        }

        return response.data.results[0]; // Returns { name, latitude, longitude, admin1, country, ... }
    } catch (error) {
        console.error('Error in searchCity:', error.message);
        throw error;
    }
};

const getWeather = async (lat, lon) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relativehumidity_2m,weathercode,windspeed_10m,winddirection_10m&current_weather=true&timezone=auto`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error in getWeather:', error.message);
        throw error;
    }
};

const getAirQuality = async (lat, lon) => {
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&timezone=auto`;
        // Note: Using 'current' for instant view, 'hourly' is also available but 'current' is easier for a simple card.
        // wait, let's check if 'current' is supported. The curl example used 'hourly'.
        // Let's stick to the curl example pattern but maybe just take the current hour.
        // Actually Open-Meteo has a 'current' parameter now for simple access.
        // Let's just use hourly to be safe as tested in curl, or try current? 
        // The curl command used: hourly=pm10,pm2_5,us_aqi
        // Let's use current=us_aqi,pm2_5,pm10 for simplicity if available. 
        // Docs say: "current=... parameter to get current weather conditions". 
        // Let's trust it supports standard params. 
        // Re-reading curl output from step 1293: it returned "hourly".
        // Let's stick to "hourly" to be 100% sure it works like my test.
        const urlHourly = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,us_aqi&timezone=auto`;
        const response = await axios.get(urlHourly);
        return response.data;
    } catch (error) {
        console.error('Error in getAirQuality:', error.message);
        return null;
    }
};

module.exports = { searchCity, getWeather, getAirQuality };
