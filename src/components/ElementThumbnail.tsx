import React from 'react';

interface ElementThumbnailProps {
  type: string;
  customImg?: string;
  size?: number;
  className?: string;
}

export const ElementThumbnail: React.FC<ElementThumbnailProps> = ({
  type,
  customImg,
  size = 24,
  className = '',
}) => {
  // If custom addon element with uploaded/drawn image
  if (customImg) {
    return (
      <div
        className={`relative shrink-0 rounded-md overflow-hidden bg-black/40 border border-white/20 flex items-center justify-center p-0.5 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={customImg}
          alt={type}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 rounded-md overflow-hidden shadow-sm flex items-center justify-center border border-white/15 bg-black/40 ${className}`}
      style={{ width: size, height: size }}
    >
      {type === 'grass' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Earth base */}
          <rect x="1" y="7" width="22" height="16" rx="1" fill="#573d2a" />
          <rect x="4" y="12" width="3" height="3" fill="#382618" />
          <rect x="14" y="15" width="4" height="3" fill="#382618" />
          <rect x="9" y="18" width="3" height="3" fill="#382618" />
          {/* Grass top */}
          <rect x="1" y="6" width="22" height="6" fill="#22c55e" />
          {/* Grass tufts */}
          <polygon points="1,6 4,1 7,6" fill="#4ade80" />
          <polygon points="7,6 10,2 13,6" fill="#4ade80" />
          <polygon points="13,6 16,1 19,6" fill="#4ade80" />
          <polygon points="18,6 21,3 23,6" fill="#4ade80" />
        </svg>
      )}

      {type === 'ground' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Dirt and stone block */}
          <rect x="1" y="1" width="22" height="22" rx="2" fill="#573d2a" stroke="#3d2a1c" strokeWidth="1" />
          <rect x="1" y="1" width="22" height="3" fill="#78553a" />
          <rect x="4" y="7" width="4" height="3" rx="0.5" fill="#3d2a1c" />
          <rect x="13" y="6" width="5" height="4" rx="0.5" fill="#3d2a1c" />
          <rect x="6" y="14" width="6" height="4" rx="0.5" fill="#3d2a1c" />
          <rect x="15" y="13" width="4" height="3" rx="0.5" fill="#3d2a1c" />
        </svg>
      )}

      {type === 'platform' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Floating wooden platform */}
          <rect x="1" y="8" width="22" height="8" rx="1.5" fill="#b45309" stroke="#78350f" strokeWidth="1" />
          <rect x="1" y="8" width="22" height="2" fill="#d97706" />
          <line x1="8" y1="10" x2="8" y2="16" stroke="#78350f" strokeWidth="1" />
          <line x1="16" y1="10" x2="16" y2="16" stroke="#78350f" strokeWidth="1" />
        </svg>
      )}

      {type === 'spike' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Sharp metal spikes with blood/danger tip */}
          <polygon points="3,21 7,5 11,21" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          <polygon points="7,5 6,10 8,10" fill="#ef4444" />
          <polygon points="12,21 16,5 20,21" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          <polygon points="16,5 15,10 17,10" fill="#ef4444" />
        </svg>
      )}

      {type === 'lava' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Molten bubbling lava */}
          <defs>
            <linearGradient id="lavaGradThumb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="60%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="22" height="22" rx="2" fill="url(#lavaGradThumb)" />
          {/* Surface wave */}
          <path d="M1,6 Q6,3 12,6 T23,6 L23,23 L1,23 Z" fill="#ea580c" />
          <circle cx="8" cy="14" r="3" fill="#facc15" />
          <circle cx="16" cy="11" r="2" fill="#facc15" />
          <circle cx="13" cy="18" r="1.5" fill="#fef08a" />
        </svg>
      )}

      {type === 'flag' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Silver pole */}
          <rect x="5" y="3" width="2" height="19" fill="#e2e8f0" />
          {/* Gold finial */}
          <circle cx="6" cy="3" r="2" fill="#facc15" />
          {/* Checkered flag */}
          <rect x="7" y="5" width="4" height="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />
          <rect x="11" y="5" width="4" height="4" fill="#0f172a" />
          <rect x="7" y="9" width="4" height="4" fill="#0f172a" />
          <rect x="11" y="9" width="4" height="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />
          <rect x="7" y="13" width="4" height="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />
          <rect x="11" y="13" width="4" height="4" fill="#0f172a" />
        </svg>
      )}

      {type === 'spawn' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Cyan spawn beacon */}
          <circle cx="12" cy="12" r="9" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="12" cy="12" r="5" fill="#0284c7" stroke="#bae6fd" strokeWidth="1" />
          <circle cx="12" cy="12" r="2" fill="#ffffff" />
        </svg>
      )}

      {type === 'spring' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Metal base plate */}
          <rect x="3" y="19" width="18" height="3" rx="0.5" fill="#475569" />
          {/* Coil */}
          <path
            d="M6,18 L18,15 L6,12 L18,9 L6,6"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Red bounce pad top */}
          <rect x="4" y="3" width="16" height="4" rx="1" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
        </svg>
      )}

      {type === 'coin' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Star Coin */}
          <circle cx="12" cy="12" r="9" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="7" fill="#fef08a" />
          <polygon
            points="12,6 13.5,9.5 17,9.5 14,11.8 15.2,15.2 12,13 8.8,15.2 10,11.8 7,9.5 10.5,9.5"
            fill="#ca8a04"
          />
        </svg>
      )}

      {type === 'checkpoint' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Checkpoint banner pole */}
          <rect x="5" y="3" width="2" height="19" fill="#64748b" />
          <polygon points="7,4 19,10 7,16" fill="#10b981" stroke="#059669" strokeWidth="1" />
        </svg>
      )}

      {type === 'pumpkin' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Orange pumpkin */}
          <rect x="11" y="2" width="2" height="4" rx="0.5" fill="#15803d" />
          <ellipse cx="12" cy="13" rx="8.5" ry="7.5" fill="#ea580c" />
          <ellipse cx="12" cy="13" rx="5" ry="7.5" fill="#f97316" />
          <ellipse cx="12" cy="13" rx="2" ry="7.5" fill="#fb923c" />
        </svg>
      )}

      {type === 'jackolantern' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Glowing Jack-o-lantern */}
          <rect x="11" y="2" width="2" height="4" rx="0.5" fill="#15803d" />
          <ellipse cx="12" cy="13" rx="8.5" ry="7.5" fill="#c2410c" />
          <ellipse cx="12" cy="13" rx="5" ry="7.5" fill="#ea580c" />
          {/* Glowing eyes & mouth */}
          <polygon points="9,10 7.5,12.5 10.5,12.5" fill="#fef08a" />
          <polygon points="15,10 13.5,12.5 16.5,12.5" fill="#fef08a" />
          <path d="M7,15 Q12,19 17,15 Q12,17 7,15 Z" fill="#fef08a" />
        </svg>
      )}

      {type === 'text' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Text prop icon */}
          <rect x="3" y="4" width="18" height="3" rx="1" fill="#38bdf8" />
          <rect x="10.5" y="6" width="3" height="13" rx="0.5" fill="#38bdf8" />
          <line x1="7" y1="19" x2="17" y2="19" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      {type === 'arrow' && (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Arrow prop icon */}
          <path
            d="M5 12h11M12 7l5 5-5 5"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};
