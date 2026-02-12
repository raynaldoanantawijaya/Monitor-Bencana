const axios = require('axios');
// const cheerio = require('cheerio'); // Removed
const responseCreator = require('../utils/responseCreator');
const topojson = require('topojson-client');

// --- Helper Functions (Exported for Reuse) ---

const getQuakeData = async () => {
    try {
        const { data } = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
        return data.Infogempa.gempa;
    } catch (e) {
        throw new Error('BMKG API Error');
    }
};

const mapFloodLevel = (level) => {
    switch (parseInt(level)) {
        case 1: return "Hati-hati";
        case 2: return "Waspada";
        case 3: return "Siaga";
        case 4: return "Awas";
        default: return "Info";
    }
};

const mapFloodDepth = (level) => {
    switch (parseInt(level)) {
        case 1: return "10 - 70 cm";
        case 2: return "10 - 70 cm";
        case 3: return "71 - 150 cm";
        case 4: return "> 150 cm";
        default: return "Tidak ada data";
    }
};

// Weather Fetcher for Flood Context (Data Penopang)
const getLocalWeather = async (lat, lon) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&timezone=auto`;
        const { data } = await axios.get(url);
        return {
            temp: data.current.temperature_2m,
            precip: data.current.precipitation,
            code: data.current.weather_code
        };
    } catch (e) { return null; }
};

const mapWeatherCode = (code) => {
    if (code <= 3) return "Cerah/Berawan";
    if (code <= 48) return "Berkabut";
    if (code <= 67) return "Hujan Ringan/Sedang";
    if (code <= 77) return "Salju/Es";
    if (code <= 82) return "Hujan Lebat";
    if (code <= 99) return "Badai Petir";
    return "Tidak Diketahui";
};

// Reusable Flood Fetcher
const getFloodData = async () => {
    const regions = [
        { code: 'ID-JK', name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
        { code: 'ID-JB', name: 'Jawa Barat', lat: -6.9175, lon: 107.6191 },
        { code: 'ID-JT', name: 'Jawa Tengah', lat: -7.1510, lon: 110.1403 },
        { code: 'ID-JT-72', name: 'Kota Surakarta', lat: -7.571, lon: 110.823 },
        { code: 'ID-JI', name: 'Jawa Timur', lat: -7.5360, lon: 112.2384 },
        { code: 'ID-YO', name: 'Yogyakarta', lat: -7.7956, lon: 110.3695 },
        { code: 'ID-BT', name: 'Banten', lat: -6.4058, lon: 106.0640 }
    ];

    const allReports = [];
    const errors = [];

    // Fetch in parallel
    await Promise.all(regions.map(async (region) => {
        try {
            const url = `https://data.petabencana.id/floods?admin=${region.code}&minimum_state=1&format=json`;
            const { data } = await axios.get(url);

            // Handle PetaBencana Wrapper
            const topology = data.result ? data.result : data;

            let features = [];

            // Check for TopoJSON
            if (topology.type === 'Topology') {
                // Try to guess the object key if 'output' is missing
                let objKey = 'output';
                if (!topology.objects[objKey]) {
                    objKey = Object.keys(topology.objects)[0]; // Fallback to first key
                }

                if (objKey && topology.objects[objKey]) {
                    const fc = topojson.feature(topology, topology.objects[objKey]);
                    features = fc.features;
                } else {
                    // throw new Error(`TopoJSON objects empty or key mismatch. Keys: ${Object.keys(topology.objects)}`);
                    // Don't throw, just skip region
                }
            }
            else if (topology.type === 'FeatureCollection') {
                features = topology.features;
            }
            // Legacy/Fallback check if wrapper was bare but structure differed
            else if (data.result && data.result.features) {
                features = data.result.features;
            }

            // Extract useful info
            await Promise.all(features.map(async f => {
                const props = f.properties || {};

                let locationName = props.name || props.text || "Lokasi tidak spesifik";

                if (locationName === "Lokasi tidak spesifik") {
                    if (props.kelurahan) locationName = `Kel. ${props.kelurahan}`;
                    else if (props.RW_admin) locationName = `Zona RW ${props.RW_admin} (ID: ${props.pkey || props.area_id})`;
                    else if (props.area_id) locationName = `Area ID: ${props.area_id}`;
                }

                // Extract coordinates (Centroid approximation)
                let coords = null;
                if (f.geometry) {
                    let ring = [];
                    if (f.geometry.type === 'Polygon') ring = f.geometry.coordinates[0];
                    else if (f.geometry.type === 'MultiPolygon') ring = f.geometry.coordinates[0][0];

                    if (ring && ring.length > 0) {
                        coords = {
                            lat: ring[0][1], // Note: PetaBencana usually uses [lon, lat]
                            lon: ring[0][0]
                        };
                    }
                }

                // Support Data: Fetch Weather for this location
                let weatherSupport = "Data cuaca tidak tersedia";
                let weather = null;
                if (coords) {
                    weather = await getLocalWeather(coords.lat, coords.lon);
                } else {
                    weather = await getLocalWeather(region.lat, region.lon);
                }

                if (weather) {
                    weatherSupport = `${mapWeatherCode(weather.code)} (Suhu ${weather.temp}°C, Curah hujan ${weather.precip}mm)`;
                }

                allReports.push({
                    region: region.name,
                    title: props.title || `Laporan Banjir - ${locationName}`,
                    location: locationName,
                    status: mapFloodLevel(props.state),
                    height_desc: props.height ? `${props.height} cm` : (props.water_depth ? `${props.water_depth} cm` : mapFloodDepth(props.state)),
                    weather_support: weatherSupport, // NEW: Data Penopang
                    image_url: props.image_url || props.image || null, // NEW: Image
                    coordinates: coords,
                    updated_at: props.created_at || new Date().toISOString()
                });
            }));

        } catch (e) {
            console.error(`Error ${region.name}:`, e.message);
            errors.push(`${region.name}: ${e.message}`);
        }
    }));

    return { allReports, errors, regions: regions.map(r => r.name) };
};

// --- Controllers ---

const getTsunamiStatus = async (req, res) => {
    try {
        const gempa = await getQuakeData();
        const potensi = gempa.Potensi || "";
        const isTsunami = potensi.toLowerCase().includes('tsunami') && !potensi.toLowerCase().includes('tidak berpotensi');

        const data = {
            status: isTsunami ? 'WARNING' : 'NORMAL',
            description: potensi,
            gempa_terkait: {
                magnitude: gempa.Magnitude,
                wilayah: gempa.Wilayah,
                jam: gempa.Jam,
                tanggal: gempa.Tanggal,
                coordinates: gempa.Coordinates
            }
        };

        return res.status(200).send(responseCreator({ data }));
    } catch (error) {
        return res.status(500).send(responseCreator({ message: 'Gagal mengambil data Tsunami' }));
    }
};

const getFloodReports = async (req, res) => {
    const { allReports, errors, regions } = await getFloodData();

    if (allReports.length === 0) {
        return res.status(200).send(responseCreator({
            data: [],
            message: 'Tidak ada laporan banjir aktif saat ini.',
            errors: errors,
            meta: {
                scanned_regions: regions,
                total_reports: 0
            }
        }));
    }

    return res.status(200).send(responseCreator({
        data: allReports,
        meta: {
            scanned_regions: regions,
            total_reports: allReports.length,
            note: "Data ketinggian spesifik menggunakan estimasi dari status siaga jika laporan warga tidak tersedia. Data cuaca disertakan sebagai penopang."
        }
    }));
};

module.exports = {
    getTsunamiStatus,
    getFloodReports,
    // Exports for Nearby Controller
    getQuakeData,
    getFloodData
};
