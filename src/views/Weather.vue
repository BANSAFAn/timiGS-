<template>
  <div class="page weather-page">
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2>{{ $t("weather.title") || "Weather & History" }}</h2>
          <div class="location-pill" v-if="isEnabled && config.name">
            <span class="location-icon">📍</span>
            <span>{{ config.name }}, {{ config.country }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn glass-btn" @click="showSettings = true" title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <div class="toggle-pill" :class="{ active: isEnabled }" @click="toggleWeather">
            <span class="toggle-label">{{ isEnabled ? "On" : "Off" }}</span>
            <div class="toggle-switch">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hero Weather Card -->
      <div 
        class="hero-weather-card animate-enter" 
        :class="getWeatherClass(current.code)"
        v-if="isEnabled && current.temp !== null"
      >
        <div class="hero-bg-effects">
          <div class="hero-orb orb-1"></div>
          <div class="hero-orb orb-2"></div>
          <div class="hero-particles" v-if="current.code >= 71 && current.code <= 77">
            <span v-for="n in 20" :key="n" class="snow-particle"></span>
          </div>
        </div>
        
        <div class="hero-content">
          <div class="hero-main">
            <div class="weather-icon-large">
              <span class="icon-emoji">{{ getWeatherIcon(current.code) }}</span>
              <div class="icon-glow"></div>
            </div>
            <div class="temp-block">
              <div class="temp-value">
                <span class="temp-number">{{ Math.round(current.temp) }}</span>
                <span class="temp-unit">°{{ config.unit }}</span>
              </div>
              <div class="condition-text">{{ getWeatherDesc(current.code) }}</div>
            </div>
          </div>
          
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-icon">💧</div>
              <div class="stat-data">
                <span class="stat-value">{{ current.humidity }}%</span>
                <span class="stat-label">Humidity</span>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-icon">💨</div>
              <div class="stat-data">
                <span class="stat-value">{{ current.wind }}</span>
                <span class="stat-label">km/h Wind</span>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-icon">🌡️</div>
              <div class="stat-data">
                <span class="stat-value">{{ Math.round((current.temp || 0) - 2) }}°</span>
                <span class="stat-label">Feels Like</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div class="hero-weather-card loading-card animate-enter" v-else-if="isEnabled">
        <div class="loading-spinner"></div>
        <span>Loading Weather...</span>
      </div>

      <!-- 5-Day Forecast Section -->
      <div class="section-block animate-enter" style="animation-delay: 0.1s" v-if="isEnabled && forecast.length > 0">
        <div class="section-header">
          <h3 class="section-title">5-Day Forecast</h3>
        </div>
        
        <!-- Premium Forecast Cards -->
        <div class="forecast-list">
          <div 
            class="forecast-item" 
            v-for="(day, index) in forecast" 
            :key="day.date"
            :style="{ animationDelay: (index * 0.05) + 's' }"
          >
            <div class="forecast-item-left">
              <div class="forecast-day-name">{{ day.dayName }}</div>
              <div class="forecast-date">{{ formatDate(day.date) }}</div>
            </div>
            
            <div class="forecast-item-center">
              <div class="forecast-weather-icon" :class="getWeatherClass(day.code)">
                {{ getWeatherIcon(day.code) }}
              </div>
              <div class="forecast-condition">{{ getWeatherDesc(day.code) }}</div>
            </div>
            
            <div class="forecast-item-right">
              <div class="temp-range">
                <span class="temp-max">{{ Math.round(day.high) }}°</span>
                <div class="temp-bar-container">
                  <div 
                    class="temp-bar" 
                    :style="{ 
                      left: getTempBarPosition(day.low) + '%',
                      right: (100 - getTempBarPosition(day.high)) + '%'
                    }"
                  >
                    <div class="temp-bar-fill"></div>
                  </div>
                </div>
                <span class="temp-min">{{ Math.round(day.low) }}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Section -->
      <div class="section-block animate-enter" style="animation-delay: 0.2s">
        <div class="section-header">
          <h3 class="section-title">Activity History</h3>
        </div>
        
        <div class="history-timeline">
          <div class="timeline-line"></div>
          <div class="history-entry" v-for="entry in history" :key="entry.date" @click="openHistoryDetail(entry)">
            <div class="timeline-dot" :class="{ 'has-weather': isEnabled }">
              <span v-if="isEnabled">{{ getWeatherIcon(entry.weatherCode) }}</span>
              <span v-else>📅</span>
            </div>
            
            <div class="entry-card">
              <div class="entry-header">
                <div class="entry-date">
                  <span class="date-day">{{ entry.day }}</span>
                  <span class="date-month">{{ entry.month }}</span>
                </div>
                <div class="entry-weather" v-if="isEnabled">
                  {{ Math.round(entry.temp) }}°{{ config.unit }}
                </div>
              </div>
              
              <div class="entry-apps" v-if="entry.apps.length > 0">
                <div 
                  class="app-group" 
                  v-for="app in entry.apps" 
                  :key="app.name"
                >
                  <div 
                    class="app-icon" 
                    :style="{ background: appIcons[app.name] ? 'transparent' : stringToColor(app.name) }"
                    :title="app.name"
                  >
                    <img v-if="appIcons[app.name]" :src="appIcons[app.name]" class="real-icon" />
                    <span v-else>{{ app.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <span class="app-duration">{{ formatDuration(app.duration) }}</span>
                </div>
                <div class="more-badge" v-if="entry.moreCount > 0">+{{ entry.moreCount }}</div>
              </div>
              <div class="no-activity-text" v-else>
                No activity recorded
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showSettings" @click.self="showSettings = false">
        <div class="modal-card" @click.stop>
          <div class="modal-header">
            <h3>Weather Settings</h3>
            <button class="modal-close" @click="showSettings = false">×</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>Search Location</label>
              <div class="search-wrapper">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  class="form-input" 
                  placeholder="e.g. Kyiv, Berlin, Tokyo"
                  @input="onSearchInput"
                >
                <div v-if="isSearching" class="input-spinner"></div>
                
                <div class="search-dropdown" v-if="searchResults.length > 0">
                  <div 
                    class="dropdown-item" 
                    v-for="result in searchResults" 
                    :key="result.id"
                    @click="selectLocation(result)"
                  >
                    <span class="item-flag">{{ getFlagEmoji(result.country_code) }}</span>
                    <span class="item-name">{{ result.name }}</span>
                    <span class="item-region">{{ result.admin1 ? result.admin1 + ', ' : '' }}{{ result.country }}</span>
                  </div>
                </div>
              </div>
              
              <div class="no-results-hint" v-if="searchQuery.length >= 2 && !isSearching && searchResults.length === 0">
                No locations found
              </div>
            </div>

            <div class="form-group">
              <button class="btn-geolocation" @click="showGeoPrompt = true" :disabled="isGeolocating">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                </svg>
                {{ isGeolocating ? 'Detecting...' : '📍 Use My Location' }}
              </button>
              <p class="geo-hint" v-if="geoError">{{ geoError }}</p>
            </div>

            <div class="current-location" v-if="config.name">
              <label>Current Location</label>
              <div class="location-value">📍 {{ config.name }}, {{ config.country }}</div>
            </div>
            
            <div class="form-group">
              <label>Temperature Unit</label>
              <div class="unit-toggle">
                <button 
                  class="unit-btn" 
                  :class="{ active: config.unit === 'C' }"
                  @click="updateUnit('C')"
                >°C</button>
                <button 
                  class="unit-btn" 
                  :class="{ active: config.unit === 'F' }"
                  @click="updateUnit('F')"
                >°F</button>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn-primary" @click="showSettings = false">Done</button>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- History Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
        <div class="modal-card detail-modal">
          <div class="modal-header">
            <div class="header-left">
              <h3>{{ selectedDayEntry?.month }} {{ selectedDayEntry?.day }}</h3>
              <span class="text-muted">Daily Activity Log</span>
            </div>
            <button class="modal-close" @click="showDetailModal = false">×</button>
          </div>
          
          <div class="modal-body custom-scrollbar">
             <div class="sessions-list">
               <div v-if="selectedDaySessions.length === 0" class="no-activity">
                 No detailed activity found for this day.
               </div>
               <div v-for="(session, index) in selectedDaySessions" :key="index" class="session-item">
                  <div class="session-time">
                    {{ new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
                  </div>
                  <div class="session-timeline-line"></div>
                  <div class="session-content">
                    <div class="app-icon-large" :style="{ background: appIcons[session.app_name] ? 'transparent' : stringToColor(session.app_name) }">
                       <img v-if="appIcons[session.app_name]" :src="appIcons[session.app_name]" />
                       <span v-else>{{ session.app_name.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="session-info">
                       <div class="session-app-name">{{ session.app_name }}</div>
                       <div class="session-duration">{{ formatDuration(session.duration_seconds) }}</div>
                       <div class="session-window text-muted sm" v-if="session.window_title">{{ session.window_title }}</div>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Geolocation Pre-Prompt Modal -->
    <Teleport to="body">
      <div v-if="showGeoPrompt" class="geo-modal-overlay" @click.self="showGeoPrompt = false">
        <div class="geo-modal animate-geo-enter">
          <div class="geo-modal-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
          </div>
          <h3 class="geo-modal-title">Allow Location Access</h3>
          <p class="geo-modal-desc">TimiGS would like to use your location to automatically detect your city and show local weather data.</p>
          <div class="geo-modal-info">
            <div class="geo-info-item">
              <span class="geo-info-icon">🛡️</span>
              <span>Your location is never stored on any server</span>
            </div>
            <div class="geo-info-item">
              <span class="geo-info-icon">🌍</span>
              <span>Used only to find your city name</span>
            </div>
          </div>
          <div class="geo-modal-actions">
            <button class="geo-btn geo-btn-cancel" @click="showGeoPrompt = false">Cancel</button>
            <button class="geo-btn geo-btn-allow" @click="confirmLocation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
              Allow
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { invoke } from '@tauri-apps/api/core';

// Geolocation state
const isGeolocating = ref(false);
const geoError = ref('');
const showGeoPrompt = ref(false);

function confirmLocation() {
  showGeoPrompt.value = false;
  useMyLocation();
}

async function useMyLocation() {
  isGeolocating.value = true;
  geoError.value = '';

  if (!navigator.geolocation) {
    // No browser geolocation — go straight to IP-based
    console.warn('navigator.geolocation not available, using IP-based fallback');
    await ipBasedGeolocation();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        // Reverse geocode to get city name
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}&count=1&format=json`);
        const data = await res.json();

        // Fallback: use coordinates directly
        config.latitude = lat;
        config.longitude = lon;

        if (data.results && data.results.length > 0) {
          config.name = data.results[0].name;
          config.country = data.results[0].country;
        } else {
          // If reverse geocode fails, try nearby search
          const res2 = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
          const data2 = await res2.json();
          config.name = data2.address?.city || data2.address?.town || data2.address?.village || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
          config.country = data2.address?.country || '';
        }

        saveConfig();
        fetchWeather();
        searchQuery.value = '';
        searchResults.value = [];
      } catch (e) {
        geoError.value = 'Failed to detect location name';
        // Still set coordinates so weather works
        config.latitude = lat;
        config.longitude = lon;
        config.name = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        config.country = '';
        saveConfig();
        fetchWeather();
      } finally {
        isGeolocating.value = false;
      }
    },
    (error) => {
      // Browser geolocation failed (common in Tauri WebView2) — fall back to IP-based
      console.warn('Browser geolocation failed, using IP-based fallback:', error.message);
      ipBasedGeolocation();
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

async function ipBasedGeolocation() {
  try {
    const res = await fetch('http://ip-api.com/json/?fields=city,country,lat,lon,status,message');
    const data = await res.json();

    if (data.status === 'fail') {
      geoError.value = 'Failed to detect location';
      isGeolocating.value = false;
      return;
    }

    config.latitude = data.lat;
    config.longitude = data.lon;
    config.name = data.city || `${data.lat.toFixed(2)}, ${data.lon.toFixed(2)}`;
    config.country = data.country || '';

    saveConfig();
    fetchWeather();
    searchQuery.value = '';
    searchResults.value = [];
  } catch (e) {
    geoError.value = 'Failed to detect location';
    console.error('IP-based geolocation failed:', e);
  } finally {
    isGeolocating.value = false;
  }
}

const isEnabled = ref(true);
const showSettings = ref(false);

// --- Forecast Helpers ---
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTempBarPosition(temp: number) {
  // Map temp from range -10 to 40 roughly to 0-100%
  const min = -15;
  const max = 40;
  const clamped = Math.max(min, Math.min(max, temp));
  return ((clamped - min) / (max - min)) * 100;
}

function getWeatherClass(code: number) {
  if (code === 0) return 'weather-clear';
  if (code >= 1 && code <= 3) return 'weather-cloudy';
  if (code >= 51 && code <= 67) return 'weather-rainy';
  if (code >= 71 && code <= 77) return 'weather-snowy';
  if (code >= 95) return 'weather-stormy';
  return '';
}

interface WeatherConfig {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  unit: 'C' | 'F';
}

const config = reactive<WeatherConfig>({
  name: 'New York',
  country: 'USA',
  latitude: 40.7128,
  longitude: -74.0060,
  unit: 'C'
});

// --- Search Logic ---
const searchQuery = ref("");
const isSearching = ref(false);
const searchResults = ref<any[]>([]);
let searchTimeout: any = null;

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  
  isSearching.value = true;
  searchTimeout = setTimeout(async () => {
    try {
       const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery.value)}&count=10&format=json`);
       const data = await res.json();
       searchResults.value = data.results || [];
    } catch(e) {
       console.error(e);
    } finally {
       isSearching.value = false;
    }
  }, 500);
}

function selectLocation(result: any) {
   config.name = result.name;
   config.country = result.country;
   config.latitude = result.latitude;
   config.longitude = result.longitude;
   
   searchQuery.value = "";
   searchResults.value = [];
   saveConfig();
   fetchWeather();
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// --- Weather Data ---
interface CurrentWeather {
  temp: number | null;
  code: number;
  description: string;
  humidity: number;
  wind: number;
}

const current = ref<CurrentWeather>({
  temp: null,
  code: 0,
  description: "",
  humidity: 0,
  wind: 0
});

const forecast = ref<any[]>([]);

async function fetchWeather() {
   if (!config.latitude || !config.longitude) return;
   
   const unitParam = config.unit === 'F' ? 'fahrenheit' : 'celsius';
   
   try {
     const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=relativehumidity_2m&timezone=auto&temperature_unit=${unitParam}`);
     const data = await res.json();
     
     if (data.current_weather) {
        // Get humidity from hourly data (current hour)
        const currentHour = new Date().getHours();
        const humidity = data.hourly?.relativehumidity_2m?.[currentHour] || 50;
        
        current.value = {
          temp: data.current_weather.temperature,
          code: data.current_weather.weathercode,
          description: getWeatherDesc(data.current_weather.weathercode),
          humidity: humidity,
          wind: Math.round(data.current_weather.windspeed)
        };
     }
     
     if (data.daily) {
        forecast.value = data.daily.time.slice(1, 6).map((time: string, index: number) => {
           const date = new Date(time);
           const dayName = new Date().getDate() + 1 === date.getDate() ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
           
           return {
              date: time,
              dayName,
              code: data.daily.weathercode[index+1],
              high: data.daily.temperature_2m_max[index+1],
              low: data.daily.temperature_2m_min[index+1]
           };
        });
     }
     
   } catch (e) {
     console.error("Failed to fetch weather", e);
   }
}

function updateUnit(u: 'C' | 'F') {
   config.unit = u;
   saveConfig();
   fetchWeather();
}

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

function getWeatherIcon(code: number) {
   if (code === 0) return '☀️';
   if (code >= 1 && code <= 3) return '⛅';
   if (code >= 45 && code <= 48) return '🌫️';
   if (code >= 51 && code <= 67) return '🌧️';
   if (code >= 71 && code <= 77) return '❄️';
   if (code >= 95) return '⚡';
   return '🌥️';
}

// --- History ---
interface AppUsage {
   name: string;
   duration: number;
}

interface HistoryEntry {
   date: string;
   day: string;
   month: string;
   weatherCode: number;
   temp: number; 
   apps: AppUsage[];
   moreCount: number;
}

const history = ref<HistoryEntry[]>([]);

function saveConfig() {
  localStorage.setItem('weather_config', JSON.stringify(config));
}

function toggleWeather() {
   isEnabled.value = !isEnabled.value;
   localStorage.setItem('weather_enabled', isEnabled.value.toString());
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${seconds}s`;
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 65%, 45%)`;
}

import { useActivityStore } from '../stores/activity';
const activityStore = useActivityStore();

const appIcons = ref<Record<string, string>>({});
const exePathMap = ref<Record<string, string>>({}); // app_name -> exe_path mapping

async function loadIcon(appName: string) {
  if (appIcons.value[appName]) return;
  const exePath = exePathMap.value[appName];
  if (!exePath) return;
  try {
     const icon = await invoke<string | null>('get_app_icon', { path: exePath });
     if (icon && icon.length > 0) {
        appIcons.value[appName] = `data:image/png;base64,${icon}`;
     }
  } catch (e) {
     // Silent fail
  }
}

// History Detail State
const showDetailModal = ref(false);
const selectedDayEntry = ref<HistoryEntry | null>(null);
const selectedDaySessions = ref<any[]>([]);

function openHistoryDetail(entry: HistoryEntry) {
  selectedDayEntry.value = entry;
  showDetailModal.value = true;
  // We need to re-fetch or filter sessions for this day if we stored them?
  // We didn't store raw sessions in history entry yet. Let's fix that.
  loadDaySessions(entry.date);
}

async function loadDaySessions(dateStr: string) {
  const sessions = await activityStore.getActivityRange(dateStr, dateStr);
  selectedDaySessions.value = sessions.sort((a, b) => new Date(b.end_time || b.start_time).getTime() - new Date(a.end_time || a.start_time).getTime());
  
  // Load icons for these sessions too
  sessions.forEach(s => loadIcon(s.app_name));
}

async function loadHistory() {
   const days = 7;
   const today = new Date();
   const pastDate = new Date(today);
   pastDate.setDate(today.getDate() - days);

   const getLocalDateStr = (d: Date) => {
       const year = d.getFullYear();
       const month = String(d.getMonth() + 1).padStart(2, '0');
       const day = String(d.getDate()).padStart(2, '0');
       return `${year}-${month}-${day}`;
   };

   const toStr = getLocalDateStr(today);
   const fromStr = getLocalDateStr(pastDate);

   const sessions = await activityStore.getActivityRange(fromStr, toStr);
   const newHistory: HistoryEntry[] = [];

   // Build exe_path map from sessions
   sessions.forEach(s => {
     if (s.exe_path && !exePathMap.value[s.app_name]) {
       exePathMap.value[s.app_name] = s.exe_path;
     }
   });

   for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getLocalDateStr(date);

      const daySessions = sessions.filter(s => s.start_time.startsWith(dateStr));

      const appMap: Record<string, number> = {};
      daySessions.forEach(s => {
          if (!appMap[s.app_name]) appMap[s.app_name] = 0;
          appMap[s.app_name] += s.duration_seconds;
      });

      const sortedApps = Object.entries(appMap)
         .map(([name, duration]) => ({ name, duration }))
         .sort((a, b) => b.duration - a.duration);

      const topApps = sortedApps.slice(0, 4);
      const moreCount = Math.max(0, sortedApps.length - 4);
      
      // Load icons (now using exe_path from map)
      topApps.forEach(app => loadIcon(app.name));

      const forecastDay = forecast.value.find(d => d.date === dateStr);
      let weatherCode = forecastDay ? forecastDay.code : (Math.random() > 0.5 ? 1 : 2); 
      let temp = forecastDay ? forecastDay.high : (15 + Math.floor(Math.random() * 10) - (i*2));

      newHistory.push({
         date: dateStr,
         day: date.getDate().toString(),
         month: date.toLocaleString('default', { month: 'short' }),
         weatherCode: weatherCode,
         temp: temp,
         apps: topApps,
         moreCount: moreCount
      });
   }
   history.value = newHistory;
}

onMounted(() => {
   const savedConfig = localStorage.getItem('weather_config');
   if (savedConfig) {
     Object.assign(config, JSON.parse(savedConfig));
   }
   
   const savedEnabled = localStorage.getItem('weather_enabled');
   if (savedEnabled !== null) {
      isEnabled.value = savedEnabled === 'true';
   }
   
   fetchWeather();
   loadHistory();
});
</script>

<style scoped>
.weather-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left h2 {
  margin-bottom: 8px;
}

.location-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.08);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.glass-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s;
}

.glass-btn:hover {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.2);
}

.toggle-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.06);
  padding: 8px 14px;
  border-radius: 24px;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s;
}

.toggle-pill.active {
  background: rgba(99,102,241,0.15);
  border-color: rgba(99,102,241,0.3);
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.toggle-switch {
  width: 40px;
  height: 22px;
  background: rgba(255,255,255,0.15);
  border-radius: 11px;
  position: relative;
  transition: all 0.3s;
}

.toggle-pill.active .toggle-switch {
  background: var(--color-primary);
}

.toggle-thumb {
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.toggle-pill.active .toggle-thumb {
  left: 20px;
}

/* Hero Weather Card */
.hero-weather-card {
  position: relative;
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 32px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15));
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
}

.hero-weather-card.weather-clear {
  background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15));
}

.hero-weather-card.weather-cloudy {
  background: linear-gradient(135deg, rgba(148,163,184,0.2), rgba(100,116,139,0.15));
}

.hero-weather-card.weather-rainy {
  background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15));
}

.hero-weather-card.weather-snowy {
  background: linear-gradient(135deg, rgba(186,230,253,0.25), rgba(147,197,253,0.2));
}

.hero-weather-card.weather-stormy {
  background: linear-gradient(135deg, rgba(75,85,99,0.3), rgba(55,65,81,0.25));
}

.hero-bg-effects {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
}

.orb-1 {
  width: 200px;
  height: 200px;
  background: rgba(99,102,241,0.4);
  top: -50px;
  right: -50px;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  width: 150px;
  height: 150px;
  background: rgba(236,72,153,0.3);
  bottom: -30px;
  left: 20%;
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -20px); }
}

.hero-particles {
  position: absolute;
  inset: 0;
}

.snow-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  animation: snowfall 3s linear infinite;
}

.snow-particle:nth-child(odd) { animation-duration: 4s; }
.snow-particle:nth-child(3n) { animation-duration: 5s; width: 4px; height: 4px; }

@keyframes snowfall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
}

.snow-particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.snow-particle:nth-child(2) { left: 20%; animation-delay: 0.3s; }
.snow-particle:nth-child(3) { left: 30%; animation-delay: 0.6s; }
.snow-particle:nth-child(4) { left: 40%; animation-delay: 0.9s; }
.snow-particle:nth-child(5) { left: 50%; animation-delay: 1.2s; }
.snow-particle:nth-child(6) { left: 60%; animation-delay: 0.2s; }
.snow-particle:nth-child(7) { left: 70%; animation-delay: 0.5s; }
.snow-particle:nth-child(8) { left: 80%; animation-delay: 0.8s; }
.snow-particle:nth-child(9) { left: 90%; animation-delay: 1.1s; }
.snow-particle:nth-child(10) { left: 5%; animation-delay: 1.4s; }
.snow-particle:nth-child(11) { left: 15%; animation-delay: 0.15s; }
.snow-particle:nth-child(12) { left: 25%; animation-delay: 0.45s; }
.snow-particle:nth-child(13) { left: 35%; animation-delay: 0.75s; }
.snow-particle:nth-child(14) { left: 45%; animation-delay: 1.05s; }
.snow-particle:nth-child(15) { left: 55%; animation-delay: 0.1s; }
.snow-particle:nth-child(16) { left: 65%; animation-delay: 0.4s; }
.snow-particle:nth-child(17) { left: 75%; animation-delay: 0.7s; }
.snow-particle:nth-child(18) { left: 85%; animation-delay: 1.0s; }
.snow-particle:nth-child(19) { left: 95%; animation-delay: 1.3s; }
.snow-particle:nth-child(20) { left: 50%; animation-delay: 0.25s; }

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 30px;
}

.weather-icon-large {
  position: relative;
  font-size: 5rem;
  line-height: 1;
}

.icon-emoji {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
}

.icon-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.temp-block {
  flex: 1;
}

.temp-value {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 8px;
}

.temp-number {
  font-size: 5rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(180deg, #fff 20%, rgba(255,255,255,0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.temp-unit {
  font-size: 2rem;
  font-weight: 500;
  opacity: 0.7;
  margin-top: 8px;
}

.condition-text {
  font-size: 1.3rem;
  color: rgba(255,255,255,0.8);
  font-weight: 500;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  background: rgba(0,0,0,0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-data {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.15);
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
  color: var(--text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Section Block */
.section-block {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-muted);
}

/* Temperature Graph */
.temp-graph-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
}

.temp-graph {
  width: 100%;
  height: 140px;
  overflow: visible;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.high { background: #fb7185; box-shadow: 0 0 8px rgba(251,113,133,0.5); }
.legend-dot.low { background: #60a5fa; box-shadow: 0 0 8px rgba(96,165,250,0.5); }

/* Forecast Grid */
.forecast-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.forecast-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 20px 16px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.forecast-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255,255,255,0.05), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.forecast-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255,255,255,0.15);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
}

.forecast-card:hover::before {
  opacity: 1;
}

.forecast-card.weather-clear { border-color: rgba(251,191,36,0.3); }
.forecast-card.weather-rainy { border-color: rgba(59,130,246,0.3); }
.forecast-card.weather-snowy { border-color: rgba(186,230,253,0.4); }

.forecast-day {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.forecast-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  transition: transform 0.3s;
}

.forecast-card:hover .forecast-icon {
  transform: scale(1.15);
}

.forecast-temps {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 0.95rem;
}

.temp-high {
  font-weight: 600;
  color: #fb7185;
}

.temp-low {
  color: #60a5fa;
}

/* History Timeline */
.history-timeline {
  position: relative;
  padding-left: 40px;
}

.timeline-line {
  position: absolute;
  left: 16px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: linear-gradient(180deg, var(--color-primary), rgba(99,102,241,0.2));
  border-radius: 1px;
}

.history-entry {
  position: relative;
  margin-bottom: 16px;
}

.timeline-dot {
  position: absolute;
  left: -32px;
  top: 20px;
  width: 32px;
  height: 32px;
  background: var(--bg-color);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.entry-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s;
}

.entry-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.1);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.entry-date {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.date-day {
  font-size: 1.5rem;
  font-weight: 700;
}

.date-month {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.entry-weather {
  font-size: 0.9rem;
  color: var(--text-muted);
  background: rgba(255,255,255,0.05);
  padding: 4px 12px;
  border-radius: 12px;
}

.entry-apps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.app-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  padding: 6px 12px 6px 6px;
  border-radius: 20px;
  transition: all 0.2s;
  cursor: default;
}

.app-chip:hover {
  background: rgba(255,255,255,0.1);
}

.app-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
  color: #fff;
}

.app-time {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.more-badge {
  background: rgba(99,102,241,0.2);
  color: var(--color-primary);
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.no-activity-text {
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.9rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 420px;
  background: linear-gradient(135deg, rgba(30,30,50,0.95), rgba(20,20,40,0.95));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255,255,255,0.08);
}

.input-spinner {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: rgba(30,30,50,0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  z-index: 10;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: rgba(99,102,241,0.15);
}

.item-flag {
  font-size: 1.2rem;
}

.item-name {
  font-weight: 500;
}

.item-region {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-left: auto;
}

.no-results-hint {
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-style: italic;
}

.current-location {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(99,102,241,0.1);
  border-radius: 12px;
  border: 1px solid rgba(99,102,241,0.2);
}

.current-location label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.location-value {
  font-weight: 500;
}

.unit-toggle {
  display: flex;
  gap: 8px;
}

.unit-btn {
  flex: 1;
  padding: 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.unit-btn:hover {
  background: rgba(255,255,255,0.1);
}

.unit-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: var(--color-primary);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #7c3aed;
  transform: translateY(-1px);
}

/* Animations */
.animate-enter {
  animation: fadeSlideIn 0.5s ease forwards;
  opacity: 0;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Forecast List Styles */
.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forecast-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.2s;
  animation: fadeSlideIn 0.5s ease forwards;
  opacity: 0;
}

.forecast-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(4px);
  border-color: rgba(255, 255, 255, 0.1);
}

.forecast-item-left {
  width: 120px;
}

.forecast-day-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 2px;
}

.forecast-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.forecast-item-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.forecast-weather-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.forecast-condition {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.forecast-item-right {
  width: 250px;
}

/* Temp Bar Visualization */
.temp-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.temp-max, .temp-min {
  width: 30px;
  text-align: center;
  font-weight: 600;
}

.temp-max { color: #fff; }
.temp-min { color: var(--text-muted); }

.temp-bar-container {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.temp-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  /* left and right set dynamically */
}

.temp-bar-fill {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #f43f5e);
  border-radius: 3px;
  opacity: 0.8;
}

/* Weather specific styles for icons/text colors if needed */
.weather-clear { color: #f59e0b; }
.weather-rainy { color: #3b82f6; }
.weather-snowy { color: #06b6d4; }
.weather-stormy { color: #8b5cf6; }
.weather-cloudy { color: #9ca3af; }


.text-muted {
  color: var(--text-muted);
}

.sm {
  font-size: 0.8rem;
}

/* App Group & Icons */
.app-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  padding: 4px 10px 4px 4px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.05);
  transition: all 0.2s;
  cursor: pointer;
}

.app-group:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.1);
}

.app-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
}

.real-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-duration {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Detail Modal specific */
.detail-modal {
  width: 500px;
  max-width: 90%;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.detail-modal .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.sessions-list {
  padding: 20px;
}

.session-item {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  position: relative;
}

.session-time {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--text-muted);
  width: 50px;
  text-align: right;
  padding-top: 4px;
}

.session-timeline-line {
  width: 2px;
  background: rgba(255,255,255,0.1);
  position: relative;
}

.session-timeline-line::before {
  content: '';
  position: absolute;
  top: 8px;
  left: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 2px solid var(--color-primary);
}

.session-content {
  flex: 1;
  background: rgba(255,255,255,0.03);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: 1px solid rgba(255,255,255,0.05);
}

.app-icon-large {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  flex-shrink: 0;
}

.app-icon-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-app-name {
  font-weight: 600;
  color: #fff;
  font-size: 0.95rem;
}

.session-duration {
  font-size: 0.85rem;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.session-window {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
}

/* Geolocation Button */
.btn-geolocation {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.12));
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 12px;
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  justify-content: center;
}

.btn-geolocation:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2));
  border-color: rgba(99,102,241,0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99,102,241,0.2);
}

.btn-geolocation:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-geolocation svg {
  flex-shrink: 0;
}

.geo-hint {
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 8px;
  text-align: center;
}

/* Geolocation Pre-Prompt Modal */
.geo-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: geoFadeIn 0.2s ease;
}

.geo-modal {
  background: linear-gradient(145deg, rgba(30, 30, 46, 0.98), rgba(24, 24, 37, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 36px 32px 28px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(99, 102, 241, 0.08);
}

.geo-modal-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #818cf8;
  animation: geoPulse 2s ease-in-out infinite;
}

.geo-modal-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}

.geo-modal-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  margin: 0 0 20px;
}

.geo-modal-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.geo-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: left;
}

.geo-info-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.geo-modal-actions {
  display: flex;
  gap: 10px;
}

.geo-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.geo-btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.geo-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.geo-btn-allow {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.geo-btn-allow:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

@keyframes geoFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes geoPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.2); }
  50% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
}

.animate-geo-enter {
  animation: geoSlideUp 0.3s ease;
}

@keyframes geoSlideUp {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
