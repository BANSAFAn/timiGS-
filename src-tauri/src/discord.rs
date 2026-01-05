use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use once_cell::sync::Lazy;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

// Discord Client ID - injected at build time via environment variable
// Set DISCORD_CLIENT_ID in your environment or GitHub Secrets
const CLIENT_ID: &str = env!("DISCORD_CLIENT_ID");

// Global client state
static CLIENT: Lazy<Mutex<Option<DiscordIpcClient>>> = Lazy::new(|| Mutex::new(None));

pub fn init() {
    connect();
}

fn connect() {
    let mut client = match DiscordIpcClient::new(CLIENT_ID) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to create Discord IPC client: {}", e);
            return;
        }
    };

    if let Err(e) = client.connect() {
        eprintln!("Failed to connect to Discord IPC: {}", e);
        // Don't store if failed
        return;
    }

    *CLIENT.lock().unwrap() = Some(client);
    println!("Discord IPC Connected");
}

pub fn update_presence(app_name: &str, details: &str) {
    let mut guard = CLIENT.lock().unwrap();

    // Auto-reconnect if needed
    if guard.is_none() {
        drop(guard); // unlock to connect
        connect();
        guard = CLIENT.lock().unwrap();
        if guard.is_none() {
            return; // Still failed, give up for now
        }
    }

    let mut needs_reconnect = false;

    if let Some(client) = guard.as_mut() {
        let start_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let assets = activity::Assets::new()
            .large_image("icon") // Ensure you have an 'icon' asset uploaded in Discord Dev Portal
            .large_text("TimiGS Activity Tracker");

        let payload = activity::Activity::new()
            .state(details) // "Editing file.rs" or Window Title
            .details(app_name) // "VS Code"
            .timestamps(activity::Timestamps::new().start(start_time))
            .assets(assets);

        if let Err(e) = client.set_activity(payload) {
            eprintln!("Failed to update Discord presence: {}", e);
            needs_reconnect = true;
        }
    }

    if needs_reconnect {
        *guard = None;
    }
}

pub fn clear_presence() {
    let mut guard = CLIENT.lock().unwrap();
    if let Some(client) = guard.as_mut() {
        let _ = client.close();
    }
    *guard = None;
}
