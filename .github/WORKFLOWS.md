# GitHub Actions CI/CD Configuration

## Workflows

### 1. `flutter-android.yml` - Flutter Android Build
**NEW** - Builds Flutter Android APK and AAB

- **Triggers:** Push to any branch, PRs, manual dispatch
- **Outputs:**
  - Debug APK (for non-main branches)
  - Release APK (for main branch)
  - Release AAB (for main branch, Google Play)
- **Artifacts:** Uploaded as `flutter-android-apk` and `flutter-android-bundle`

### 2. `release.yml` - Desktop & Release Management
- **Desktop builds:** Windows, Linux, macOS (Tauri)
- **Android build:** DISABLED (commented out, replaced by Flutter)
- **Release management:** Uses release-please for versioning

### 3. `ci.yml` - Code Quality Checks
- Security audit (Rust dependencies)
- Linting and formatting (Rust, Node.js)
- Build verification for desktop platforms

## Flutter Android Build Details

The new Flutter Android workflow:
- Uses Flutter 3.24.0 (stable)
- Java 17 (Temurin)
- Runs `flutter analyze` and `flutter test`
- Builds both APK and AAB for releases
- Automatically uploads artifacts

## Migration Notes

The Tauri Android build in `release.yml` has been **disabled** and replaced with a dedicated Flutter workflow. The old Tauri build code is commented out for reference but will not execute.

## Next Steps

1. Push these changes to trigger the new workflow
2. Check GitHub Actions tab for build results
3. Download APKs from the Artifacts section
4. For releases, APKs will be attached to GitHub releases automatically
