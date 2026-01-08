const fs = require('fs');
const path = require('path');

const manifestPath = path.join('src-tauri', 'gen', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.error(`AndroidManifest.xml not found at: ${manifestPath}`);
  process.exit(1);
}

let content = fs.readFileSync(manifestPath, 'utf8');
console.log('Found AndroidManifest.xml, patching...');

// 1. Inject Deep Link Intent Filter for timigs://callback
if (!content.includes('android:scheme="timigs"')) {
  const intentFilter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="timigs" android:host="callback" />
            </intent-filter>
  `;
  // Insert inside <activity>
  content = content.replace('</activity>', `${intentFilter}\n        </activity>`);
  console.log('Injected Deep Link Intent Filter.');
}

// 2. Inject Permissions for Background Service (Foreground Service)
const permissions = `
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
`;

if (!content.includes('android.permission.FOREGROUND_SERVICE')) {
    content = content.replace('<application', `${permissions}\n    <application`);
    console.log('Injected Foreground Service permissions.');
}

fs.writeFileSync(manifestPath, content);
console.log('AndroidManifest.xml patched successfully.');
