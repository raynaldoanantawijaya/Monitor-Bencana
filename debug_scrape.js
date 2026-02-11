const axios = require('axios');

async function debugScraper() {
    console.log("=== Debugging PetaBencana Structure ===");

    try {
        const urlJK = 'https://data.petabencana.id/floods?admin=ID-JK&minimum_state=1&format=json';
        const res = await axios.get(urlJK);

        console.log("Status:", res.status);
        console.log("Data Keys:", Object.keys(res.data));

        if (res.data.result) {
            console.log("Result Keys:", Object.keys(res.data.result));
            console.log("Preview Result:", JSON.stringify(res.data.result).substring(0, 500));

            if (res.data.result.objects) {
                console.log("It looks like TopoJSON!");
                console.log("Objects keys:", Object.keys(res.data.result.objects));
            }
            if (res.data.result.features) {
                console.log("It looks like GeoJSON!");
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

debugScraper();
