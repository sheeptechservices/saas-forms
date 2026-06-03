import { SdrForm } from "@/components/sdr-form";
import { DotGrid } from "@/components/dot-grid";
import { CyclingTitle } from "@/components/cycling-title";
import { NeonBackground } from "@/components/neon-background";
import { SheepLogo } from "@/components/sheep-logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080808] relative overflow-hidden">

      {/* Dot grid interativo */}
      <DotGrid />
      {/* Elementos neon flutuantes */}
      <NeonBackground />

      {/* Animated blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(170,255,0,0.07) 0%, transparent 70%)",
          animation: "blob1 14s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(170,255,0,0.05) 0%, transparent 70%)",
          animation: "blob2 18s ease-in-out infinite",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(170,255,0,0.03) 0%, transparent 70%)",
          animation: "blob3 22s ease-in-out infinite",
          filter: "blur(100px)",
        }}
      />

      {/* Decorative floating rings */}
      <div className="absolute top-20 right-[8%] w-24 h-24 rounded-full border border-[#AAFF00]/8 pointer-events-none"
        style={{ animation: "blob3 10s ease-in-out infinite" }} />
      <div className="absolute top-32 right-[9%] w-12 h-12 rounded-full border border-[#AAFF00]/12 pointer-events-none"
        style={{ animation: "blob1 8s ease-in-out infinite reverse" }} />
      <div className="absolute bottom-40 left-[6%] w-16 h-16 rounded-full border border-[#AAFF00]/10 pointer-events-none"
        style={{ animation: "blob2 12s ease-in-out infinite" }} />
      <div className="absolute bottom-28 left-[7%] w-6 h-6 rounded-full bg-[#AAFF00]/8 pointer-events-none"
        style={{ animation: "blob3 9s ease-in-out infinite reverse" }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero header */}
        <div className="pt-10 pb-7 px-4 sm:pt-16 sm:pb-12">
          <div className="max-w-2xl mx-auto text-center space-y-4 sm:space-y-5">
            <SheepLogo />
            <CyclingTitle />
            <p className="text-[#777] max-w-md mx-auto text-xs sm:text-sm leading-relaxed px-2 sm:px-0">
              Preencha as informações abaixo para que possamos criar um SDR personalizado para o seu
              negócio — pensado para converter e vender pelo WhatsApp.
            </p>
          </div>
        </div>

        {/* Form area */}
        <div className="px-3 pb-10 sm:px-4 sm:pb-16 safe-area-bottom">
          <SdrForm />
          <p className="text-center text-xs text-white/60 mt-6 sm:mt-8 px-4">
            Suas informações são tratadas com sigilo e usadas apenas para a construção do seu SDR.
          </p>
        </div>
      </div>
    </div>
  );
}
