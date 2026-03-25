/**
 * Generate NSIS Installer Graphics for TimiGS
 * Creates BMP files for the installer UI
 * 
 * Run: node windows/generate-graphics.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname);

// BMP file structure helpers
function createBMP(width, height, pixels) {
  const rowSize = Math.ceil(width * 3 / 4) * 4; // Row size must be multiple of 4
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  
  const buffer = Buffer.alloc(fileSize);
  let offset = 0;
  
  // BMP Header (14 bytes)
  buffer.writeUInt16LE(0x4D42, offset); // 'BM'
  buffer.writeUInt32LE(fileSize, offset + 2); // File size
  buffer.writeUInt16LE(0, offset + 6); // Reserved
  buffer.writeUInt16LE(0, offset + 8); // Reserved
  buffer.writeUInt32LE(54, offset + 10); // Pixel data offset
  
  // DIB Header (40 bytes - BITMAPINFOHEADER)
  buffer.writeUInt32LE(40, offset + 14); // Header size
  buffer.writeInt32LE(width, offset + 18); // Width
  buffer.writeInt32LE(height, offset + 22); // Height
  buffer.writeUInt16LE(1, offset + 26); // Color planes
  buffer.writeUInt16LE(24, offset + 28); // Bits per pixel
  buffer.writeUInt32LE(0, offset + 30); // Compression (none)
  buffer.writeUInt32LE(pixelDataSize, offset + 34); // Image size
  buffer.writeInt32LE(2835, offset + 38); // Horizontal resolution (72 DPI)
  buffer.writeInt32LE(2835, offset + 42); // Vertical resolution (72 DPI)
  buffer.writeUInt32LE(0, offset + 46); // Colors in palette
  buffer.writeUInt32LE(0, offset + 50); // Important colors
  
  // Pixel data (BGR format, bottom-up)
  offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const pixel = pixels[x][y];
      buffer.writeUInt8(pixel[2], offset++); // Blue
      buffer.writeUInt8(pixel[1], offset++); // Green
      buffer.writeUInt8(pixel[0], offset++); // Red
    }
    // Padding to multiple of 4 bytes
    while (offset % 4 !== 0) {
      buffer.writeUInt8(0, offset++);
    }
  }
  
  return buffer;
}

// Color scheme
const colors = {
  primaryBlue: [0, 45, 92],    // #002D5C
  secondaryBlue: [0, 64, 128], // #004080
  accentBlue: [0, 102, 204],   // #0066CC
  white: [255, 255, 255],
  lightGray: [240, 240, 240]
};

// Create gradient background
function createGradient(width, height, color1, color2, vertical = true) {
  const pixels = [];
  for (let x = 0; x < width; x++) {
    pixels[x] = [];
    for (let y = 0; y < height; y++) {
      const t = vertical ? y / height : x / width;
      const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
      const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
      const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
      pixels[x][y] = [r, g, b];
    }
  }
  return pixels;
}

// Simple text rendering (basic pixel font)
function renderText(pixels, text, startX, startY, color) {
  // Simple 5x7 pixel font for basic characters
  const font = {
    'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    'i': [[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    'm': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'G': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'S': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'A': [[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'C': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
    'R': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
    ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  };
  
  const charWidth = 6; // 5 pixels + 1 spacing
  
  for (let ci = 0; ci < text.length; ci++) {
    const char = text[ci];
    const charData = font[char] || font[' '];
    if (!charData) continue;
    
    for (let py = 0; py < 7; py++) {
      for (let px = 0; px < 5; px++) {
        if (charData[py][px] === 1) {
          const drawX = startX + ci * charWidth + px;
          const drawY = startY + py;
          if (drawX < pixels.length && drawY < pixels[0].length) {
            pixels[drawX][drawY] = color;
          }
        }
      }
    }
  }
}

// 1. Create Header Bitmap (150x57)
console.log('Creating header bitmap (150x57)...');
const headerWidth = 150;
const headerHeight = 57;
const headerPixels = createGradient(headerWidth, headerHeight, colors.primaryBlue, colors.secondaryBlue, true);

// Add decorative circle/arc
for (let x = 100; x < headerWidth; x++) {
  for (let y = 0; y < headerHeight; y++) {
    const dx = x - headerWidth;
    const dy = y - headerHeight / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 40 && dist > 35) {
      const alpha = (dist - 35) / 5;
      const blend = [
        Math.round(colors.accentBlue[0] * alpha + headerPixels[x][y][0] * (1 - alpha)),
        Math.round(colors.accentBlue[1] * alpha + headerPixels[x][y][1] * (1 - alpha)),
        Math.round(colors.accentBlue[2] * alpha + headerPixels[x][y][2] * (1 - alpha))
      ];
      headerPixels[x][y] = blend;
    }
  }
}

// Render "TimiGS" text
renderText(headerPixels, "TimiGS", 10, 20, colors.white);

const headerBMP = createBMP(headerWidth, headerHeight, headerPixels);
writeFileSync(join(outputDir, 'installer-header.bmp'), headerBMP);
console.log('  ✓ installer-header.bmp created');

// 2. Create Sidebar Bitmap (164x314)
console.log('Creating sidebar bitmap (164x314)...');
const sidebarWidth = 164;
const sidebarHeight = 314;
const sidebarPixels = createGradient(sidebarWidth, sidebarHeight, colors.primaryBlue, colors.secondaryBlue, true);

// Add decorative elements
for (let i = 0; i < 5; i++) {
  const cy = 50 + i * 50;
  for (let x = 20; x < sidebarWidth - 20; x++) {
    const alpha = Math.sin((x - 20) / 10 + i) * 0.3 + 0.7;
    const blend = [
      Math.round(colors.accentBlue[0] * alpha + sidebarPixels[x][cy][0] * (1 - alpha)),
      Math.round(colors.accentBlue[1] * alpha + sidebarPixels[x][cy][1] * (1 - alpha)),
      Math.round(colors.accentBlue[2] * alpha + sidebarPixels[x][cy][2] * (1 - alpha))
    ];
    sidebarPixels[x][cy] = blend;
  }
}

// Render text
renderText(sidebarPixels, "TimiGS", 10, 20, colors.white);
renderText(sidebarPixels, "Activity", 10, 100, colors.white);
renderText(sidebarPixels, "Tracker", 10, 115, colors.white);

const sidebarBMP = createBMP(sidebarWidth, sidebarHeight, sidebarPixels);
writeFileSync(join(outputDir, 'installer-sidebar.bmp'), sidebarBMP);
console.log('  ✓ installer-sidebar.bmp created');

// 3. Create Finish Bitmap (150x57)
console.log('Creating finish bitmap (150x57)...');
const finishWidth = 150;
const finishHeight = 57;
const finishPixels = createGradient(finishWidth, finishHeight, colors.primaryBlue, colors.secondaryBlue, true);

// Add checkmark
const checkColor = [100, 255, 100];
for (let i = 0; i < 8; i++) {
  for (let j = 0; j < 4; j++) {
    const x = 110 + i + j;
    const y = 25 - i + j;
    if (x < finishWidth && y < finishHeight && y > 0) {
      finishPixels[x][y] = checkColor;
    }
  }
}

// Render text
renderText(finishPixels, "TimiGS", 10, 20, colors.white);

const finishBMP = createBMP(finishWidth, finishHeight, finishPixels);
writeFileSync(join(outputDir, 'installer-finish.bmp'), finishBMP);
console.log('  ✓ installer-finish.bmp created');

console.log('\n✅ All graphics generated successfully!');
console.log('Files created in:', outputDir);
