const axios = require('axios');

async function debugGeoJSON() {
    console.log("=== Debugging GeoJSON Structure ===");
    try {
        const url = 'https://data.petabencana.id/floods?admin=ID-JT&minimum_state=1&format=json';
        const { data } = await axios.get(url);

        console.log("Root Keys:", Object.keys(data));

        if (data.type === 'FeatureCollection') {
            console.log("It IS a FeatureCollection at root!");
            if (data.features.length > 0) {
                console.log("First Feature Props:", JSON.stringify(data.features[0].properties));
                console.log("Keys:", Object.keys(data.features[0].properties));
            }
        }
        else if (data.result) {
            console.log("Result Keys:", Object.keys(data.result));
            if (data.result.type === 'FeatureCollection') {
                console.log("FC inside result!");
                if (data.result.features.length > 0) {
                    console.log("First Feature Props:", JSON.stringify(data.result.features[0].properties));
                }
            }
        }

    } catch (e) {
        console.error(e.message);
    }
}

debugGeoJSON();
