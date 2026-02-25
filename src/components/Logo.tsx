import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 hover:opacity-90 transition-opacity ${className}`}>
      {/* Icon: Modern stylized football pitch */}
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-[#ff6b8b] shadow-[0_0_15px_rgba(233,69,96,0.4)]">
        {/* Pitch stripes effect */}
        <div className="absolute inset-0 flex opacity-20">
          <div className="w-1/4 h-full bg-white/40 -skew-x-12 translate-x-1 shadow-sm"></div>
          <div className="w-1/4 h-full bg-transparent"></div>
          <div className="w-1/4 h-full bg-white/40 -skew-x-12 -translate-x-1 shadow-sm"></div>
          <div className="w-1/4 h-full bg-transparent"></div>
        </div>
        
        <svg
          className="relative z-10 h-5 w-5 text-white drop-shadow-sm"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <circle cx="12" cy="12" r="3" />
          <path d="M2 9h3v6H2" />
          <path d="M22 9h-3v6h3" />
          <circle cx="12" cy="12" r="0.5" fill="currentColor" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col items-start leading-none justify-center">
        <span className="text-[1.35rem] font-black tracking-tight text-white uppercase drop-shadow-sm">
          <span className="text-primary">BEIRA</span> DO CAMPO
        </span>
      </div>
    </div>
  );
}
