import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIR = path.join(__dirname, 'src', 'components');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walk(dirPath, callback) : callback(dirPath);
  });
}

walk(DIR, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('@phosphor-icons/react')) {
      const regex = /import\s+\{([^}]+)\}\s+from\s+['"]@phosphor-icons\/react['"];?/g;
      content = content.replace(regex, (match, importsStr) => {
        let fixed = importsStr.split(',').map(s => s.trim()).filter(Boolean);
        fixed = fixed.map(im => {
          if (im === 'Sparkles') return 'Sparkle as Sparkles';
          if (im === 'CheckCircle2') return 'CheckCircle as CheckCircle2';
          if (im === 'Apple') return 'AppleLogo as Apple';
          if (im === 'AlertTriangle') return 'Warning as AlertTriangle';
          if (im === 'MessageSquare') return 'ChatCircle as MessageSquare';
          if (im === 'LayoutDashboard') return 'SquaresFour as LayoutDashboard';
          return im;
        });
        return `import { ${fixed.join(', ')} } from '@phosphor-icons/react';`;
      });
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
