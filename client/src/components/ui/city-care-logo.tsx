import React from "react";

interface CityCareLogoProps {
  variant?: "light" | "dark";
  showTagline?: boolean;
  className?: string;
}

export function CityMapIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* City Map Hexagonal / Grid Shield Base */}
      <rect
        x="2"
        y="2"
        width="32"
        height="32"
        rx="9"
        className="fill-slate-950"
      />
      
      {/* Grid / Street Geometry Paths */}
      <path
        d="M2 18H34M18 2V34M10 2L10 34M26 2L26 34"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1.2"
      />

      {/* Main Street Arterial Curve */}
      <path
        d="M7 26C12 26 14 18 22 18C26 18 29 13 29 10"
        stroke="rgba(16, 185, 129, 0.5)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* City Pin Point & Radial Pulse */}
      <circle cx="18" cy="14" r="5.5" className="fill-emerald-500" />
      <circle cx="18" cy="14" r="2.2" className="fill-white" />
      <path
        d="M18 19.5L18 23"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CityCareLogo({
  variant = "light",
  showTagline = true,
  className = "",
}: CityCareLogoProps) {
  const isDark = variant === "dark";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <CityMapIcon className="h-9 w-9 shrink-0 shadow-xs" />
      <div className="flex flex-col">
        <span
          className={`text-lg font-bold tracking-tight leading-none ${
            isDark ? "text-white" : "text-slate-950"
          }`}
        >
          CityCare
        </span>
        {showTagline ? (
          <span
            className={`mt-1 text-[11px] font-medium tracking-normal leading-none ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Your City, Our Care
          </span>
        ) : null}
      </div>
    </div>
  );
}

