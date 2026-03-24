import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIR = path.join(__dirname, 'src', 'components');

const map = {
  Menu: 'List',
  X: 'X',
  Globe: 'GlobeHemisphereWest',
  Clock: 'Clock',
  Star: 'Star',
  Download: 'DownloadSimple',
  MessageSquare: 'ChatCircle',
  Home: 'House',
  FileText: 'FileText',
  BookOpen: 'BookOpen',
  Shield: 'ShieldCheck',
  FlaskConical: 'Flask',
  Newspaper: 'Newspaper',
  ChevronRight: 'CaretRight',
  Github: 'GithubLogo',
  Heart: 'Heart',
  ExternalLink: 'ArrowUpRight',
  ArrowRight: 'ArrowRight',
  Lock: 'LockKey',
  Check: 'Check',
  ArrowLeft: 'ArrowLeft',
  Monitor: 'Monitor',
  Cpu: 'Cpu',
  Activity: 'Activity',
  Database: 'Database',
  Layers: 'Stack',
  Zap: 'Lightning',
  Info: 'Info',
  AlertTriangle: 'Warning',
  AlertCircle: 'WarningCircle',
  Settings: 'Gear',
  Terminal: 'TerminalWindow',
  Code: 'Code',
  Play: 'PlayCircle',
  SkipForward: 'FastForwardCircle',
  Search: 'MagnifyingGlass',
  Folder: 'Folder',
  File: 'File',
  Box: 'Package',
  Cloud: 'Cloud',
  Server: 'HardDrives',
  Users: 'Users',
  Key: 'Key'
};

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
    
    // Find lucide-react import
    if (content.includes('lucide-react')) {
      const regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
      content = content.replace(regex, (match, importsStr) => {
        const imports = importsStr.split(',').map(i => i.trim()).filter(Boolean);
        const newImports = imports.map(i => {
          let [name, alias] = i.split(' as ').map(x => x.trim());
          let mapped = map[name] || name;
          if (mapped === name) {
            return alias ? `${name} as ${alias}` : name;
          } else {
            return alias ? `${mapped} as ${alias}` : `${mapped} as ${name}`;
          }
        });
        return `import { ${newImports.join(', ')} } from '@phosphor-icons/react';`;
      });
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Replaced icons in ${filePath}`);
    }
  }
});
