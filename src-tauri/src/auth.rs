use oauth2::{
    basic::BasicClient, reqwest::http_client, AuthUrl, AuthorizationCode, ClientId, ClientSecret,
    CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, Scope, TokenResponse, TokenUrl,
};

use crate::db;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use tiny_http::{Response, Server};

// TODO: Replace with env vars or settings
const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL: &str = "https://www.googleapis.com/oauth2/v3/token";
const REDIRECT_URL_DESKTOP: &str = "http://localhost:8000";
const REDIRECT_URL_MOBILE: &str = "timigs://callback";

const COMPILE_CLIENT_ID: Option<&str> = option_env!("GOOGLE_CLIENT_ID");
const COMPILE_CLIENT_SECRET: Option<&str> = option_env!("GOOGLE_CLIENT_SECRET");

// Store PKCE Verifier for Mobile Flow (Async)
static PKCE_VERIFIER: Lazy<Mutex<Option<PkceCodeVerifier>>> = Lazy::new(|| Mutex::new(None));

fn get_client() -> Result<BasicClient, String> {
    let db_client_id = db::get_setting("google_client_id");
    let db_client_secret = db::get_setting("google_client_secret");

    let client_id = db_client_id
        .or(COMPILE_CLIENT_ID.map(|s| s.to_string()))
        .ok_or("Missing Google Client ID")?;

    let client_secret = db_client_secret
        .or(COMPILE_CLIENT_SECRET.map(|s| s.to_string()))
        .ok_or("Missing Google Client Secret")?;

    let redirect_url = if cfg!(target_os = "android") {
        REDIRECT_URL_MOBILE
    } else {
        REDIRECT_URL_DESKTOP
    };

    BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        AuthUrl::new(AUTH_URL.to_string()).map_err(|e| e.to_string())?,
        Some(TokenUrl::new(TOKEN_URL.to_string()).map_err(|e| e.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_url.to_string()).map_err(|e| e.to_string())?)
    .map_err(|e| e.to_string())
}

pub fn start_auth_flow() -> Result<String, String> {
    let client = get_client()?;

    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

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

    // On Android, we save verifier and open URL, then return (waiting for Deep Link)
    #[cfg(target_os = "android")]
    {
        *PKCE_VERIFIER.lock() = Some(pkce_verifier);
        if let Err(e) = opener::open(auth_url.to_string()) {
            return Err(format!("Failed to open browser: {}", e));
        }
        return Ok("Auth started on mobile. Please check browser.".to_string());
    }

    // On Desktop, we keep blocking flow with local server
    #[cfg(not(target_os = "android"))]
    {
        let server = Server::http("0.0.0.0:8000").map_err(|e| e.to_string())?;

        if let Err(e) = opener::open(auth_url.to_string()) {
            return Err(format!("Failed to open browser: {}", e));
        }

        if let Ok(request) = server.recv() {
            let url = request.url().to_string();
            if url.contains("code=") {
                let code_pair = url.split("code=").nth(1).unwrap_or("");
                let code = code_pair.split('&').next().unwrap_or("");

                let _ = request.respond(
                    Response::from_string("Login Successful! You can close this tab.").with_header(
                        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..])
                            .unwrap(),
                    ),
                );

                // Exchange
                return exchange_code_internal(code.to_string(), pkce_verifier);
            }
        }
        Err("Server timeout".to_string())
    }
}

pub fn exchange_auth_code(code: String) -> Result<String, String> {
    let verifier_opt = PKCE_VERIFIER.lock().take();
    let verifier = verifier_opt.ok_or("No PKCE verifier found. Restart auth.")?;
    exchange_code_internal(code, verifier)
}

fn exchange_code_internal(code: String, verifier: PkceCodeVerifier) -> Result<String, String> {
    let client = get_client()?;

    let token_result = client
        .exchange_code(AuthorizationCode::new(code))
        .set_pkce_verifier(verifier)
        .request(http_client)
        .map_err(|e| e.to_string())?;

    let access = token_result.access_token().secret().to_string();
    let refresh = token_result
        .refresh_token()
        .map(|t| t.secret().clone())
        .unwrap_or_default();

    // Fetch User Info
    let client_http = reqwest::blocking::Client::new();
    let user_info_res = client_http
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .header("Authorization", format!("Bearer {}", access))
        .send()
        .map_err(|e| e.to_string())?;

    if user_info_res.status().is_success() {
        let user_info: serde_json::Value = user_info_res.json().map_err(|e| e.to_string())?;
        let email = user_info["email"].as_str().unwrap_or("unknown@gmail.com");

        db::add_cloud_account(email, "google", &access, &refresh).map_err(|e| e.to_string())?;

        Ok("Successfully authenticated".to_string())
    } else {
        Err("Failed to fetch user info".to_string())
    }
}

pub fn get_valid_token() -> Result<String, String> {
    db::get_setting("google_access_token").ok_or("No token found".to_string())
}
