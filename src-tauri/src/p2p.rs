use std::fs::File;
use std::io;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use tiny_http::{Response, Server, StatusCode};

static SERVER_RUNNING: AtomicBool = AtomicBool::new(false);

pub fn start_server() -> Result<String, String> {
    if SERVER_RUNNING.load(Ordering::SeqCst) {
        return Ok("Server already running".to_string());
    }

    let server = Server::http("0.0.0.0:4444").map_err(|e| e.to_string())?;
    SERVER_RUNNING.store(true, Ordering::SeqCst);

    thread::spawn(move || {
        println!("P2P Server listening on 0.0.0.0:4444");

        // Loop while running.
        // Note: tiny_http server doesn't have a clean shutdown via flag easily without non-blocking,
        // but since this is a desktop app helper, we can just let it run or rely on Accept timeout if configured.
        // For simplicity, we process incoming requests.

        for mut request in server.incoming_requests() {
            if !SERVER_RUNNING.load(Ordering::SeqCst) {
                break;
            }

            println!("Received request: {} {}", request.method(), request.url());

            if request.url() == "/upload" && request.method().as_str() == "POST" {
                // Get filename from header
                let filename = request
                    .headers()
                    .iter()
                    .find(|h| h.field.equiv("x-filename"))
                    .map(|h| h.value.as_str().to_string())
                    .unwrap_or_else(|| format!("received_{}.db", chrono::Utc::now().timestamp()));

                // Save to Downloads
                let download_dir =
                    dirs::download_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
                let path = download_dir.join(&filename);

                let mut file = match File::create(&path) {
                    Ok(f) => f,
                    Err(e) => {
                        let _ = request.respond(
                            Response::from_string(format!("Failed to create file: {}", e))
                                .with_status_code(StatusCode(500)),
                        );
                        continue;
                    }
                };

                // Copy body
                if let Err(e) = io::copy(request.as_reader(), &mut file) {
                    let _ = request.respond(
                        Response::from_string(format!("Failed to write file: {}", e))
                            .with_status_code(StatusCode(500)),
                    );
                    continue;
                }

                let _ = request.respond(Response::from_string("File received successfully"));

                // Notify user via main thread? (Hard from here without AppHandle passed in)
                // For now, client will see success.
            } else {
                let _ = request
                    .respond(Response::from_string("Not Found").with_status_code(StatusCode(404)));
            }
        }
        println!("P2P Server stopped");
    });

    Ok("Server started on port 4444".to_string())
}

pub fn stop_server() {
    SERVER_RUNNING.store(false, Ordering::SeqCst);
    // Note: The thread is blocked on accept(). It will stop after *next* request or when app closes.
    // This is a known limitation of simple blocking servers.
    // For a robust app, we should make a self-request to unblock or use a non-blocking server.
    // Making a dummy request to unblock:
    thread::spawn(|| {
        let _ = reqwest::blocking::get("http://127.0.0.1:4444/shutdown");
    });
}
