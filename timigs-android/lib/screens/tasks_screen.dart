import 'package:flutter/material.dart';
import '../services/task_service.dart';
import '../models/task.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<Task> _tasks = [];
  Map<int, int> _taskProgress = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    setState(() => _isLoading = true);

    final tasks = await TaskService.instance.getTasks();
    final Map<int, int> progress = {};

    for (var task in tasks) {
      progress[task.id] = await TaskService.instance.getTaskProgress(task.id);
    }

    if (mounted) {
      setState(() {
        _tasks = tasks;
        _taskProgress = progress;
        _isLoading = false;
      });
    }
  }

  Future<void> _showCreateTaskDialog() async {
    final appNameController = TextEditingController();
    final descriptionController = TextEditingController();
    final hoursController = TextEditingController(text: '1');

    final recentApps = await TaskService.instance.getRecentApps();

    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Create Task'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Autocomplete<String>(
                  optionsBuilder: (textEditingValue) {
                    if (textEditingValue.text.isEmpty) {
                      return recentApps;
                    }
                    return recentApps.where((app) => app
                        .toLowerCase()
                        .contains(textEditingValue.text.toLowerCase()));
                  },
                  onSelected: (selection) {
                    appNameController.text = selection;
                  },
                  fieldViewBuilder:
                      (context, controller, focusNode, onFieldSubmitted) {
                    appNameController.text = controller.text;
                    return TextField(
                      controller: controller,
                      focusNode: focusNode,
                      decoration: const InputDecoration(
                        labelText: 'App Name',
                        hintText: 'e.g., com.android.chrome',
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description (optional)',
                    hintText: 'What are you working on?',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: hoursController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Goal (hours)',
                    hintText: '1',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (appNameController.text.isNotEmpty) {
                  final hours = int.tryParse(hoursController.text) ?? 1;
                  await TaskService.instance.createTask(
                    appName: appNameController.text,
                    description: descriptionController.text.isEmpty
                        ? null
                        : descriptionController.text,
                    goalSeconds: hours * 3600,
                  );
                  if (context.mounted) {
                    Navigator.pop(context);
                    _loadTasks();
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tasks & Goals'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tasks.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.task_outlined,
                        size: 64,
                        color: theme.colorScheme.onSurface.withOpacity(0.3),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No active tasks',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _showCreateTaskDialog,
                        icon: const Icon(Icons.add),
                        label: const Text('Create Task'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadTasks,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _tasks.length,
                    itemBuilder: (context, index) {
                      final task = _tasks[index];
                      final progress = _taskProgress[task.id] ?? 0;
                      final percentage = (progress / task.goalSeconds * 100)
                          .clamp(0, 100)
                          .toDouble();

                      return _buildTaskCard(
                          context, task, progress, percentage);
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateTaskDialog,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildTaskCard(
      BuildContext context, Task task, int progress, double percentage) {
    final theme = Theme.of(context);
    final isCompleted = task.status == 'completed' || percentage >= 100;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        task.appName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          decoration:
                              isCompleted ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      if (task.description != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          task.description!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                PopupMenuButton(
                  itemBuilder: (context) => [
                    if (task.status == 'active')
                      PopupMenuItem(
                        child: const Text('Mark Complete'),
                        onTap: () async {
                          await TaskService.instance
                              .updateTaskStatus(task.id, 'completed');
                          _loadTasks();
                        },
                      ),
                    PopupMenuItem(
                      child: const Text('Delete'),
                      onTap: () async {
                        await TaskService.instance.deleteTask(task.id);
                        _loadTasks();
                      },
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: LinearProgressIndicator(
                    value: percentage / 100,
                    backgroundColor: theme.colorScheme.surfaceVariant,
                    valueColor: AlwaysStoppedAnimation(
                      isCompleted ? Colors.green : theme.colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${percentage.toStringAsFixed(0)}%',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color:
                        isCompleted ? Colors.green : theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_formatDuration(progress)} / ${task.formattedGoal}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
                if (isCompleted)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '✓ Completed',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDuration(int seconds) {
    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;

    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }
}
