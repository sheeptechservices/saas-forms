"use client";

import { useEffect, useRef } from "react";

interface Dot {
  ox: number;
  oy: number;
  x: number;
  y: number;
}

interface Ripple {
  x: number;
  y: number;
  t: number;       // timestamp ms
  speed: number;   // px/ms
  maxR: number;
  strength: number;
}

const SPACING = 26;
const DOT_RADIUS = 1;
const MOUSE_RADIUS = 110;
const REPULSION = 50;
const SPRING = 0.1;

const RIPPLE_SPEED = 0.3;       // px per ms
const RIPPLE_MAX_R = 500;
const RIPPLE_STRENGTH = 35;
const RIPPLE_THICKNESS = 38;

export function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dots: Dot[] = [];
    let mouse = { x: -9999, y: -9999 };
    let ripples: Ripple[] = [];
    let raf: number;

    function build() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      dots = [];
      for (let y = 0; y <= canvas.height + SPACING; y += SPACING) {
        for (let x = 0; x <= canvas.width + SPACING; x += SPACING) {
          dots.push({ ox: x, oy: y, x, y });
        }
      }
    }

    function frame(now: number) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Limpa ripples expirados
      ripples = ripples.filter(r => (now - r.t) * r.speed < r.maxR);

      for (const d of dots) {
        // ── Força do mouse ──
        const mdx = d.ox - mouse.x;
        const mdy = d.oy - mouse.y;
        const mDist = Math.hypot(mdx, mdy);

        let tx = d.ox;
        let ty = d.oy;

        if (mDist < MOUSE_RADIUS && mDist > 0) {
          const force = (1 - mDist / MOUSE_RADIUS) * REPULSION;
          tx = d.ox + (mdx / mDist) * force;
          ty = d.oy + (mdy / mDist) * force;
        }

        // ── Força dos ripples ──
        let rippleAlpha = 0;
        let rippleR = 0;

        for (const r of ripples) {
          const elapsed = now - r.t;
          const waveR = elapsed * r.speed;
          const fade = 1 - waveR / r.maxR;

          const rdx = d.ox - r.x;
          const rdy = d.oy - r.y;
          const dotDist = Math.hypot(rdx, rdy);
          const distFromWave = Math.abs(dotDist - waveR);

          if (distFromWave < RIPPLE_THICKNESS && dotDist > 0) {
            const waveIntensity = (1 - distFromWave / RIPPLE_THICKNESS) * fade;
            const push = waveIntensity * r.strength;
            tx += (rdx / dotDist) * push;
            ty += (rdy / dotDist) * push;
            rippleAlpha = Math.max(rippleAlpha, waveIntensity);
            rippleR = Math.max(rippleR, waveIntensity);
          }
        }

        // ── Spring para posição alvo ──
        d.x += (tx - d.x) * (mDist < MOUSE_RADIUS ? 0.3 : SPRING);
        d.y += (ty - d.y) * (mDist < MOUSE_RADIUS ? 0.3 : SPRING);

        // ── Visual ──
        const curMouseDist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
        const mouseIntensity = curMouseDist < MOUSE_RADIUS ? 1 - curMouseDist / MOUSE_RADIUS : 0;
        const totalIntensity = Math.min(1, mouseIntensity + rippleAlpha * 0.9);

        ctx.beginPath();
        ctx.arc(d.x, d.y, DOT_RADIUS + totalIntensity * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170,255,0,${(0.28 + totalIntensity * 0.55).toFixed(2)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    build();
    raf = requestAnimationFrame(frame);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouse = { x: -9999, y: -9999 }; };
    const onResize = () => build();
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        t: performance.now(),
        speed: RIPPLE_SPEED,
        maxR: RIPPLE_MAX_R,
        strength: RIPPLE_STRENGTH,
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);
    window.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
