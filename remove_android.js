const fs = require('fs');
const path = require('path');

// Process JSON files
const jsonDir = path.join(__dirname, 'site', 'src', 'i18n', 'translations');
if (fs.existsSync(jsonDir)) {
  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(jsonDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let modified = false;

      if (data.downloads) {
        if (data.downloads.android !== undefined) { delete data.downloads.android; modified = true; }
        if (data.downloads.android_desc !== undefined) { delete data.downloads.android_desc; modified = true; }
        if (data.downloads.android_alpha_badge !== undefined) { delete data.downloads.android_alpha_badge; modified = true; }
        if (data.downloads.android_alpha_warning !== undefined) { delete data.downloads.android_alpha_warning; modified = true; }
      }
      
      if (data.comparison && data.comparison.features && data.comparison.features.android !== undefined) {
        delete data.comparison.features.android;
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
        console.log(`Updated ${file}`);
      }
    } catch(err) {
      console.error(`Error processing ${file}: ${err}`);
    }
  }
}

// Process translations.ts
const tsPath = path.join(__dirname, 'site', 'src', 'i18n', 'translations.ts');
if (fs.existsSync(tsPath)) {
  let tsContent = fs.readFileSync(tsPath, 'utf8');
  let newContent = tsContent.replace(/android:\s*'[^']*',\s*android_desc:\s*'[^']*',\s*android_alpha_badge:\s*'[^']*',\s*android_alpha_warning:\s*'[^']*',\s*/g, '');
  if (tsContent !== newContent) {
    fs.writeFileSync(tsPath, newContent);
    console.log('Updated translations.ts');
  }
}
