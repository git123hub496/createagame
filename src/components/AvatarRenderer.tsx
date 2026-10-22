import React from 'react';
import { AvatarConfig } from '../types';

interface AvatarRendererProps {
  avatar: AvatarConfig;
  size?: number;
  squashX?: number;
  squashY?: number;
  isMoving?: boolean;
  facing?: 'left' | 'right';
  className?: string;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  avatar,
  size = 40,
  squashX = 1,
  squashY = 1,
  isMoving = false,
  facing = 'right',
  className = '',
}) => {
  const { color = '#ffffff', eyeStyle = 'normal', hat = 'none' } = avatar;

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        transform: `scale(${facing === 'left' ? -squashX : squashX}, ${squashY})`,
        transformOrigin: 'bottom center',
        transition: 'transform 0.05s ease-out',
      }}
    >
      {/* Hat / Head Accessory (drawn above square) */}
      {hat !== 'none' && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10"
          style={{ width: size, height: size * 0.5 }}
        >
          {avatar.customHatImg && (
            <img src={avatar.customHatImg} alt={hat} className="w-full h-full object-contain drop-shadow" />
          )}

          {!avatar.customHatImg && hat === 'crown' && (
            <svg viewBox="0 0 40 20" className="w-full h-full drop-shadow">
              <polygon points="4,18 36,18 34,6 26,14 20,4 14,14 6,6" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
              <circle cx="20" cy="5" r="2" fill="#ef4444" />
              <circle cx="7" cy="7" r="1.5" fill="#3b82f6" />
              <circle cx="33" cy="7" r="1.5" fill="#10b981" />
            </svg>
          )}

          {hat === 'tophat' && (
            <svg viewBox="0 0 40 24" className="w-full h-full drop-shadow">
              <rect x="10" y="2" width="20" height="15" rx="1" fill="#1f2937" stroke="#111827" strokeWidth="1.5" />
              <rect x="10" y="13" width="20" height="4" fill="#ef4444" />
              <rect x="4" y="17" width="32" height="4" rx="2" fill="#1f2937" />
            </svg>
          )}

          {hat === 'cap' && (
            <svg viewBox="0 0 40 20" className="w-full h-full drop-shadow">
              <path d="M 8 16 Q 20 4 32 16 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
              <rect x="4" y="14" width="12" height="3" rx="1.5" fill="#1d4ed8" />
              <circle cx="20" cy="9" r="1.5" fill="#ffffff" />
            </svg>
          )}

          {hat === 'horns' && (
            <svg viewBox="0 0 40 20" className="w-full h-full">
              <path d="M 8 16 Q 6 4 3 6 Q 6 12 11 16 Z" fill="#dc2626" />
              <path d="M 32 16 Q 34 4 37 6 Q 34 12 29 16 Z" fill="#dc2626" />
            </svg>
          )}

          {hat === 'halo' && (
            <svg viewBox="0 0 40 16" className="w-full h-full -top-1 relative">
              <ellipse cx="20" cy="8" rx="14" ry="4" fill="none" stroke="#facc15" strokeWidth="3" className="animate-pulse" />
            </svg>
          )}

          {hat === 'headphones' && (
            <svg viewBox="0 0 40 24" className="w-full h-full drop-shadow">
              <path d="M 6 18 A 14 14 0 0 1 34 18" fill="none" stroke="#06b6d4" strokeWidth="3" />
              <rect x="4" y="14" width="5" height="10" rx="2" fill="#0891b2" />
              <rect x="31" y="14" width="5" height="10" rx="2" fill="#0891b2" />
            </svg>
          )}

          {hat === 'ninja' && (
            <div className="w-full h-3 bg-red-600 rounded-sm relative shadow-sm border-t border-red-700">
              <div className="absolute right-0 -bottom-2 w-2 h-4 bg-red-600 -rotate-12 rounded-sm origin-top"></div>
              <div className="absolute right-1 -bottom-3 w-1.5 h-4 bg-red-500 rotate-12 rounded-sm origin-top"></div>
            </div>
          )}

          {/* Halloween Head Accessories */}
          {hat === 'pumpkin' && (
            <svg viewBox="0 0 40 24" className="w-full h-full drop-shadow -top-1 relative">
              {/* Green stem */}
              <rect x="18" y="1" width="4" height="5" rx="1" fill="#15803d" />
              {/* Pumpkin body */}
              <ellipse cx="20" cy="14" rx="15" ry="9" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
              <ellipse cx="20" cy="14" rx="9" ry="9" fill="#fb923c" />
              {/* Carved eyes */}
              <polygon points="14,12 17,14 14,16" fill="#431407" />
              <polygon points="26,12 23,14 26,16" fill="#431407" />
              {/* Carved jagged mouth */}
              <polygon points="15,18 17,20 19,18 21,20 23,18 25,20 20,21" fill="#431407" />
            </svg>
          )}

          {hat === 'bat' && (
            <svg viewBox="0 0 44 24" className="w-full h-full drop-shadow -top-1 relative">
              {/* Left wing */}
              <path d="M 12 14 C 4 6, 2 12, 1 18 C 6 15, 9 17, 12 14 Z" fill="#312e81" stroke="#1e1b4b" strokeWidth="1" />
              {/* Right wing */}
              <path d="M 32 14 C 40 6, 42 12, 43 18 C 38 15, 35 17, 32 14 Z" fill="#312e81" stroke="#1e1b4b" strokeWidth="1" />
              {/* Bat head */}
              <ellipse cx="22" cy="13" rx="8" ry="7" fill="#1e1b4b" />
              {/* Ears */}
              <polygon points="16,8 14,2 19,6" fill="#312e81" />
              <polygon points="28,8 30,2 25,6" fill="#312e81" />
              {/* Eyes */}
              <circle cx="19" cy="12" r="1.5" fill="#f43f5e" />
              <circle cx="25" cy="12" r="1.5" fill="#f43f5e" />
              {/* White fangs */}
              <polygon points="19,16 20,19 21,16" fill="#ffffff" />
              <polygon points="23,16 24,19 25,16" fill="#ffffff" />
            </svg>
          )}

          {hat === 'ghost' && (
            <svg viewBox="0 0 40 24" className="w-full h-full drop-shadow -top-2 relative animate-pulse">
              {/* Floating ghost shape */}
              <path
                d="M 10 18 C 10 7, 30 7, 30 18 C 27 16, 24 19, 20 17 C 16 19, 13 16, 10 18 Z"
                fill="rgba(255, 255, 255, 0.9)"
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              {/* Ghost dark eyes */}
              <ellipse cx="16" cy="11" rx="1.5" ry="2.5" fill="#0f172a" />
              <ellipse cx="24" cy="11" rx="1.5" ry="2.5" fill="#0f172a" />
              {/* Small mouth */}
              <ellipse cx="20" cy="15" rx="1.5" ry="1.5" fill="#0f172a" />
            </svg>
          )}

          {hat === 'witch' && (
            <svg viewBox="0 0 40 24" className="w-full h-full drop-shadow -top-2 relative">
              {/* Brim */}
              <ellipse cx="20" cy="19" rx="18" ry="4" fill="#18181b" stroke="#09090b" strokeWidth="1" />
              {/* Cone */}
              <path d="M 12 18 Q 17 6 27 2 Q 22 10 28 18 Z" fill="#27272a" />
              {/* Purple band */}
              <path d="M 13 18 Q 20 16 27 18 L 26.5 15 Q 20 13.5 13.5 15 Z" fill="#9333ea" />
              {/* Gold buckle */}
              <rect x="18" y="14" width="4" height="4" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
            </svg>
          )}

          {hat === 'skull' && (
            <svg viewBox="0 0 40 24" className="w-full h-full drop-shadow -top-1 relative">
              {/* Cranium */}
              <path d="M 12 14 C 12 5, 28 5, 28 14 C 28 17, 24 17, 24 20 L 16 20 C 16 17, 12 17, 12 14 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
              {/* Eye sockets */}
              <ellipse cx="16" cy="12" rx="2.5" ry="3" fill="#0f172a" />
              <ellipse cx="24" cy="12" rx="2.5" ry="3" fill="#0f172a" />
              {/* Nasal cavity */}
              <polygon points="20,14 19,16 21,16" fill="#0f172a" />
              {/* Teeth */}
              <line x1="17" y1="18" x2="17" y2="20" stroke="#0f172a" strokeWidth="1" />
              <line x1="20" y1="18" x2="20" y2="20" stroke="#0f172a" strokeWidth="1" />
              <line x1="23" y1="18" x2="23" y2="20" stroke="#0f172a" strokeWidth="1" />
            </svg>
          )}

          {hat === 'spider' && (
            <svg viewBox="0 0 40 24" className="w-full h-full drop-shadow -top-1 relative">
              {/* Spider legs left */}
              <path d="M 16 14 Q 8 6 4 14 M 16 15 Q 8 10 3 18 M 16 16 Q 9 16 5 22 M 16 13 Q 10 4 8 0" stroke="#18181b" strokeWidth="1.5" fill="none" />
              {/* Spider legs right */}
              <path d="M 24 14 Q 32 6 36 14 M 24 15 Q 32 10 37 18 M 24 16 Q 31 16 35 22 M 24 13 Q 30 4 32 0" stroke="#18181b" strokeWidth="1.5" fill="none" />
              {/* Spider body */}
              <ellipse cx="20" cy="14" rx="6" ry="5" fill="#18181b" />
              <ellipse cx="20" cy="17" rx="3.5" ry="3" fill="#27272a" />
              {/* Spider red eyes */}
              <circle cx="18" cy="18" r="0.8" fill="#ef4444" />
              <circle cx="22" cy="18" r="0.8" fill="#ef4444" />
            </svg>
          )}
        </div>
      )}

      {/* Main Square Body */}
      <div
        className="w-full h-full rounded-md shadow-md flex items-center justify-center relative overflow-hidden border-2 border-black/20"
        style={{
          backgroundColor: color,
        }}
      >
        {/* Subtle inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-black/15 pointer-events-none rounded-sm"></div>

        {/* Eyes & Facial Expression */}
        <div className="relative z-10 w-full flex justify-center items-center gap-1.5 px-2">
          {eyeStyle === 'normal' && (
            <>
              <div className="w-2 h-2.5 bg-neutral-900 rounded-full flex items-start justify-end p-0.5 shadow-inner">
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              </div>
              <div className="w-2 h-2.5 bg-neutral-900 rounded-full flex items-start justify-end p-0.5 shadow-inner">
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              </div>
            </>
          )}

          {eyeStyle === 'happy' && (
            <>
              <div className="w-2.5 h-2 border-t-2 border-neutral-900 rounded-t-full"></div>
              <div className="w-2.5 h-2 border-t-2 border-neutral-900 rounded-t-full"></div>
            </>
          )}

          {eyeStyle === 'shades' && (
            <div className="flex items-center -mt-0.5">
              <div className="w-3.5 h-2.5 bg-black border border-neutral-700 rounded-sm"></div>
              <div className="w-1.5 h-0.5 bg-black"></div>
              <div className="w-3.5 h-2.5 bg-black border border-neutral-700 rounded-sm"></div>
            </div>
          )}

          {eyeStyle === 'gamer' && (
            <div className="w-4/5 h-2.5 bg-cyan-950 border border-cyan-400 rounded-sm flex items-center justify-center shadow-[0_0_8px_#22d3ee]">
              <div className="w-full h-0.5 bg-cyan-300"></div>
            </div>
          )}

          {eyeStyle === 'cyclops' && (
            <div className="w-4 h-4 bg-red-950 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_6px_#ef4444]">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
            </div>
          )}

          {eyeStyle === 'angry' && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2 bg-neutral-900 -rotate-12 rounded-sm"></div>
              <div className="w-2.5 h-2 bg-neutral-900 rotate-12 rounded-sm"></div>
            </div>
          )}

          {eyeStyle === 'wink' && (
            <>
              <div className="w-2 h-2.5 bg-neutral-900 rounded-full flex items-start justify-end p-0.5">
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              </div>
              <div className="w-2.5 h-1 border-b-2 border-neutral-900"></div>
            </>
          )}
        </div>

        {/* Moving feet / bounce hint */}
        {isMoving && (
          <div className="absolute -bottom-1 w-full flex justify-around px-1">
            <div className="w-1.5 h-1 bg-black/40 rounded-full"></div>
            <div className="w-1.5 h-1 bg-black/40 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};
