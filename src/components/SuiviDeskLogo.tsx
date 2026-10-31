import React from 'react';

export const SuiviDeskLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg 
      viewBox="0 0 128 128" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0055A5" />
          <stop offset="60%" stopColor="#003B73" />
          <stop offset="100%" stopColor="#07162c" />
        </linearGradient>
        <linearGradient id="logoCyanStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#00A3E0" />
        </linearGradient>
        <linearGradient id="logoGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0055A5" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Squircle Tile with Glass Border */}
      <rect 
        x="6" 
        y="6" 
        width="116" 
        height="116" 
        rx="28" 
        fill="url(#logoBgGrad)" 
        stroke="rgba(255, 255, 255, 0.18)" 
        strokeWidth="2" 
      />
      
      {/* Reflection Highlight */}
      <path 
        d="M 14,36 C 14,24 24,14 36,14 L 92,14 C 104,14 114,24 114,36 C 114,48 85,38 64,44 C 40,50 14,56 14,36 Z" 
        fill="url(#logoGlow)" 
        opacity="0.35" 
      />

      {/* Stylized Monogram S + Pulse Dot */}
      <g transform="translate(28, 28)" strokeLinecap="round" strokeLinejoin="round">
        <path 
          d="M 52,14 C 48,6 36,4 26,6 C 12,9 8,22 16,32 C 24,42 48,40 54,50 C 60,60 52,70 38,70 C 24,70 14,64 10,54" 
          fill="none" 
          stroke="url(#logoCyanStroke)" 
          strokeWidth="7" 
        />
        
        {/* Glow Tracking Spark Dot */}
        <circle cx="56" cy="14" r="5" fill="#38bdf8" />

        {/* Check Notch */}
        <path 
          d="M 28,52 L 35,59 L 48,46" 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="4.5" 
        />
      </g>
    </svg>
  );
};
