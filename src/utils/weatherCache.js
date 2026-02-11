const NodeCache = require('node-cache');
const axios = require('axios');
const xmlJs = require('xml-js');
const toUpperFirstLetterWords = require('./toUpperFirstLetterWords');
const refactJsonWeather = require('./refactJsonWeather');

const cache = new NodeCache({ stdTTL: 900 }); // Cache for 15 minutes

const getWeather = async (province) => {
    const cacheKey = `weather-${province}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache Hit] Serving weather data for ${province}`);
        return cachedData;
    }

    console.log(`[Cache Miss] Fetching weather data for ${province}`);

    const url = `https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-${toUpperFirstLetterWords(
        province
    )}.xml`;

    let attempts = 0;
    const maxAttempts = 3;
    let lastError;

    while (attempts < maxAttempts) {
        try {
            const result = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://data.bmkg.go.id/',
                    'Accept': 'application/xml, text/xml, */*; q=0.01',
                },
                timeout: 10000, // 10s timeout
            });

            if (typeof result.data === 'string' && result.data.trim().startsWith('<!DOCTYPE html>')) {
                throw new Error('Received HTML instead of XML (likely blocked)');
            }

            const weathers = xmlJs.xml2js(result.data, { compact: true, spaces: 2 });
            const refactoredJsonWeathers = refactJsonWeather(weathers);

            // Save to cache
            cache.set(cacheKey, refactoredJsonWeathers);
            console.log(`[Cache Set] Cached weather data for ${province}`);

            return refactoredJsonWeathers;
        } catch (error) {
            lastError = error;
            attempts++;
            console.error(`[Attempt ${attempts}/${maxAttempts}] Failed to fetch ${province}: ${error.message}`);
            // Wait before retry (simple backoff: 1s, 2s, 3s)
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
    }

    throw lastError;
};

module.exports = { getWeather };
