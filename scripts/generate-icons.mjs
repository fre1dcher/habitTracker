import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync(path.resolve('./public/icon-512.svg'));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const publicDir = path.resolve('./public');
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
  
  // Generate maskable icons
  for (const size of [192, 512]) {
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 99, g: 102, b: 241, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, `icon-${size}-maskable.png`));
    console.log(`Generated icon-${size}-maskable.png`);
  }
  
  // Apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
  
  // Favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');
}

generateIcons().catch(console.error);