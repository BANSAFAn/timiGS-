
use oauth2::{
    basic::BasicClient,
    reqwest::http_client,
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken,
    PkceCodeChallenge, RedirectUrl, Scope, TokenResponse, TokenUrl,
};
use std::sync::{Arc, Mutex};
use tiny_http::{Server, Response};
use crate::db;


// TODO: User must replace these with their own credentials from Google Cloud Console
const GOOGLE_CLIENT_ID: &str = "YOUR_CLIENT_ID_HERE";
const GOOGLE_CLIENT_SECRET: &str = "YOUR_CLIENT_SECRET_HERE";
const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL: &str = "https://www.googleapis.com/oauth2/v3/token";
const REDIRECT_URL: &str = "http://localhost:8000";

pub fn start_auth_flow() -> Result<String, String> {
    // Check if placeholders are still present
    if GOOGLE_CLIENT_ID == "YOUR_CLIENT_ID_HERE" {
        return Err("Missing Google Credentials. Please configure them in auth.rs".to_string());
    }

    let client = BasicClient::new(
        ClientId::new(GOOGLE_CLIENT_ID.to_string()),
        Some(ClientSecret::new(GOOGLE_CLIENT_SECRET.to_string())),
        AuthUrl::new(AUTH_URL.to_string()).map_err(|e| e.to_string())?,
        Some(TokenUrl::new(TOKEN_URL.to_string()).map_err(|e| e.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(REDIRECT_URL.to_string()).map_err(|e| e.to_string())?);

    // PKCE
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    // Generate Auth URL
    let (auth_url, _csrf_state) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("https://www.googleapis.com/auth/drive.file".to_string()))
        .add_scope(Scope::new("https://www.googleapis.com/auth/userinfo.email".to_string()))
        .set_pkce_challenge(pkce_challenge)
        .url();

    // Start temporary server to listen for callback
    // We spawn a thread that waits for the request
    let server = Server::http("0.0.0.0:8000").map_err(|e| e.to_string())?;
    
    // Open the browser
    if let Err(e) = opener::open(auth_url.to_string()) {
        return Err(format!("Failed to open browser: {}", e));
    }

    let guard = Arc::new(Mutex::new(None));
    let result_guard = guard.clone();

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
                
            // Save tokens to DB
            let access = token_result.access_token().secret();
            let refresh = token_result.refresh_token().map(|t| t.secret().clone()).unwrap_or_default();
            
            db::save_setting("google_access_token", access).map_err(|e| e.to_string())?;
            if !refresh.is_empty() {
                db::save_setting("google_refresh_token", &refresh).map_err(|e| e.to_string())?;
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
