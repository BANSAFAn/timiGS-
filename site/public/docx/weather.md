# Weather Module

The Weather module combines real-time weather data with your activity history, giving you insights into how weather conditions correlate with your productivity and app usage patterns.

## Overview

Track current weather conditions, view 5-day forecasts, and see your activity history enriched with weather data. All weather information is stored locally and integrated seamlessly with your activity tracking.

## Features

### 🌤️ Current Weather Display

Get real-time weather information for your location:
- **Temperature** - Current temperature with "feels like" calculation
- **Weather Conditions** - Clear visual representation with emoji icons
- **Humidity** - Current humidity percentage
- **Wind Speed** - Wind speed in km/h
- **Dynamic Backgrounds** - Beautiful gradient backgrounds that change based on weather conditions

### 📅 5-Day Forecast

View upcoming weather with detailed forecasts:
- Daily high and low temperatures
- Weather condition icons
- Visual temperature range bars
- Day-by-day breakdown

### 📊 Activity History Integration

See how weather affects your productivity:
- **7-Day Timeline** - View your activity history for the past week
- **Weather Correlation** - Each day shows the weather conditions alongside your app usage
- **Top Apps** - See which apps you used most on each day
- **Duration Tracking** - Total time spent on each application
- **Detailed Sessions** - Click any day to see a complete breakdown of all activity sessions

## Configuration

### Location Setup

1. Click the **Settings** icon (⚙️) in the Weather page header
2. Search for your city in the location search box
3. Select your location from the dropdown results
4. Your location is saved automatically

> [!TIP]
> The location search uses the Open-Meteo Geocoding API and supports cities worldwide. Try searching with different formats like "New York", "London, UK", or "Tokyo, Japan".

### 📍 Use My Location (Geolocation)

TimiGS supports automatic location detection via the **"Use My Location"** button:

1. Click **"📍 Use My Location"** in Weather Settings
2. A custom confirmation dialog asks you to allow location access
3. TimiGS attempts to detect your location automatically

**How Geolocation Works - Two-Stage Detection:**

```typescript
// Stage 1: Try browser's built-in GPS (navigator.geolocation)
navigator.geolocation.getCurrentPosition(
  async (position) => {
    // GPS success — use precise coordinates
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    // Reverse geocode to get city name via Open-Meteo
  },
  (error) => {
    // GPS failed — fall back to IP-based detection
    console.warn('Browser geolocation failed, using IP-based fallback');
    ipBasedGeolocation();
  },
  { enableHighAccuracy: true, timeout: 5000 }
);
```

```typescript
// Stage 2: IP-based fallback (when GPS is unavailable)
async function ipBasedGeolocation() {
  // Uses ip-api.com to determine approximate location from IP
  const res = await fetch(
    'http://ip-api.com/json/?fields=city,country,lat,lon,status,message'
  );
  const data = await res.json();
  // Sets city, country, latitude, longitude from IP data
}
```

> [!IMPORTANT]
> **Desktop (Tauri) limitation:** On Windows/macOS/Linux desktop apps, the browser-level GPS (`navigator.geolocation`) is typically blocked by the WebView2 engine. TimiGS automatically falls back to IP-based geolocation, which determines your approximate location from your internet connection.

> [!WARNING]
> **IP-based geolocation may not be precise.** Your ISP may route traffic through a different city, so the detected location might not match your actual position. For best accuracy, use the **Search Location** field to manually enter your city.

### Temperature Units

Choose between Celsius (°C) and Fahrenheit (°F):
- Open Weather Settings
- Click the **°C** or **°F** button
- Your preference is saved automatically

## Weather API Integration

TimiGS uses the **Open-Meteo API** for weather data:
- **Free and Open Source** - No API key required
- **Privacy-Focused** - No personal data collection
- **Accurate Data** - Reliable weather forecasts from multiple sources
- **Global Coverage** - Weather data for locations worldwide

### How It Works - Direct API Calls

> [!IMPORTANT]
> **Your browser connects directly to Open-Meteo API** - TimiGS does NOT act as a middleman. All weather requests go straight from your device to `api.open-meteo.com`. No data passes through TimiGS servers.

**Implementation Code:**

```typescript
// Weather.vue - Direct API call from browser
async function fetchWeather() {
  if (!config.latitude || !config.longitude) return;
  
  const unitParam = config.unit === 'F' ? 'fahrenheit' : 'celsius';
  
  // Direct fetch to Open-Meteo API - no intermediary
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${config.latitude}&` +
    `longitude=${config.longitude}&` +
    `current_weather=true&` +
    `daily=weathercode,temperature_2m_max,temperature_2m_min&` +
    `hourly=relativehumidity_2m&` +
    `timezone=auto&` +
    `temperature_unit=${unitParam}`
  );
  
  const data = await res.json();
  // Process and display data locally
}
```

**What this means:**
- ✅ Your browser makes the request directly
- ✅ Open-Meteo receives only coordinates (no personal info)
- ✅ TimiGS never sees or stores your weather data
- ✅ No tracking, no analytics, no data collection

### Data Sources

- **Current Weather** - Real-time conditions updated hourly
- **Hourly Forecasts** - Humidity and detailed conditions
- **Daily Forecasts** - 5-day outlook with high/low temperatures
- **Weather Codes** - WMO weather interpretation codes for accurate condition display

## Activity Tracking Integration

The Weather module integrates directly with TimiGS's core activity tracking system, enriching your activity timeline with weather context.

### How Activity Data Is Loaded

The module pulls activity data from the local SQLite database via the **activity store**:

```typescript
// Weather.vue - Loading 7-day activity history
async function loadHistory() {
  const days = 7;
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - days);

  // Fetch all sessions in the date range from SQLite
  const sessions = await activityStore.getActivityRange(fromStr, toStr);

  // Build per-day breakdown
  for (let i = 0; i < days; i++) {
    const daySessions = sessions.filter(s => 
      s.start_time.startsWith(dateStr)
    );

    // Aggregate duration per app
    const appMap: Record<string, number> = {};
    daySessions.forEach(s => {
      if (!appMap[s.app_name]) appMap[s.app_name] = 0;
      appMap[s.app_name] += s.duration_seconds;
    });

    // Sort by usage and display top 4 apps
    const sortedApps = Object.entries(appMap)
      .map(([name, duration]) => ({ name, duration }))
      .sort((a, b) => b.duration - a.duration);
    const topApps = sortedApps.slice(0, 4);
  }
}
```

### Activity Session Details

When you click on any day in the history timeline, a modal shows all individual sessions:

```typescript
// Fetch detailed sessions for a specific day
async function loadDaySessions(dateStr: string) {
  const sessions = await activityStore.getActivityRange(dateStr, dateStr);
  // Sort by most recent first
  selectedDaySessions.value = sessions.sort(
    (a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
  );
}
```

Each session includes:
- **App Name** - Which application was used
- **Start/End Time** - When the session occurred
- **Duration** - Total time in hours/minutes/seconds
- **Window Title** - The active window title (if available)
- **App Icon** - Extracted from the application's executable

### App Icon Loading

TimiGS extracts icons directly from application executables via Tauri's Rust backend:

```typescript
// Load app icon from exe path using Tauri invoke
async function loadIcon(appName: string) {
  const exePath = exePathMap.value[appName];
  if (!exePath) return;
  
  // Calls Rust backend to extract icon from .exe file
  const icon = await invoke<string | null>(
    'get_app_icon', 
    { path: exePath }
  );
  
  if (icon && icon.length > 0) {
    // Icon returned as base64-encoded PNG
    appIcons.value[appName] = `data:image/png;base64,${icon}`;
  }
}
```

## Weather Conditions

The module displays various weather conditions with appropriate icons and colors:

| Condition | Icon | Code Range | CSS Class |
|-----------|------|------------|-----------|
| Clear Sky | ☀️ | 0 | `weather-clear` |
| Partly Cloudy | ⛅ | 1-3 | `weather-cloudy` |
| Fog | 🌫️ | 45-48 | — |
| Drizzle/Rain | 🌧️ | 51-67 | `weather-rainy` |
| Snow | ❄️ | 71-77 | `weather-snowy` |
| Thunderstorm | ⚡ | 95+ | `weather-stormy` |

**Weather code mapping implementation:**

```typescript
function getWeatherDesc(code: number) {
  const codes: Record<number, string> = {
    0: 'Clear Sky',
    1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime Fog',
    51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
    61: 'Slight Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
    95: 'Thunderstorm'
  };
  return codes[code] || 'Unknown';
}
```

### Dynamic Visual Effects

The Weather card includes special visual effects based on conditions:
- **Snow particles** — Animated snowflake particles when weather code is 71-77
- **Gradient backgrounds** — Dynamic color schemes that shift based on current weather
- **Glowing icon effects** — Subtle glow behind the weather emoji

## Privacy & Data Storage

> [!IMPORTANT]
> All weather data is stored locally in your browser's localStorage. No weather information is sent to external servers except when fetching forecasts from Open-Meteo API.

**Implementation Code:**

```typescript
// Weather.vue - Local storage only
function saveConfig() {
  // Saves to browser localStorage - never sent to servers
  localStorage.setItem('weather_config', JSON.stringify(config));
}

function toggleWeather() {
  isEnabled.value = !isEnabled.value;
  // Again, only localStorage - no network requests
  localStorage.setItem('weather_enabled', isEnabled.value.toString());
}

// On app load - read from localStorage
onMounted(() => {
  const savedConfig = localStorage.getItem('weather_config');
  if (savedConfig) {
    Object.assign(config, JSON.parse(savedConfig));
  }
});
```

**What's Stored (Locally Only):**
- Selected location (city, country, coordinates)
- Temperature unit preference (C/F)
- Weather enabled/disabled state

**What's NOT Stored:**
- Your actual GPS location
- Weather history (fetched fresh each time)
- Personal identification data

**Storage Location:**
- Desktop: `%APPDATA%/timiGS/Local Storage`
- Web: Browser's localStorage (domain-specific)
- Mobile: App's local storage directory

## Architecture Overview

Here's how the Weather module connects with other TimiGS subsystems:

| Component | Role | Data Flow |
|-----------|------|-----------|
| `Weather.vue` | Main UI component | Renders weather + history |
| `activity store` | SQLite bridge | Provides `getActivityRange()` queries |
| `Open-Meteo API` | External weather | Returns current + forecast data |
| `ip-api.com` | IP geolocation fallback | Returns approximate lat/lon |
| `localStorage` | Config persistence | Saves user preferences |
| Rust backend (`get_app_icon`) | Icon extraction | Reads icons from `.exe` files |

## Troubleshooting

### Weather Not Loading

If weather data fails to load:
1. Check your internet connection
2. Verify your location is set correctly in Settings
3. Try selecting a different nearby city
4. Refresh the page

### Location Not Found

If your city doesn't appear in search results:
- Try searching with just the city name
- Add the country code (e.g., "Paris, FR")
- Use a larger nearby city
- Check spelling

### "Use My Location" Shows Wrong City

This happens because desktop apps use IP-based geolocation as a fallback:
- Your ISP may route traffic through a different city
- **Solution**: Use the **Search Location** field to manually enter your correct city
- This is a known limitation of IP-based detection and does not affect weather accuracy once the correct city is selected

### Incorrect Temperature

Make sure you've selected the correct temperature unit (°C or °F) in the Weather Settings.

## Tips for Best Experience

> [!TIP]
> **Use Search for Accuracy** - For the most accurate weather data, manually search and select your city rather than relying on automatic detection.

> [!TIP]
> **Enable Weather Tracking** - Keep the weather module enabled to automatically correlate weather conditions with your daily activity patterns.

> [!TIP]
> **Check History Details** - Click on any day in the Activity History to see a complete breakdown of all your app sessions for that day.

> [!NOTE]
> Weather data for historical days in the activity timeline is estimated based on forecast data and may not be 100% accurate for past dates.
