"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const WORDS = [
  "seu SDR?",
  "mais vendas?",
  "seu Agente 24h?",
  "mais clientes?",
  "uma máquina de vendas?",
];

export function CyclingTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <h1 className="text-[2rem] sm:text-[2.6rem] md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.18] sm:leading-[1.15]">
      Vamos construir
      <br />
      {/* Container com overflow hidden — entrada e saída são simultâneas */}
      <span className="relative block" style={{ clipPath: "inset(-8px -60vw)" }}>
        {/* Palavra fantasma define a altura da linha */}
        <span className="invisible pointer-events-none select-none block whitespace-nowrap">
          {WORDS[0]}
        </span>

        <AnimatePresence initial={false}>
          <motion.span
            key={index}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center text-[#AAFF00] whitespace-nowrap"
            style={{
              textShadow: "0 0 12px rgba(170,255,0,0.7), 0 0 35px rgba(170,255,0,0.3), 0 0 70px rgba(170,255,0,0.1)",
            }}
          >
            {WORDS[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </h1>
  );
}
