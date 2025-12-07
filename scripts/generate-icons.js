const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a modern icon with checkmark for HabitTracker
async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
        <linearGradient id="check" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#34d399"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
      
      <!-- Circle background for checkmark -->
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.32}" fill="white" opacity="0.95"/>
      
      <!-- Checkmark -->
      <path 
        d="M ${size * 0.3} ${size * 0.5} L ${size * 0.45} ${size * 0.65} L ${size * 0.7} ${size * 0.38}" 
        stroke="url(#check)" 
        stroke-width="${size * 0.08}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        fill="none"
      />
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
        <linearGradient id="check" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#34d399"/>
        </linearGradient>
      </defs>
      
      <!-- Background (no rounded corners for Apple) -->
      <rect width="${size}" height="${size}" fill="url(#bg)"/>
      
      <!-- Circle background for checkmark -->
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.32}" fill="white" opacity="0.95"/>
      
      <!-- Checkmark -->
      <path 
        d="M ${size * 0.3} ${size * 0.5} L ${size * 0.45} ${size * 0.65} L ${size * 0.7} ${size * 0.38}" 
        stroke="url(#check)" 
        stroke-width="${size * 0.08}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        fill="none"
      />
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
      
      <!-- Background -->
      <rect width="${size}" height="${size}" rx="6" fill="url(#bg)"/>
      
      <!-- Checkmark (white) -->
      <path 
        d="M 8 16 L 14 22 L 24 10" 
        stroke="white" 
        stroke-width="4" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        fill="none"
      />
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));
  
  // Also create ico version
  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
  
  console.log('✓ Généré: favicon.png & favicon.ico');
}

// Generate OG image for social sharing
async function generateOGImage() {
  const width = 1200;
  const height = 630;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e1b4b"/>
          <stop offset="50%" style="stop-color:#312e81"/>
          <stop offset="100%" style="stop-color:#1e1b4b"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
        <linearGradient id="check" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#34d399"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      
      <!-- Decorative circles -->
      <circle cx="100" cy="100" r="200" fill="#6366f1" opacity="0.1"/>
      <circle cx="1100" cy="530" r="250" fill="#8b5cf6" opacity="0.1"/>
      
      <!-- Icon -->
      <rect x="150" y="200" width="200" height="200" rx="40" fill="url(#accent)"/>
      <circle cx="250" cy="300" r="64" fill="white" opacity="0.95"/>
      <path 
        d="M 210 300 L 240 330 L 290 270" 
        stroke="url(#check)" 
        stroke-width="16" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        fill="none"
      />
      
      <!-- Text -->
      <text x="400" y="280" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white">HabitTracker</text>
      <text x="400" y="350" font-family="Arial, sans-serif" font-size="32" fill="#a5b4fc">Suivi d'habitudes entre amis</text>
      
      <!-- Feature tags -->
      <rect x="400" y="400" width="180" height="50" rx="25" fill="#6366f1" opacity="0.3"/>
      <text x="490" y="433" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">Habitudes</text>
      
      <rect x="600" y="400" width="150" height="50" rx="25" fill="#6366f1" opacity="0.3"/>
      <text x="675" y="433" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">Amis</text>
      
      <rect x="770" y="400" width="180" height="50" rx="25" fill="#6366f1" opacity="0.3"/>
      <text x="860" y="433" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">Statistiques</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'og-image.png'));
  
  console.log('✓ Généré: og-image.png (1200x630)');
}

// Generate SVG icon for public folder
async function generateSVGIcon() {
  const size = 512;
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <linearGradient id="check" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#34d399"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  
  <!-- Circle background for checkmark -->
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.32}" fill="white" opacity="0.95"/>
  
  <!-- Checkmark -->
  <path 
    d="M ${size * 0.3} ${size * 0.5} L ${size * 0.45} ${size * 0.65} L ${size * 0.7} ${size * 0.38}" 
    stroke="url(#check)" 
    stroke-width="${size * 0.08}" 
    stroke-linecap="round" 
    stroke-linejoin="round"
    fill="none"
  />
</svg>`;

  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg);
  console.log('✓ Généré: icon.svg');
}

async function main() {
  console.log('🎨 Génération des icônes HabitTracker...\n');
  
  try {
    // Generate all size variants
    for (const size of sizes) {
      await generateIcon(size);
    }
    
    await generateAppleTouchIcon();
    await generateFavicon();
    await generateOGImage();
    await generateSVGIcon();
    
    console.log('\n✅ Toutes les icônes ont été générées avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();

