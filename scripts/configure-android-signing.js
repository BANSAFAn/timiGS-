const fs = require('fs');
const path = require('path');

const gradlePath = path.join('src-tauri', 'gen', 'android', 'app', 'build.gradle.kts');

if (!fs.existsSync(gradlePath)) {
  console.error(`Gradle file not found at: ${gradlePath}`);
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, 'utf8');

console.log('Found build.gradle.kts, configuring signing...');

// Check if signing config is already set
if (!content.includes('signingConfig = signingConfigs.getByName("debug")')) {
  // We want to make sure the release build uses the debug signing key (so it's signed)
  // Standard Tauri/Android template usually has:
  // buildTypes {
  //     getByName("release") {
  //         isMinifyEnabled = true
  //         proguardFiles(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro")
  //     }
  // }
  
  // We will replace 'getByName("release") {' with 'getByName("release") { signingConfig = signingConfigs.getByName("debug")'
  
  const regex = /getByName\("release"\)\s*\{/;
  if (regex.test(content)) {
    content = content.replace(regex, 'getByName("release") {\n            signingConfig = signingConfigs.getByName("debug")');
    fs.writeFileSync(gradlePath, content);
    console.log('Successfully configured release build to use debug signing.');
  } else {
    // Fallback: try to append it if structure is different
    // Or just append a block at the end? No, must be inside android { ... }
    console.warn('Could not find standard release block. Attempting regex for buildTypes.');
    
    // Kotlin DSL: android { ... buildTypes { ... } }
    
    console.error('Failed to inject signing config: Regex match failed.');
    // Don't fail the build, just warn. Inspecting content might be needed if this fails.
    console.log('Current Content Snippet:', content.substring(0, 500));
  }
} else {
  console.log('Signing config already present.');
}
