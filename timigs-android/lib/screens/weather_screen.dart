import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class WeatherScreen extends StatefulWidget {
  const WeatherScreen({super.key});

  @override
  State<WeatherScreen> createState() => _WeatherScreenState();
}

class _WeatherScreenState extends State<WeatherScreen> {
  bool _isLoading = false;
  String _city = 'Kyiv';
  double? _temperature;
  String _condition = '';
  int _weatherCode = 0;
  double _humidity = 0;
  double _windSpeed = 0;
  List<Map<String, dynamic>> _forecast = [];

  late TextEditingController _cityController;

  @override
  void initState() {
    super.initState();
    _cityController = TextEditingController(text: _city);
    _fetchWeather();
  }

  @override
  void dispose() {
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _fetchWeather() async {
    // Update city from controller if needed, or keeping them in sync
    // Logic remains mostly same but using controller

    setState(() => _isLoading = true);

    try {
      // Geocoding to get coordinates
      final geoUrl =
          'https://geocoding-api.open-meteo.com/v1/search?name=$_city&count=1&language=en&format=json';
      final geoResponse = await http.get(Uri.parse(geoUrl));

      if (geoResponse.statusCode == 200) {
        final geoData = json.decode(geoResponse.body);
        if (geoData['results'] != null && geoData['results'].isNotEmpty) {
          final lat = geoData['results'][0]['latitude'];
          final lon = geoData['results'][0]['longitude'];

          // Get weather data
          final weatherUrl =
              'https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=relativehumidity_2m&timezone=auto';
          final weatherResponse = await http.get(Uri.parse(weatherUrl));

          if (weatherResponse.statusCode == 200) {
            final weatherData = json.decode(weatherResponse.body);

            setState(() {
              _temperature = weatherData['current_weather']['temperature'];
              _weatherCode = weatherData['current_weather']['weathercode'];
              _windSpeed = weatherData['current_weather']['windspeed'];
              _condition = _getWeatherDescription(_weatherCode);

              // Get current hour humidity
              final currentHour = DateTime.now().hour;
              _humidity = weatherData['hourly']['relativehumidity_2m']
                      [currentHour]
                  .toDouble();

              // Get 5-day forecast
              _forecast = [];
              for (int i = 1; i < 6; i++) {
                _forecast.add({
                  'date': weatherData['daily']['time'][i],
                  'code': weatherData['daily']['weathercode'][i],
                  'high': weatherData['daily']['temperature_2m_max'][i],
                  'low': weatherData['daily']['temperature_2m_min'][i],
                });
              }
            });
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch weather: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String _getWeatherDescription(int code) {
    if (code == 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 95) return 'Thunderstorm';
    return 'Unknown';
  }

  String _getWeatherIcon(int code) {
    if (code == 0) return '☀️';
    if (code >= 1 && code <= 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 95) return '⚡';
    return '🌥️';
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    final now = DateTime.now();
    if (date.day == now.day + 1) return 'Tomorrow';
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.weekday - 1];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Weather'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchWeather,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchWeather,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // City selector
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          const Icon(Icons.location_on, size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              decoration: const InputDecoration(
                                hintText: 'Enter city name',
                                border: InputBorder.none,
                              ),
                              onSubmitted: (value) {
                                setState(() => _city = value);
                                _fetchWeather();
                              },
                              controller: _cityController,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.search),
                            onPressed: _fetchWeather,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Current weather card
                  if (_temperature != null)
                    Card(
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Theme.of(context)
                                  .colorScheme
                                  .primary
                                  .withOpacity(0.3),
                              Theme.of(context)
                                  .colorScheme
                                  .secondary
                                  .withOpacity(0.2),
                            ],
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              _getWeatherIcon(_weatherCode),
                              style: const TextStyle(fontSize: 80),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              '${_temperature!.round()}°C',
                              style: Theme.of(context)
                                  .textTheme
                                  .displayLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _condition,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildWeatherStat(
                                    '💧', '${_humidity.round()}%', 'Humidity'),
                                _buildWeatherStat(
                                    '💨', '${_windSpeed.round()} km/h', 'Wind'),
                                _buildWeatherStat(
                                    '🌡️',
                                    '${(_temperature! - 2).round()}°',
                                    'Feels Like'),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 24),

                  // 5-day forecast
                  if (_forecast.isNotEmpty) ...[
                    Text(
                      '5-Day Forecast',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    ..._forecast.map((day) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: Text(
                              _getWeatherIcon(day['code']),
                              style: const TextStyle(fontSize: 32),
                            ),
                            title: Text(_formatDate(day['date'])),
                            subtitle: Text(_getWeatherDescription(day['code'])),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '${day['high'].round()}°',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '${day['low'].round()}°',
                                  style: TextStyle(
                                    color: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.color,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildWeatherStat(String icon, String value, String label) {
    return Column(
      children: [
        Text(icon, style: const TextStyle(fontSize: 24)),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Theme.of(context).textTheme.bodySmall?.color,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
