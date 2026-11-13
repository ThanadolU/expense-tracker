#!/usr/bin/env node
/**
 * Generates all application icons from the single source mark:
 *   public/logo-mark.svg
 *
 * Outputs:
 *   src/app/icon.svg              adaptive (light/dark) SVG favicon
 *   src/app/favicon.ico           16/32/48 fallback favicon
 *   src/app/apple-icon.png        180x180 full-bleed (iOS applies its own mask)
 *   public/icons/icon-192.png     PWA icon (rounded tile, transparent corners)
 *   public/icons/icon-512.png     PWA icon (rounded tile, transparent corners)
 *   public/icons/icon-maskable-512.png  PWA maskable icon (full-bleed)
 *
 * Usage: npm run icons:generate
 */
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public/logo-mark.svg");
const appDir = path.join(root, "src/app");
const iconsDir = path.join(root, "public/icons");

const sourceSvg = await readFile(src, "utf8");

// Raster images can't respond to prefers-color-scheme, so drop the dark-mode
// block and render the light palette.
const lightSvg = sourceSvg.replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?\}\s*\}/, "");

// Full-bleed variant: square tile with no rounded corners. Used where the OS
// applies its own mask (iOS home screen, Android adaptive/maskable icons).
// The receipt already sits inside the 80% maskable safe zone.
const fullBleedSvg = lightSvg.replace(/(<rect class="tile"[^>]*?)\s+rx="[^"]*"/, "$1");

const render = (svg, size) =>
  sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 64) * 2 })
    .resize(size, size)
    .png()
    .toBuffer();

/** Packs PNG buffers into a single .ico (PNG-compressed entries). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

await mkdir(iconsDir, { recursive: true });

// SVG favicon keeps the adaptive light/dark styles.
await copyFile(src, path.join(appDir, "icon.svg"));

const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map(async (size) => ({ size, data: await render(lightSvg, size) })),
);
await writeFile(path.join(appDir, "favicon.ico"), buildIco(icoImages));

await writeFile(path.join(appDir, "apple-icon.png"), await render(fullBleedSvg, 180));
await writeFile(path.join(iconsDir, "icon-192.png"), await render(lightSvg, 192));
await writeFile(path.join(iconsDir, "icon-512.png"), await render(lightSvg, 512));
await writeFile(path.join(iconsDir, "icon-maskable-512.png"), await render(fullBleedSvg, 512));

console.log("✓ Icons generated from public/logo-mark.svg");
