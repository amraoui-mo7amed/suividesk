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

      {/* Solid Rounded Squircle Tile without edge whitespace */}
      <rect 
        x="2" 
        y="2" 
        width="124" 
        height="124" 
        rx="30" 
        fill="url(#logoBgGrad)" 
        stroke="#00A3E0" 
        strokeWidth="1.5" 
        strokeOpacity="0.3"
      />

      {/* Stylized Pure Monogram S + Pulse Dot (no white notch, no white marks) */}
      <g transform="translate(24, 20)" strokeLinecap="round" strokeLinejoin="round">
        <path 
          d="M 58,16 C 52,6 38,4 28,6 C 14,9 10,24 20,36 C 30,48 58,46 64,58 C 70,70 60,82 44,82 C 28,82 16,74 12,62" 
          fill="none" 
          stroke="url(#logoCyanStroke)" 
          strokeWidth="8.5" 
        />
        
        {/* Cyan Spark Dot */}
        <circle cx="62" cy="16" r="5.5" fill="#38bdf8" />
      </g>
    </svg>
  );
};
