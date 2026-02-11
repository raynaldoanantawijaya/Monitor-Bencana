# 🌦️ Monitor Bencana — Indonesia Disaster & Weather Monitoring REST API

> **Created & Maintained by Van Helsing**

REST API lengkap untuk pemantauan **cuaca**, **gempa bumi**, **kualitas udara**, **banjir**, dan **aktivitas vulkanik** di Indonesia. Dirancang untuk integrasi mudah ke website Karang Taruna, portal desa, dan aplikasi publik lainnya.

---

## ✨ Fitur Lengkap

### 🌡️ Prakiraan Cuaca (Open-Meteo)
- Suhu real-time & prakiraan 24 jam
- Kelembapan udara, kecepatan & arah angin
- Weather code untuk ikon cuaca
- Pencarian kota otomatis (Geocoding)

### 🌍 Gempa Bumi (BMKG)
- Data gempa terbaru (autogempa)
- Daftar gempa terkini (`/quake/recent`) — 15 gempa terakhir
- Gempa dirasakan (`/quake/felt`) — gempa yang dilaporkan masyarakat
- Shakemap image (peta intensitas guncangan)

### 💨 Kualitas Udara / Air Quality Index (AQI)
- **Data Satelit (Global)**: AQI, PM2.5, PM10 dari Open-Meteo (model CAMS)
- **Data Presisi (Ground Station)**: Data real-time dari Stasiun Solo Manahan (KLHK) untuk area Surakarta via WAQI API
- Indikator warna otomatis (Baik → Berbahaya)

### 🌊 Pemantauan Banjir (PetaBencana.id)
- Peta banjir real-time embedded
- Selector regional: Jakarta, Surakarta, Jawa Tengah, Semarang, dll.

### 🌋 Pemantauan Gunung Api (MAGMA Indonesia)
- Status aktivitas vulkanik terbaru embedded dari MAGMA ESDM

### 📍 Geolocation Support
- Endpoint khusus `/weather/coords/:lat/:lon` untuk integrasi "Lacak Lokasi Saya"
- Langsung pakai koordinat dari browser tanpa perlu cari nama kota

### 🛡️ Infrastruktur
- **CORS enabled** — siap diakses dari domain manapun
- **Caching** (Node-Cache) — mengurangi beban API upstream
- **Retry mechanism** — otomatis retry jika API sumber gagal
- **Swagger Documentation** — dokumentasi interaktif di `/api-docs`
- **Unit Testing** (Jest) — test otomatis untuk endpoint
- **Vercel-ready** — konfigurasi deploy satu klik

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/raynaldoanantawijaya/Monitor-Bencana.git

# Install dependencies
npm install

# Run server
npm start

# Run dev server (auto-reload)
npm run dev
```

Server berjalan di `http://localhost:3000`

---

## 📡 API Endpoints

### Gempa Bumi

| Endpoint | Deskripsi |
|---|---|
| `GET /quake` | Gempa terbaru (autogempa) + shakemap |
| `GET /quake/recent` | 15 gempa terkini |
| `GET /quake/felt` | Gempa yang dirasakan masyarakat |

### Cuaca & Kualitas Udara

| Endpoint | Deskripsi |
|---|---|
| `GET /weather/:province` | Prakiraan cuaca per provinsi |
| `GET /weather/:province/:city` | Cuaca + AQI untuk kota spesifik |
| `GET /weather/coords/:lat/:lon` | Cuaca + AQI berdasarkan koordinat GPS |

### Dokumentasi

| Endpoint | Deskripsi |
|---|---|
| `GET /api-docs` | Swagger UI (dokumentasi interaktif) |

---

## 📋 Contoh Response

### Cuaca per Kota (`/weather/jawa-tengah/surakarta`)

```json
{
  "success": true,
  "data": {
    "description": "Surakarta",
    "admin1": "Central Java",
    "coordinate": "110.83 -7.57",
    "current_weather": {
      "temperature": 28.5,
      "windspeed": 12.3,
      "winddirection": 180,
      "weathercode": 3
    },
    "hourly": {
      "time": ["2026-02-11T00:00", "..."],
      "temperature_2m": [25.1, "..."],
      "weathercode": [1, "..."]
    },
    "air_quality": {
      "pm10": [45, "..."],
      "pm2_5": [22, "..."],
      "us_aqi": [55, "..."]
    },
    "precision_aqi": {
      "source": "Monitor Station Solo Manahan (KLHK)",
      "aqi": 41,
      "pm2_5": 9.6,
      "pm10": 21.3,
      "time": "2026-02-11 09:00:00"
    }
  }
}
```

### Cuaca via Koordinat (`/weather/coords/-7.575/110.824`)

```json
{
  "success": true,
  "data": {
    "description": "Location (-7.575, 110.824)",
    "coordinate": "110.824 -7.575",
    "current_weather": { "..." },
    "hourly": { "..." },
    "air_quality": { "..." }
  }
}
```

### Gempa Terbaru (`/quake`)

```json
{
  "success": true,
  "data": {
    "tanggal": "11 Feb 2026",
    "jam": "12:00:34 WIB",
    "coordinates": "0.35,123.75",
    "magnitude": "5.3",
    "kedalaman": "185 km",
    "wilayah": "Pusat gempa berada di darat 26 km BaratDaya Bolaanguki",
    "potensi": "Gempa ini dirasakan untuk diteruskan pada masyarakat",
    "shakemap": "https://data.bmkg.go.id/DataMKG/TEWS/..."
  }
}
```

---

## 🔌 Integrasi ke Website (Contoh)

### Geolocation — "Lacak Lokasi Saya"

```javascript
navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const res = await fetch(`https://YOUR_API_URL/weather/coords/${latitude}/${longitude}`);
    const data = await res.json();
    
    // Tampilkan di UI
    document.getElementById('suhu').textContent = data.data.current_weather.temperature + '°C';
    document.getElementById('aqi').textContent = data.data.air_quality.us_aqi[0];
});
```

### Fetch Gempa Terkini

```javascript
const res = await fetch('https://YOUR_API_URL/quake/recent');
const gempa = await res.json();

gempa.data.forEach(g => {
    console.log(`M${g.magnitude} - ${g.wilayah}`);
});
```

---

## 📦 Sumber Data

| Data | Sumber | Tipe |
|---|---|---|
| Gempa Bumi | [BMKG Open Data](https://data.bmkg.go.id/) | XML → JSON |
| Prakiraan Cuaca | [Open-Meteo API](https://open-meteo.com/) | REST API |
| Kualitas Udara (Satelit) | [Open-Meteo Air Quality](https://open-meteo.com/) | REST API |
| Kualitas Udara (Presisi) | [WAQI / AQICN](https://waqi.info/) | REST API |
| Peta Banjir | [PetaBencana.id](https://petabencana.id/) | Embedded Map |
| Aktivitas Vulkanik | [MAGMA Indonesia](https://magma.esdm.go.id/) | Embedded Page |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js + Express.js
- **Data Sources**: BMKG, Open-Meteo, WAQI, PetaBencana, MAGMA
- **Caching**: Node-Cache
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Frontend**: HTML5 + Vanilla JS + Leaflet.js
- **Deployment**: Vercel-ready

---

## 📄 Lisensi

MIT License

---

> **Enhanced with ❤️ by Van Helsing**
> 
> *Dibuat untuk mendukung website Karang Taruna dan masyarakat Indonesia.*
