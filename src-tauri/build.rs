fn main() {
    dotenv::dotenv().ok();

    // Pass environment variables to the Rust compiler
    for key in [
        "DISCORD_CLIENT_ID",
    ] {
        if let Ok(val) = std::env::var(key) {
            println!("cargo:rustc-env={}={}", key, val);
        }
    }

    tauri_build::build()
}
