use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use std::time::Duration;
use tauri::Manager;

static TIMER_STATE: OnceLock<Mutex<TimerState>> = OnceLock::new();

struct TimerState {
    running: Arc<AtomicBool>,
    remaining_secs: Arc<AtomicU64>,
}

impl TimerState {
    fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
            remaining_secs: Arc::new(AtomicU64::new(0)),
        }
    }
}

fn get_state() -> &'static Mutex<TimerState> {
    TIMER_STATE.get_or_init(|| Mutex::new(TimerState::new()))
}

pub fn start_timer(duration_secs: u64, app_handle: tauri::AppHandle) {
    let state_mutex = get_state();
    let mut state = state_mutex.lock().unwrap();

    // Stop existing timer if any
    state.running.store(false, Ordering::SeqCst);

    // Create new state controls
    let running = Arc::new(AtomicBool::new(true));
    let remaining = Arc::new(AtomicU64::new(duration_secs));

    state.running = running.clone();
    state.remaining_secs = remaining.clone();

    thread::spawn(move || {
        while running.load(Ordering::SeqCst) {
            let left = remaining.load(Ordering::SeqCst);

            if left == 0 {
                // Time's up!
                running.store(false, Ordering::SeqCst);

                // Trigger shutdown
                #[cfg(target_os = "windows")]
                {
                    use std::process::Command;
                    let _ = Command::new("shutdown").args(["/s", "/t", "0"]).spawn();
                }

                // Notify frontend
                let _ = app_handle.emit("timer-finished", ());
                break;
            }

            thread::sleep(Duration::from_secs(1));
            remaining.fetch_sub(1, Ordering::SeqCst);
        }
    });
}

pub fn cancel_timer() {
    let state_mutex = get_state();
    let state = state_mutex.lock().unwrap();
    state.running.store(false, Ordering::SeqCst);
    state.remaining_secs.store(0, Ordering::SeqCst);
}

pub fn get_remaining_time() -> Option<u64> {
    let state_mutex = get_state();
    let state = state_mutex.lock().unwrap();
    if state.running.load(Ordering::SeqCst) {
        Some(state.remaining_secs.load(Ordering::SeqCst))
    } else {
        None
    }
}
