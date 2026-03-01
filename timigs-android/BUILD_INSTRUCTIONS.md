# Build Instructions for TimiGS Android

## Prerequisites

Before building the application, ensure you have the following installed:

1. **Flutter SDK** (3.0.0 or higher)
   - Download from: https://flutter.dev/docs/get-started/install
   - Add Flutter to your PATH

2. **Android SDK**
   - Android Studio or Android SDK Command-line tools
   - SDK Platform 34 (Android 14)
   - SDK Build-Tools 34.0.0

3. **Java Development Kit (JDK)**
   - JDK 11 or higher

## Installation Steps

### 1. Install Flutter

```bash
# Download Flutter SDK and extract it
# Add Flutter to PATH (Windows)
set PATH=%PATH%;C:\path\to\flutter\bin

# Verify installation
flutter doctor
```

### 2. Install Dependencies

Navigate to the project directory and run:

```bash
cd timigs-android
flutter pub get
```

This will download all required packages specified in `pubspec.yaml`.

### 3. Configure Android SDK

Ensure Android SDK is properly configured:

```bash
flutter doctor --android-licenses
```

Accept all licenses when prompted.

## Building the Application

### Option 1: Using the Build Script (Windows)

Simply double-click `build.bat` or run:

```bash
build.bat
```

The script will:
1. Install dependencies
2. Build the release APK
3. Show the location of the generated APK

### Option 2: Manual Build

#### Build APK (Release)

```bash
flutter build apk --release
```

The APK will be located at:
```
build/app/outputs/flutter-apk/app-release.apk
```

#### Build App Bundle (for Google Play)

```bash
flutter build appbundle --release
```

The AAB will be located at:
```
build/app/outputs/bundle/release/app-release.aab
```

#### Build APK (Debug)

```bash
flutter build apk --debug
```

## Running on Device/Emulator

### Connect Android Device

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Verify connection:

```bash
flutter devices
```

### Run the App

```bash
flutter run
```

Or for release mode:

```bash
flutter run --release
```

## Installing the APK

### Method 1: ADB Install

```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

### Method 2: Manual Install

1. Copy `app-release.apk` to your Android device
2. Open the APK file on your device
3. Allow installation from unknown sources if prompted
4. Install the application

## Troubleshooting

### Flutter Doctor Issues

If `flutter doctor` shows issues, resolve them before building:

```bash
flutter doctor -v
```

### Gradle Build Errors

If you encounter Gradle errors:

```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

### Permission Errors

The app requires `PACKAGE_USAGE_STATS` permission. Users must grant this manually:

1. Open Settings on Android device
2. Go to Apps → Special app access → Usage access
3. Enable TimiGS

## Build Variants

### Split APKs by ABI

To reduce APK size, build separate APKs for different architectures:

```bash
flutter build apk --split-per-abi
```

This creates:
- `app-armeabi-v7a-release.apk` (32-bit ARM)
- `app-arm64-v8a-release.apk` (64-bit ARM)
- `app-x86_64-release.apk` (64-bit Intel)

## Signing the APK (Production)

For production releases, create a keystore and sign the APK:

1. Create keystore:

```bash
keytool -genkey -v -keystore timigs-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias timigs
```

2. Create `android/key.properties`:

```properties
storePassword=<password>
keyPassword=<password>
keyAlias=timigs
storeFile=<path-to-keystore>/timigs-release.jks
```

3. Update `android/app/build.gradle` to use the keystore

4. Build signed APK:

```bash
flutter build apk --release
```

## File Sizes

Expected APK sizes:
- Release APK: ~40-50 MB
- Debug APK: ~60-70 MB
- App Bundle: ~35-45 MB

## Next Steps

After successful build:

1. Test the APK on multiple devices
2. Verify all permissions work correctly
3. Test activity tracking functionality
4. Check database operations
5. Verify Google Drive sync (if configured)

## Support

For issues or questions:
- Check Flutter documentation: https://flutter.dev/docs
- Review Android documentation: https://developer.android.com
- Check project README: README.md
