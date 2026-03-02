use once_cell::sync::Lazy;
use parking_lot::{Mutex, RwLock};
use rodio::{Decoder, OutputStream, Sink};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{BufReader, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MusicFile {
    pub filename: String,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MusicPlaybackStatus {
    pub is_playing: bool,
    pub current_track: Option<String>,
    pub volume: f32,
}

struct MusicState {
    current_track: Option<String>,
    is_playing: bool,
    volume: f32,
    output_stream: Option<OutputStream>,
    sink: Option<Sink>,
}

unsafe impl Send for MusicState {}
unsafe impl Sync for MusicState {}

static MUSIC_STATE: Lazy<Mutex<MusicState>> = Lazy::new(|| {
    Mutex::new(MusicState {
        current_track: None,
        is_playing: false,
        volume: 0.5,
        output_stream: None,
        sink: None,
    })
});

static LOOP_ENABLED: AtomicBool = AtomicBool::new(false);

// Store custom music paths
static MUSIC_PATHS: Lazy<RwLock<Vec<String>>> = Lazy::new(|| RwLock::new(Vec::new()));

fn get_music_paths_file(app_handle: &AppHandle) -> PathBuf {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    app_data_dir.join("music_paths.json")
}

pub fn load_music_paths(app_handle: &AppHandle) {
    let paths_file = get_music_paths_file(app_handle);
    if paths_file.exists() {
        if let Ok(content) = fs::read_to_string(&paths_file) {
            if let Ok(paths) = serde_json::from_str::<Vec<String>>(&content) {
                *MUSIC_PATHS.write() = paths;
            }
        }
    }
}

pub fn save_music_paths(app_handle: &AppHandle) -> Result<(), String> {
    let paths_file = get_music_paths_file(app_handle);
    let paths = MUSIC_PATHS.read();
    let json = serde_json::to_string_pretty(&*paths).map_err(|e| e.to_string())?;
    let mut file = fs::File::create(&paths_file).map_err(|e| e.to_string())?;
    file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_music_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to resolve app data directory".to_string())?;

    let music_dir = app_data_dir.join("music");

    if !music_dir.exists() {
        fs::create_dir_all(&music_dir)
            .map_err(|e| format!("Failed to create music directory: {}", e))?;
    }

    Ok(music_dir)
}

pub fn init_music_dir(app_handle: &AppHandle) -> Result<(), String> {
    // Just ensure it exists
    let _ = get_music_dir(app_handle)?;
    Ok(())
}

pub fn get_music_files(app_handle: &AppHandle) -> Result<Vec<MusicFile>, String> {
    let mut files = Vec::new();
    
    // Get files from music directory
    let music_dir = get_music_dir(&app_handle)?;
    if let Ok(entries) = fs::read_dir(music_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let ext = ext.to_lowercase();
                    if ext == "mp3" || ext == "wav" || ext == "ogg" || ext == "flac" {
                        if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                            files.push(MusicFile {
                                filename: filename.to_string(),
                                path: path.to_string_lossy().to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    // Add custom paths
    let custom_paths = MUSIC_PATHS.read();
    for path_str in custom_paths.iter() {
        let path = Path::new(path_str);
        if path.exists() && path.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext = ext.to_lowercase();
                if ext == "mp3" || ext == "wav" || ext == "ogg" || ext == "flac" {
                    if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                        // Check if not already in files
                        if !files.iter().any(|f| f.path == *path_str) {
                            files.push(MusicFile {
                                filename: filename.to_string(),
                                path: path_str.clone(),
                            });
                        }
                    }
                }
            }
        }
    }

    // Sort alphabetically
    files.sort_by(|a, b| a.filename.cmp(&b.filename));
    Ok(files)
}

pub fn add_music_path(app_handle: &AppHandle, source_path: String) -> Result<MusicFile, String> {
    let source = Path::new(&source_path);

    if !source.exists() || !source.is_file() {
        return Err("Source file does not exist".to_string());
    }

    let filename = source
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid file name".to_string())?;

    // Add to custom paths
    {
        let mut paths = MUSIC_PATHS.write();
        if !paths.contains(&source_path) {
            paths.push(source_path.clone());
        }
    }
    
    // Save to file
    save_music_paths(&app_handle)?;

    Ok(MusicFile {
        filename: filename.to_string(),
        path: source_path,
    })
}

pub fn remove_music_path(app_handle: &AppHandle, path: String) -> Result<(), String> {
    {
        let mut paths = MUSIC_PATHS.write();
        if let Some(pos) = paths.iter().position(|p| *p == path) {
            paths.remove(pos);
        }
    }
    save_music_paths(&app_handle)?;
    Ok(())
}

pub fn delete_music_file(app_handle: &AppHandle, filename: &str) -> Result<(), String> {
    let music_dir = get_music_dir(&app_handle)?;
    let target_path = music_dir.join(filename);

    if target_path.exists() {
        fs::remove_file(target_path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(())
}

pub fn open_music_folder(app_handle: &AppHandle) -> Result<(), String> {
    let music_dir = get_music_dir(&app_handle)?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(music_dir)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(music_dir)
            .spawn()
            .map_err(|e| format!("Failed to open finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(music_dir)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(())
}

// ── Music Playback Functions ──

use std::time::Duration;

pub fn play_music(app_handle: &AppHandle, file_path: &str) -> Result<(), String> {
    // Try to open the file directly first (for custom paths)
    let path = Path::new(file_path);
    
    // If file doesn't exist at given path, try music directory
    let actual_path = if path.exists() {
        path.to_path_buf()
    } else {
        let music_dir = get_music_dir(app_handle)?;
        let track_path = music_dir.join(file_path);
        if !track_path.exists() {
            return Err("Track file not found".to_string());
        }
        track_path
    };

    let file = std::fs::File::open(&actual_path)
        .map_err(|e| format!("Failed to open track file: {}", e))?;
    let buf_reader = BufReader::new(file);

    let (output_stream, stream_handle) = OutputStream::try_default()
        .map_err(|e| format!("Failed to create audio output: {}", e))?;

    let source = Decoder::new(buf_reader)
        .map_err(|e| format!("Failed to decode audio: {}", e))?;

    let sink = Sink::try_new(&stream_handle)
        .map_err(|e| format!("Failed to create audio sink: {}", e))?;

    let filename = actual_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(file_path)
        .to_string();

    {
        let mut state = MUSIC_STATE.lock();
        state.output_stream = Some(output_stream);
        state.sink = Some(sink);
        state.current_track = Some(filename.clone());
        state.is_playing = true;
    }

    if let Some(sink) = MUSIC_STATE.lock().sink.as_ref() {
        sink.append(source);
        sink.set_volume(0.5);
    }

    let path_clone = actual_path.to_string_lossy().to_string();
    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        loop {
            {
                let state = MUSIC_STATE.lock();
                if !state.is_playing {
                    break;
                }
                if let Some(sink) = state.sink.as_ref() {
                    if sink.empty() {
                        if LOOP_ENABLED.load(Ordering::SeqCst) {
                            drop(state);
                            let _ = play_music(&app_handle_clone, &path_clone);
                        } else {
                            let mut state = MUSIC_STATE.lock();
                            state.is_playing = false;
                            state.current_track = None;
                        }
                        break;
                    }
                } else {
                    break;
                }
            }
            thread::sleep(Duration::from_millis(100));
        }
    });

    Ok(())
}

pub fn pause_music() -> Result<(), String> {
    let mut state = MUSIC_STATE.lock();
    if let Some(sink) = state.sink.as_ref() {
        sink.pause();
        state.is_playing = false;
    }
    Ok(())
}

pub fn resume_music() -> Result<(), String> {
    let mut state = MUSIC_STATE.lock();
    if let Some(sink) = state.sink.as_ref() {
        sink.play();
        state.is_playing = true;
    }
    Ok(())
}

pub fn stop_music() -> Result<(), String> {
    let mut state = MUSIC_STATE.lock();
    if let Some(sink) = state.sink.take() {
        sink.stop();
    }
    state.output_stream = None;
    state.sink = None;
    state.current_track = None;
    state.is_playing = false;
    Ok(())
}

pub fn get_music_status() -> Result<MusicPlaybackStatus, String> {
    let state = MUSIC_STATE.lock();
    Ok(MusicPlaybackStatus {
        is_playing: state.is_playing,
        current_track: state.current_track.clone(),
        volume: state.volume,
    })
}

pub fn set_music_volume(volume: f32) -> Result<(), String> {
    let mut state = MUSIC_STATE.lock();
    state.volume = volume.clamp(0.0, 1.0);
    if let Some(sink) = state.sink.as_ref() {
        sink.set_volume(state.volume);
    }
    Ok(())
}

pub fn toggle_music_loop() -> Result<bool, String> {
    let new_state = !LOOP_ENABLED.load(Ordering::SeqCst);
    LOOP_ENABLED.store(new_state, Ordering::SeqCst);
    Ok(new_state)
}
