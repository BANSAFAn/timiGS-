<template>
  <div class="page weather-page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t("weather.title") || "Weather & History" }}</h2>
        <div class="header-actions">
           <!-- Settings Trigger -->
           <button class="icon-btn" @click="showSettings = true" title="Weather Settings">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <circle cx="12" cy="12" r="3"></circle>
               <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
             </svg>
           </button>
           
           <label class="switch-label">
             <span>{{ isEnabled ? "Tracking On" : "Tracking Off" }}</span>
             <div class="toggle-switch" :class="{ checked: isEnabled }" @click="toggleWeather">
                <div class="toggle-thumb"></div>
             </div>
           </label>
        </div>
      </div>
      
      <!-- Location Header (Displayed if configured) -->
      <div class="location-header" v-if="isEnabled && config.name">
        📍 {{ config.name }}, {{ config.country }}
      </div>

      <!-- Current Weather Card -->
      <div class="glass-card current-weather animate-enter" v-if="isEnabled && current.temp !== null">
         <div class="weather-main">
            <div class="temp-display">
               <span class="temperature">{{ Math.round(current.temp) }}°{{ config.unit }}</span>
               <div class="condition">
                  <span class="icon">{{ getWeatherIcon(current.code) }}</span>
                  <span class="text">{{ getWeatherDesc(current.code) }}</span>
               </div>
            </div>
            <div class="weather-meta">
               <div class="meta-item">
                  <span class="label">Humidity</span>
                  <span class="value">{{ current.humidity }}%</span>
               </div>
               <div class="meta-item">
                  <span class="label">Wind</span>
                  <span class="value">{{ current.wind }} km/h</span>
               </div>
            </div>
         </div>
      </div>
       <div class="glass-card current-weather animate-enter" v-if="isEnabled && current.temp === null">
         <div class="loading-state">
           Loading Weather...
         </div>
      </div>

      <!-- Forecast (Horizontal Scroll) with Temperature Graph -->
      <div class="section-title" v-if="isEnabled && forecast.length > 0">5-Day Forecast</div>
      
      <!-- Temperature Trend Graph -->
      <div class="temp-graph-container glass-card animate-enter" v-if="isEnabled && forecast.length > 0" style="animation-delay: 0.1s">
        <svg class="temp-graph" viewBox="0 0 500 120" preserveAspectRatio="none">
          <!-- Background grid lines -->
          <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
          <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
          <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
          
          <!-- Gradient fill under high temp line -->
          <defs>
            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgba(255,107,107,0.4)" />
              <stop offset="100%" style="stop-color:rgba(255,107,107,0)" />
            </linearGradient>
            <linearGradient id="coldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgba(107,155,255,0.3)" />
              <stop offset="100%" style="stop-color:rgba(107,155,255,0)" />
            </linearGradient>
          </defs>
          
          <!-- Area fill -->
          <path :d="chartAreaPath" fill="url(#tempGradient)" />
          
          <!-- High temp line -->
          <path :d="chartHighPath" fill="none" stroke="#ff6b6b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          
          <!-- Low temp line -->
          <path :d="chartLowPath" fill="none" stroke="#6b9bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5,5" />
          
          <!-- Data points (high) -->
          <circle v-for="(point, i) in chartHighPoints" :key="'h'+i" :cx="point.x" :cy="point.y" r="5" fill="#ff6b6b" />
          <text v-for="(point, i) in chartHighPoints" :key="'ht'+i" :x="point.x" :y="point.y - 10" text-anchor="middle" fill="#ff6b6b" font-size="12" font-weight="bold">{{ Math.round(forecast[i].high) }}°</text>
          
          <!-- Data points (low) -->
          <circle v-for="(point, i) in chartLowPoints" :key="'l'+i" :cx="point.x" :cy="point.y" r="4" fill="#6b9bff" />
          <text v-for="(point, i) in chartLowPoints" :key="'lt'+i" :x="point.x" :y="point.y + 20" text-anchor="middle" fill="#6b9bff" font-size="12">{{ Math.round(forecast[i].low) }}°</text>
        </svg>
        
        <!-- Legend -->
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot high"></span> High Temp</span>
          <span class="legend-item"><span class="legend-dot low"></span> Low Temp</span>
        </div>
      </div>
      
      <!-- Forecast Cards -->
      <div class="forecast-scroller hide-scrollbar animate-enter" style="animation-delay: 0.15s" v-if="isEnabled && forecast.length > 0">
         <div 
           class="forecast-card glass-card" 
           v-for="day in forecast" 
           :key="day.date"
           :class="getWeatherClass(day.code)"
         >
            <div class="day-name">{{ day.dayName }}</div>
            <div class="day-icon-wrapper">
              <span class="day-icon">{{ getWeatherIcon(day.code) }}</span>
            </div>
            <div class="day-temp">
              <span class="high">{{ Math.round(day.high) }}°</span>
              <span class="low">{{ Math.round(day.low) }}°</span>
            </div>
         </div>
      </div>

      <!-- History & Apps -->
      <div class="section-title">History & Activity</div>
      <div class="history-list animate-enter" style="animation-delay: 0.2s">
         <div class="glass-card history-item" v-for="entry in history" :key="entry.date">
            <div class="history-date">
               <span class="date-num">{{ entry.day }}</span>
               <span class="date-month">{{ entry.month }}</span>
               <div class="history-weather" v-if="isEnabled">
                  {{ getWeatherIcon(entry.weatherCode) }} {{ Math.round(entry.temp) }}°
               </div>
            </div>
            
            <div class="history-content">
               <div class="apps-row" v-if="entry.apps.length > 0">
                  <div class="app-mini-icon" v-for="app in entry.apps" :key="app.name" :title="app.name + ' (' + formatDuration(app.duration) + ')'">
                     <!-- Placeholder for app icon, using first letter -->
                     <div class="app-letter" :style="{ backgroundColor: stringToColor(app.name) }">
                        {{ app.name.charAt(0).toUpperCase() }}
                     </div>
                  </div>
                  <div class="more-apps" v-if="entry.moreCount > 0">+{{ entry.moreCount }}</div>
               </div>
               <div class="no-activity" v-else>
                  No activity recorded
               </div>
            </div>
         </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div class="modal-overlay" v-if="showSettings" @click.self="showSettings = false">
      <div class="glass-card modal-content" @click.stop>
        <h3>Weather Settings</h3>
        
        <div class="input-group">
          <label>Search Location</label>
          <div class="search-box">
             <input 
               type="text" 
               v-model="searchQuery" 
               class="input-glass" 
               placeholder="e.g. Kyiv, Berlin, Tokyo"
               @input="onSearchInput"
             >
             <div v-if="isSearching" class="search-spinner"></div>
          
             <!-- Search Results Dropdown - Now inside search-box -->
             <div class="search-results" v-if="searchResults.length > 0">
                <div 
                  class="result-item" 
                  v-for="result in searchResults" 
                  :key="result.id"
                  @click="selectLocation(result)"
                >
                   <span class="result-flag" v-if="result.country_code">{{ getFlagEmoji(result.country_code) }}</span>
                   <span class="result-name">{{ result.name }}</span>
                   <span class="result-country">{{ result.admin1 ? result.admin1 + ', ' : '' }}{{ result.country }}</span>
                </div>
             </div>
          </div>
          
          <!-- No results message -->
          <div class="no-results" v-if="searchQuery.length >= 2 && !isSearching && searchResults.length === 0">
             No locations found. Try a different search term.
          </div>
        </div>

        <div class="selected-location" v-if="config.name">
           <label>Selected:</label>
           <div class="selected-text">
             {{ config.name }}, {{ config.country }}
           </div>
        </div>
        
        <div class="input-group">
          <label>Temperature Unit</label>
          <div class="toggle-row">
            <button 
              class="btn btn-sm" 
              :class="{ 'btn-primary': config.unit === 'C', 'btn-secondary': config.unit !== 'C' }"
              @click="updateUnit('C')"
            >Celsius (°C)</button>
             <button 
              class="btn btn-sm" 
              :class="{ 'btn-primary': config.unit === 'F', 'btn-secondary': config.unit !== 'F' }"
              @click="updateUnit('F')"
            >Fahrenheit (°F)</button>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-primary full-width" @click="closeSettings">Done</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';

const isEnabled = ref(true);
const showSettings = ref(false);

// --- Chart Computed Properties (Smooth Curves) ---



function getSmoothPath(points: {x: number, y: number}[]) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        
        // Simple catmull-rom to cubic bezier conversion logic or tension-based
        // Simplified approach for fixed points:
        const cp1x = p1.x + (p2.x - p0.x) * 0.15; // Tension 0.15
        const cp1y = p1.y + (p2.y - p0.y) * 0.15;
        const cp2x = p2.x - (p3.x - p1.x) * 0.15;
        const cp2y = p2.y - (p3.y - p1.y) * 0.15;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
}

const chartHighPoints = computed(() => {
  if (forecast.value.length === 0) return [];
  const highs = forecast.value.map(d => d.high);
  const min = Math.min(...highs, ...forecast.value.map(d => d.low)) - 2; // Add padding
  const max = Math.max(...highs) + 2;
  const range = max - min || 1;
  
  return forecast.value.map((day, i) => ({
    x: 50 + i * 100,
    y: 100 - ((day.high - min) / range) * 80
  }));
});

const chartLowPoints = computed(() => {
  if (forecast.value.length === 0) return [];
  const lows = forecast.value.map(d => d.low);
  const highs = forecast.value.map(d => d.high);
  const min = Math.min(...lows, ...highs) - 2;
  const max = Math.max(...highs) + 2;
  const range = max - min || 1;
  
  return forecast.value.map((day, i) => ({
    x: 50 + i * 100,
    y: 100 - ((day.low - min) / range) * 80
  }));
});

const chartHighPath = computed(() => getSmoothPath(chartHighPoints.value));
const chartLowPath = computed(() => getSmoothPath(chartLowPoints.value));

const chartAreaPath = computed(() => {
  if (chartHighPoints.value.length === 0) return '';
  const highPath = getSmoothPath(chartHighPoints.value);
  const lastX = chartHighPoints.value[chartHighPoints.value.length - 1].x;
  const firstX = chartHighPoints.value[0].x;
  
  // Close the loop for area fill
  return `${highPath} L ${lastX} 120 L ${firstX} 120 Z`;
});


function getWeatherClass(code: number) {
  if (code === 0) return 'weather-sunny';
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
       // No language parameter - accepts input in any language
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
   fetchWeather(); // Refresh weather immediately
}

function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt(0));
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
     const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=${unitParam}`);
     const data = await res.json();
     
     if (data.current_weather) {
        current.value = {
          temp: data.current_weather.temperature,
          code: data.current_weather.weathercode,
          description: getWeatherDesc(data.current_weather.weathercode),
          humidity: 50, // OpenMeteo current_weather doesn't give humidity in basic free tier easily without hourly, mocking for speed
          wind: data.current_weather.windspeed
        };
     }
     
     if (data.daily) {
        forecast.value = data.daily.time.slice(1, 6).map((time: string, index: number) => {
           const date = new Date(time);
           const dayName = new Date().getDate() + 1 === date.getDate() ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' });
           
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
   fetchWeather(); // Refetch to get correct unit from API
}

function getWeatherDesc(code: number) {
   const codes: Record<number, string> = {
      0: 'Clear Sky',
      1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing Rime Fog',
      51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
      61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
      71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
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

// --- History & Logic ---

// Mock App Data
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

function closeSettings() {
  showSettings.value = false;
}

function toggleWeather() {
   isEnabled.value = !isEnabled.value;
   localStorage.setItem('weather_enabled', isEnabled.value.toString());
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

import { useActivityStore } from '../stores/activity';

const activityStore = useActivityStore();


async function loadHistory() {
   const days = 7;
   const today = new Date();
   const pastDate = new Date(today);
   pastDate.setDate(today.getDate() - days);

   // Helper for Local ISO Date String (YYYY-MM-DD)
   const getLocalDateStr = (d: Date) => {
       const year = d.getFullYear();
       const month = String(d.getMonth() + 1).padStart(2, '0');
       const day = String(d.getDate()).padStart(2, '0');
       return `${year}-${month}-${day}`;
   };

   const toStr = getLocalDateStr(today);
   const fromStr = getLocalDateStr(pastDate);

   console.log(`Loading history from ${fromStr} to ${toStr}`);

   // Fetch real activity data
   // We assume db.rs/get_activity_range uses inclusive string comparison
   const sessions = await activityStore.getActivityRange(fromStr + " 00:00:00", toStr + " 23:59:59");
   console.log("Sessions found:", sessions.length);

   const newHistory: HistoryEntry[] = [];

   // Process last 7 days (reverse order: Today -> Past)
   for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getLocalDateStr(date);

      // Filter sessions for this day (Matches "YYYY-MM-DD HH:mm:ss")
      const daySessions = sessions.filter(s => s.start_time.startsWith(dateStr));

      // Aggregate by App Name
      const appMap: Record<string, number> = {};
      daySessions.forEach(s => {
          if (!appMap[s.app_name]) appMap[s.app_name] = 0;
          appMap[s.app_name] += s.duration_seconds;
      });

      // Convert to array and sort
      const sortedApps = Object.entries(appMap)
         .map(([name, duration]) => ({ name, duration }))
         .sort((a, b) => b.duration - a.duration);

      const topApps = sortedApps.slice(0, 4);
      const moreCount = Math.max(0, sortedApps.length - 4);

      // Weather Data (Forecast or fallback)
      const forecastDay = forecast.value.find(d => d.date === dateStr);
      let weatherCode = forecastDay ? forecastDay.code : (Math.random() > 0.5 ? 1 : 2); 
      let temp = forecastDay ? forecastDay.high : (15 + Math.floor(Math.random() * 10) - (i*2));

      newHistory.push({
         date: dateStr,
         day: date.getDate().toString(),
         month: date.toLocaleString('default', { month: 'short' }),
         weatherCode: weatherCode,
         temp: temp,
         apps: topApps, // Real app data
         moreCount: moreCount
      });
   }
   history.value = newHistory;
}


// Initial Load
onMounted(() => {
   const savedConfig = localStorage.getItem('weather_config');
   if (savedConfig) {
     Object.assign(config, JSON.parse(savedConfig));
   }
   
   const savedEnabled = localStorage.getItem('weather_enabled');
   if (savedEnabled !== null) {
      isEnabled.value = savedEnabled === 'true';
   }
   
   // Apply unit to display (re-convert mock history if needed, but for now history is mock)
   // Fetch real weather
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
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
   display: flex;
   align-items: center;
   gap: 15px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: rgba(255,255,255,0.1);
}

.switch-label {
   display: flex;
   align-items: center;
   gap: 10px;
   font-size: 0.9rem;
   color: var(--text-color);
   cursor: pointer;
}

.current-weather {
   padding: 30px;
   margin-bottom: 30px;
   background: var(--card-bg);
   background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.0) 100%);
}

.weather-main {
   display: flex;
   justify-content: space-between;
   align-items: center;
}

.temp-display {
   display: flex;
   flex-direction: column;
}

.temperature {
   font-size: 4rem;
   font-weight: 700;
   line-height: 1;
   background: linear-gradient(to right, #fff, #bbb);
   -webkit-background-clip: text;
   -webkit-text-fill-color: transparent;
}

.condition {
   display: flex;
   align-items: center;
   gap: 10px;
   font-size: 1.2rem;
   margin-top: 10px;
   color: var(--text-muted);
}

.weather-meta {
   display: flex;
   gap: 30px;
}

.meta-item {
   display: flex;
   flex-direction: column;
   align-items: flex-end;
}

.meta-item .label {
   font-size: 0.8rem;
   text-transform: uppercase;
   letter-spacing: 1px;
   color: var(--text-muted);
   margin-bottom: 5px;
}

.meta-item .value {
   font-size: 1.2rem;
   font-weight: 500;
}

/* Temp Graph */
.temp-graph-container {
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  background: rgba(255,255,255,0.03);
}

.temp-graph {
  width: 100%;
  height: 120px;
  overflow: visible;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.high { background: #ff6b6b; }
.legend-dot.low { background: #6b9bff; }

/* Forecast */
.forecast-scroller {
   display: flex;
   gap: 15px;
   overflow-x: auto;
   padding-bottom: 10px;
   margin-bottom: 30px;
}

.forecast-card {
   min-width: 130px;
   padding: 15px;
   display: flex;
   flex-direction: column;
   align-items: center;
   text-align: center;
   flex-shrink: 0;
   transition: all 0.3s ease;
   border: 1px solid rgba(255,255,255,0.05);
   position: relative;
   overflow: hidden;
}

/* Weather Condition Gradients */
.forecast-card.weather-sunny {
  background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,255,255,0.02));
  border-color: rgba(255,215,0,0.3);
}
.forecast-card.weather-rainy {
  background: linear-gradient(135deg, rgba(74,144,226,0.1), rgba(255,255,255,0.02));
  border-color: rgba(74,144,226,0.3);
}
.forecast-card.weather-cloudy {
  background: linear-gradient(135deg, rgba(149,165,166,0.1), rgba(255,255,255,0.02));
  border-color: rgba(149,165,166,0.3);
}
.forecast-card.weather-snowy {
  background: linear-gradient(135deg, rgba(236,240,241,0.15), rgba(255,255,255,0.05));
  border-color: rgba(236,240,241,0.5);
}
.forecast-card.weather-stormy {
  background: linear-gradient(135deg, rgba(44,62,80,0.3), rgba(255,255,255,0.02));
  border-color: rgba(52,73,94,0.5);
}

.forecast-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}

.day-name {
   font-weight: 600;
   margin-bottom: 5px;
   font-size: 0.9rem;
   text-transform: uppercase;
   letter-spacing: 0.5px;
   opacity: 0.9;
}

.day-icon-wrapper {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
}

.day-icon {
   font-size: 2.2rem;
   filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
   transition: transform 0.3s ease;
}

.forecast-card:hover .day-icon {
  transform: scale(1.1);
}

.day-temp {
   font-size: 1rem;
   color: var(--text-color);
   display: flex;
   gap: 8px;
   background: rgba(0,0,0,0.2);
   padding: 4px 10px;
   border-radius: 12px;
}

.day-temp .high {
   color: var(--text-color);
   font-weight: bold;
   margin-right: 5px;
}

/* History List */
.history-list {
   display: flex;
   flex-direction: column;
   gap: 15px;
}

.history-item {
   display: flex;
   align-items: center;
   padding: 20px;
   gap: 20px;
}

.history-date {
   display: flex;
   flex-direction: column;
   align-items: center;
   min-width: 60px;
   border-right: 1px solid var(--border-color);
   padding-right: 20px;
}

.date-num {
   font-size: 1.5rem;
   font-weight: bold;
}

.date-month {
   font-size: 0.8rem;
   text-transform: uppercase;
   color: var(--text-muted);
}

.history-weather {
   margin-top: 5px;
   font-size: 0.9rem;
   color: var(--text-muted);
}

.history-content {
   flex: 1;
}

.apps-row {
   display: flex;
   align-items: center;
   gap: 10px;
   flex-wrap: wrap;
}

.app-mini-icon {
   width: 36px;
   height: 36px;
   border-radius: 8px;
   background: var(--bg-color);
   display: flex;
   align-items: center;
   justify-content: center;
   border: 1px solid var(--border-color);
   transition: transform 0.2s;
   cursor: default;
}

.app-mini-icon:hover {
   transform: translateY(-2px);
   border-color: var(--color-primary);
}

.app-letter {
   width: 100%;
   height: 100%;
   display: flex;
   align-items: center;
   justify-content: center;
   border-radius: 8px;
   font-weight: bold;
   color: #fff;
   text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.more-apps {
   font-size: 0.8rem;
   color: var(--text-muted);
   margin-left: 5px;
}

.no-activity {
   font-style: italic;
   color: var(--text-muted);
   font-size: 0.9rem;
}

.section-title {
   margin-bottom: 15px;
   font-size: 1.1rem;
   font-weight: 600;
   color: var(--text-muted);
}

.location-header {
  font-size: 1.1em;
  color: var(--text-muted);
  margin-bottom: 10px;
  display: flex;
  gap: 5px;
}

/* Modal Stlyes */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9em;
  opacity: 0.8;
}

.toggle-row {
  display: flex;
  gap: 10px;
}

.btn-secondary {
  background: var(--bg-color-lighter);
  color: var(--text-muted);
}

.search-box {
   position: relative;
}

.search-spinner {
   position: absolute;
   right: 10px;
   top: 10px;
   width: 15px;
   height: 15px;
   border: 2px solid var(--text-muted);
   border-top-color: transparent;
   border-radius: 50%;
   animation: spin 1s linear infinite;
}

@keyframes spin {
   to { transform: rotate(360deg); }
}

.search-results {
   position: absolute;
   top: 100%;
   left: 0;
   right: 0;
   max-height: 250px;
   overflow-y: auto;
   background: #1a1a2e; /* Dark solid background */
   border: 1px solid rgba(255,255,255,0.2);
   z-index: 100;
   margin-top: 5px;
   border-radius: 8px;
   box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.no-results {
   margin-top: 10px;
   color: var(--text-muted);
   font-size: 0.9em;
   font-style: italic;
}

.result-item {
   padding: 10px;
   cursor: pointer;
   display: flex;
   align-items: center;
   gap: 8px;
   border-bottom: 1px solid rgba(255,255,255,0.05);
}

.result-item:hover {
   background: rgba(255,255,255,0.05);
}

.result-name {
   font-weight: 600;
}

.result-country {
   color: var(--text-muted);
   font-size: 0.8em;
}

.selected-location {
   margin-bottom: 20px;
   background: rgba(255,255,255,0.05);
   padding: 10px;
   border-radius: 8px;
}

.selected-text {
   font-weight: 500;
}

.loading-state {
   padding: 40px;
   text-align: center;
   color: var(--text-muted);
}
</style>
