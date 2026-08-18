#!/usr/bin/env node
// Generates the Expo app icon, adaptive icon, splash, and favicon PNGs in
// mobile/assets/ from the Moneta brand mark geometry
// (public/marketing/moneta-mark.svg).
//
// sharp is not a project dependency; install it ad hoc when regenerating:
//   npm install --no-save sharp && node scripts/generate-mobile-assets.cjs

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, '..', 'mobile', 'assets');

// Inner mark elements in the original 512x512 coordinate space.
const MARK_ELEMENTS = `
  <circle cx="256" cy="256" r="136" fill="#173033"/>
  <circle cx="256" cy="256" r="136" stroke="#F6F1E7" stroke-opacity="0.12" stroke-width="10"/>
  <path d="M164 314C164 303.507 172.507 295 183 295H221V222C221 211.507 229.507 203 240 203H272V153C272 142.507 280.507 134 291 134H329C339.493 134 348 142.507 348 153V333C348 343.493 339.493 352 329 352H183C172.507 352 164 343.493 164 333V314Z" fill="#D1A15C"/>
  <path d="M164 314C164 303.507 172.507 295 183 295H221V222C221 211.507 229.507 203 240 203H272V153C272 142.507 280.507 134 291 134H329C339.493 134 348 142.507 348 153V333C348 343.493 339.493 352 329 352H183C172.507 352 164 343.493 164 333V314Z" stroke="#F6F1E7" stroke-opacity="0.18" stroke-width="8"/>
  <path d="M170 378C224.254 405.585 287.746 405.585 342 378" stroke="#6ECDA6" stroke-width="16" stroke-linecap="round"/>
  <path d="M170 378C224.254 405.585 287.746 405.585 342 378" stroke="#0C1415" stroke-opacity="0.32" stroke-width="26" stroke-linecap="round"/>
`;

function markGroup(canvas, scale) {
  const offset = (canvas - 512 * scale) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">${MARK_ELEMENTS}</g>`;
}

// Full-bleed square icon (the OS applies its own corner mask on iOS).
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#0C1415"/>
  <rect x="48" y="48" width="928" height="928" rx="176" stroke="#D1A15C" stroke-opacity="0.28" stroke-width="32"/>
  ${markGroup(1024, 2.1)}
</svg>`;

// Android adaptive-icon foreground: transparent, content inside the ~66% safe zone.
const adaptiveSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${markGroup(1024, 2)}
</svg>`;

// Splash logo: transparent; Expo composes it over the splash backgroundColor.
const splashSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${markGroup(1024, 1.2)}
</svg>`;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jobs = [
    { svg: iconSvg, size: 1024, file: 'icon.png' },
    { svg: adaptiveSvg, size: 1024, file: 'adaptive-icon.png' },
    { svg: splashSvg, size: 1024, file: 'splash-icon.png' },
    { svg: iconSvg, size: 48, file: 'favicon.png' }
  ];

  for (const job of jobs) {
    const out = path.join(OUT_DIR, job.file);
    await sharp(Buffer.from(job.svg)).resize(job.size, job.size).png().toFile(out);
    console.log(`wrote ${out}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
