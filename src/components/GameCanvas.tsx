import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameMap, AvatarConfig, LevelElement } from '../types';
import { sounds } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  Smartphone,
  Timer,
  CircleDollarSign,
  Skull,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Users,
  LogOut,
  Trophy,
  CheckCircle2,
  Flag,
  Compass,
} from 'lucide-react';
import { drawPumpkin, drawJackOLantern, getGrassHalloweenDecorations } from '../services/halloweenDecorations';
import {
  PartyData,
  PlayerPosition,
  updatePlayerPosition,
  reportPartyPlayerFinish,
  returnPartyToLobby,
  getPartyPlayerId,
} from '../services/partyService';
import { getCachedImage } from '../services/imageCache';

interface GameCanvasProps {
  map: GameMap;
  avatar: AvatarConfig;
  onVictory: (clearTimeMs: number, deaths: number) => void;
  onExit: () => void;
  onPlayAnother?: () => void;
  isVerificationMode?: boolean;
  party?: PartyData | null;
  onLeaveParty?: () => void;
  onSelectPartyMap?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface LavaBubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
}

function drawCharacterAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  facing: 'left' | 'right',
  squashX: number,
  squashY: number,
  avatarConfig: AvatarConfig,
  nameTag?: string,
  isFinished?: boolean
) {
  ctx.save();
  const px = x + width / 2;
  const py = y + height;
  ctx.translate(px, py);
  ctx.scale(facing === 'left' ? -squashX : squashX, squashY);

  const hw = width / 2;
  const h = height;

  // Body fill
  ctx.fillStyle = avatarConfig.color || '#ffffff';
  ctx.fillRect(-hw, -h, width, height);

  // Subtle borders
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-hw, -h, width, height);

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-hw, -h, width, 4);

  // Hat
  const hat = avatarConfig.hat;
  if (hat === 'crown') {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-12, -h - 2);
    ctx.lineTo(12, -h - 2);
    ctx.lineTo(10, -h - 12);
    ctx.lineTo(5, -h - 6);
    ctx.lineTo(0, -h - 14);
    ctx.lineTo(-5, -h - 6);
    ctx.lineTo(-10, -h - 12);
    ctx.closePath();
    ctx.fill();
  } else if (hat === 'cap') {
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-12, -h - 8, 20, 8);
    ctx.fillRect(-16, -h - 3, 6, 3);
  } else if (hat === 'tophat') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(-14, -h - 3, 28, 4);
    ctx.fillRect(-9, -h - 16, 18, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-9, -h - 5, 18, 3);
  } else if (hat === 'horns') {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-10, -h);
    ctx.lineTo(-13, -h - 9);
    ctx.lineTo(-6, -h);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, -h);
    ctx.lineTo(13, -h - 9);
    ctx.lineTo(10, -h);
    ctx.fill();
  } else if (hat === 'halo') {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -h - 7, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (hat === 'headphones') {
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -h + 6, 14, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#0891b2';
    ctx.fillRect(-hw - 3, -h + 8, 4, 10);
    ctx.fillRect(hw - 1, -h + 8, 4, 10);
  } else if (hat === 'ninja') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-hw, -h + 2, width, 5);
    ctx.fillRect(-hw - 4, -h + 4, 4, 8);
  } else if (hat === 'pumpkin') {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-2, -h - 13, 4, 4);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(0, -h - 6, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#431407';
    ctx.fillRect(-5, -h - 8, 3, 3);
    ctx.fillRect(2, -h - 8, 3, 3);
    ctx.fillRect(-3, -h - 4, 6, 2);
  } else if (hat === 'bat') {
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.moveTo(-16, -h - 4);
    ctx.lineTo(-6, -h - 8);
    ctx.lineTo(-6, -h);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -h - 4);
    ctx.lineTo(6, -h - 8);
    ctx.lineTo(6, -h);
    ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(0, -h - 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-3, -h - 7, 2, 2);
    ctx.fillRect(2, -h - 7, 2, 2);
  } else if (hat === 'ghost') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(0, -h - 7, 8, Math.PI, 0);
    ctx.lineTo(8, -h);
    ctx.lineTo(4, -h - 3);
    ctx.lineTo(0, -h);
    ctx.lineTo(-4, -h - 3);
    ctx.lineTo(-8, -h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -h - 8, 2, 3);
    ctx.fillRect(2, -h - 8, 2, 3);
  } else if (hat === 'witch') {
    ctx.fillStyle = '#311042';
    ctx.beginPath();
    ctx.moveTo(-16, -h);
    ctx.lineTo(16, -h);
    ctx.lineTo(0, -h - 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-7, -h - 5, 14, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2, -h - 6, 4, 5);
  } else if (hat === 'skull') {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -h - 7, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -h - 9, 3, 3);
    ctx.fillRect(1, -h - 9, 3, 3);
    ctx.fillRect(-3, -h - 4, 6, 2);
  } else if (hat === 'spider') {
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(0, -h - 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, -h - 6);
    ctx.lineTo(-13, -h - 11);
    ctx.moveTo(-5, -h - 4);
    ctx.lineTo(-14, -h - 2);
    ctx.moveTo(5, -h - 6);
    ctx.lineTo(13, -h - 11);
    ctx.moveTo(5, -h - 4);
    ctx.lineTo(14, -h - 2);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, -h - 7, 1.5, 1.5);
    ctx.fillRect(1, -h - 7, 1.5, 1.5);
  }

  // Eyes
  const eye = avatarConfig.eyeStyle || 'normal';
  if (eye === 'normal') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(1, -h + 9, 3, 5);
    ctx.fillRect(7, -h + 9, 3, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, -h + 9, 1.5, 2);
    ctx.fillRect(7, -h + 9, 1.5, 2);
  } else if (eye === 'happy') {
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(2, -h + 12, 3, Math.PI, 0);
    ctx.arc(8, -h + 12, 3, Math.PI, 0);
    ctx.stroke();
  } else if (eye === 'shades') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(-1, -h + 8, 12, 5);
  } else if (eye === 'gamer') {
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, -h + 9, 10, 4);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(2, -h + 10, 6, 2);
  } else if (eye === 'cyclops') {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(5, -h + 11, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (eye === 'angry') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(1, -h + 10, 3, 4);
    ctx.fillRect(7, -h + 10, 3, 4);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -h + 8);
    ctx.lineTo(4, -h + 10);
    ctx.moveTo(10, -h + 8);
    ctx.lineTo(6, -h + 10);
    ctx.stroke();
  } else if (eye === 'wink') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(1, -h + 9, 3, 5);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(6, -h + 12);
    ctx.lineTo(10, -h + 12);
    ctx.stroke();
  }

  ctx.restore();

  // Floating name tag
  if (nameTag) {
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(nameTag).width;
    const tagPad = 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x + width / 2 - textWidth / 2 - tagPad, y - 26, textWidth + tagPad * 2, 16, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameTag, x + width / 2, y - 18);

    if (isFinished) {
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Arrived', x + width / 2, y - 35);
    }
    ctx.restore();
  }
}

function formattedTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${m > 0 ? `${m}:` : ''}${s < 10 && m > 0 ? '0' : ''}${s}.${cs < 10 ? '0' : ''}${cs}s`;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  map,
  avatar,
  onVictory,
  onExit,
  onPlayAnother,
  isVerificationMode = false,
  party,
  onLeaveParty,
  onSelectPartyMap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerDisplayRef = useRef<HTMLSpanElement | null>(null);

  const myId = getPartyPlayerId();
  const isHost = party ? party.hostId === myId : false;
  const peerName = party ? (isHost ? party.guestName || 'Player 2' : party.hostName || 'Player 1') : '';
  const peerAvatar = party ? (isHost ? party.guestAvatar : party.hostAvatar) : null;

  // Stable refs for callbacks and current values so game loop does not restart on parent re-renders
  const onVictoryRef = useRef(onVictory);
  onVictoryRef.current = onVictory;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const onPlayAnotherRef = useRef(onPlayAnother);
  onPlayAnotherRef.current = onPlayAnother;
  const onSelectPartyMapRef = useRef(onSelectPartyMap);
  onSelectPartyMapRef.current = onSelectPartyMap;
  const partyRef = useRef(party);
  partyRef.current = party;
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;
  const avatarRef = useRef(avatar);
  avatarRef.current = avatar;
  const mapRef = useRef(map);
  mapRef.current = map;

  // Real-time peer position ref for 60fps canvas access without state overhead
  const peerPosRef = useRef<PlayerPosition | null>(null);
  const peerRenderPosRef = useRef<{
    x: number;
    y: number;
    faceRight: boolean;
    isDead: boolean;
    finished: boolean;
  } | null>(null);

  useEffect(() => {
    peerPosRef.current = party ? (isHost ? party.guestPos : party.hostPos) || null : null;
  }, [party, isHost]);

  // Race countdown state
  const [countdown, setCountdown] = useState<number | null>(() => {
    return party && party.gameMode === 'race' ? 3 : null;
  });
  const countdownRef = useRef<number | null>(countdown);
  countdownRef.current = countdown;

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      sounds.playJump();
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0) {
      sounds.playVictory();
      const t = setTimeout(() => setCountdown(null), 700);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Co-op arrival tracking (reliable check across positions and results)
  const [localFinished, setLocalFinished] = useState(false);
  const peerFinished = Boolean(
    (isHost ? party?.guestPos?.finished : party?.hostPos?.finished) ||
    (isHost ? party?.results?.guestFinished : party?.results?.hostFinished) ||
    peerPosRef.current?.finished
  );

  // Stats state for HUD
  const [deaths, setDeaths] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [touchEnabled, setTouchEnabled] = useState(false);

  // Input states stored in refs to avoid re-rendering loop
  const inputRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    jumpPressed: false,
  });

  // Sound mute handler
  const handleToggleMute = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  }, []);

  // Detect touch support on mount
  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setTouchEnabled(true);
    }
  }, []);

  // Main Game Loop Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;

    // Canvas sizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Find initial spawn point
    const spawnElem = map.elements.find((e) => e.type === 'spawn') || {
      x: 100,
      y: 350,
      width: 32,
      height: 32,
    };

    let respawnX = spawnElem.x;
    let respawnY = spawnElem.y;

    // Player physics state
    const player = {
      x: respawnX,
      y: respawnY,
      width: 30,
      height: 30,
      vx: 0,
      vy: 0,
      isGrounded: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      squashX: 1,
      squashY: 1,
      facing: 'right' as 'left' | 'right',
      dead: false,
      deathTimer: 0,
    };

    // Camera state
    const camera = {
      x: player.x - canvas.width * 0.4,
      y: player.y - canvas.height * 0.6,
    };

    // Level elements (cloned so coins can be collected)
    const elements: LevelElement[] = JSON.parse(JSON.stringify(map.elements));
    const coinCount = elements.filter((e) => e.type === 'coin').length;
    setTotalCoins(coinCount);
    let coinsEarned = 0;
    const collectedCoins = new Set<string>();
    const reachedCheckpoints = new Set<string>();

    // Visual particles
    const particles: Particle[] = [];
    const trailParticles: Particle[] = [];
    let screenShake = 0;

    // Lava bubbles simulation
    const lavaBubbles: LavaBubble[] = [];
    const lavaElements = elements.filter((e) => e.type === 'lava');
    lavaElements.forEach((lava) => {
      const count = Math.max(3, Math.floor(lava.width / 40));
      for (let i = 0; i < count; i++) {
        lavaBubbles.push({
          x: lava.x + Math.random() * lava.width,
          y: lava.y + Math.random() * lava.height,
          radius: 2 + Math.random() * 4,
          speed: 0.5 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    });

    // Timing
    let startTime = performance.now();
    let lastTime = performance.now();
    let currentDeaths = 0;
    let gameCleared = false;

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') {
        inputRef.current.left = true;
      }
      if (code === 'ArrowRight' || code === 'KeyD') {
        inputRef.current.right = true;
      }
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
        if (!inputRef.current.up) {
          inputRef.current.jumpPressed = true;
        }
        inputRef.current.up = true;
      }
      if (code === 'ArrowDown' || code === 'KeyS') {
        inputRef.current.down = true;
      }
      if (code === 'KeyR') {
        // Quick Reset
        triggerDeath('reset');
      }
      if (code === 'KeyM') {
        handleToggleMute();
      }
      if ((code === 'KeyK' || e.key === 'k' || e.key === 'K') && !isVerificationMode && onPlayAnotherRef.current) {
        sounds.playClick();
        onPlayAnotherRef.current();
      }
      if (code === 'Escape') {
        onExitRef.current();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') inputRef.current.left = false;
      if (code === 'ArrowRight' || code === 'KeyD') inputRef.current.right = false;
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
        inputRef.current.up = false;
        // Variable jump height
        if (player.vy < -3) {
          player.vy *= 0.45;
        }
      }
      if (code === 'ArrowDown' || code === 'KeyS') inputRef.current.down = false;
    };

    const onBlur = () => {
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.up = false;
      inputRef.current.down = false;
      inputRef.current.jumpPressed = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Broadcast initial spawn position immediately so peer sees us right away
    if (partyRef.current) {
      updatePlayerPosition(partyRef.current.id, isHostRef.current, {
        x: Math.round(respawnX),
        y: Math.round(respawnY),
        vx: 0,
        vy: 0,
        faceRight: true,
        isDead: false,
        finished: false,
        updatedAt: Date.now(),
      });
    }

    // Particle Spawner
    const spawnDeathParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          color,
          size: 4 + Math.random() * 5,
          alpha: 1,
          life: 0,
          maxLife: 25 + Math.random() * 20,
        });
      }
    };

    const spawnLandDust = (x: number, y: number) => {
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + player.height,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 1.5,
          color: '#cbd5e1',
          size: 3 + Math.random() * 3,
          alpha: 0.8,
          life: 0,
          maxLife: 15,
        });
      }
    };

    let lastPositionSyncTime = 0;
    let hasArrivedAtFlag = false;
    let flagFinishTimeMs: number | undefined = undefined;

    const triggerDeath = (cause: 'spike' | 'lava' | 'fall' | 'reset') => {
      if (player.dead) return;
      player.dead = true;
      player.deathTimer = 35;
      currentDeaths += 1;
      setDeaths(currentDeaths);
      screenShake = 12;

      const currentParty = partyRef.current;
      if (currentParty) {
        updatePlayerPosition(currentParty.id, isHostRef.current, {
          x: Math.round(player.x),
          y: Math.round(player.y),
          vx: 0,
          vy: 0,
          faceRight: player.facing === 'right',
          isDead: true,
          finished: hasArrivedAtFlag,
          finishTime: flagFinishTimeMs,
          updatedAt: Date.now(),
        });
      }

      if (cause === 'lava') {
        sounds.playLavaDeath();
        spawnDeathParticles(player.x + 15, player.y + 15, '#f97316');
      } else if (cause === 'spike') {
        sounds.playSpikeDeath();
        spawnDeathParticles(player.x + 15, player.y + 15, '#ef4444');
      } else {
        sounds.playSpikeDeath();
        spawnDeathParticles(player.x + 15, player.y + 15, avatarRef.current.color);
      }
    };

    const triggerVictory = () => {
      if (gameCleared) return;
      gameCleared = true;
      sounds.playVictory();

      // Confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#4ade80', '#facc15', '#fb923c', '#f43f5e', '#a855f7'],
      });

      const clearTime = Math.floor(performance.now() - startTime);
      setTimeout(() => {
        onVictoryRef.current(clearTime, currentDeaths);
      }, 700);
    };

    const triggerPartyRaceVictory = () => {
      if (gameCleared) return;
      gameCleared = true;
      sounds.playVictory();
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#facc15', '#fbbf24', '#f59e0b', '#38bdf8', '#a855f7'],
      });
      const clearTime = Math.floor(performance.now() - startTime);
      const currentParty = partyRef.current;
      if (currentParty) {
        updatePlayerPosition(currentParty.id, isHostRef.current, {
          x: Math.round(player.x),
          y: Math.round(player.y),
          vx: 0,
          vy: 0,
          faceRight: player.facing === 'right',
          isDead: false,
          finished: true,
          finishTime: clearTime,
          updatedAt: Date.now(),
        });
        reportPartyPlayerFinish(currentParty.id, isHostRef.current, clearTime, avatarRef.current.name || 'Player');
      }
    };

    const triggerPartyCoopArrival = () => {
      if (hasArrivedAtFlag) return;
      hasArrivedAtFlag = true;
      setLocalFinished(true);
      sounds.playVictory();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#4ade80', '#facc15'],
      });
      const clearTime = Math.floor(performance.now() - startTime);
      flagFinishTimeMs = clearTime;
      const currentParty = partyRef.current;
      if (currentParty) {
        updatePlayerPosition(currentParty.id, isHostRef.current, {
          x: Math.round(player.x),
          y: Math.round(player.y),
          vx: 0,
          vy: 0,
          faceRight: player.facing === 'right',
          isDead: false,
          finished: true,
          finishTime: clearTime,
          updatedAt: Date.now(),
        });
        reportPartyPlayerFinish(currentParty.id, isHostRef.current, clearTime, avatarRef.current.name || 'Player');
      }
    };

    // Main Update Function
    const update = (dt: number) => {
      if (gameCleared) return;

      // Smoothly interpolate peer position in 60fps frame loop
      const targetPeer = peerPosRef.current;
      if (targetPeer) {
        if (!peerRenderPosRef.current) {
          peerRenderPosRef.current = {
            x: targetPeer.x,
            y: targetPeer.y,
            faceRight: targetPeer.faceRight,
            isDead: targetPeer.isDead,
            finished: targetPeer.finished,
          };
        } else {
          peerRenderPosRef.current.x += (targetPeer.x - peerRenderPosRef.current.x) * 0.45;
          peerRenderPosRef.current.y += (targetPeer.y - peerRenderPosRef.current.y) * 0.45;
          peerRenderPosRef.current.faceRight = targetPeer.faceRight;
          peerRenderPosRef.current.isDead = targetPeer.isDead;
          peerRenderPosRef.current.finished = targetPeer.finished;
        }
      }

      // Freeze movements during race 3..2..1 countdown
      if (countdownRef.current !== null && countdownRef.current > 0) {
        startTime = performance.now();
        if (timerDisplayRef.current) {
          timerDisplayRef.current.textContent = '0.00s';
        }
        return;
      }

      // Update timer display at 60fps directly on DOM without causing component re-render loops
      const elapsed = Math.floor(performance.now() - startTime);
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = formattedTime(elapsed);
      }

      // Throttled position sync to Firestore for 2-player multiplayer
      const currentParty = partyRef.current;
      const currentIsHost = isHostRef.current;
      if (currentParty && !hasArrivedAtFlag) {
        const now = performance.now();
        if (now - lastPositionSyncTime > 110) {
          lastPositionSyncTime = now;
          updatePlayerPosition(currentParty.id, currentIsHost, {
            x: Math.round(player.x),
            y: Math.round(player.y),
            vx: Math.round(player.vx * 10) / 10,
            vy: Math.round(player.vy * 10) / 10,
            faceRight: player.facing === 'right',
            isDead: player.dead,
            finished: false,
            finishTime: undefined,
            updatedAt: Date.now(),
          });
        }
      }

      // Handle Death State & Respawn
      if (player.dead) {
        player.deathTimer -= 1;
        if (player.deathTimer <= 0) {
          player.dead = false;
          player.x = respawnX;
          player.y = respawnY;
          player.vx = 0;
          player.vy = 0;
          player.squashX = 1;
          player.squashY = 1;
        }
        return;
      }

      // Horizontal Movement Physics
      const accel = 0.85;
      const maxSpeed = 5.6;
      const friction = 0.82;

      if (inputRef.current.left) {
        player.vx = Math.max(player.vx - accel, -maxSpeed);
        player.facing = 'left';
      } else if (inputRef.current.right) {
        player.vx = Math.min(player.vx + accel, maxSpeed);
        player.facing = 'right';
      } else {
        player.vx *= friction;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
      }

      // Gravity
      const gravity = 0.52;
      const maxFallSpeed = 13.5;
      player.vy = Math.min(player.vy + gravity, maxFallSpeed);

      // Coyote time & Jump buffer logic
      if (player.isGrounded) {
        player.coyoteTimer = 7; // frames of grace
      } else if (player.coyoteTimer > 0) {
        player.coyoteTimer -= 1;
      }

      if (inputRef.current.jumpPressed) {
        player.jumpBufferTimer = 6;
        inputRef.current.jumpPressed = false;
      } else if (player.jumpBufferTimer > 0) {
        player.jumpBufferTimer -= 1;
      }

      // Execute Jump
      if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
        player.vy = -11.2;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
        player.isGrounded = false;
        player.squashX = 0.72;
        player.squashY = 1.35;
        sounds.playJump();
      }

      // Natural squash recovery
      player.squashX += (1 - player.squashX) * 0.15;
      player.squashY += (1 - player.squashY) * 0.15;

      // Spawn movement trails if avatar config has one
      if (avatar.trail !== 'none' && (Math.abs(player.vx) > 2 || Math.abs(player.vy) > 2)) {
        let tColor = avatar.color;
        if (avatar.trail === 'rainbow') {
          const hue = (performance.now() / 8) % 360;
          tColor = `hsl(${hue}, 90%, 60%)`;
        } else if (avatar.trail === 'fire') {
          tColor = Math.random() > 0.5 ? '#f97316' : '#ef4444';
        } else if (avatar.trail === 'sparkle') {
          tColor = '#facc15';
        }
        trailParticles.push({
          x: player.x + (player.facing === 'left' ? player.width : 0) + (Math.random() - 0.5) * 6,
          y: player.y + player.height * 0.5 + (Math.random() - 0.5) * 6,
          vx: -player.vx * 0.15,
          vy: -player.vy * 0.15,
          color: tColor,
          size: avatar.trail === 'sparkle' ? 2 + Math.random() * 3 : 5 + Math.random() * 4,
          alpha: 0.7,
          life: 0,
          maxLife: 14,
        });
      }

      // Horizontal Collision Resolution
      player.x += player.vx;
      for (const elem of elements) {
        if (elem.type === 'ground' || elem.type === 'grass') {
          if (
            player.x < elem.x + elem.width &&
            player.x + player.width > elem.x &&
            player.y < elem.y + elem.height &&
            player.y + player.height > elem.y
          ) {
            if (player.vx > 0) {
              player.x = elem.x - player.width;
              player.vx = 0;
            } else if (player.vx < 0) {
              player.x = elem.x + elem.width;
              player.vx = 0;
            }
          }
        }
      }

      // Vertical Collision Resolution
      const wasGrounded = player.isGrounded;
      player.isGrounded = false;
      player.y += player.vy;

      for (const elem of elements) {
        // Solid Ground / Grass blocks
        if (elem.type === 'ground' || elem.type === 'grass') {
          if (
            player.x < elem.x + elem.width &&
            player.x + player.width > elem.x &&
            player.y < elem.y + elem.height &&
            player.y + player.height > elem.y
          ) {
            if (player.vy > 0) {
              player.y = elem.y - player.height;
              player.vy = 0;
              player.isGrounded = true;
              if (!wasGrounded) {
                // Landing impact
                sounds.playLand();
                player.squashX = 1.35;
                player.squashY = 0.72;
                spawnLandDust(player.x, player.y);
              }
            } else if (player.vy < 0) {
              player.y = elem.y + elem.height;
              player.vy = 0;
            }
          }
        }

        // Floating Platforms (Jump through from underneath)
        if (elem.type === 'platform') {
          if (
            player.x < elem.x + elem.width &&
            player.x + player.width > elem.x &&
            player.y + player.height >= elem.y &&
            player.y + player.height <= elem.y + 14 &&
            player.vy > 0
          ) {
            player.y = elem.y - player.height;
            player.vy = 0;
            player.isGrounded = true;
            if (!wasGrounded) {
              sounds.playLand();
              player.squashX = 1.25;
              player.squashY = 0.8;
              spawnLandDust(player.x, player.y);
            }
          }
        }

        // Springs
        if (elem.type === 'spring') {
          if (
            player.x < elem.x + elem.width &&
            player.x + player.width > elem.x &&
            player.y + player.height >= elem.y &&
            player.y + player.height <= elem.y + elem.height + 10 &&
            player.vy > 0
          ) {
            player.vy = -16.5;
            player.isGrounded = false;
            player.squashX = 0.6;
            player.squashY = 1.45;
            sounds.playSpring();
          }
        }

        // Coins
        if (elem.type === 'coin' && !collectedCoins.has(elem.id)) {
          if (
            player.x < elem.x + elem.width &&
            player.x + player.width > elem.x &&
            player.y < elem.y + elem.height &&
            player.y + player.height > elem.y
          ) {
            collectedCoins.add(elem.id);
            coinsEarned += 1;
            setCoinsCollected(coinsEarned);
            sounds.playCoin();
            // Coin burst particles
            for (let i = 0; i < 10; i++) {
              particles.push({
                x: elem.x + elem.width / 2,
                y: elem.y + elem.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4,
                color: '#facc15',
                size: 3 + Math.random() * 2,
                alpha: 1,
                life: 0,
                maxLife: 20,
              });
            }
          }
        }

        // Checkpoint Flag
        if (elem.type === 'checkpoint' && !reachedCheckpoints.has(elem.id)) {
          if (
            player.x < elem.x + elem.width &&
            player.x + player.width > elem.x &&
            player.y < elem.y + elem.height &&
            player.y + player.height > elem.y
          ) {
            reachedCheckpoints.add(elem.id);
            respawnX = elem.x;
            respawnY = elem.y;
            sounds.playCheckpoint();
          }
        }

        // Checkered Flag Goal
        if (elem.type === 'flag') {
          if (
            player.x < elem.x + elem.width &&
            player.x + player.width > elem.x &&
            player.y < elem.y + elem.height &&
            player.y + player.height > elem.y
          ) {
            const currentParty = partyRef.current;
            if (currentParty) {
              if (currentParty.gameMode === 'race') {
                triggerPartyRaceVictory();
              } else {
                triggerPartyCoopArrival();
              }
            } else {
              triggerVictory();
            }
          }
        }

        // Spikes Hazard
        if (elem.type === 'spike') {
          // Accurate inner hitbox check
          const dir = elem.spikeDir || 'up';
          const pad = 4;
          if (
            player.x + pad < elem.x + elem.width - pad &&
            player.x + player.width - pad > elem.x + pad &&
            player.y + pad < elem.y + elem.height - pad &&
            player.y + player.height - pad > elem.y + pad
          ) {
            triggerDeath('spike');
          }
        }

        // Lava Hazard
        if (elem.type === 'lava') {
          if (
            player.x + 3 < elem.x + elem.width - 3 &&
            player.x + player.width - 3 > elem.x + 3 &&
            player.y + player.height > elem.y + 6 &&
            player.y < elem.y + elem.height
          ) {
            triggerDeath('lava');
          }
        }

        // Custom Addon Elements Behavior
        if (elem.customImg && elem.behavior) {
          if (elem.behavior === 'solid') {
            if (
              player.x < elem.x + elem.width &&
              player.x + player.width > elem.x &&
              player.y + player.height >= elem.y &&
              player.y + player.height <= elem.y + 14 &&
              player.vy > 0
            ) {
              player.y = elem.y - player.height;
              player.vy = 0;
              player.isGrounded = true;
              if (!wasGrounded) {
                sounds.playLand();
                player.squashX = 1.25;
                player.squashY = 0.8;
                spawnLandDust(player.x, player.y);
              }
            }
          } else if (elem.behavior === 'hazard') {
            if (
              player.x + 4 < elem.x + elem.width - 4 &&
              player.x + player.width - 4 > elem.x + 4 &&
              player.y + player.height > elem.y + 4 &&
              player.y < elem.y + elem.height - 4
            ) {
              triggerDeath('spike');
            }
          } else if (elem.behavior === 'spring') {
            if (
              player.x < elem.x + elem.width &&
              player.x + player.width > elem.x &&
              player.y + player.height >= elem.y &&
              player.y + player.height <= elem.y + elem.height + 10 &&
              player.vy > 0
            ) {
              player.vy = -18;
              player.isGrounded = false;
              player.squashX = 0.6;
              player.squashY = 1.45;
              sounds.playSpring();
            }
          } else if (elem.behavior === 'coin' && !collectedCoins.has(elem.id)) {
            if (
              player.x < elem.x + elem.width &&
              player.x + player.width > elem.x &&
              player.y < elem.y + elem.height &&
              player.y + player.height > elem.y
            ) {
              collectedCoins.add(elem.id);
              coinsEarned += 1;
              setCoinsCollected(coinsEarned);
              sounds.playCoin();
            }
          }
        }
      }

      // Void Fall Death
      if (player.y > 1800) {
        triggerDeath('fall');
      }

      // Smooth Camera Tracking (Lerp)
      const targetCamX = player.x - canvas.width * 0.45;
      const targetCamY = player.y - canvas.height * 0.55;
      camera.x += (targetCamX - camera.x) * 0.12;
      camera.y += (targetCamY - camera.y) * 0.12;

      // Update Screen Shake
      if (screenShake > 0) {
        screenShake *= 0.85;
        if (screenShake < 0.2) screenShake = 0;
      }
    };

    // Render Canvas
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      // Apply screen shake
      if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake * 2;
        const sy = (Math.random() - 0.5) * screenShake * 2;
        ctx.translate(sx, sy);
      }

      // 1. Background sky based on Theme
      const theme = map.theme || 'Grassland';
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);

      if (theme === 'Volcano') {
        grad.addColorStop(0, '#1c0808');
        grad.addColorStop(0.6, '#38120d');
        grad.addColorStop(1, '#541c0a');
      } else if (theme === 'Cyber') {
        grad.addColorStop(0, '#090514');
        grad.addColorStop(0.5, '#120d2b');
        grad.addColorStop(1, '#1e1445');
      } else if (theme === 'Underground') {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.7, '#1e293b');
        grad.addColorStop(1, '#334155');
      } else if (theme === 'Halloween') {
        // Spooky Halloween twilight sky
        grad.addColorStop(0, '#0f051d');
        grad.addColorStop(0.5, '#2e1065');
        grad.addColorStop(1, '#7c2d12');
      } else {
        // Grassland sky
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.6, '#7dd3fc');
        grad.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parallax distant clouds / mountains
      ctx.save();
      const pX = -camera.x * 0.2;
      if (theme === 'Halloween') {
        // Eerie harvest full moon
        ctx.fillStyle = 'rgba(254, 215, 170, 0.25)';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.75, 120, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.75, 120, 40, 0, Math.PI * 2);
        ctx.fill();

        // Spooky dark mist / silhouette hills
        ctx.fillStyle = 'rgba(15, 5, 29, 0.7)';
        for (let i = 0; i < 6; i++) {
          const hx = ((pX + i * 360) % (canvas.width + 400)) - 100;
          ctx.beginPath();
          ctx.arc(hx, canvas.height, 160, Math.PI, 0);
          ctx.fill();
        }
      } else if (theme === 'Grassland') {
        // Soft clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 8; i++) {
          const cx = ((pX + i * 400) % (canvas.width + 500)) - 100;
          ctx.beginPath();
          ctx.arc(cx, 120 + (i % 3) * 40, 50, 0, Math.PI * 2);
          ctx.arc(cx + 40, 100 + (i % 3) * 40, 60, 0, Math.PI * 2);
          ctx.arc(cx + 80, 120 + (i % 3) * 40, 45, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (theme === 'Volcano') {
        // Craggy dark peaks
        ctx.fillStyle = 'rgba(30, 8, 8, 0.6)';
        for (let i = 0; i < 6; i++) {
          const mx = ((pX + i * 360) % (canvas.width + 400)) - 100;
          ctx.beginPath();
          ctx.moveTo(mx, canvas.height);
          ctx.lineTo(mx + 180, canvas.height - 240);
          ctx.lineTo(mx + 360, canvas.height);
          ctx.fill();
        }
      }
      ctx.restore();

      // Apply World Camera offset
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

      // 2. Render Map Elements
      for (const elem of elements) {
        // Ground & Grass
        if (elem.type === 'ground' || elem.type === 'grass') {
          // Dirt base
          ctx.fillStyle =
            theme === 'Volcano'
              ? '#291e1d'
              : theme === 'Cyber'
              ? '#181829'
              : theme === 'Halloween'
              ? '#180d29'
              : '#573d2a';
          ctx.fillRect(elem.x, elem.y, elem.width, elem.height);

          // Subtle dirt speckle pattern
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          for (let sx = elem.x + 8; sx < elem.x + elem.width; sx += 24) {
            for (let sy = elem.y + 16; sy < elem.y + elem.height; sy += 24) {
              ctx.fillRect(sx, sy, 4, 4);
            }
          }

          // Top border
          if (elem.type === 'grass') {
            // Lush Grass Top
            const grassColor =
              theme === 'Volcano'
                ? '#78350f'
                : theme === 'Cyber'
                ? '#06b6d4'
                : theme === 'Halloween'
                ? '#ea580c'
                : '#22c55e';
            const grassHighlight =
              theme === 'Volcano'
                ? '#92400e'
                : theme === 'Cyber'
                ? '#67e8f9'
                : theme === 'Halloween'
                ? '#fb923c'
                : '#4ade80';

            ctx.fillStyle = grassColor;
            ctx.fillRect(elem.x, elem.y, elem.width, 14);

            // Grass tufts / blades along top
            ctx.fillStyle = grassHighlight;
            for (let gx = elem.x; gx < elem.x + elem.width - 6; gx += 10) {
              ctx.beginPath();
              ctx.moveTo(gx, elem.y);
              ctx.lineTo(gx + 5, elem.y - 4);
              ctx.lineTo(gx + 10, elem.y);
              ctx.fill();
            }
          } else {
            // Solid ground stone top trim
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(elem.x, elem.y, elem.width, 4);
          }

          // Block outline
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
        }

        // Floating Platform
        if (elem.type === 'platform') {
          ctx.fillStyle =
            theme === 'Cyber'
              ? '#3b82f6'
              : theme === 'Halloween'
              ? '#3b0764'
              : '#92400e';
          ctx.fillRect(elem.x, elem.y, elem.width, elem.height);

          // Highlight & trim
          ctx.fillStyle = theme === 'Cyber' ? '#93c5fd' : '#b45309';
          ctx.fillRect(elem.x, elem.y, elem.width, 4);

          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
        }

        // Spikes
        if (elem.type === 'spike') {
          const dir = elem.spikeDir || 'up';
          const spikeCount = Math.max(1, Math.round(dir === 'up' || dir === 'down' ? elem.width / 16 : elem.height / 16));
          const step = (dir === 'up' || dir === 'down' ? elem.width : elem.height) / spikeCount;

          ctx.fillStyle = '#cbd5e1';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;

          for (let i = 0; i < spikeCount; i++) {
            ctx.beginPath();
            if (dir === 'up') {
              const sx = elem.x + i * step;
              ctx.moveTo(sx, elem.y + elem.height);
              ctx.lineTo(sx + step / 2, elem.y);
              ctx.lineTo(sx + step, elem.y + elem.height);
            } else if (dir === 'down') {
              const sx = elem.x + i * step;
              ctx.moveTo(sx, elem.y);
              ctx.lineTo(sx + step / 2, elem.y + elem.height);
              ctx.lineTo(sx + step, elem.y);
            } else if (dir === 'left') {
              const sy = elem.y + i * step;
              ctx.moveTo(elem.x + elem.width, sy);
              ctx.lineTo(elem.x, sy + step / 2);
              ctx.lineTo(elem.x + elem.width, sy + step);
            } else {
              const sy = elem.y + i * step;
              ctx.moveTo(elem.x, sy);
              ctx.lineTo(elem.x + elem.width, sy + step / 2);
              ctx.lineTo(elem.x, sy + step);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Blood/danger tip accent
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            if (dir === 'up') {
              const sx = elem.x + i * step;
              ctx.moveTo(sx + step * 0.35, elem.y + elem.height * 0.3);
              ctx.lineTo(sx + step / 2, elem.y);
              ctx.lineTo(sx + step * 0.65, elem.y + elem.height * 0.3);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#cbd5e1';
          }
        }

        // Lava
        if (elem.type === 'lava') {
          // Deep fiery gradient
          const lavaGrad = ctx.createLinearGradient(elem.x, elem.y, elem.x, elem.y + elem.height);
          lavaGrad.addColorStop(0, '#f97316');
          lavaGrad.addColorStop(0.3, '#ea580c');
          lavaGrad.addColorStop(1, '#991b1b');
          ctx.fillStyle = lavaGrad;
          ctx.fillRect(elem.x, elem.y, elem.width, elem.height);

          // Animated boiling wavy surface
          const time = performance.now() * 0.005;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(elem.x, elem.y);
          for (let lx = 0; lx <= elem.width; lx += 12) {
            const waveY = elem.y + Math.sin(lx * 0.08 + time) * 3;
            ctx.lineTo(elem.x + lx, waveY);
          }
          ctx.lineTo(elem.x + elem.width, elem.y + 6);
          ctx.lineTo(elem.x, elem.y + 6);
          ctx.closePath();
          ctx.fill();
        }

        // Springs
        if (elem.type === 'spring') {
          // Metal base plate
          ctx.fillStyle = '#475569';
          ctx.fillRect(elem.x + 2, elem.y + elem.height - 6, elem.width - 4, 6);

          // Coiled spring
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(elem.x + 8, elem.y + elem.height - 6);
          ctx.lineTo(elem.x + elem.width - 8, elem.y + elem.height - 12);
          ctx.lineTo(elem.x + 8, elem.y + elem.height - 18);
          ctx.lineTo(elem.x + elem.width - 8, elem.y + 8);
          ctx.stroke();

          // Red bouncy pad top
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(elem.x + 4, elem.y + 2, elem.width - 8, 8);
        }

        // Coins (Rotating Star)
        if (elem.type === 'coin' && !collectedCoins.has(elem.id)) {
          const coinPhase = (performance.now() * 0.004) % (Math.PI * 2);
          const cx = elem.x + elem.width / 2;
          const cy = elem.y + elem.height / 2 + Math.sin(coinPhase * 2) * 3;
          const scaleX = Math.abs(Math.cos(coinPhase));

          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(scaleX, 1);

          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(0, 0, elem.width / 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, 0, elem.width / 2 - 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ca8a04';
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const rot = (Math.PI / 5) * (s * 2);
            const innerRot = (Math.PI / 5) * (s * 2 + 1);
            const ox = Math.cos(rot - Math.PI / 2) * 5;
            const oy = Math.sin(rot - Math.PI / 2) * 5;
            const ix = Math.cos(innerRot - Math.PI / 2) * 2.5;
            const iy = Math.sin(innerRot - Math.PI / 2) * 2.5;
            if (s === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
            ctx.lineTo(ix, iy);
          }
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }

        // Checkpoint Flag
        if (elem.type === 'checkpoint') {
          const isReached = reachedCheckpoints.has(elem.id);
          // Pole
          ctx.fillStyle = '#64748b';
          ctx.fillRect(elem.x + 6, elem.y, 4, elem.height);
          // Flag cloth
          ctx.fillStyle = isReached ? '#22c55e' : '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(elem.x + 10, elem.y + 4);
          ctx.lineTo(elem.x + elem.width, elem.y + 16);
          ctx.lineTo(elem.x + 10, elem.y + 28);
          ctx.closePath();
          ctx.fill();
        }

        // Checkered Flag (The Goal Finish Line)
        if (elem.type === 'flag') {
          // Silver flagpole
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(elem.x + 4, elem.y, 5, elem.height);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(elem.x + 6.5, elem.y, 6, 0, Math.PI * 2);
          ctx.fill();

          // Checkered Flag Banner waving
          const fw = elem.width - 8;
          const fh = 36;
          const fx = elem.x + 9;
          const fy = elem.y + 6;

          // Draw Checkered Grid
          const cols = 5;
          const rows = 3;
          const cellW = fw / cols;
          const cellH = fh / rows;

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
              ctx.fillRect(fx + c * cellW, fy + r * cellH, cellW, cellH);
            }
          }
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(fx, fy, fw, fh);
        }

        // Floating Text Prop (Pass-through)
        if (elem.type === 'text') {
          ctx.save();
          const cx = elem.x + elem.width / 2;
          const cy = elem.y + elem.height / 2;
          ctx.translate(cx, cy);
          ctx.rotate(((elem.rotation || 0) * Math.PI) / 180);
          const content = elem.text !== undefined ? elem.text : 'Text';
          const textColor = elem.color || '#38bdf8';
          const fontSize = elem.fontSize || Math.max(14, Math.floor(elem.height * 0.65));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 5;
          ctx.fillText(content, 0, 0);
          ctx.restore();
        }

        // Arrow Prop (Pass-through)
        if (elem.type === 'arrow') {
          ctx.save();
          const cx = elem.x + elem.width / 2;
          const cy = elem.y + elem.height / 2;
          ctx.translate(cx, cy);
          ctx.rotate(((elem.rotation || 0) * Math.PI) / 180);
          const arrowColor = elem.color || '#38bdf8';

          const hw = elem.width * 0.44;
          const hh = elem.height * 0.44;
          const shaftH = hh * 0.46;
          const headW = hw * 0.88;

          ctx.fillStyle = arrowColor;
          ctx.beginPath();
          ctx.moveTo(-hw, -shaftH / 2);
          ctx.lineTo(hw - headW, -shaftH / 2);
          ctx.lineTo(hw - headW, -hh);
          ctx.lineTo(hw, 0);
          ctx.lineTo(hw - headW, hh);
          ctx.lineTo(hw - headW, shaftH / 2);
          ctx.lineTo(-hw, shaftH / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Render decorative Halloween pumpkins and glowing jack-o'-lanterns on top of grass (pass-through)
      if (theme === 'Halloween') {
        const pulse = performance.now() * 0.003;
        for (const elem of elements) {
          if (elem.type === 'grass') {
            const decors = getGrassHalloweenDecorations(elem);
            for (const dec of decors) {
              if (dec.type === 'jackolantern') {
                drawJackOLantern(ctx, dec.x, dec.y, 24, pulse + dec.x * 0.05);
              } else {
                drawPumpkin(ctx, dec.x, dec.y, 22);
              }
            }
          }
        }
      }

      // Also render any specifically placed pumpkins or jack-o'-lanterns (pass-through)
      const decorPulse = performance.now() * 0.003;
      for (const elem of elements) {
        if (elem.type === 'pumpkin') {
          drawPumpkin(ctx, elem.x + elem.width / 2, elem.y + elem.height, elem.width);
        } else if (elem.type === 'jackolantern') {
          drawJackOLantern(ctx, elem.x + elem.width / 2, elem.y + elem.height, elem.width, decorPulse);
        }
      }

      // Render Custom Add-on Blocks (Images centered on square tiles)
      for (const elem of elements) {
        if (elem.customImg) {
          try {
            const img = getCachedImage(elem.customImg);
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, elem.x, elem.y, elem.width, elem.height);
            } else {
              ctx.fillStyle = '#a855f7';
              ctx.fillRect(elem.x, elem.y, elem.width, elem.height);
            }
          } catch {}
        }
      }

      // Render Lava Bubbles
      ctx.fillStyle = '#fef08a';
      for (const b of lavaBubbles) {
        b.y -= b.speed;
        b.x += Math.sin(b.phase + performance.now() * 0.003) * 0.4;
        const matchingLava = lavaElements.find(
          (l) => b.x >= l.x && b.x <= l.x + l.width && b.y >= l.y && b.y <= l.y + l.height
        );
        if (!matchingLava || b.y <= matchingLava.y) {
          b.y = matchingLava ? matchingLava.y + matchingLava.height : 0;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Render Trail Particles
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.life += 1;
        p.alpha = 1 - p.life / p.maxLife;
        if (p.life >= p.maxLife) {
          trailParticles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      // 4. Render Active Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // slight gravity
        p.life += 1;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Render Local Player Avatar
      if (!player.dead) {
        drawCharacterAvatar(
          ctx,
          player.x,
          player.y,
          player.width,
          player.height,
          player.facing,
          player.squashX,
          player.squashY,
          avatar
        );
      }

      // 6. Render Peer Multiplayer Player (Live Location Sync)
      const currentParty = partyRef.current;
      if (currentParty) {
        const isPeerPresent = isHostRef.current ? Boolean(currentParty.guestId) : Boolean(currentParty.hostId);
        if (isPeerPresent) {
          const peer = peerRenderPosRef.current || peerPosRef.current;
          const peerX = peer ? peer.x : spawnElem.x;
          const peerY = peer ? peer.y : spawnElem.y;
          const peerFacing = peer ? (peer.faceRight ? 'right' : 'left') : 'right';
          const peerDead = peer ? peer.isDead : false;
          const peerDone = peer ? peer.finished : false;
          const activePeerAvatar: AvatarConfig = peerAvatar || {
            name: peerName || (isHostRef.current ? 'Player 2' : 'Player 1'),
            color: isHostRef.current ? '#38bdf8' : '#fbbf24',
            eyeStyle: 'normal',
            hat: 'none',
            trail: 'none',
          };

          if (!peerDead) {
            drawCharacterAvatar(
              ctx,
              peerX,
              peerY,
              30,
              30,
              peerFacing,
              1,
              1,
              activePeerAvatar,
              peerName || (isHostRef.current ? 'Player 2' : 'Player 1'),
              peerDone
            );
          }
        }
      }

      ctx.restore();
    };

    // Frame Loop
    const loop = (time: number) => {
      if (!isRunning) return;
      const rawDt = (time - lastTime) / 1000;
      lastTime = time;
      const dt = Math.min(rawDt, 0.05);

      update(dt);
      render();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [map.id, isVerificationMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-black">
      {/* 60fps Isolated Game Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full cursor-default" />

      {/* Top Left: Map Info & Verification Badge */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-xl text-white font-bold text-sm tracking-wide border border-white/15 shadow-lg">
            {map.title}
          </span>
          {isVerificationMode && (
            <span className="px-2.5 py-1 rounded-2xl bg-amber-500 text-black font-extrabold text-xs tracking-wider uppercase animate-pulse shadow-md">
              Verify Run (Beat to Publish!)
            </span>
          )}
        </div>
      </div>

      {/* Top Right: Stats Cluster & Control Actions */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Multiplayer Party Badge */}
        {party && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 text-xs font-bold text-emerald-300 shadow-lg">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Room {party.id}</span>
            <span className="text-[10px] text-neutral-400 font-normal">
              ({party.gameMode === 'race' ? 'Race' : 'Co-op'})
            </span>
          </div>
        )}

        {/* Leader: Select New Map / Party Homescreen */}
        {party && isHost && (
          <button
            onClick={async () => {
              sounds.playClick();
              await returnPartyToLobby(party.id);
              if (onSelectPartyMapRef.current) {
                onSelectPartyMapRef.current();
              }
            }}
            title="Return to Party Homescreen and Select New Map"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 text-indigo-200 text-xs font-bold shadow-lg transition cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Select New Map</span>
          </button>
        )}

        {/* Leave Party Button */}
        {party && onLeaveParty && (
          <button
            onClick={() => {
              sounds.playClick();
              onLeaveParty();
            }}
            title="Leave Party"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-200 text-xs font-bold shadow-lg transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Party</span>
          </button>
        )}

        {/* Play Another Random Map Button */}
        {!isVerificationMode && !party && onPlayAnother && (
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAnother();
            }}
            title="Play Another Random Map (Hotkey: K)"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl backdrop-blur-xl bg-emerald-500/90 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/25 transition transform active:scale-95 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Play Another (K)</span>
          </button>
        )}

        {/* Timer */}
        <div className="px-3 py-1.5 rounded-2xl bg-black/50 backdrop-blur-xl text-white font-mono font-bold text-xs sm:text-sm border border-white/15 shadow flex items-center gap-1.5 tabular-nums">
          <Timer className="w-3.5 h-3.5 text-neutral-400" />
          <span ref={timerDisplayRef}>0.00s</span>
        </div>

        {/* Coins if any */}
        {totalCoins > 0 && (
          <div className="px-3 py-1.5 rounded-2xl bg-black/50 backdrop-blur-xl text-yellow-300 font-mono font-bold text-xs sm:text-sm border border-white/15 shadow flex items-center gap-1.5 tabular-nums">
            <CircleDollarSign className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              {coinsCollected} / {totalCoins}
            </span>
          </div>
        )}

        {/* Deaths */}
        <div className="px-3 py-1.5 rounded-2xl bg-black/50 backdrop-blur-xl text-red-300 font-mono font-bold text-xs sm:text-sm border border-white/15 shadow flex items-center gap-1.5 tabular-nums">
          <Skull className="w-3.5 h-3.5 text-red-400" />
          <span>{deaths}</span>
        </div>

        {/* Mute button */}
        <button
          onClick={handleToggleMute}
          title="Toggle Mute (M)"
          className="p-2 rounded-2xl backdrop-blur-xl bg-black/50 hover:bg-black/70 text-white/90 hover:text-white border border-white/15 shadow transition cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Quick Restart (only in solo) */}
        {!party && (
          <button
            onClick={() => {
              const ev = new KeyboardEvent('keydown', { code: 'KeyR' });
              window.dispatchEvent(ev);
            }}
            title="Restart Level (R)"
            className="p-2 rounded-2xl backdrop-blur-xl bg-black/50 hover:bg-black/70 text-white/90 hover:text-white border border-white/15 shadow transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Toggle On-screen Controls */}
        <button
          onClick={() => setTouchEnabled(!touchEnabled)}
          title="Toggle Mobile Touch Controls"
          className={`p-2 rounded-2xl backdrop-blur-xl border shadow transition cursor-pointer ${
            touchEnabled
              ? 'bg-indigo-600 text-white border-indigo-400'
              : 'bg-black/50 hover:bg-black/70 text-white/70 border-white/15'
          }`}
        >
          <Smartphone className="w-4 h-4" />
        </button>

        {/* Exit back */}
        <button
          onClick={onExit}
          title="Exit to Menu (Esc)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs border border-red-500/50 shadow transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Race Countdown Overlay */}
      {party && party.gameMode === 'race' && countdown !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="px-10 py-7 rounded-3xl backdrop-blur-2xl bg-black/70 border border-white/20 shadow-2xl text-center">
            <div
              className={`font-mono font-black ${
                countdown === 0 ? 'text-6xl text-emerald-400 animate-bounce' : 'text-7xl text-amber-400 animate-pulse'
              }`}
            >
              {countdown === 0 ? 'GO' : countdown}
            </div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-neutral-300 mt-2">
              {countdown === 0 ? 'Sprint to the Flag' : 'Race Starting'}
            </div>
          </div>
        </div>
      )}

      {/* Co-op Waiting Status Banner */}
      {party && party.gameMode === 'coop' && localFinished && !peerFinished && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
          <div className="px-5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/70 border border-emerald-400/40 shadow-xl flex items-center gap-2 text-white text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>You reached the flag! Waiting for {peerName} to arrive... (1/2)</span>
          </div>
        </div>
      )}
      {party && party.gameMode === 'coop' && !localFinished && peerFinished && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
          <div className="px-5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/70 border border-amber-400/40 shadow-xl flex items-center gap-2 text-white text-xs font-bold">
            <Flag className="w-4 h-4 text-amber-400" />
            <span>{peerName} reached the flag! Reach the checkered flag to complete the level!</span>
          </div>
        </div>
      )}

      {/* Control Hint Banner at Bottom Center */}
      {!touchEnabled && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
          <span className="text-[11px] font-medium tracking-wide text-neutral-300 backdrop-blur-xl bg-black/60 px-4 py-1.5 rounded-2xl border border-white/15 shadow-lg">
            WASD / Arrows to Move · Space / W to Jump · K for Next Map · R to Reset · Esc to Exit
          </span>
        </div>
      )}

      {/* Mobile Touch Screen Controls (Joysticks / Buttons) */}
      {touchEnabled && (
        <div className="absolute inset-x-0 bottom-6 px-8 flex items-end justify-between pointer-events-auto z-30">
          {/* Left / Right D-Pad Controls */}
          <div className="flex items-center gap-3">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                inputRef.current.left = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                inputRef.current.left = false;
              }}
              onMouseDown={() => (inputRef.current.left = true)}
              onMouseUp={() => (inputRef.current.left = false)}
              className="w-16 h-16 rounded-3xl backdrop-blur-2xl bg-black/60 active:bg-indigo-600/80 border-2 border-white/20 active:border-white text-white flex items-center justify-center shadow-2xl transition transform active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                inputRef.current.right = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                inputRef.current.right = false;
              }}
              onMouseDown={() => (inputRef.current.right = true)}
              onMouseUp={() => (inputRef.current.right = false)}
              className="w-16 h-16 rounded-3xl backdrop-blur-2xl bg-black/60 active:bg-indigo-600/80 border-2 border-white/20 active:border-white text-white flex items-center justify-center shadow-2xl transition transform active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Right Action / Jump Button */}
          <div>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                inputRef.current.jumpPressed = true;
                inputRef.current.up = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                inputRef.current.up = false;
              }}
              onMouseDown={() => {
                inputRef.current.jumpPressed = true;
                inputRef.current.up = true;
              }}
              onMouseUp={() => {
                inputRef.current.up = false;
              }}
              className="w-20 h-20 rounded-3xl backdrop-blur-2xl bg-emerald-600/80 active:bg-emerald-500 border-2 border-emerald-300 text-white flex flex-col items-center justify-center shadow-2xl transition transform active:scale-95 cursor-pointer"
            >
              <ArrowUp className="w-6 h-6" />
              <span className="text-xs font-black tracking-wider">JUMP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
