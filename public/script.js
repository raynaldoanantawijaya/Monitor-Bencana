const BASE_URL = window.location.origin;

function changeFloodMap() {
    const region = document.getElementById('flood-region').value;
    const frame = document.getElementById('flood-frame');
    frame.src = `https://petabencana.id/map/${region}`;
}

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all tab buttons
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

    // Show selected tab content
    document.getElementById(`tab-${tabName}`).classList.add('active');
    // Activate selected tab button
    // Find the button that calls this function with this tabName (simple approximation)
    const tabs = document.querySelectorAll('.nav-tab');
    if (tabName === 'dashboard') tabs[0].classList.add('active');
    if (tabName === 'flood') tabs[1].classList.add('active');
    if (tabName === 'volcano') tabs[2].classList.add('active');

    // Resize map if dashboard is selected (Leaflet resize fix)
    if (tabName === 'dashboard' && window.quakeMap) {
        setTimeout(() => { window.quakeMap.invalidateSize(); }, 100);
    }
}

async function fetchQuake() {
    const container = document.getElementById('quake-info');
    const shakemapContainer = document.getElementById('shakemap-container');
    container.innerHTML = '<p>Loading...</p>';

    // Initialize map container if needed
    if (!window.quakeMap) {
        window.quakeMap = L.map('map').setView([-2.5, 118], 5); // Centers on Indonesia
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(window.quakeMap);
        window.quakeMarker = null;
    }

    try {
        const response = await fetch(`${BASE_URL}/quake`);
        const result = await response.json();

        if (result.success && result.data) {
            const data = result.data;
            container.innerHTML = `
                <div class="info-item"><strong>Waktu:</strong> ${data.tanggal}, ${data.jam}</div>
                <div class="info-item"><strong>Magnitudo:</strong> ${data.magnitude}</div>
                <div class="info-item"><strong>Kedalaman:</strong> ${data.kedalaman}</div>
                <div class="info-item"><strong>Lokasi:</strong> ${data.wilayah}</div>
                <div class="info-item"><strong>Potensi:</strong> ${data.potensi}</div>
            `;

            // Update Map
            if (data.coordinates) {
                const [lat, lon] = data.coordinates.split(',').map(Number);
                if (window.quakeMarker) window.quakeMap.removeLayer(window.quakeMarker);
                window.quakeMarker = L.marker([lat, lon]).addTo(window.quakeMap)
                    .bindPopup(`<b>Gempa M ${data.magnitude}</b><br>${data.wilayah}`).openPopup();
                window.quakeMap.setView([lat, lon], 7);
            }

            // Update Shakemap
            if (data.shakemap) {
                shakemapContainer.innerHTML = `<h3>Peta Guncangan (Shakemap)</h3><img src="https://data.bmkg.go.id/DataMKG/TEWS/${data.shakemap}" style="max-width: 100%; border-radius: 5px; border: 1px solid #ddd;">`;
            }
        } else {
            container.innerHTML = '<p class="error">Gagal memuat data gempa.</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}


async function fetchRecentQuakes() {
    const container = document.getElementById('recent-quake-list');
    try {
        const response = await fetch(`${BASE_URL}/quake/recent`);
        const result = await response.json();
        if (result.success && result.data) {
            let html = '<ul style="padding-left: 20px;">';
            result.data.forEach(q => {
                html += `<li><strong>${q.Tanggal} ${q.Jam}</strong>: M ${q.Magnitude} - ${q.Wilayah}</li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        }
    } catch (e) { container.innerHTML = 'Gagal memuat data.'; }
}

async function fetchFeltQuakes() {
    const container = document.getElementById('felt-quake-list');
    try {
        const response = await fetch(`${BASE_URL}/quake/felt`);
        const result = await response.json();
        if (result.success && result.data) {
            let html = '<ul style="padding-left: 20px;">';
            result.data.forEach(q => {
                html += `<li><strong>${q.Tanggal} ${q.Jam}</strong>: M ${q.Magnitude} - ${q.Wilayah} <br><small>Dirasakan: ${q.Dirasakan}</small></li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        }
    } catch (e) { container.innerHTML = 'Gagal memuat data.'; }
}

async function fetchWeather() {
    const province = document.getElementById('province-input').value.trim();
    const city = document.getElementById('city-input').value.trim();
    const container = document.getElementById('weather-result');

    if (!province || !city) {
        alert('Mohon isi provinsi dan kota!');
        return;
    }

    container.innerHTML = '<p>Loading weather data...</p>';

    try {
        const response = await fetch(`${BASE_URL}/weather/${province}/${city}`);
        const result = await response.json();

        if (result.success && result.data) {
            // Check if deprecated (empty data array with message)
            if (Array.isArray(result.data) && result.data.length === 0) {
                container.innerHTML = `<p class="error">${result.message}</p>`;
                return;
            }

            const data = result.data;
            let html = `<h3>Cuaca di ${data.description}, ${data.admin1 || ''}</h3>`;

            // Open-Meteo provides hourly arrays
            if (data.hourly && data.hourly.time) {
                // Show first 6 hours
                const times = data.hourly.time.slice(0, 6);

                html += '<div style="background: #f0f8ff; padding: 10px; border-radius: 5px;">';
                times.forEach((timeStr, index) => {
                    const temp = data.hourly.temperature_2m[index];
                    const wCode = data.hourly.weathercode[index];
                    const humidity = data.hourly.relativehumidity_2m ? data.hourly.relativehumidity_2m[index] : '-';
                    const windSpeed = data.hourly.windspeed_10m ? data.hourly.windspeed_10m[index] : '-';
                    const windDir = data.hourly.winddirection_10m ? data.hourly.winddirection_10m[index] : '-';

                    // Simple wCode mapping (WMO code)
                    let weatherDesc = 'Unknown';
                    if (wCode === 0) weatherDesc = 'Cerah';
                    else if (wCode === 1 || wCode === 2 || wCode === 3) weatherDesc = 'Berawan';
                    else if (wCode === 45 || wCode === 48) weatherDesc = 'Kabut';
                    else if (wCode >= 51 && wCode <= 67) weatherDesc = 'Gerimis / Hujan Ringan';
                    else if (wCode >= 71 && wCode <= 77) weatherDesc = 'Salju';
                    else if (wCode >= 80 && wCode <= 82) weatherDesc = 'Hujan Deras';
                    else if (wCode >= 95 && wCode <= 99) weatherDesc = 'Badai Petir';

                    // Format Time (ISO string from Open-Meteo: "2023-01-01T00:00")
                    const dateObj = new Date(timeStr);
                    const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                    html += `
                        <div class="weather-hour">
                            <span><strong>${formattedTime}</strong></span>
                            <span>
                                ${weatherDesc} | ${temp}°C <br>
                                <small style="color: #666;">
                                    💧 ${humidity}% | 💨 ${windSpeed} km/h (${windDir}°)
                                </small>
                            </span>
                        </div>
                    `;
                });
                html += '</div>';
            } else {
                html += '<p>Data cuaca tidak tersedia.</p>';
            }

            // Air Quality Data (Current Hour)
            if (result.data.air_quality) {
                const aq = result.data.air_quality;
                // Find index for current hour or closest
                const nowISO = new Date().toISOString().slice(0, 13); // "2023-01-01T15"
                const aqIndex = aq.time.findIndex(t => t.startsWith(nowISO));
                const finalIndex = aqIndex === -1 ? 0 : aqIndex;

                const currentAQI = aq.us_aqi ? aq.us_aqi[finalIndex] : '-';
                const currentPM25 = aq.pm2_5 ? aq.pm2_5[finalIndex] : '-';

                // Color Coding
                let aqiColor = '#2ecc71'; // Green
                let aqiText = 'Baik';
                if (currentAQI > 50) { aqiColor = '#f1c40f'; aqiText = 'Sedang'; }
                if (currentAQI > 100) { aqiColor = '#e67e22'; aqiText = 'Tidak Sehat (Sensitif)'; }
                if (currentAQI > 150) { aqiColor = '#e74c3c'; aqiText = 'Tidak Sehat'; }
                if (currentAQI > 200) { aqiColor = '#8e44ad'; aqiText = 'Sangat Tidak Sehat'; }
                if (currentAQI > 300) { aqiColor = '#7f0000'; aqiText = 'Berbahaya'; }

                html += `
                    <div style="margin-top: 15px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <h4 style="margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Kualitas Udara (Saat Ini)</h4>
                        
                        <!-- Satellite Data -->
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 0.8em; color: #888; margin-bottom: 5px;">SUMBER: SATELIT (Area Luas)</div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="text-align: center; background: ${aqiColor}; color: white; padding: 10px; border-radius: 5px; min-width: 80px;">
                                    <div style="font-size: 2em; font-weight: bold;">${currentAQI}</div>
                                    <div style="font-size: 0.8em;">US AQI</div>
                                </div>
                                <div style="flex-grow: 1; margin-left: 15px;">
                                    <div style="font-weight: bold; color: ${aqiColor}; font-size: 1.2em;">${aqiText}</div>
                                    <div style="color: #666; font-size: 0.9em; margin-top: 5px;">
                                        PM2.5: <strong>${currentPM25}</strong> µg/m³
                                    </div>
                                </div>
                            </div>
                        </div>
                `;

                // Precision Data (If Available)
                if (result.data.precision_aqi) {
                    const pAq = result.data.precision_aqi;

                    // Color Logic for Precision Data
                    let pColor = '#2ecc71';
                    let pText = 'Baik';
                    const pVal = pAq.aqi;
                    if (pVal > 50) { pColor = '#f1c40f'; pText = 'Sedang'; }
                    if (pVal > 100) { pColor = '#e67e22'; pText = 'Tidak Sehat (Sensitif)'; }
                    if (pVal > 150) { pColor = '#e74c3c'; pText = 'Tidak Sehat'; }
                    if (pVal > 200) { pColor = '#8e44ad'; pText = 'Sangat Tidak Sehat'; }
                    if (pVal > 300) { pColor = '#7f0000'; pText = 'Berbahaya'; }

                    html += `
                        <!-- Precision Data -->
                        <div style="border-top: 1px dashed #ddd; padding-top: 10px;">
                            <div style="font-size: 0.8em; color: #888; margin-bottom: 5px;">SUMBER: STASIUN MANAHAN (Alat Fisik)</div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="text-align: center; background: ${pColor}; color: white; padding: 10px; border-radius: 5px; min-width: 80px;">
                                    <div style="font-size: 2em; font-weight: bold;">${pVal}</div>
                                    <div style="font-size: 0.8em;">AQI</div>
                                </div>
                                <div style="flex-grow: 1; margin-left: 15px;">
                                    <div style="font-weight: bold; color: ${pColor}; font-size: 1.2em;">${pText}</div>
                                    <div style="color: #666; font-size: 0.9em; margin-top: 5px;">
                                        PM2.5: <strong>${pAq.pm2_5}</strong> | PM10: <strong>${pAq.pm10}</strong>
                                    </div>
                                    <div style="font-size: 0.7em; color: #999; margin-top: 3px;">
                                        Update: ${pAq.time}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                html += `</div>`; // Close card div
            }

            container.innerHTML = html;
        } else {
            container.innerHTML = `<p class="error">${result.message || 'Kota tidak ditemukan.'}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// Load quake on start
fetchQuake();
fetchRecentQuakes();
fetchFeltQuakes();
