use oauth2::{
    basic::BasicClient, reqwest::http_client, AuthUrl, AuthorizationCode, ClientId, ClientSecret,
    CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, Scope, TokenResponse, TokenUrl,
};

use crate::db;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
#[cfg(not(target_os = "android"))]
use tiny_http::{Response, Server};

const GITHUB_AUTH_URL: &str = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL: &str = "https://github.com/login/oauth/access_token";
const REDIRECT_URL_DESKTOP: &str = "http://localhost:8001";
const REDIRECT_URL_MOBILE: &str = "timigs://github-callback";

const COMPILE_GITHUB_CLIENT_ID: Option<&str> = option_env!("GITHUB_CLIENT_ID");
const COMPILE_GITHUB_CLIENT_SECRET: Option<&str> = option_env!("GITHUB_CLIENT_SECRET");

static GITHUB_PKCE_VERIFIER: Lazy<Mutex<Option<PkceCodeVerifier>>> = Lazy::new(|| Mutex::new(None));

fn get_github_client() -> Result<BasicClient, String> {
    let db_client_id = db::get_setting("github_client_id");
    let db_client_secret = db::get_setting("github_client_secret");

    let client_id = db_client_id
        .or(COMPILE_GITHUB_CLIENT_ID.map(|s| s.to_string()))
        .ok_or("Missing GitHub Client ID. Please set it in Settings.")?;

    let client_secret = db_client_secret
        .or(COMPILE_GITHUB_CLIENT_SECRET.map(|s| s.to_string()))
        .ok_or("Missing GitHub Client Secret. Please set it in Settings.")?;

    let redirect_url = if cfg!(target_os = "android") {
        REDIRECT_URL_MOBILE
    } else {
        REDIRECT_URL_DESKTOP
    };

    Ok(BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        AuthUrl::new(GITHUB_AUTH_URL.to_string()).map_err(|e| e.to_string())?,
        Some(TokenUrl::new(GITHUB_TOKEN_URL.to_string()).map_err(|e| e.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_url.to_string()).map_err(|e| e.to_string())?))
}

pub fn start_github_auth_flow() -> Result<String, String> {
    let client = get_github_client()?;

    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let (auth_url, _csrf_state) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("read:user".to_string()))
        .add_scope(Scope::new("repo".to_string()))
        .add_scope(Scope::new("read:org".to_string()))
        .add_scope(Scope::new("project".to_string()))
        .set_pkce_challenge(pkce_challenge)
        .url();

    #[cfg(target_os = "android")]
    {
        *GITHUB_PKCE_VERIFIER.lock() = Some(pkce_verifier);
        if let Err(e) = opener::open(auth_url.to_string()) {
            return Err(format!("Failed to open browser: {}", e));
        }
        return Ok("Auth started on mobile. Please check browser.".to_string());
    }

    #[cfg(not(target_os = "android"))]
    {
        let server = Server::http("0.0.0.0:8001").map_err(|e| e.to_string())?;

        if let Err(e) = opener::open(auth_url.to_string()) {
            return Err(format!("Failed to open browser: {}", e));
        }

        if let Ok(request) = server.recv() {
            let url = request.url().to_string();
            if url.contains("code=") {
                let code_pair = url.split("code=").nth(1).unwrap_or("");
                let code = code_pair.split('&').next().unwrap_or("");

                let success_html = r#"
<!DOCTYPE html>
<html>
<head>
    <title>GitHub Connected</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #0f172a;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            overflow: hidden;
        }
        .container {
            text-align: center;
            position: relative;
        }
        .circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: rgba(99, 102, 241, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 30px;
            position: relative;
            box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
            animation: pulse 2s infinite;
        }
        .github-icon {
            width: 80px;
            height: 80px;
            fill: white;
            opacity: 0;
            animation: fadeUp 0.8s 0.3s forwards;
        }
        h1 { font-size: 2.5rem; margin: 0 0 10px; opacity: 0; animation: fadeUp 0.8s 0.6s forwards; }
        p { color: #94a3b8; font-size: 1.1rem; opacity: 0; animation: fadeUp 0.8s 0.8s forwards; }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            70% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
            100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .bg-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(99,102,241,0.05) 0%, rgba(0,0,0,0) 70%);
            z-index: -1;
        }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="container">
        <div class="circle">
            <svg class="github-icon" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
        </div>
        <h1>GitHub Connected!</h1>
        <p>You can close this tab and return to TimiGS</p>
    </div>
    <script>
        setTimeout(() => {
            window.close();
        }, 5000);
    </script>
</body>
</html>
                "#;
                let _ = request.respond(Response::from_string(success_html).with_header(
                    tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap(),
                ));

                return exchange_github_code_internal(code.to_string(), pkce_verifier);
            }
        }
        Err("Server timeout".to_string())
    }
}

pub fn exchange_github_auth_code(code: String) -> Result<String, String> {
    let verifier_opt = GITHUB_PKCE_VERIFIER.lock().take();
    let verifier = verifier_opt.ok_or("No PKCE verifier found. Restart auth.")?;
    exchange_github_code_internal(code, verifier)
}

fn exchange_github_code_internal(
    code: String,
    verifier: PkceCodeVerifier,
) -> Result<String, String> {
    let client = get_github_client()?;

    let token_result = client
        .exchange_code(AuthorizationCode::new(code))
        .set_pkce_verifier(verifier)
        .request(http_client)
        .map_err(|e| format!("Token exchange failed: {}", e))?;

    let access_token = token_result.access_token().secret().to_string();

    // Fetch GitHub user info
    let client_http = reqwest::blocking::Client::new();
    let user_info_res = client_http
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {}", access_token))
        .header("User-Agent", "TimiGS")
        .header("Accept", "application/json")
        .send()
        .map_err(|e| e.to_string())?;

    if user_info_res.status().is_success() {
        let user_info: serde_json::Value = user_info_res.json().map_err(|e| e.to_string())?;
        let login = user_info["login"].as_str().unwrap_or("unknown");
        let email = user_info["email"].as_str().unwrap_or(login);

        // Store as cloud account with provider "github"
        db::add_cloud_account(email, "github", &access_token, "").map_err(|e| e.to_string())?;

        Ok(serde_json::json!({
            "login": login,
            "email": email,
            "name": user_info["name"].as_str().unwrap_or(login),
            "avatar_url": user_info["avatar_url"].as_str().unwrap_or(""),
        })
        .to_string())
    } else {
        Err(format!(
            "Failed to fetch GitHub user info: {}",
            user_info_res.status()
        ))
    }
}

pub fn get_github_token() -> Result<String, String> {
    // Look for a github cloud account
    let accounts = db::get_cloud_accounts().map_err(|e| e.to_string())?;
    for account in accounts {
        if account.provider == "github" {
            let (token, _) = db::get_cloud_token(account.id).map_err(|e| e.to_string())?;
            return Ok(token);
        }
    }
    Err("No GitHub account connected".to_string())
}

pub fn get_github_account() -> Option<serde_json::Value> {
    let accounts = db::get_cloud_accounts().ok()?;
    for account in accounts {
        if account.provider == "github" {
            let (token, _) = db::get_cloud_token(account.id).ok()?;
            return Some(serde_json::json!({
                "id": account.id,
                "email": account.email,
                "token": token,
            }));
        }
    }
    None
}

pub fn remove_github_account() -> Result<(), String> {
    let accounts = db::get_cloud_accounts().map_err(|e| e.to_string())?;
    for account in accounts {
        if account.provider == "github" {
            db::remove_cloud_account(account.id).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
