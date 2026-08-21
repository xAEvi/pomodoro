"use client";

import React from "react";

interface ProgressRingProps {
  progress: number; // 0..1, fracción de tiempo transcurrido
  colorClass: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  isRunning?: boolean;
}

export default function ProgressRing({
  progress,
  colorClass,
  size = 176,
  strokeWidth = 6,
  children,
  isRunning = false,
}: ProgressRingProps) {
  // Bleed externo para que blur / drop-shadow / dot no se recorten por el viewBox
  const pad = 14;
  const c = size / 2;
  const radius = size / 2 - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const dashOffset = circumference * (1 - clampedProgress);

  // Dot perfectamente acoplado al tip del arco:
  // el strokeLinecap="round" alarga visualmente ~strokeWidth/2 sobre el arco,
  // así que compensamos medio grosor hacia atrás para que el centro del dot
  // coincida con el borde exterior del cap, no con su centro geométrico.
  const capCompDeg = (strokeWidth / 2 / circumference) * 360;
  const angleDeg = clampedProgress * 360 - 90 - capCompDeg * clampedProgress;
  const angleRad = (angleDeg * Math.PI) / 180;
  const dotX = Number((c + radius * Math.cos(angleRad)).toFixed(2));
  const dotY = Number((c + radius * Math.sin(angleRad)).toFixed(2));
  const showDot = clampedProgress > 0.008 && clampedProgress < 0.992;

  return (
    <div
      className={`relative overflow-visible ${isRunning ? "motion-safe:animate-[ring-breathe_4s_ease-in-out_infinite]" : ""}`}
      style={{ width: size, height: size, overflow: "visible" }}
      role="progressbar"
      aria-valuenow={Math.round(clampedProgress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${Math.round(clampedProgress * 100)}% elapsed`}
    >
      {/* Subtle outer glow when running — surgical accent, con bleed para no recortar blur */}
      {isRunning && (
        <span
          aria-hidden="true"
          className={`absolute rounded-full blur-[18px] opacity-[0.11] transition-opacity duration-700 pointer-events-none ${colorClass} bg-current`}
          style={{ inset: -6, transform: "scale(0.96)" }}
        />
      )}
      <svg
        viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
        width={size}
        height={size}
        className="block overflow-visible"
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        {/* Instrument ticks — 12 faint marks, 3h/6h/9h/12h slightly longer */}
        <g opacity={0.9}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 - 90) * (Math.PI / 180);
            const isCardinal = i % 3 === 0;
            const tickLen = isCardinal ? 5 : 2.5;
            const outer = radius + strokeWidth / 2 + 3;
            const inner = outer - tickLen;
            const x1 = Number((c + inner * Math.cos(a)).toFixed(2));
            const y1 = Number((c + inner * Math.sin(a)).toFixed(2));
            const x2 = Number((c + outer * Math.cos(a)).toFixed(2));
            const y2 = Number((c + outer * Math.sin(a)).toFixed(2));
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.09)"
                strokeWidth={isCardinal ? 1.1 : 0.9}
                strokeLinecap="round"
              />
            );
          })}
        </g>
        <circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${c} ${c})`}
          className={`transition-[stroke-dashoffset] duration-500 ease-linear ${colorClass}`}
          stroke="currentColor"
          style={
            isRunning
              ? { filter: "drop-shadow(0 0 6px currentColor)", overflow: "visible" }
              : { overflow: "visible" }
          }
        />
        {/* Orbiting head dot — anclado al centro geométrico del stroke, no al borde del viewBox */}
        {showDot && (
          <g style={{ opacity: isRunning ? 1 : 0.85 }}>
            {/* outer glow */}
            <circle
              cx={dotX}
              cy={dotY}
              r={7}
              fill="currentColor"
              className={colorClass}
              opacity={0.14}
            />
            <circle
              cx={dotX}
              cy={dotY}
              r={3.5}
              fill="currentColor"
              className={`${colorClass} drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]`}
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={1}
            />
            <circle cx={dotX} cy={dotY} r={1.1} fill="white" opacity={0.95} />
          </g>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        {children}
      </div>
    </div>
  );
}
