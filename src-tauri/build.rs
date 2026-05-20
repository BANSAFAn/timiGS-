fn main() {
    dotenv::dotenv().ok();
    tauri_build::build()
}
