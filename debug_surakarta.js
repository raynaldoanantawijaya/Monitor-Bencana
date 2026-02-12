const axios = require('axios');

async function debugSurakarta() {
    const codes = ['ID-JT-72', 'ID-SK', 'ID-JT-3372'];

    for (const code of codes) {
        try {
            console.log(`Testing ${code}...`);
            const url = `https://data.petabencana.id/floods?admin=${code}&minimum_state=1&format=json`;
            const { data } = await axios.get(url);
            console.log(`[${code}] Status: 200`);
            console.log(`[${code}] Result keys:`, Object.keys(data));
        } catch (e) {
            console.log(`[${code}] Failed: ${e.message}`);
        }
    }
}

debugSurakarta();
