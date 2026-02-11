// Migration: Replaced BMKG XML source with Open-Meteo JSON source
const { searchCity, getWeather, getAirQuality } = require('../utils/openMeteo');
const { getStationAQI } = require('../utils/waqi');
const responseCreator = require('../utils/responseCreator');

const getByProvince = async (req, res) => {
  const { province } = req.params;

  try {
    const data = await getWeather(province);

    return res
      .status(200)
      .send(responseCreator({ data }));
  } catch (error) {
    console.error("Error in getByProvince:", error.message);

    if (error.response && error.response.status === 404) {
      return res.status(404).send(responseCreator({ message: 'Not found' }));
    }

    if (error.message.includes('Received HTML') || error.message.includes('timeout')) {
      return res.status(503).send(responseCreator({ message: 'Service Unavailable: Upstream BMKG API blocked the request or timed out.' }));
    }

    return res
      .status(500)
      .send(responseCreator({ message: 'Something went wrong' }));
  }
};

const getByCity = async (req, res) => {
  const { province, city } = req.params; // 'province' is kept for URL compatibility but unused by Open-Meteo

  try {
    // 1. Search for city coordinates (Geocoding)
    const cityLocation = await searchCity(city);

    if (!cityLocation) {
      return res.status(404).send(responseCreator({ message: `City '${city}' not found.` }));
    }

    // 2. Fetch Weather Data using coordinates
    const weatherData = await getWeather(cityLocation.latitude, cityLocation.longitude);

    // 3. Format Response (Open-Meteo structure)
    const formattedData = {
      id: cityLocation.id,
      description: cityLocation.name,
      admin1: cityLocation.admin1,
      coordinate: `${cityLocation.longitude} ${cityLocation.latitude}`,
      current_weather: weatherData.current_weather,
      hourly: {
        time: weatherData.hourly.time,
        temperature_2m: weatherData.hourly.temperature_2m,
        weathercode: weatherData.hourly.weathercode
      }
    };

    // 4. Fetch Air Quality (Optional, don't fail if this fails)
    const airQualityData = await getAirQuality(cityLocation.latitude, cityLocation.longitude);
    if (airQualityData && airQualityData.hourly) {
      formattedData.air_quality = {
        pm10: airQualityData.hourly.pm10,
        pm2_5: airQualityData.hourly.pm2_5,
        us_aqi: airQualityData.hourly.us_aqi,
        time: airQualityData.hourly.time
      };
    }

    // 5. Fetch Precision Air Quality (WAQI) for Surakarta only (or specific stations)
    // Station ID for Solo Manahan: A416908
    if (city.toLowerCase().includes('surakarta') || city.toLowerCase().includes('solo')) {
      const precisionAqi = await getStationAQI('A416908');
      if (precisionAqi) {
        formattedData.precision_aqi = {
          source: 'Monitor Station Solo Manahan (KLHK)',
          aqi: precisionAqi.aqi,
          pm2_5: precisionAqi.iaqi && precisionAqi.iaqi.pm25 ? precisionAqi.iaqi.pm25.v : '-',
          pm10: precisionAqi.iaqi && precisionAqi.iaqi.pm10 ? precisionAqi.iaqi.pm10.v : '-',
          time: precisionAqi.time ? precisionAqi.time.s : '-'
        };
      }
    }

    return res.status(200).send(responseCreator({ data: formattedData }));
  } catch (error) {
    console.error("Error in getByCity:", error.message);
    return res
      .status(500)
      .send(responseCreator({ data: 'Something went wrong with Open-Meteo integration.' }));
  }
};

const getByCoordinates = async (req, res) => {
  const { lat, lon } = req.params;

  try {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).send(responseCreator({ message: 'Invalid coordinates. Use numbers for lat and lon.' }));
    }

    // 1. Fetch Weather Data directly using coordinates
    const weatherData = await getWeather(latitude, longitude);

    // 2. Format Response
    const formattedData = {
      description: `Location (${latitude}, ${longitude})`,
      coordinate: `${longitude} ${latitude}`,
      current_weather: weatherData.current_weather,
      hourly: {
        time: weatherData.hourly.time,
        temperature_2m: weatherData.hourly.temperature_2m,
        weathercode: weatherData.hourly.weathercode
      }
    };

    // 3. Fetch Air Quality (Optional)
    const airQualityData = await getAirQuality(latitude, longitude);
    if (airQualityData && airQualityData.hourly) {
      formattedData.air_quality = {
        pm10: airQualityData.hourly.pm10,
        pm2_5: airQualityData.hourly.pm2_5,
        us_aqi: airQualityData.hourly.us_aqi,
        time: airQualityData.hourly.time
      };
    }

    return res.status(200).send(responseCreator({ data: formattedData }));
  } catch (error) {
    console.error("Error in getByCoordinates:", error.message);
    return res
      .status(500)
      .send(responseCreator({ data: 'Something went wrong fetching weather by coordinates.' }));
  }
};

module.exports = { getByProvince, getByCity, getByCoordinates };
