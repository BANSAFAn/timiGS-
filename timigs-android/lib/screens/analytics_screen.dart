import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/database_service.dart';
import '../models/app_usage_summary.dart';
import '../models/daily_stats.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  List<AppUsageSummary> _topApps = [];
  List<DailyStats> _weeklyStats = [];
  bool _isLoading = true;
  int _totalTimeToday = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    final summary = await DatabaseService.instance.getTodaySummary();
    final weekly = await DatabaseService.instance.getWeeklyStats();
    final totalTime = await DatabaseService.instance.getTotalTimeToday();
    
    if (mounted) {
      setState(() {
        _topApps = summary;
        _weeklyStats = weekly;
        _totalTimeToday = totalTime;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Pie Chart
                  if (_topApps.isNotEmpty) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Usage by Application',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              height: 250,
                              child: PieChart(
                                PieChartData(
                                  sections: _buildPieSections(),
                                  sectionsSpace: 2,
                                  centerSpaceRadius: 60,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            ..._topApps.take(5).map((app) => _buildLegendItem(
                              context,
                              app.appName,
                              app.formattedDuration,
                              _getColorForIndex(_topApps.indexOf(app)),
                            )),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  
                  // Weekly Bar Chart
                  if (_weeklyStats.isNotEmpty) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Weekly Overview',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              height: 200,
                              child: BarChart(
                                BarChartData(
                                  alignment: BarChartAlignment.spaceAround,
                                  maxY: _getMaxWeeklyTime().toDouble(),
                                  barGroups: _buildBarGroups(),
                                  titlesData: FlTitlesData(
                                    show: true,
                                    bottomTitles: AxisTitles(
                                      sideTitles: SideTitles(
                                        showTitles: true,
                                        getTitlesWidget: (value, meta) {
                                          if (value.toInt() < _weeklyStats.length) {
                                            final stat = _weeklyStats[value.toInt()];
                                            final date = DateTime.parse(stat.date);
                                            return Text(
                                              '${date.day}/${date.month}',
                                              style: theme.textTheme.bodySmall,
                                            );
                                          }
                                          return const Text('');
                                        },
                                      ),
                                    ),
                                    leftTitles: AxisTitles(
                                      sideTitles: SideTitles(
                                        showTitles: true,
                                        reservedSize: 40,
                                        getTitlesWidget: (value, meta) {
                                          return Text(
                                            '${(value ~/ 3600)}h',
                                            style: theme.textTheme.bodySmall,
                                          );
                                        },
                                      ),
                                    ),
                                    topTitles: AxisTitles(
                                      sideTitles: SideTitles(showTitles: false),
                                    ),
                                    rightTitles: AxisTitles(
                                      sideTitles: SideTitles(showTitles: false),
                                    ),
                                  ),
                                  gridData: FlGridData(show: false),
                                  borderData: FlBorderData(show: false),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  
                  if (_topApps.isEmpty && _weeklyStats.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          children: [
                            Icon(
                              Icons.analytics_outlined,
                              size: 64,
                              color: theme.colorScheme.onSurface.withOpacity(0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No data available yet',
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: theme.colorScheme.onSurface.withOpacity(0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  List<PieChartSectionData> _buildPieSections() {
    final total = _topApps.fold<int>(0, (sum, app) => sum + app.totalSeconds);
    
    return _topApps.take(5).map((app) {
      final percentage = (app.totalSeconds / total * 100);
      final index = _topApps.indexOf(app);
      
      return PieChartSectionData(
        value: app.totalSeconds.toDouble(),
        title: '${percentage.toStringAsFixed(1)}%',
        color: _getColorForIndex(index),
        radius: 80,
        titleStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
    }).toList();
  }

  List<BarChartGroupData> _buildBarGroups() {
    return _weeklyStats.asMap().entries.map((entry) {
      return BarChartGroupData(
        x: entry.key,
        barRods: [
          BarChartRodData(
            toY: entry.value.totalSeconds.toDouble(),
            color: Theme.of(context).colorScheme.primary,
            width: 16,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
          ),
        ],
      );
    }).toList();
  }

  int _getMaxWeeklyTime() {
    if (_weeklyStats.isEmpty) return 3600;
    return _weeklyStats.fold<int>(0, (max, stat) => 
      stat.totalSeconds > max ? stat.totalSeconds : max
    );
  }

  Color _getColorForIndex(int index) {
    final colors = [
      const Color(0xFF6366F1),
      const Color(0xFFEC4899),
      const Color(0xFF10B981),
      const Color(0xFFF59E0B),
      const Color(0xFF8B5CF6),
    ];
    return colors[index % colors.length];
  }

  Widget _buildLegendItem(BuildContext context, String label, String value, Color color) {
    final theme = Theme.of(context);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodyMedium,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
