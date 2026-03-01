# TimiGS Rust Backend

This directory contains the Rust backend for TimiGS Android app, providing:
- SQLite database operations
- Activity session management  
- Analytics calculations
- Settings management
- Task/goal tracking

## Architecture

```
Flutter UI (Dart)
       │
       │ flutter_rust_bridge (FFI)
       ▼
Rust Backend (timigs_core)
  ├── api/       → Public API exposed to Dart
  ├── models/    → Data structures
  └── db/        → SQLite database layer
```

## Prerequisites

1. **Install Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Add Android targets**
   ```bash
   rustup target add aarch64-linux-android
   rustup target add armv7-linux-androideabi
   rustup target add x86_64-linux-android
   rustup target add i686-linux-android
   ```

3. **Install cargo-ndk**
   ```bash
   cargo install cargo-ndk
   ```

4. **Set ANDROID_NDK_HOME**
   ```bash
   export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/26.1.10909125
   ```

## Building

### Check Rust code
```bash
cd rust
cargo check
```

### Run tests
```bash
cargo test
```

### Generate Flutter bindings
From the `timigs-android` directory:
```bash
dart run flutter_rust_bridge_codegen generate
```

This will create generated Dart files in `lib/src/rust/`.

## API Reference

### Database
- `init_database(path: String)` - Initialize SQLite database
- `close_database()` - Close connection
- `get_database_path()` - Get DB file path for export

### Sessions
- `start_session(session: NewSession)` - Start tracking session
- `end_session(session_id: i64)` - End session
- `get_sessions_for_date(year, month, day)` - Query sessions
- `get_today_sessions()` - Today's sessions
- `get_total_time_today()` - Total seconds today

### Analytics
- `get_today_summary()` - App usage summary
- `get_weekly_stats()` - Last 7 days stats
- `get_weekly_trend()` - Aggregated weekly data
- `get_top_apps(days, limit)` - Top apps by usage

### Settings
- `get_settings()` - Get all settings
- `save_settings(settings: AppSettings)` - Save all
- `get_setting(key: String)` - Get single value
- `save_setting(key: String, value: String)` - Save single

### Tasks
- `create_task(task: NewTask)` - Create goal
- `get_active_tasks()` - Active tasks only
- `get_all_tasks()` - All tasks
- `update_task_status(task_id, status)` - Update status
- `delete_task(task_id)` - Delete task

## Hybrid Architecture

Android's `UsageStats` API remains in Dart because:
1. It's Android-specific (JNI complexity)
2. Works via Flutter plugin ecosystem
3. Only data **storage** goes to Rust

The tracking flow:
```
Android UsageStats (Dart)
       │
       │ collected data
       ▼
Rust Backend (rusqlite)
       │
       │ stored & processed
       ▼
Flutter UI (Dart)
```

## Development

Edit Rust code in `src/`, then:
1. Run `cargo check` to verify
2. Run `flutter_rust_bridge_codegen generate` to update bindings
3. Run Flutter app to test
