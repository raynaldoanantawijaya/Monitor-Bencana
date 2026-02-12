const { getQuakeData, getFloodData } = require('./disaster');
const { calculateDistance } = require('../utils/geo');
const { getWeather } = require('../utils/openMeteo');
const responseCreator = require('../utils/responseCreator');

const getNearbyDisasters = async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).send(responseCreator({ message: 'GPS coordinates (lat, lon) required.' }));
    }

    const userLat = parseFloat(lat);
    const userLon = parseFloat(lon);

    try {
        // 1. Fetch Data
        const [quake, flood] = await Promise.all([
            getQuakeData(),
            getFloodData()
        ]);

        const alerts = [];
        const distances = {};
        let status = 'SAFE'; // SAFE, WARNING, DANGER

        // 2. Process Earthquake
        // coordinates usually in "Lat,Lon" string like "-7.1, 110.2"
        const quakeCoords = quake.Coordinates.split(',');
        const quakeLat = parseFloat(quakeCoords[0]);
        const quakeLon = parseFloat(quakeCoords[1]);
        const quakeDist = calculateDistance(userLat, userLon, quakeLat, quakeLon);

        distances.nearest_quake = {
            distance_km: quakeDist,
            magnitude: quake.Magnitude,
            location: quake.Wilayah,
            time: `${quake.Tanggal} ${quake.Jam}`,
            // Enrichment
            depth: quake.Kedalaman,
            potential: quake.Potensi,
            shakemap: `https://data.bmkg.go.id/DataMKG/TEWS/${quake.Shakemap}`,
            coordinates: { lat: quakeLat, lon: quakeLon }
        };

        // If quake < 50km or Potensi Tsunami, Upgrade status
        if (quakeDist < 50) {
            status = 'DANGER';
            alerts.push(`GEMPA TERDEKAT: ${quake.Magnitude} SR berjarak ${quakeDist} km dari lokasi Anda!`);
        } else if (quakeDist < 200) {
            if (status !== 'DANGER') status = 'WARNING';
            alerts.push(`Gempa ${quake.Magnitude} SR terdeteksi ${quakeDist} km dari lokasi Anda.`);
        }

        // 3. Process Flood
        let nearestFlood = null;
        let minFloodDist = 99999;

        flood.allReports.forEach(report => {
            if (report.coordinates) {
                const dist = calculateDistance(userLat, userLon, report.coordinates.lat, report.coordinates.lon);

                if (dist < minFloodDist) {
                    minFloodDist = dist;
                    nearestFlood = { ...report, distance_km: dist };
                }

                if (dist < 5) { // 5km radius
                    status = 'DANGER';
                    alerts.push(`BANJIR: ${report.title} berjarak hanya ${dist} km dari Anda!`);
                } else if (dist < 15) {
                    if (status !== 'DANGER') status = 'WARNING';
                    alerts.push(`Waspada Banjir di ${report.location} (${dist} km dari Anda).`);
                }
            }
        });

        if (nearestFlood) {
            distances.nearest_flood = {
                distance_km: nearestFlood.distance_km,
                title: nearestFlood.title,
                status: nearestFlood.status,
                // Enrichment
                location: nearestFlood.location,
                height_desc: nearestFlood.height_desc,
                weather_support: nearestFlood.weather_support,
                image_url: nearestFlood.image_url,
                updated_at: nearestFlood.updated_at,
                coordinates: nearestFlood.coordinates
            };
        } else {
            distances.nearest_flood = null;
        }

        // 4. Fetch User Weather
        const userWeather = await getWeather(userLat, userLon);
        const currentWeather = userWeather.current_weather; // temp, windspeed, weathercode

        // Construct Response
        const responseData = {
            user_location: { lat: userLat, lon: userLon },
            safety_status: status,
            alerts: alerts.length > 0 ? alerts : ["Tidak ada ancaman bencana terdeteksi di sekitar Anda."],
            summary: {
                distances,
                weather: {
                    temperature: currentWeather.temperature,
                    windspeed: currentWeather.windspeed,
                    weathercode: currentWeather.weathercode,
                    // Enrichment: Add time/is_day
                    time: currentWeather.time,
                    is_day: currentWeather.is_day
                }
            }
        };

        return res.status(200).send(responseCreator({ data: responseData }));

    } catch (error) {
        console.error("Nearby Error:", error);
        return res.status(500).send(responseCreator({ message: 'Gagal melakukan kalkulasi jarak.' }));
    }
};

module.exports = { getNearbyDisasters };
