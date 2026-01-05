use oauth2::{
    basic::BasicClient, reqwest::http_client, AuthUrl, AuthorizationCode, ClientId, ClientSecret,
    CsrfToken, PkceCodeChallenge, RedirectUrl, Scope, TokenResponse, TokenUrl,
};

use crate::db;
use tiny_http::{Response, Server};

// TODO: User must replace these with their own credentials from Google Cloud Console
// Removed consts to prevent hardcoding secrets
const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL: &str = "https://www.googleapis.com/oauth2/v3/token";
const REDIRECT_URL: &str = "http://localhost:8000";

// Fallback to compile-time env vars (injected by CI) if DB settings are missing
const COMPILE_CLIENT_ID: Option<&str> = option_env!("GOOGLE_CLIENT_ID");
const COMPILE_CLIENT_SECRET: Option<&str> = option_env!("GOOGLE_CLIENT_SECRET");

pub fn start_auth_flow() -> Result<String, String> {
    // 1. Try DB Settings
    let db_client_id = db::get_setting("google_client_id");
    let db_client_secret = db::get_setting("google_client_secret");

    // 2. Fallback to Compiled-in Defaults
    let client_id = db_client_id
        .or(COMPILE_CLIENT_ID.map(|s| s.to_string()))
        .ok_or(
        "Missing Google Client ID. Configure in Settings (Cloud & Data) or build with env vars.",
    )?;

    let client_secret = db_client_secret.or(COMPILE_CLIENT_SECRET.map(|s| s.to_string()))
        .ok_or("Missing Google Client Secret. Configure in Settings (Cloud & Data) or build with env vars.")?;

    let client = BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        AuthUrl::new(AUTH_URL.to_string()).map_err(|e| e.to_string())?,
        Some(TokenUrl::new(TOKEN_URL.to_string()).map_err(|e| e.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(REDIRECT_URL.to_string()).map_err(|e| e.to_string())?);

    // PKCE
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    // Generate Auth URL
    let (auth_url, _csrf_state) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new(
            "https://www.googleapis.com/auth/drive.file".to_string(),
        ))
        .add_scope(Scope::new(
            "https://www.googleapis.com/auth/userinfo.email".to_string(),
        ))
        .set_pkce_challenge(pkce_challenge)
        .url();

    // Start temporary server to listen for callback
    // We spawn a thread that waits for the request
    let server = Server::http("0.0.0.0:8000").map_err(|e| e.to_string())?;

    // Open the browser
    if let Err(e) = opener::open(auth_url.to_string()) {
        return Err(format!("Failed to open browser: {}", e));
    }

    // This is a simplified blocking wait for demo purposes.
    // In a real app, you might want a timeout.
    // For now, we block this thread (which is spawned by tauri command usually)

    // Actually, tauri commands are async or run on thread pool.

    // Handle ONE request
    if let Ok(request) = server.recv() {
        let url = request.url().to_string();

        // Parse code (very primitive parsing)
        if url.contains("code=") {
            let code_pair = url.split("code=").nth(1).unwrap_or("");
            let code = code_pair.split('&').next().unwrap_or("");

            let _ = request.respond(Response::from_string("<html><body><h1>Login Successful!</h1><p>You can close this tab and return to TimiGS.</p><script>window.close()</script></body></html>").with_header(tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap()));

            // Exchange code
            let token_result = client
                .exchange_code(AuthorizationCode::new(code.to_string()))
                .set_pkce_verifier(pkce_verifier)
                .request(http_client)
                .map_err(|e| e.to_string())?;

            let access = token_result.access_token().secret().to_string();
            let refresh = token_result
                .refresh_token()
                .map(|t| t.secret().clone())
                .unwrap_or_default();

            // Fetch User Info to get Email
            let client_http = reqwest::blocking::Client::new();
            let user_info_res = client_http
                .get("https://www.googleapis.com/oauth2/v2/userinfo")
                .header("Authorization", format!("Bearer {}", access))
                .send()
                .map_err(|e| e.to_string())?;

            if user_info_res.status().is_success() {
                let user_info: serde_json::Value =
                    user_info_res.json().map_err(|e| e.to_string())?;
                let email = user_info["email"].as_str().unwrap_or("unknown@gmail.com");

                // Save to Cloud Accounts Table
                db::add_cloud_account(email, "google", &access, &refresh)
                    .map_err(|e| e.to_string())?;
            } else {
                return Err("Failed to fetch user info".to_string());
            }

            return Ok("Successfully authenticated".to_string());
        } else {
            let _ = request.respond(Response::from_string("Login Failed"));
            return Err("No code found in callback".to_string());
        }
    }

    Err("Server timeout or error".to_string())
}

// Function to refresh token if needed
pub fn get_valid_token() -> Result<String, String> {
    // Logic: Get access token, try to use it. If 401, use refresh token to get new one.
    // Simplifying: Just return stored access token for now.
    // Real implementation requires check expiration or reactive refresh.

    // For now, let's implement refresh logic if we had expiration time.
    // But we simpler: just return what we have.

    db::get_setting("google_access_token").ok_or("No token found".to_string())
}
