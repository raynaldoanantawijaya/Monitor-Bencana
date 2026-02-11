const axios = require('axios');
const cheerio = require('cheerio');
const responseCreator = require('../utils/responseCreator');

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
        { name: 'Gunung Sinabung', status: 'Cek Link', link: 'https://magma.esdm.go.id/v1/gunung-api/laporan/sinabung' },
        { name: 'Gunung Ili Lewotolok', status: 'Cek Link', link: 'https://magma.esdm.go.id/v1/gunung-api/laporan/ili-lewotolok' }
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
            message: 'Data realtime tidak terbaca (struktur web berubah). Menampilkan link resmi.'
        }));

    } catch (e) {
        return res.status(200).send(responseCreator({
            data: fallback,
            message: 'Gagal mengambil data MAGMA. Menampilkan link resmi.'
        }));
    }
};

const getFloodReports = async (req, res) => {
    const regions = [
        { code: 'ID-JK', name: 'Jakarta' },
        { code: 'ID-JB', name: 'Jawa Barat' },
        { code: 'ID-JT', name: 'Jawa Tengah' },
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

            // Logic to handle TopoJSON or GeoJSON structure
            let features = [];

            // Setup for GeoJSON
            if (data.result && data.result.features) {
                features = data.result.features;
            }
            // Setup for TopoJSON (common in PetaBencana)
            else if (data.result && data.result.objects && data.result.objects.output && data.result.objects.output.geometries) {
                features = data.result.objects.output.geometries;
            }

            // Extract useful info
            features.forEach(f => {
                const props = f.properties || {};
                // Filter out empty reports if needed, but 'minimum_state=1' implies some activity/report
                allReports.push({
                    region: region.name,
                    title: props.title || props.text || "Laporan Banjir",
                    location: props['Kelurahan/Village'] || props.rem_kelurahan_name || "Lokasi tidak spesifik",
                    status: mapFloodLevel(props.state),
                    height_desc: props.height || "Tidak ada data tinggi air",
                    updated_at: props.created_at || new Date().toISOString()
                });
            });

        } catch (e) {
            errors.push(`${region.name}: ${e.message}`);
        }
    }));

    // If no reports found at all
    if (allReports.length === 0) {
        return res.status(200).send(responseCreator({
            data: [],
            message: 'Tidak ada laporan banjir aktif saat ini di wilayah terpilih. (Atau sumber data tidak merespon).'
        }));
    }

    return res.status(200).send(responseCreator({
        data: allReports,
        meta: {
            scanned_regions: regions.map(r => r.name),
            total_reports: allReports.length
        }
    }));
};

module.exports = { getTsunamiStatus, getVolcanoStatus, getFloodReports };
