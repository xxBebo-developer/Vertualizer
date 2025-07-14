
import React, { useEffect, forwardRef } from 'react';
import type { VisualizerSettings } from '../types';
import { resolutions } from '../types';

interface VisualizerProps {
  frequencyData: Uint8Array;
  settings: VisualizerSettings;
  offscreenCanvasRef: React.RefObject<HTMLCanvasElement>;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

const particles: Particle[] = [];

// Drawing functions now take canvas dimensions to be resolution-independent
const drawBars = (ctx: CanvasRenderingContext2D, data: Uint8Array, color: string, width: number, height: number) => {
  let x = 0;
  const barWidth = (width / data.length) * 2.5;
  ctx.fillStyle = color;
  for (let i = 0; i < data.length; i++) {
    const barHeight = (data[i] / 255) * height * 0.8;
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
};

const drawWave = (ctx: CanvasRenderingContext2D, data: Uint8Array, color: string, lineWidth: number, width: number, height: number) => {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    
    const sliceWidth = width * 1.0 / data.length;
    let x = 0;

    for(let i = 0; i < data.length; i++) {
        const v = data[i] / 255.0;
        const y = v * height/2 + height / 4;

        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
    }
    ctx.lineTo(width, height / 2);
    ctx.stroke();
};

const drawCircle = (ctx: CanvasRenderingContext2D, data: Uint8Array, color: string, lineWidth: number, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.2;
    const len = data.length;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for(let i = 0; i < len; i++) {
        const amp = data[i] / 255;
        const angle = (i / len) * Math.PI * 2 - Math.PI / 2;
        const r = radius + amp * height * 0.2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
};

const drawParticles = (ctx: CanvasRenderingContext2D, data: Uint8Array, color: string, speed: number, width: number, height: number) => {
    const averageAmp = data.reduce((sum, val) => sum + val, 0) / data.length;
    const intensity = Math.pow(averageAmp / 128, 2);

    if (particles.length < 100 && Math.random() < 0.5 * intensity) {
        const radius = 2 + Math.random() * 3;
        particles.push({
            x: Math.random() * width,
            y: height,
            radius: radius,
            color: color,
            vx: (Math.random() - 0.5) * 2,
            vy: -(Math.random() * 2 + 1) * (1 + intensity * speed),
        });
    }

    ctx.fillStyle = color;
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.radius *= 0.99;

        if (p.y + p.radius < 0 || p.x < -p.radius || p.x > width + p.radius || p.radius < 0.5) {
            particles.splice(i, 1);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

const drawScene = (ctx: CanvasRenderingContext2D, frequencyData: Uint8Array, settings: VisualizerSettings) => {
    const { width, height } = ctx.canvas;
    
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    switch (settings.style) {
        case 'bars':
            drawBars(ctx, frequencyData, settings.barColor, width, height);
            break;
        case 'wave':
            drawWave(ctx, frequencyData, settings.barColor, settings.lineWidth, width, height);
            break;
        case 'circle':
            drawCircle(ctx, frequencyData, settings.barColor, settings.lineWidth, width, height);
            break;
        case 'particles':
            drawParticles(ctx, frequencyData, settings.barColor, settings.particleSpeed, width, height);
            break;
        default:
            drawBars(ctx, frequencyData, settings.barColor, width, height);
    }
}

export const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>(({ frequencyData, settings, offscreenCanvasRef }, ref) => {
  useEffect(() => {
    // 1. Configure and draw on the visible canvas
    const visibleCanvas = (ref as React.RefObject<HTMLCanvasElement>)?.current;
    if (visibleCanvas) {
        const parent = visibleCanvas.parentElement;
        if (parent) {
            const dpr = window.devicePixelRatio || 1;
            const rect = parent.getBoundingClientRect();
            if (visibleCanvas.width !== rect.width * dpr || visibleCanvas.height !== rect.height * dpr) {
                visibleCanvas.width = rect.width * dpr;
                visibleCanvas.height = rect.height * dpr;
                visibleCanvas.style.width = `${rect.width}px`;
                visibleCanvas.style.height = `${rect.height}px`;
                const ctx = visibleCanvas.getContext('2d');
                ctx?.scale(dpr, dpr);
            }
        }
        const visibleCtx = visibleCanvas.getContext('2d');
        if (visibleCtx) {
            drawScene(visibleCtx, frequencyData, settings);
        }
    }

    // 2. Configure and draw on the offscreen canvas for recording
    const offscreenCanvas = offscreenCanvasRef.current;
    if (offscreenCanvas) {
        const resolution = resolutions[settings.resolution];
        if (offscreenCanvas.width !== resolution.width || offscreenCanvas.height !== resolution.height) {
            offscreenCanvas.width = resolution.width;
            offscreenCanvas.height = resolution.height;
        }
        const offscreenCtx = offscreenCanvas.getContext('2d');
        if (offscreenCtx) {
            drawScene(offscreenCtx, frequencyData, settings);
        }
    }
  }, [frequencyData, settings, ref, offscreenCanvasRef]);

  return <canvas ref={ref} className="w-full h-full" />;
});
Visualizer.displayName = 'Visualizer';