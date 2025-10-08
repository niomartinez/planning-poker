const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public');

async function generateFavicon() {
  try {
    // Generate ICO file with multiple sizes (16x16, 32x32, 48x48)
    // Note: .ico format requires external tool, so we'll create PNGs instead

    // Create 16x16 favicon
    await sharp(inputPath)
      .resize(16, 16)
      .toFile(path.join(outputDir, 'favicon-16x16.png'));

    // Create 32x32 favicon
    await sharp(inputPath)
      .resize(32, 32)
      .toFile(path.join(outputDir, 'favicon-32x32.png'));

    // Create 48x48 favicon (used as favicon.ico size)
    await sharp(inputPath)
      .resize(48, 48)
      .png()
      .toFile(path.join(outputDir, 'favicon.ico'));

    // Create Apple Touch Icon
    await sharp(inputPath)
      .resize(180, 180)
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));

    // Create Android Chrome icons
    await sharp(inputPath)
      .resize(192, 192)
      .toFile(path.join(outputDir, 'android-chrome-192x192.png'));

    await sharp(inputPath)
      .resize(512, 512)
      .toFile(path.join(outputDir, 'android-chrome-512x512.png'));

    console.log('✓ Favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicon();
