const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple icon with gradient background and "BC" text
async function generateIcon(size) {
  // Create SVG for each size
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f59e0b"/>
          <stop offset="100%" style="stop-color:#f97316"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
      
      <!-- Flame shape -->
      <ellipse cx="${size/2}" cy="${size/2 + size*0.05}" rx="${size*0.28}" ry="${size*0.35}" fill="url(#accent)"/>
      
      <!-- Inner white -->
      <ellipse cx="${size/2}" cy="${size/2 + size*0.08}" rx="${size*0.18}" ry="${size*0.22}" fill="white"/>
      
      <!-- BC Text -->
      <text x="${size/2}" y="${size/2 + size*0.12}" 
            font-family="Arial Black, Arial, sans-serif" 
            font-size="${size * 0.22}" 
            font-weight="900"
            fill="#6366f1" 
            text-anchor="middle">BC</text>
    </svg>
  `;

  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Généré: icon-${size}x${size}.png`);
}

// Generate Apple Touch Icon (180x180)
async function generateAppleTouchIcon() {
  const size = 180;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f59e0b"/>
          <stop offset="100%" style="stop-color:#f97316"/>
        </linearGradient>
      </defs>
      
      <rect width="${size}" height="${size}" fill="url(#bg)"/>
      <ellipse cx="${size/2}" cy="${size/2 + size*0.05}" rx="${size*0.28}" ry="${size*0.35}" fill="url(#accent)"/>
      <ellipse cx="${size/2}" cy="${size/2 + size*0.08}" rx="${size*0.18}" ry="${size*0.22}" fill="white"/>
      <text x="${size/2}" y="${size/2 + size*0.12}" 
            font-family="Arial Black, Arial, sans-serif" 
            font-size="${size * 0.22}" 
            font-weight="900"
            fill="#6366f1" 
            text-anchor="middle">BC</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));
  
  console.log('✓ Généré: apple-touch-icon.png');
}

// Generate favicon
async function generateFavicon() {
  const size = 32;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="6" fill="url(#bg)"/>
      <text x="${size/2}" y="${size*0.72}" 
            font-family="Arial Black, Arial, sans-serif" 
            font-size="${size * 0.5}" 
            font-weight="900"
            fill="white" 
            text-anchor="middle">B</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));
  
  // Also create ico version (just copy png for simplicity)
  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
  
  console.log('✓ Généré: favicon.png & favicon.ico');
}

async function main() {
  console.log('🎨 Génération des icônes PWA...\n');
  
  try {
    // Generate all size variants
    for (const size of sizes) {
      await generateIcon(size);
    }
    
    await generateAppleTouchIcon();
    await generateFavicon();
    
    console.log('\n✅ Toutes les icônes ont été générées avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();

