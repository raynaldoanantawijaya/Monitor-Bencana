const axios = require('axios');

async function debugGeoformat() {
    console.log("=== Debugging geoformat Param ===");
    try {
        const url = 'https://data.petabencana.id/floods?admin=ID-JK&minimum_state=1&format=json&geoformat=geojson';
        const { data } = await axios.get(url);

        if (data.result && data.result.features) {
            const p = data.result.features[0].properties;
            console.log("Keys with geoformat:", JSON.stringify(Object.keys(p)));
            console.log("Values:", JSON.stringify(p));
        } else {
            console.log("Structure mismatch with geoformat"); // might trigger if it returns to TopoJSON default
        }

    } catch (e) {
        console.error(e.message);
    }
}

debugGeoformat();
