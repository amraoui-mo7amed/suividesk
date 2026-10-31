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
          <stop offset="50%" stopColor="#003B73" />
          <stop offset="100%" stopColor="#06162d" />
        </linearGradient>
        <linearGradient id="logoCyanStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#00A3E0" />
        </linearGradient>
      </defs>

      {/* Rounded Squircle Tile with Breathing Whitespace Margins */}
      <rect 
        x="10" 
        y="10" 
        width="108" 
        height="108" 
        rx="30" 
        fill="url(#logoBgGrad)" 
        stroke="#00A3E0" 
        strokeWidth="1.5" 
        strokeOpacity="0.3"
      />

      {/* Centered Monogram S + Cyan Pulse Dot */}
      <g transform="translate(28, 22)" strokeLinecap="round" strokeLinejoin="round">
        <path 
          d="M 52,14 C 48,6 36,4 26,6 C 12,9 8,22 16,32 C 24,42 48,40 54,50 C 60,60 52,70 38,70 C 24,70 14,64 10,54" 
          fill="none" 
          stroke="url(#logoCyanStroke)" 
          strokeWidth="8" 
        />
        
        {/* Cyan Spark Dot */}
        <circle cx="56" cy="14" r="5" fill="#38bdf8" />
      </g>
    </svg>
  );
};
