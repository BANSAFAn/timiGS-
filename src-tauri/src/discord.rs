use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use once_cell::sync::Lazy;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

const CLIENT_ID: &str = "1323605963499831346"; // Generic Client ID or specific app ID

pub struct DiscordClient {
    client: Option<DiscordIpcClient>,
    connected: bool,
}

impl DiscordClient {
    pub fn new() -> Self {
        Self {
            client: None,
            connected: false,
        }
    }

    pub fn connect(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if self.connected {
            return Ok(());
        }

        let mut client = DiscordIpcClient::new(CLIENT_ID)?;
        client.connect()?;
        self.client = Some(client);
        self.connected = true;
        Ok(())
    }

    pub fn set_activity(&mut self, app_name: &str, window_title: &str, start_time: i64) {
        if !self.connected {
            if let Err(_) = self.connect() {
                // connection failed, silently ignore to avoid spamming logs/errors
                return;
            }
        }

        if let Some(client) = &mut self.client {
            let details = format!("Using {}", app_name);
            let state = if window_title.len() > 128 {
                // Truncate title if too long
                format!("{}...", &window_title[..125])
            } else if window_title.is_empty() {
                "Active".to_string()
            } else {
                window_title.to_string()
            };

            let payload = activity::Activity::new()
                .details(&details)
                .state(&state)
                .assets(
                    activity::Assets::new()
                        .large_image("icon")
                        .large_text("TimiGS Activity Tracker"),
                ) // Make sure you upload 'logo' to Discord Dev Portal or use a generic one
                .timestamps(activity::Timestamps::new().start(start_time));

            let _ = client.set_activity(payload);
        }
    }

    pub fn clear_activity(&mut self) {
        if let Some(client) = &mut self.client {
            let _ = client.clear_activity();
        }
    }
}

// Global Discord Client Instance
pub static DISCORD: Lazy<Arc<Mutex<DiscordClient>>> =
    Lazy::new(|| Arc::new(Mutex::new(DiscordClient::new())));

pub fn update_presence(app_name: &str, window_title: &str) {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // Run in a separate thread to avoid blocking main thread
    let app_name = app_name.to_string();
    let window_title = window_title.to_string();

    std::thread::spawn(move || {
        if let Ok(mut client) = DISCORD.lock() {
            client.set_activity(&app_name, &window_title, now);
        }
    });
}

pub fn clear_presence() {
    std::thread::spawn(move || {
        if let Ok(mut client) = DISCORD.lock() {
            client.clear_activity();
        }
    });
}
