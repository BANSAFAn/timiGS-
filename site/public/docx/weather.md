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

## Weather Conditions

The module displays various weather conditions with appropriate icons and colors:

| Condition | Icon | Code Range |
|-----------|------|------------|
| Clear Sky | ☀️ | 0 |
| Partly Cloudy | ⛅ | 1-3 |
| Fog | 🌫️ | 45-48 |
| Drizzle/Rain | 🌧️ | 51-67 |
| Snow | ❄️ | 71-77 |
| Thunderstorm | ⚡ | 95+ |

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

### Incorrect Temperature

Make sure you've selected the correct temperature unit (°C or °F) in the Weather Settings.

## Tips for Best Experience

> [!TIP]
> **Enable Weather Tracking** - Keep the weather module enabled to automatically correlate weather conditions with your daily activity patterns.

> [!TIP]
> **Check History Details** - Click on any day in the Activity History to see a complete breakdown of all your app sessions for that day.

> [!NOTE]
> Weather data for historical days in the activity timeline is estimated based on forecast data and may not be 100% accurate for past dates.
