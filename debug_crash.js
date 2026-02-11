const fs = require('fs');
const xmlJs = require('xml-js');

let refactJsonWeather;
try {
    refactJsonWeather = require('./src/utils/refactJsonWeather');
    console.log("Module loaded successfully");
} catch (e) {
    console.error("Failed to load module:", e.message);
    process.exit(1);
}

try {
    const xmlData = fs.readFileSync('debug_data.xml', 'utf8');
    console.log("XML Read. Length:", xmlData.length);
    const weathers = xmlJs.xml2js(xmlData, { compact: true, spaces: 2 });
    console.log("XML Parsed. Roots:", Object.keys(weathers));

    console.log("Attempting to refactor JSON...");
    const result = refactJsonWeather(weathers);
    console.log("Success!");
} catch (error) {
    console.log("ERROR DETECTED");
    console.log("Message:", error.message);
    if (error.stack) console.log("Stack:", error.stack.split('\n')[0]);
}
