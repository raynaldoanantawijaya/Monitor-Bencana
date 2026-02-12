const axios = require('axios');
const cheerio = require('cheerio');
const responseCreator = require('../utils/responseCreator');
const topojson = require('topojson-client');

// --- Helper Functions ---

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

const getVolcanoStatus = async (req, res) => {
    const fallback = [
        { name: 'Gunung Merapi', status: 'Cek Link', link: 'https://magma.esdm.go.id/v1/gunung-api/laporan/merapi' },
        { name: 'Gunung Semeru', status: 'Cek Link', link: 'https://magma.esdm.go.id/v1/gunung-api/laporan/semeru' },
        { name: 'Gunung Anak Krakatau', status: 'Cek Link', link: 'https://magma.esdm.go.id/v1/gunung-api/laporan/anak-krakatau' },
        { name: 'Gunung Sinabung', status: 'Cek Link', link: 'https://magma.esdm.go.id/v1/gunung-api/laporan/sinabung' }
    ];

    try {
        const { data } = await axios.get('https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas');
        const $ = cheerio.load(data);
        const volcanoes = [];

        $('div.col-md-3, div.col-sm-6').each((i, el) => {
            const text = $(el).text();
            if (text.includes('Level')) {
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                const name = lines[0] || "Unknown Volcano";
                const statusLine = lines.find(l => l.includes('Level')) || "Unknown Status";

                volcanoes.push({
                    name: name,
                    status: statusLine,
                    link: 'https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas'
                });
            }
        });

        if (volcanoes.length > 0) {
            return res.status(200).send(responseCreator({ data: volcanoes }));
        }

        return res.status(200).send(responseCreator({
            data: fallback,
            message: 'Data realtime tidak terbaca. Fallback link active.'
        }));

    } catch (e) {
        return res.status(200).send(responseCreator({
            data: fallback,
            message: 'Gagal mengambil data MAGMA.'
        }));
    }
};

const getFloodReports = async (req, res) => {
    const regions = [
        { code: 'ID-JK', name: 'Jakarta' },
        { code: 'ID-JB', name: 'Jawa Barat' },
        { code: 'ID-JT', name: 'Jawa Tengah' },
        { code: 'ID-JT-72', name: 'Kota Surakarta' }, // Added per request
        { code: 'ID-JI', name: 'Jawa Timur' },
        { code: 'ID-YO', name: 'Yogyakarta' },
        { code: 'ID-BT', name: 'Banten' }
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
                    throw new Error(`TopoJSON objects empty or key mismatch. Keys: ${Object.keys(topology.objects)}`);
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
            features.forEach(f => {
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
                            lat: ring[0][1],
                            lon: ring[0][0]
                        };
                    }
                }

                allReports.push({
                    region: region.name,
                    title: props.title || `Laporan Banjir - ${locationName}`,
                    location: locationName,
                    status: mapFloodLevel(props.state),
                    height_desc: props.height ? `${props.height} cm` : mapFloodDepth(props.state),
                    coordinates: coords,
                    updated_at: props.created_at || new Date().toISOString()
                });
            });

        } catch (e) {
            console.error(`Error ${region.name}:`, e.message);
            errors.push(`${region.name}: ${e.message}`);
        }
    }));

    if (allReports.length === 0) {
        return res.status(200).send(responseCreator({
            data: [],
            message: 'Tidak ada laporan banjir aktif saat ini.',
            errors: errors // EXPOSE ERRORS FOR DEBUGGING
        }));
    }

    return res.status(200).send(responseCreator({
        data: allReports,
        meta: {
            scanned_regions: regions.map(r => r.name),
            total_reports: allReports.length,
            note: "Nama lokasi menggunakan ID Area karena API PetaBencana tidak menyediakan nama Kelurahan secara publik."
        }
    }));
};

module.exports = { getTsunamiStatus, getVolcanoStatus, getFloodReports };
