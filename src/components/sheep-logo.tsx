"use client";

import { motion } from "framer-motion";
import { GiSheep } from "react-icons/gi";

export function SheepLogo() {
  return (
    <motion.div
      className="mx-auto w-fit"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <GiSheep
        className="w-12 h-12 sm:w-[88px] sm:h-[88px]"
        color="#AAFF00"
        style={{
          filter:
            "drop-shadow(0 0 6px rgba(170,255,0,0.75)) drop-shadow(0 0 18px rgba(170,255,0,0.35)) drop-shadow(0 0 40px rgba(170,255,0,0.15))",
        }}
      />
    </motion.div>
  );
}
