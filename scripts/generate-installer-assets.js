/**
 * Generate beautiful branded BMP images for the NSIS Windows installer.
 *
 * Uses raw BMP byte manipulation — zero external dependencies.
 * Generates:
 *   - nsis-header.bmp  (150 × 57 px)  — top-right banner on wizard pages
 *   - nsis-sidebar.bmp (164 × 314 px) — left panel on Welcome & Finish pages
 *
 * Run:  node scripts/generate-installer-assets.js
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_DIR = join(__dirname, "..", "src-tauri", "icons");

// ─── Color palette (matching the app's dark indigo theme) ────────────────────
const PALETTE = {
  bgDark: [15, 15, 30], // #0F0F1E
  bgMid: [25, 22, 52], // #191634
  indigo: [99, 102, 241], // #6366F1
  indigoLight: [129, 140, 248], // #818CF8
  purple: [139, 92, 246], // #8B5CF6
  white: [255, 255, 255],
  whiteTranslucent: [200, 205, 230],
  accent: [236, 72, 153], // #EC4899 — pink accent
  emerald: [16, 185, 129], // #10B981
};

// ─── BMP writer (24-bit, bottom-up) ─────────────────────────────────────────
function createBMP(width, height, pixelCallback) {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows padded to 4 bytes
  const imageSize = rowSize * height;
  const fileSize = 54 + imageSize;

  const buf = Buffer.alloc(fileSize, 0);

  // ── File header (14 bytes) ──
  buf.write("BM", 0); // signature
  buf.writeUInt32LE(fileSize, 2); // file size
  buf.writeUInt32LE(54, 10); // pixel data offset

  // ── DIB header (40 bytes / BITMAPINFOHEADER) ──
  buf.writeUInt32LE(40, 14); // header size
  buf.writeInt32LE(width, 18); // width
  buf.writeInt32LE(height, 22); // height (positive = bottom-up)
  buf.writeUInt16LE(1, 26); // color planes
  buf.writeUInt16LE(24, 28); // bits per pixel
  buf.writeUInt32LE(0, 30); // compression (none)
  buf.writeUInt32LE(imageSize, 34); // image size
  buf.writeInt32LE(2835, 38); // horizontal resolution (72 DPI)
  buf.writeInt32LE(2835, 42); // vertical resolution (72 DPI)

  // ── Pixel data (bottom-up) ──
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelCallback(x, y, width, height);
      const bmpY = height - 1 - y; // flip for bottom-up
      const offset = 54 + bmpY * rowSize + x * 3;
      buf[offset] = clamp(b); // BMP stores BGR
      buf[offset + 1] = clamp(g);
      buf[offset + 2] = clamp(r);
    }
  }

  return buf;
}

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// ─── Smooth noise for organic effects ───────────────────────────────────────
function smoothNoise(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// ─── Draw a filled circle (antialiased) ─────────────────────────────────────
function circleAlpha(cx, cy, r, x, y) {
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (dist > r + 1) return 0;
  if (dist < r - 1) return 1;
  return Math.max(0, 1 - (dist - r + 1));
}

// ─── Simple glow effect ─────────────────────────────────────────────────────
function glowAlpha(cx, cy, r, x, y) {
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (dist > r) return 0;
  return Math.pow(1 - dist / r, 2);
}

// ─── 5×7 pixel font for text rendering ──────────────────────────────────────
const FONT = {
  T: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  i: [
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  m: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
  ],
  G: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  S: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
};

function drawText(text, startX, startY, scale, x, y) {
  let cursorX = startX;
  for (const ch of text) {
    const glyph = FONT[ch];
    if (!glyph) {
      cursorX += 4 * scale;
      continue;
    }
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx]) {
          const px = cursorX + gx * scale;
          const py = startY + gy * scale;
          if (
            x >= px &&
            x < px + scale &&
            y >= py &&
            y < py + scale
          ) {
            return 1;
          }
        }
      }
    }
    cursorX += 6 * scale;
  }
  return 0;
}

// ═════════════════════════════════════════════════════════════════════════════
// SIDEBAR IMAGE (164 × 314)
// ═════════════════════════════════════════════════════════════════════════════
function generateSidebar() {
  const W = 164,
    H = 314;

  return createBMP(W, H, (x, y, w, h) => {
    // Normalized coordinates
    const nx = x / w;
    const ny = y / h;

    // ── Base gradient: dark → indigo (top→bottom + slight diagonal) ──
    const gradT = ny * 0.85 + nx * 0.15;
    let color = lerpColor(PALETTE.bgDark, PALETTE.bgMid, gradT);

    // ── Diagonal glow strip from top-left to bottom-right ──
    const diagDist = Math.abs(nx - ny) * 1.4;
    if (diagDist < 0.35) {
      const diagAlpha = (1 - diagDist / 0.35) * 0.12;
      color = lerpColor(color, PALETTE.indigo, diagAlpha);
    }

    // ── Large glow orb (top-right area) ──
    const orbAlpha = glowAlpha(w * 0.75, h * 0.18, 90, x, y);
    if (orbAlpha > 0) {
      color = lerpColor(color, PALETTE.indigo, orbAlpha * 0.35);
    }

    // ── Small accent orb (bottom-left) ──
    const orb2Alpha = glowAlpha(w * 0.2, h * 0.82, 60, x, y);
    if (orb2Alpha > 0) {
      color = lerpColor(color, PALETTE.purple, orb2Alpha * 0.25);
    }

    // ── Tiny pink accent orb (middle) ──
    const orb3 = glowAlpha(w * 0.5, h * 0.55, 40, x, y);
    if (orb3 > 0) {
      color = lerpColor(color, PALETTE.accent, orb3 * 0.15);
    }

    // ── Decorative dots grid (subtle) ──
    const gridX = x % 20;
    const gridY = y % 20;
    if (gridX >= 9 && gridX <= 11 && gridY >= 9 && gridY <= 11 && ny > 0.25 && ny < 0.45) {
      const dotAlpha = 0.08 + smoothNoise(x, y, 42) * 0.04;
      color = lerpColor(color, PALETTE.indigoLight, dotAlpha);
    }

    // ── Clock icon (centered, top area) ──
    const clockCx = w / 2;
    const clockCy = h * 0.16;
    const clockR = 22;

    // Clock ring
    const clockDist = Math.sqrt((x - clockCx) ** 2 + (y - clockCy) ** 2);
    if (clockDist >= clockR - 2.5 && clockDist <= clockR + 1) {
      const ringAlpha = Math.max(0, 1 - Math.abs(clockDist - clockR) / 2);
      color = lerpColor(color, PALETTE.indigoLight, ringAlpha * 0.9);
    }
    // Clock hands
    // Hour hand (pointing ~2 o'clock)
    const hourAngle = (-Math.PI / 6) * 2; // 60 degrees from 12
    const hourEndX = clockCx + Math.sin(hourAngle) * (clockR * 0.5);
    const hourEndY = clockCy - Math.cos(hourAngle) * (clockR * 0.5);
    const hourDist = pointToSegmentDist(x, y, clockCx, clockCy, hourEndX, hourEndY);
    if (hourDist < 2) {
      color = lerpColor(color, PALETTE.white, (1 - hourDist / 2) * 0.85);
    }
    // Minute hand (pointing ~10 o'clock)
    const minAngle = (-Math.PI / 6) * 10;
    const minEndX = clockCx + Math.sin(minAngle) * (clockR * 0.75);
    const minEndY = clockCy - Math.cos(minAngle) * (clockR * 0.75);
    const minDist = pointToSegmentDist(x, y, clockCx, clockCy, minEndX, minEndY);
    if (minDist < 1.5) {
      color = lerpColor(color, PALETTE.white, (1 - minDist / 1.5) * 0.85);
    }
    // Center dot
    const centerDot = circleAlpha(clockCx, clockCy, 3, x, y);
    if (centerDot > 0) {
      color = lerpColor(color, PALETTE.accent, centerDot * 0.9);
    }

    // Clock glow
    const clockGlow = glowAlpha(clockCx, clockCy, clockR * 2.5, x, y);
    if (clockGlow > 0 && clockDist > clockR + 1) {
      color = lerpColor(color, PALETTE.indigo, clockGlow * 0.1);
    }

    // ── "TimiGS" text (below clock) ──
    const textScale = 2;
    const textWidth = 6 * 6 * textScale; // 6 chars × (5+1) × scale
    const textX = Math.floor((w - textWidth) / 2) + 2;
    const textY = Math.floor(h * 0.28);
    const textAlpha = drawText("TimiGS", textX, textY, textScale, x, y);
    if (textAlpha > 0) {
      color = lerpColor(color, PALETTE.white, textAlpha * 0.95);
    }

    // ── Tagline dots / mini bar chart (lower area) ──
    const barBaseY = Math.floor(h * 0.62);
    const barHeights = [18, 28, 22, 35, 30, 25, 40, 33, 20, 15];
    const barWidth = 6;
    const barGap = 3;
    const totalBarsWidth = barHeights.length * (barWidth + barGap);
    const barStartX = Math.floor((w - totalBarsWidth) / 2);

    for (let bi = 0; bi < barHeights.length; bi++) {
      const bx = barStartX + bi * (barWidth + barGap);
      const bh = barHeights[bi];
      const by = barBaseY - bh;
      if (x >= bx && x < bx + barWidth && y >= by && y < barBaseY) {
        const barT = (y - by) / bh;
        const barColor = lerpColor(PALETTE.indigo, PALETTE.purple, barT);
        const barAlpha = 0.5 + barT * 0.3;
        color = lerpColor(color, barColor, barAlpha);
      }
    }
    // Bar baseline
    if (y >= barBaseY && y <= barBaseY + 1 && x >= barStartX && x < barStartX + totalBarsWidth) {
      color = lerpColor(color, PALETTE.whiteTranslucent, 0.2);
    }

    // ── Bottom decorative line ──
    if (y >= h - 4 && y <= h - 2) {
      const lineT = nx;
      const lineColor = lerpColor(PALETTE.indigo, PALETTE.accent, lineT);
      color = lerpColor(color, lineColor, 0.6);
    }

    // ── Subtle noise for texture ──
    const noise = (smoothNoise(x * 0.5, y * 0.5, 7) - 0.5) * 4;
    color = [color[0] + noise, color[1] + noise, color[2] + noise];

    return color;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// HEADER IMAGE (150 × 57)
// ═════════════════════════════════════════════════════════════════════════════
function generateHeader() {
  const W = 150,
    H = 57;

  return createBMP(W, H, (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;

    // ── Base: dark horizontal gradient ──
    let color = lerpColor(PALETTE.bgMid, PALETTE.bgDark, nx * 0.6 + ny * 0.4);

    // ── Diagonal indigo band ──
    const diagT = nx * 0.7 + ny * 0.3;
    if (diagT > 0.3 && diagT < 0.7) {
      const bandAlpha = (1 - Math.abs(diagT - 0.5) / 0.2) * 0.15;
      color = lerpColor(color, PALETTE.indigo, Math.max(0, bandAlpha));
    }

    // ── Small glow orb (right side) ──
    const orb = glowAlpha(w * 0.85, h * 0.5, 35, x, y);
    if (orb > 0) {
      color = lerpColor(color, PALETTE.indigo, orb * 0.3);
    }

    // ── "TimiGS" text (right-aligned, centered vertically) ──
    const hScale = 2;
    const htextWidth = 6 * 6 * hScale;
    const htextX = w - htextWidth - 10;
    const htextY = Math.floor((h - 7 * hScale) / 2);
    const htextAlpha = drawText("TimiGS", htextX, htextY, hScale, x, y);
    if (htextAlpha > 0) {
      color = lerpColor(color, PALETTE.white, htextAlpha * 0.92);
    }

    // ── Mini clock icon (left of text) ──
    const miniClockCx = htextX - 18;
    const miniClockCy = h / 2;
    const miniR = 9;
    const miniClockDist = Math.sqrt((x - miniClockCx) ** 2 + (y - miniClockCy) ** 2);
    if (miniClockDist >= miniR - 1.5 && miniClockDist <= miniR + 0.5) {
      const rAlpha = Math.max(0, 1 - Math.abs(miniClockDist - miniR) / 1.5);
      color = lerpColor(color, PALETTE.indigoLight, rAlpha * 0.85);
    }
    // Mini clock hands
    const mhEndX = miniClockCx + Math.sin(-Math.PI / 3) * (miniR * 0.5);
    const mhEndY = miniClockCy - Math.cos(-Math.PI / 3) * (miniR * 0.5);
    const mhDist = pointToSegmentDist(x, y, miniClockCx, miniClockCy, mhEndX, mhEndY);
    if (mhDist < 1) {
      color = lerpColor(color, PALETTE.white, (1 - mhDist) * 0.8);
    }
    const mmEndX = miniClockCx + Math.sin(-Math.PI * 5 / 3) * (miniR * 0.7);
    const mmEndY = miniClockCy - Math.cos(-Math.PI * 5 / 3) * (miniR * 0.7);
    const mmDist = pointToSegmentDist(x, y, miniClockCx, miniClockCy, mmEndX, mmEndY);
    if (mmDist < 0.8) {
      color = lerpColor(color, PALETTE.white, (1 - mmDist / 0.8) * 0.8);
    }
    // Mini center dot
    const mcDot = circleAlpha(miniClockCx, miniClockCy, 1.5, x, y);
    if (mcDot > 0) {
      color = lerpColor(color, PALETTE.accent, mcDot * 0.85);
    }

    // ── Bottom accent line ──
    if (y >= h - 2) {
      const lineColor = lerpColor(PALETTE.indigo, PALETTE.accent, nx);
      color = lerpColor(color, lineColor, 0.5);
    }

    // Texture noise
    const noise = (smoothNoise(x * 0.8, y * 0.8, 13) - 0.5) * 3;
    color = [color[0] + noise, color[1] + noise, color[2] + noise];

    return color;
  });
}

// ─── Geometry helpers ───────────────────────────────────────────────────────
function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

// ─── Main ───────────────────────────────────────────────────────────────────
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

console.log("Generating NSIS installer assets...");

const sidebar = generateSidebar();
writeFileSync(join(OUT_DIR, "nsis-sidebar.bmp"), sidebar);
console.log(`  ✓ nsis-sidebar.bmp (164×314, ${sidebar.length} bytes)`);

const header = generateHeader();
writeFileSync(join(OUT_DIR, "nsis-header.bmp"), header);
console.log(`  ✓ nsis-header.bmp (150×57, ${header.length} bytes)`);

console.log("Done! Assets written to src-tauri/icons/");
