use std::fs::File;
use std::io;
use std::net::UdpSocket;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use tiny_http::{Header, Response, Server, StatusCode};

static SERVER_RUNNING: AtomicBool = AtomicBool::new(false);

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

    let server = Server::http("0.0.0.0:4444").map_err(|e| e.to_string())?;
    SERVER_RUNNING.store(true, Ordering::SeqCst);

    let ip = get_local_ip().unwrap_or_else(|_| "unknown".to_string());

    thread::spawn(move || {
        println!("P2P Server listening on 0.0.0.0:4444");

        for mut request in server.incoming_requests() {
            if !SERVER_RUNNING.load(Ordering::SeqCst) {
                break;
            }

            println!("Received request: {} {}", request.method(), request.url());

            let cors = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap();

            match (request.method().as_str(), request.url()) {
                ("POST", "/upload") => {
                    // Receive a file from another device
                    let filename = request
                        .headers()
                        .iter()
                        .find(|h| h.field.equiv("x-filename"))
                        .map(|h| h.value.as_str().to_string())
                        .unwrap_or_else(|| {
                            format!("received_{}.db", chrono::Utc::now().timestamp())
                        });

                    let download_dir =
                        dirs::download_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
                    let path = download_dir.join(&filename);

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
    let path = std::path::Path::new(file_path);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    let filename = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "file.bin".to_string());

    let data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let client = reqwest::blocking::Client::new();
    let url = format!("http://{}:4444/upload", target_ip);

    let resp = client
        .post(&url)
        .header("x-filename", &filename)
        .body(data)
        .send()
        .map_err(|e| format!("Connection failed: {}", e))?;

    if resp.status().is_success() {
        Ok("File sent successfully".to_string())
    } else {
        Err(format!("Transfer failed: HTTP {}", resp.status()))
    }
}
