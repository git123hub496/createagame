// Halloween decorative pumpkins and glowing jack-o'-lanterns
// Pure pass-through decorations that emit light on night sky

export function drawPumpkin(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  baseY: number,
  size = 24
) {
  const halfW = size / 2;
  const height = size * 0.85;
  const centerY = baseY - height / 2;

  ctx.save();

  // Curled green stem on top
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, baseY - height);
  ctx.quadraticCurveTo(centerX + 3, baseY - height - 7, centerX + 5, baseY - height - 5);
  ctx.stroke();

  // Ribbed pumpkin lobes
  // Outer lobes
  ctx.fillStyle = '#c2410c';
  ctx.beginPath();
  ctx.ellipse(centerX - halfW * 0.45, centerY, halfW * 0.48, height / 2, 0, 0, Math.PI * 2);
  ctx.ellipse(centerX + halfW * 0.45, centerY, halfW * 0.48, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Middle lobes
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(centerX - halfW * 0.22, centerY, halfW * 0.42, height / 2, 0, 0, Math.PI * 2);
  ctx.ellipse(centerX + halfW * 0.22, centerY, halfW * 0.42, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Center highlight lobe
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, halfW * 0.38, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawJackOLantern(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  baseY: number,
  size = 26,
  pulse = 0
) {
  const height = size * 0.85;
  const centerY = baseY - height / 2;

  ctx.save();

  // 1. Emit ambient light glow around it on the dark night sky
  const glowRadius = 55 + Math.sin(pulse) * 6;
  const lightGlow = ctx.createRadialGradient(centerX, centerY, 3, centerX, centerY, glowRadius);
  lightGlow.addColorStop(0, 'rgba(251, 146, 60, 0.6)');
  lightGlow.addColorStop(0.35, 'rgba(245, 158, 11, 0.22)');
  lightGlow.addColorStop(0.7, 'rgba(245, 158, 11, 0.07)');
  lightGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = lightGlow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Base pumpkin body
  drawPumpkin(ctx, centerX, baseY, size);

  // 3. Glowing warm yellow carved eyes and jagged mouth
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 8;

  // Left eye
  ctx.beginPath();
  ctx.moveTo(centerX - 6, centerY - 2);
  ctx.lineTo(centerX - 2.5, centerY - 2);
  ctx.lineTo(centerX - 4.25, centerY - 6);
  ctx.closePath();
  ctx.fill();

  // Right eye
  ctx.beginPath();
  ctx.moveTo(centerX + 2.5, centerY - 2);
  ctx.lineTo(centerX + 6, centerY - 2);
  ctx.lineTo(centerX + 4.25, centerY - 6);
  ctx.closePath();
  ctx.fill();

  // Nose (small triangle)
  ctx.beginPath();
  ctx.moveTo(centerX - 1.5, centerY);
  ctx.lineTo(centerX + 1.5, centerY);
  ctx.lineTo(centerX, centerY - 2.5);
  ctx.closePath();
  ctx.fill();

  // Carved sinister smile
  ctx.beginPath();
  ctx.moveTo(centerX - 7, centerY + 3);
  ctx.lineTo(centerX - 4.5, centerY + 5.5);
  ctx.lineTo(centerX - 2.5, centerY + 3.5);
  ctx.lineTo(centerX, centerY + 6);
  ctx.lineTo(centerX + 2.5, centerY + 3.5);
  ctx.lineTo(centerX + 4.5, centerY + 5.5);
  ctx.lineTo(centerX + 7, centerY + 3);
  ctx.lineTo(centerX + 5.5, centerY + 7);
  ctx.lineTo(centerX - 5.5, centerY + 7);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Deterministically place pumpkins and glowing jack-o'-lanterns along the top of a grass block
export function getGrassHalloweenDecorations(elem: { id: string; x: number; y: number; width: number }) {
  const items: { type: 'pumpkin' | 'jackolantern'; x: number; y: number }[] = [];
  if (elem.width < 32) return items;

  const minSpacing = 80;
  const count = Math.max(1, Math.floor(elem.width / minSpacing));
  const step = elem.width / (count + 1);

  let hash = 0;
  for (let i = 0; i < elem.id.length; i++) {
    hash = (hash * 31 + elem.id.charCodeAt(i)) | 0;
  }

  for (let i = 1; i <= count; i++) {
    const cx = elem.x + i * step;
    const isJackOLantern = ((Math.abs(hash) + i) % 2) === 1;
    items.push({
      type: isJackOLantern ? 'jackolantern' : 'pumpkin',
      x: cx,
      y: elem.y,
    });
  }
  return items;
}
