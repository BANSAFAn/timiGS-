# Contributing to TimiGS Android

Thank you for your interest in contributing to TimiGS Android!

## Development Setup

1. **Install Flutter SDK**
   ```bash
   # Download from https://flutter.dev/docs/get-started/install
   flutter doctor
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/timiGS-.git
   cd timiGS-/timigs-android
   ```

3. **Install dependencies**
   ```bash
   flutter pub get
   ```

4. **Run the app**
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── models/       # Data models
├── services/     # Business logic
├── screens/      # UI screens
└── l10n/         # Translations
```

## Code Style

- Follow [Effective Dart](https://dart.dev/guides/language/effective-dart) guidelines
- Use `flutter analyze` to check for issues
- Format code with `flutter format .`

## Adding Features

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Testing

```bash
# Run tests
flutter test

# Run on device
flutter run --release
```

## Translations

To add a new language:

1. Create `lib/l10n/app_XX.arb` (where XX is language code)
2. Copy keys from `app_en.arb`
3. Translate values
4. Update `l10n.yaml` if needed

## Reporting Issues

Please include:
- Android version
- Device model
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
