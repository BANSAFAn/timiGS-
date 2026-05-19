use std::fs::File;
use std::io;
use std::net::UdpSocket;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use tiny_http::{Header, Response, Server, StatusCode};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

static SERVER_RUNNING: AtomicBool = AtomicBool::new(false);

struct RateLimiter {
    requests: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
}

impl RateLimiter {
    fn new() -> Self {
        Self {
            requests: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn check_rate_limit(&self, ip: &str, max_requests: usize, window: Duration) -> bool {
        let mut requests = self.requests.lock().unwrap();
        let now = Instant::now();
        
        let entry = requests.entry(ip.to_string()).or_insert_with(Vec::new);
        entry.retain(|&time| now.duration_since(time) < window);
        
        if entry.len() >= max_requests {
            return false;
        }
        
        entry.push(now);
        true
    }
}

fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '_' || *c == '-')
        .take(255)
        .collect()
}

fn validate_ip(ip: &str) -> bool {
    if let Ok(addr) = ip.parse::<std::net::IpAddr>() {
        match addr {
            std::net::IpAddr::V4(ipv4) => {
                let octets = ipv4.octets();
                (octets[0] == 192 && octets[1] == 168) ||
                (octets[0] == 10) ||
                (octets[0] == 172 && octets[1] >= 16 && octets[1] <= 31) ||
                (octets[0] == 127)
            }
            _ => false,
        }
    } else {
        false
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub name: String,
    pub duration: i64,
    pub timestamp: i64,
}

/// Get the local LAN IP address by connecting a UDP socket to an external address.
pub fn get_local_ip() -> Result<String, String> {
    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    // We don't actually send anything — just use connect to determine the outbound interface
    socket.connect("8.8.8.8:80").map_err(|e| e.to_string())?;
    let addr = socket.local_addr().map_err(|e| e.to_string())?;
    Ok(addr.ip().to_string())
}

pub fn start_server() -> Result<String, String> {
    if SERVER_RUNNING.load(Ordering::SeqCst) {
        return Ok("Server already running".to_string());
    }

    let server = Server::http("127.0.0.1:4444").map_err(|e| e.to_string())?;
    SERVER_RUNNING.store(true, Ordering::SeqCst);

    let ip = get_local_ip().unwrap_or_else(|_| "unknown".to_string());
    let rate_limiter = RateLimiter::new();

    thread::spawn(move || {
        println!("P2P Server listening on 127.0.0.1:4444");

        for mut request in server.incoming_requests() {
            if !SERVER_RUNNING.load(Ordering::SeqCst) {
                break;
            }

            let client_ip = request.remote_addr()
                .map(|addr| addr.ip().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            if !rate_limiter.check_rate_limit(&client_ip, 10, Duration::from_secs(60)) {
                let _ = request.respond(
                    Response::from_string("Rate limit exceeded")
                        .with_status_code(StatusCode(429)),
                );
                continue;
            }

            println!("Received request: {} {} from {}", request.method(), request.url(), client_ip);

            let cors = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"http://localhost"[..]).unwrap();

            match (request.method().as_str(), request.url()) {
                ("POST", "/upload") => {
                    let raw_filename = request
                        .headers()
                        .iter()
                        .find(|h| h.field.equiv("x-filename"))
                        .map(|h| h.value.as_str().to_string())
                        .unwrap_or_else(|| {
                            format!("received_{}.db", chrono::Utc::now().timestamp())
                        });

                    let filename = sanitize_filename(&raw_filename);
                    
                    if filename.is_empty() || filename.contains("..") {
                        let _ = request.respond(
                            Response::from_string("Invalid filename")
                                .with_status_code(StatusCode(400))
                                .with_header(cors),
                        );
                        continue;
                    }

                    let download_dir =
                        dirs::download_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
                    let path = download_dir.join(&filename);
                    
                    if !path.starts_with(&download_dir) {
                        let _ = request.respond(
                            Response::from_string("Path traversal detected")
                                .with_status_code(StatusCode(400))
                                .with_header(cors),
                        );
                        continue;
                    }
                    
                    let content_length = request.headers()
                        .iter()
                        .find(|h| h.field.equiv("content-length"))
                        .and_then(|h| h.value.as_str().parse::<usize>().ok())
                        .unwrap_or(0);
                    
                    if content_length > 100 * 1024 * 1024 {
                        let _ = request.respond(
                            Response::from_string("File too large (max 100MB)")
                                .with_status_code(StatusCode(413))
                                .with_header(cors),
                        );
                        continue;
                    }

                    let mut file = match File::create(&path) {
                        Ok(f) => f,
                        Err(e) => {
                            let _ = request.respond(
                                Response::from_string(format!("Failed to create file: {}", e))
                                    .with_status_code(StatusCode(500))
                                    .with_header(cors),
                            );
                            continue;
                        }
                    };

                    if let Err(e) = io::copy(request.as_reader(), &mut file) {
                        let _ = request.respond(
                            Response::from_string(format!("Failed to write file: {}", e))
                                .with_status_code(StatusCode(500))
                                .with_header(cors),
                        );
                        continue;
                    }

                    let _ = request.respond(
                        Response::from_string("File received successfully").with_header(cors),
                    );
                }
                ("GET", "/ping") => {
                    // Health check — lets the other device verify IP is reachable
                    let _ = request.respond(
                        Response::from_string("{\"status\":\"ok\",\"app\":\"TimiGS\"}")
                            .with_header(cors),
                    );
                }
                ("GET", "/info") => {
                    // Device information endpoint
                    let device_name = std::env::var("COMPUTERNAME")
                        .or_else(|_| std::env::var("HOSTNAME"))
                        .or_else(|_| std::env::var("USER"))
                        .or_else(|_| std::env::var("USERNAME"))
                        .unwrap_or_else(|_| "Unknown".to_string());
                    
                    let device_type = if cfg!(target_os = "android") {
                        "Android"
                    } else if cfg!(target_os = "windows") {
                        "Windows"
                    } else if cfg!(target_os = "macos") {
                        "macOS"
                    } else if cfg!(target_os = "linux") {
                        "Linux"
                    } else {
                        "Unknown"
                    };
                    
                    let info = format!(
                        "{{\"name\":\"{}\",\"type\":\"{}\",\"app\":\"TimiGS\"}}",
                        device_name, device_type
                    );
                    
                    let _ = request.respond(
                        Response::from_string(info).with_header(cors),
                    );
                }
                ("GET", "/processes") => {
                    // Get current processes/activities
                    match get_current_processes() {
                        Ok(processes_json) => {
                            let _ = request.respond(
                                Response::from_string(processes_json).with_header(cors),
                            );
                        }
                        Err(e) => {
                            let _ = request.respond(
                                Response::from_string(format!("{{\"error\":\"{}\"}}", e))
                                    .with_status_code(StatusCode(500))
                                    .with_header(cors),
                            );
                        }
                    }
                }
                _ => {
                    let _ = request.respond(
                        Response::from_string("Not Found")
                            .with_status_code(StatusCode(404))
                            .with_header(cors),
                    );
                }
            }
        }
        println!("P2P Server stopped");
    });

    Ok(format!("Server started on {}:4444", ip))
}

pub fn stop_server() {
    SERVER_RUNNING.store(false, Ordering::SeqCst);
    // Make a dummy request to unblock the accept() call
    thread::spawn(|| {
        let _ = reqwest::blocking::get("http://127.0.0.1:4444/shutdown");
    });
}

/// Send a file to another device via HTTP POST
pub fn send_file_to_ip(target_ip: &str, file_path: &str) -> Result<String, String> {
    if !validate_ip(target_ip) {
        return Err("Invalid or non-local IP address".to_string());
    }
    
    let path = std::path::Path::new(file_path);
    if !path.exists() {
        return Err("File not found".to_string());
    }
    
    let metadata = std::fs::metadata(file_path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    
    if metadata.len() > 100 * 1024 * 1024 {
        return Err("File too large (max 100MB)".to_string());
    }

    let filename = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "file.bin".to_string());
    
    let sanitized_filename = sanitize_filename(&filename);

    let data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;
    
    let url = format!("http://{}:4444/upload", target_ip);

    let resp = client
        .post(&url)
        .header("x-filename", &sanitized_filename)
        .body(data)
        .send()
        .map_err(|e| format!("Connection failed: {}", e))?;

    if resp.status().is_success() {
        Ok("File sent successfully".to_string())
    } else {
        Err(format!("Transfer failed: HTTP {}", resp.status()))
    }
}

/// Get current processes from database
fn get_current_processes() -> Result<String, String> {
    let today_summary = crate::db::get_today_summary()
        .map_err(|e| format!("Failed to get today summary: {}", e))?;
    
    let processes: Vec<ProcessInfo> = today_summary
        .iter()
        .map(|s| ProcessInfo {
            name: s.app_name.clone(),
            duration: s.total_seconds,
            timestamp: chrono::Utc::now().timestamp(),
        })
        .collect();
    
    serde_json::to_string(&processes)
        .map_err(|e| format!("Failed to serialize processes: {}", e))
}
