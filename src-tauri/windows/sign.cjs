const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const filePath = process.argv[2];
if (!filePath) {
  console.error("No file specified for signing.");
  process.exit(1);
}

const pfxPath = process.env.TAURI_WINDOWS_PFX;
const password = process.env.TAURI_WINDOWS_PFX_PASSWORD;

if (!pfxPath || !fs.existsSync(pfxPath)) {
  console.warn("TAURI_WINDOWS_PFX not set or file not found. Skipping code signing.");
  process.exit(0);
}

function findSigntool() {
  try {
    const res = spawnSync('where', ['signtool'], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout.trim()) {
      return 'signtool';
    }
  } catch (e) {}

  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const sdkBases = [
    path.join(programFilesX86, 'Windows Kits', '10', 'bin'),
    path.join(programFilesX86, 'Windows Kits', '8.1', 'bin')
  ];

  for (const base of sdkBases) {
    if (!fs.existsSync(base)) continue;
    if (base.includes('8.1')) {
      const paths = [
        path.join(base, 'x64', 'signtool.exe'),
        path.join(base, 'x86', 'signtool.exe')
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
    } else {
      try {
        const subdirs = fs.readdirSync(base);
        for (const subdir of subdirs) {
          const dirPath = path.join(base, subdir);
          if (!fs.statSync(dirPath).isDirectory()) continue;
          const paths = [
            path.join(dirPath, 'x64', 'signtool.exe'),
            path.join(dirPath, 'x86', 'signtool.exe')
          ];
          for (const p of paths) {
            if (fs.existsSync(p)) return p;
          }
        }
      } catch (e) {}
    }
  }
  return null;
}

const signtoolPath = findSigntool();
if (!signtoolPath) {
  console.error("signtool.exe not found on PATH or in Windows SDK directories.");
  process.exit(1);
}

const args = ['sign', '/f', pfxPath];
if (password) {
  args.push('/p', password);
}
args.push('/fd', 'SHA256', '/tr', 'http://timestamp.digicert.com', '/td', 'SHA256', filePath);

const run = spawnSync(signtoolPath, args, { stdio: 'inherit' });
if (run.status !== 0) {
  console.error("Signing failed with exit code " + run.status);
  process.exit(run.status === null ? 1 : run.status);
}
