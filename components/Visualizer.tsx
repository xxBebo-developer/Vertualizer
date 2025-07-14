
import React, { useEffect, forwardRef, useRef } from 'react';
import type { VisualizerSettings, VisualizerStyle } from '../types.ts';
import { resolutions } from '../types.ts';

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
  life: number;
}

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

const drawParticles = (particles: React.MutableRefObject<Particle[]>, ctx: CanvasRenderingContext2D, data: Uint8Array, color: string, speed: number, width: number, height: number) => {
    const averageAmp = data.reduce((sum, val) => sum + val, 0) / data.length;
    const intensity = Math.pow(averageAmp / 128, 2);

    if (particles.current.length < 100 && Math.random() < 0.5 * intensity) {
        const radius = 2 + Math.random() * 3;
        particles.current.push({
            x: Math.random() * width,
            y: height,
            radius: radius,
            color: color,
            vx: (Math.random() - 0.5) * 2,
            vy: -(Math.random() * 2 + 1) * (1 + intensity * speed),
            life: 1,
        });
    }

    ctx.fillStyle = color;
    for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life -= 0.005;

        if (p.life <= 0) {
            particles.current.splice(i, 1);
        } else {
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
};

const drawDualBars = (ctx: CanvasRenderingContext2D, data: Uint8Array, color: string, width: number, height: number) => {
    const barWidth = width / data.length;
    const centerY = height / 2;
    ctx.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * (height / 2) * 0.9;
        ctx.fillRect(i * barWidth, centerY - barHeight, barWidth, barHeight);
        ctx.fillRect(i * barWidth, centerY, barWidth, barHeight);
    }
};

const drawGalaxy = (particles: React.MutableRefObject<Particle[]>, ctx: CanvasRenderingContext2D, data: Uint8Array, color: string, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const bass = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8;

    if (bass > 180 && Math.random() > 0.5) {
        const particleCount = 20 + Math.floor(Math.random() * 20);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3 + (bass - 180) / 50;
            particles.current.push({
                x: centerX,
                y: centerY,
                radius: 1 + Math.random() * 2,
                color: color,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
            });
        }
    }

    ctx.fillStyle = color;
    for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;

        if (p.life <= 0) {
            particles.current.splice(i, 1);
        } else {
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
};


const drawScene = (ctx: CanvasRenderingContext2D, frequencyData: Uint8Array, settings: VisualizerSettings, particlesRef: React.MutableRefObject<Particle[]>) => {
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
            drawParticles(particlesRef, ctx, frequencyData, settings.barColor, settings.particleSpeed, width, height);
            break;
        case 'dual_bars':
            drawDualBars(ctx, frequencyData, settings.barColor, width, height);
            break;
        case 'galaxy':
            drawGalaxy(particlesRef, ctx, frequencyData, settings.barColor, width, height);
            break;
        default:
            drawBars(ctx, frequencyData, settings.barColor, width, height);
    }
}

export const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>(({ frequencyData, settings, offscreenCanvasRef }, ref) => {
  const particlesRef = useRef<Particle[]>([]);

  // Clear particles when style changes to avoid visual artifacts
  useEffect(() => {
    particlesRef.current = [];
  }, [settings.style]);
  
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
            const scaledCtx = visibleCtx;
            const originalWidth = visibleCanvas.width / (window.devicePixelRatio || 1);
            const originalHeight = visibleCanvas.height / (window.devicePixelRatio || 1);

            scaledCtx.fillStyle = settings.backgroundColor;
            scaledCtx.fillRect(0, 0, originalWidth, originalHeight);

            drawScene(scaledCtx, frequencyData, settings, particlesRef);
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
            drawScene(offscreenCtx, frequencyData, settings, particlesRef);
        }
    }
  }, [frequencyData, settings, ref, offscreenCanvasRef]);

  return <canvas ref={ref} className="w-full h-full" />;
});
Visualizer.displayName = 'Visualizer';