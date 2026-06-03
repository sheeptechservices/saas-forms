"use client";

import { useEffect, useRef } from "react";
import { CyclingTitle } from "./cycling-title";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const state = useRef({ current: 0, target: 0 });

  useEffect(() => {
    let raf: number;

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      state.current.target = Math.max(0, 1 - dist / 420);
    };

    const onLeave = () => { state.current.target = 0; };

    const tick = () => {
      const s = state.current;
      s.current += (s.target - s.current) * 0.05;

      if (turbRef.current && dispRef.current) {
        const freq = (0.012 + s.current * 0.022).toFixed(4);
        turbRef.current.setAttribute("baseFrequency", freq);
        dispRef.current.setAttribute("scale", String((s.current * 12).toFixed(2)));
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="pt-16 pb-12 px-4 relative">
      {/* Filtro SVG de distorção */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          <filter id="hero-distort" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              ref={turbRef}
              type="turbulence"
              baseFrequency="0.012"
              numOctaves="3"
              seed="8"
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="max-w-2xl mx-auto text-center space-y-5"
        style={{ filter: "url(#hero-distort)" }}
      >
        <CyclingTitle />
        <p className="text-[#777] max-w-md mx-auto text-sm leading-relaxed">
          Preencha as informações abaixo para que possamos criar um SDR personalizado para o seu
          negócio — pensado para converter e vender pelo WhatsApp.
        </p>
      </div>
    </div>
  );
}
