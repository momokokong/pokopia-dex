// Generate PWA icons as SVG → PNG via canvas
// Run: node scripts/generate-icons.js

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background — warm cream circle with orange accent
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, '#FFD93D');
  gradient.addColorStop(0.7, '#FF8C42');
  gradient.addColorStop(1, '#FF6B35');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Pokéball center circle
  ctx.fillStyle = '#FFF8E1';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Inner circle
  ctx.fillStyle = '#FFF8E1';
  ctx.strokeStyle = '#FF6B35';
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Horizontal line across
  ctx.strokeStyle = '#FFF8E1';
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size/2);
  ctx.lineTo(size * 0.9, size/2);
  ctx.stroke();

  const outPath = path.join(__dirname, '..', 'icons', `icon-${size}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`Generated ${outPath}`);

  // Maskable version (more padding)
  const maskCanvas = createCanvas(size, size);
  const mctx = maskCanvas.getContext('2d');

  // Same gradient but smaller circle (safe zone for maskable)
  const mgradient = mctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.35);
  mgradient.addColorStop(0, '#FFD93D');
  mgradient.addColorStop(0.7, '#FF8C42');
  mgradient.addColorStop(1, '#FF6B35');

  mctx.fillStyle = '#FFF8E1'; // white background for maskable
  mctx.fillRect(0, 0, size, size);

  mctx.fillStyle = mgradient;
  mctx.beginPath();
  mctx.arc(size/2, size/2, size * 0.35, 0, Math.PI * 2);
  mctx.fill();

  // Center
  mctx.fillStyle = '#FFF8E1';
  mctx.beginPath();
  mctx.arc(size/2, size/2, size * 0.1, 0, Math.PI * 2);
  mctx.fill();

  const maskPath = path.join(__dirname, '..', 'icons', `icon-maskable-${size}.png`);
  fs.writeFileSync(maskPath, maskCanvas.toBuffer('image/png'));
  console.log(`Generated ${maskPath}`);
});