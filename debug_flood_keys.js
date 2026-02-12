const axios = require('axios');

async function debugFlood() {
    console.log("=== Debugging Flood Properties (2) ===");
    try {
        const url = 'https://data.petabencana.id/floods?admin=ID-JK&minimum_state=1&format=json';
        const { data } = await axios.get(url);

        let features = [];
        if (data.result && data.result.features) features = data.result.features;
        else if (data.result && data.result.objects && data.result.objects.output && data.result.objects.output.geometries) {
            features = data.result.objects.output.geometries;
        }

        if (features.length > 0) {
            const p = features[0].properties;
            console.log("Keys available:", Object.keys(p));

            console.log("\n--- Specific Value Check ---");
            console.log("pkey:", p.pkey);
            console.log("created_at:", p.created_at);
            console.log("image_url:", p.image_url);
            console.log("title:", p.title);
            console.log("text:", p.text);

            // Location candidates
            console.log("name:", p.name);
            console.log("parent_name:", p.parent_name);
            console.log("district_id:", p.district_id);
            console.log("region_code:", p.region_code);

            // Height candidates
            console.log("tags:", JSON.stringify(p.tags));
            console.log("state:", p.state);
        } else {
            console.log("No features found.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

debugFlood();
