import { useEffect, useRef } from 'react';
import { sceneStops } from './content.jsx';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);

function lerpColor(colorA, colorB, t) {
  const parse = (color) => [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ];
  const toHex = (value) => Math.round(value).toString(16).padStart(2, '0');
  const [r1, g1, b1] = parse(colorA);
  const [r2, g2, b2] = parse(colorB);

  return `#${toHex(lerp(r1, r2, t))}${toHex(lerp(g1, g2, t))}${toHex(lerp(b1, b2, t))}`;
}

function getSceneState(progress) {
  const sectionIndex = progress * (sceneStops.length - 1);
  const currentIndex = Math.floor(sectionIndex);
  const t = sectionIndex - currentIndex;
  const current = sceneStops[Math.min(currentIndex, sceneStops.length - 1)];
  const next = sceneStops[Math.min(currentIndex + 1, sceneStops.length - 1)];

  return {
    sky1: lerpColor(current.sky1, next.sky1, t),
    sky2: lerpColor(current.sky2, next.sky2, t),
    ocean: lerpColor(current.ocean, next.ocean, t),
  };
}

export default function RoadtripScene({ progress }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let animationFrame = 0;
    let frameCount = 0;
    let vanX = window.innerWidth * 0.15;
    let vanBob = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawScene = (timestamp) => {
      const progressValue = progressRef.current;
      frameCount += 1;

      const width = canvas.width;
      const height = canvas.height;
      const scene = getSceneState(progressValue);

      const skyGradient = context.createLinearGradient(0, 0, 0, height * 0.55);
      skyGradient.addColorStop(0, scene.sky1);
      skyGradient.addColorStop(1, scene.sky2);
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, width, height);

      const sunY = height * lerp(0.12, 0.38, progressValue);
      const sunX = width * lerp(0.72, 0.55, progressValue);
      const sunRadius = 38 + Math.sin(frameCount * 0.02) * 2;
      const glow = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3.5);
      glow.addColorStop(0, 'rgba(255,240,180,0.55)');
      glow.addColorStop(1, 'rgba(255,240,180,0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(sunX, sunY, sunRadius * 3.5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#fff9d4';
      context.beginPath();
      context.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      context.fill();

      const horizonY = height * 0.45;
      const oceanGradient = context.createLinearGradient(0, horizonY, 0, height * 0.72);
      oceanGradient.addColorStop(0, scene.ocean);
      oceanGradient.addColorStop(1, lerpColor(scene.ocean, '#0d1b2a', 0.6));
      context.fillStyle = oceanGradient;
      context.fillRect(0, horizonY, width, height * 0.72 - horizonY);

      context.save();
      context.globalAlpha = 0.13;
      context.strokeStyle = '#ffffff';
      context.lineWidth = 1.5;
      for (let i = 0; i < 6; i += 1) {
        const waveY = horizonY + 18 + i * 14 + Math.sin(frameCount * 0.04 + i) * 4;
        const waveWidth = width * (0.4 + i * 0.08);
        const startX = (width - waveWidth) / 2 + Math.sin(frameCount * 0.02 + i * 0.5) * 20;
        context.beginPath();
        context.moveTo(startX, waveY);
        context.lineTo(startX + waveWidth, waveY);
        context.stroke();
      }
      context.restore();

      context.fillStyle = lerpColor('#9aa38a', '#7a8066', 0.5);
      context.beginPath();
      context.moveTo(0, height * 0.62);
      context.bezierCurveTo(width * 0.1, height * 0.5, width * 0.2, height * 0.52, width * 0.35, height * 0.48);
      context.bezierCurveTo(width * 0.45, height * 0.46, width * 0.55, height * 0.54, width, height * 0.55);
      context.lineTo(width, height * 0.72);
      context.lineTo(0, height * 0.72);
      context.closePath();
      context.fill();

      const cliffY = height * 0.72;
      context.fillStyle = '#5c4a30';
      context.beginPath();
      context.moveTo(0, cliffY);
      context.lineTo(width, cliffY);
      context.lineTo(width, height * 0.78);
      context.bezierCurveTo(width * 0.75, height * 0.79, width * 0.6, height * 0.76, width * 0.5, height * 0.77);
      context.bezierCurveTo(width * 0.35, height * 0.78, width * 0.2, height * 0.81, 0, height * 0.8);
      context.closePath();
      context.fill();

      const roadTop = height * 0.76;
      context.fillStyle = '#2e2e2e';
      context.beginPath();
      context.moveTo(width * 0.15, roadTop);
      context.lineTo(width * 0.85, roadTop);
      context.lineTo(width, height);
      context.lineTo(0, height);
      context.closePath();
      context.fill();

      context.fillStyle = '#888070';
      context.fillRect(0, roadTop - 6, width, 8);

      context.save();
      context.strokeStyle = '#f5e642';
      context.lineWidth = 4;
      context.setLineDash([40, 30]);
      context.lineDashOffset = -(frameCount * 3) % 70;
      context.beginPath();
      context.moveTo(width * 0.5, roadTop + 4);
      context.lineTo(width * 0.5, height);
      context.stroke();
      context.restore();

      context.save();
      context.strokeStyle = '#b0a898';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(0, roadTop - 2);
      context.lineTo(width, roadTop - 2);
      context.stroke();
      context.strokeStyle = '#aaa';
      context.lineWidth = 2;
      for (let px = 0; px < width; px += 60) {
        const offset = (frameCount * 2) % 60;
        const postX = ((px - offset + width) % width);
        context.beginPath();
        context.moveTo(postX, roadTop - 18);
        context.lineTo(postX, roadTop - 2);
        context.stroke();
      }
      context.restore();

      context.fillStyle = '#3d5a3e';
      for (let tx = 0; tx < width + 80; tx += 80) {
        const treeX = ((tx - frameCount * 1.5) % (width + 80) + width + 80) % (width + 80) - 80;
        const treeHeight = 60 + Math.sin(tx * 0.7) * 20;
        context.beginPath();
        context.ellipse(treeX, roadTop - treeHeight * 0.5, 10, treeHeight * 0.5, 0, 0, Math.PI * 2);
        context.fill();
      }

      vanBob = Math.sin(frameCount * 0.05) * 1.8;
      const vanTargetX = width * lerp(0.1, 0.7, progressValue);
      vanX += (vanTargetX - vanX) * 0.04;

      const vanY = roadTop - 8 + vanBob;
      const vanWidth = Math.min(140, width * 0.3);
      const vanHeight = 60;

      context.save();
      context.globalAlpha = 0.18;
      context.fillStyle = '#000';
      context.beginPath();
      context.ellipse(vanX + vanWidth * 0.5, vanY + vanHeight - 2, vanWidth * 0.45, 8, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.fillStyle = '#d0d0d0';
      context.beginPath();
      context.roundRect(vanX, vanY + 18, vanWidth, vanHeight - 20, 6);
      context.fill();

      context.fillStyle = '#c4c4c4';
      context.beginPath();
      context.moveTo(vanX + 22, vanY + 18);
      context.lineTo(vanX + 32, vanY + 4);
      context.lineTo(vanX + vanWidth - 10, vanY + 4);
      context.lineTo(vanX + vanWidth - 4, vanY + 18);
      context.closePath();
      context.fill();

      context.fillStyle = 'rgba(135,206,235,0.75)';
      context.beginPath();
      context.moveTo(vanX + 28, vanY + 17);
      context.lineTo(vanX + 36, vanY + 7);
      context.lineTo(vanX + 64, vanY + 7);
      context.lineTo(vanX + 64, vanY + 17);
      context.closePath();
      context.fill();
      context.fillRect(vanX + 68, vanY + 8, 30, 9);
      context.fillRect(vanX + 102, vanY + 8, 24, 9);

      context.fillStyle = '#2563eb';
      context.fillRect(vanX, vanY + 30, vanWidth, 5);

      context.fillStyle = '#fff9c0';
      context.beginPath();
      context.ellipse(vanX + vanWidth - 6, vanY + 26, 6, 5, 0, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#ff3322';
      context.beginPath();
      context.ellipse(vanX + 6, vanY + 26, 5, 4, 0, 0, Math.PI * 2);
      context.fill();

      for (const wheelX of [vanX + 22, vanX + vanWidth - 28]) {
        context.fillStyle = '#1a1a1a';
        context.beginPath();
        context.arc(wheelX, vanY + vanHeight - 6, 14, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#666';
        context.beginPath();
        context.arc(wheelX, vanY + vanHeight - 6, 8, 0, Math.PI * 2);
        context.fill();
        context.save();
        context.translate(wheelX, vanY + vanHeight - 6);
        context.rotate(frameCount * 0.12);
        context.strokeStyle = '#999';
        context.lineWidth = 1.5;
        for (let spoke = 0; spoke < 4; spoke += 1) {
          context.beginPath();
          context.moveTo(0, 0);
          context.lineTo(Math.cos(spoke * Math.PI / 2) * 6, Math.sin(spoke * Math.PI / 2) * 6);
          context.stroke();
        }
        context.restore();
      }

      if (frameCount % 4 === 0) {
        context.save();
        context.globalAlpha = 0.12 + Math.random() * 0.06;
        context.fillStyle = '#aaa';
        context.beginPath();
        context.arc(vanX - 8 + Math.random() * 6, vanY + vanHeight - 14 + Math.random() * 4, 5 + Math.random() * 4, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      const stopIndex = Math.min(Math.round(progressValue * (sceneStops.length - 1)), sceneStops.length - 1);
      context.save();
      context.font = '600 11px "DM Mono", monospace';
      context.fillStyle = 'rgba(255,255,255,0.55)';
      context.textAlign = 'left';
      context.fillText(`PCH - ${sceneStops[stopIndex].label.toUpperCase()}`, 18, height - 18);
      context.restore();

      animationFrame = requestAnimationFrame(drawScene);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrame = requestAnimationFrame(drawScene);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div id="scene-wrap">
      <canvas id="scene-canvas" ref={canvasRef} />
    </div>
  );
}
