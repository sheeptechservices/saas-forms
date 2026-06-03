"use client";

import { useEffect, useRef } from "react";

type PType = "text" | "hex" | "circle" | "triangle";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  text: string;
  size: number;
  alpha: number;
  alphaDir: number;
  rotation: number;
  rotSpeed: number;
  type: PType;
}

const SYMBOLS = [
  "01","10","11","00","101","010","0101","1100",
  "</>","{}", "=>","//","&&","||","##",
  "0xAF","0xFF","#AA","λ","∑","∆","π",
  "if","fn","AI","SDR","ML",">_",
  "[ ]","( )","< >",
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function make(w: number, h: number, initial = false): Particle {
  const types: PType[] = ["text","text","text","hex","circle","triangle"];
  return {
    x: rand(0, w),
    y: initial ? rand(-h, h) : rand(h + 10, h + 60),
    vx: rand(-0.25, 0.25),
    vy: -rand(0.08, 0.35),
    text: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    size: rand(9, 22),
    alpha: rand(0.2, 0.55),
    alphaDir: Math.random() > 0.5 ? 1 : -1,
    rotation: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.008, 0.008),
    type: types[Math.floor(Math.random() * types.length)],
  };
}

export function NeonBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let particles: Particle[] = [];
    let raf: number;

    function build() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 22000));
      particles = Array.from({ length: count }, () => make(canvas.width, canvas.height, true));
    }

    function hexPath(r: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        i === 0
          ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a))
          : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      ctx.closePath();
    }

    function triPath(r: number) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
        i === 0
          ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a))
          : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      ctx.closePath();
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha += p.alphaDir * 0.0015;
        if (p.alpha > 0.6) { p.alpha = 0.6; p.alphaDir = -1; }
        if (p.alpha < 0.12) { p.alpha = 0.12; p.alphaDir = 1; }

        if (p.y < -40) {
          particles[i] = make(canvas.width, canvas.height);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = "rgba(170,255,0,1)";
        ctx.fillStyle = "rgba(170,255,0,1)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(170,255,0,0.8)";
        ctx.lineWidth = 1;

        if (p.type === "text") {
          ctx.font = `${p.size}px 'Courier New', monospace`;
          ctx.fillText(p.text, 0, 0);
        } else if (p.type === "hex") {
          hexPath(p.size);
          ctx.stroke();
        } else if (p.type === "triangle") {
          triPath(p.size);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    }

    build();
    frame();

    window.addEventListener("resize", build);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
