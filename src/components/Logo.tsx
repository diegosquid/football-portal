import React from "react";
import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 hover:opacity-90 transition-opacity ${className}`}>
      {/* Shield logo — white circle background */}
      <div className="shrink-0 flex items-center justify-center rounded-full bg-white w-14 h-14">
        <Image
          src="/static/logo-96.png"
          alt="Beira do Campo"
          width={48}
          height={48}
        />
      </div>

      {/* Typography */}
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="text-[1.35rem] font-black tracking-wide text-white uppercase">
          BEIRA
        </span>
        <span className="text-[1.35rem] font-light tracking-wide text-white uppercase">
          DO CAMPO
        </span>
      </div>
    </div>
  );
}
