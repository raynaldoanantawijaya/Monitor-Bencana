const axios = require('axios');

async function testAPIs() {
    console.log("Testing APIs...");

    // 1. PetaBencana (Floods) - Test BBox
    try {
        console.log("\n1. Testing PetaBencana (BBox)...");
        // Indonesia BBox: 95.0,-11.0,141.0,6.0
        const res = await axios.get('https://data.petabencana.id/floods?bbox=95.0,-11.0,141.0,6.0');
        console.log("PetaBencana Success:", res.status);
        console.log(JSON.stringify(res.data, null, 2).substring(0, 500));
    } catch (error) {
        console.log("PetaBencana Failed:", error.message);
        if (error.response) console.log("Response:", error.response.status, error.response.data);
    }

    // 2. MAGMA (VONA)
    try {
        console.log("\n2. Testing MAGMA VONA...");
        const res = await axios.get('https://magma.esdm.go.id/v1/vona');
        console.log("MAGMA Success:", res.status);
        const isJSON = typeof res.data === 'object';
        if (isJSON) {
            console.log(JSON.stringify(res.data, null, 2).substring(0, 500));
        } else {
            console.log("Preview:", res.data.toString().substring(0, 500));
        }
    } catch (error) {
        console.log("MAGMA Failed:", error.message);
    }
}

testAPIs();
