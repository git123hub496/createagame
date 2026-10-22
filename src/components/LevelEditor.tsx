import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameMap, LevelElement, ElementType, SpikeDirection, ThemeType, DifficultyType, AvatarConfig } from '../types';
import { sounds } from '../services/sound';
import {
  exportMapToCagFile,
  importMapFromCagFile,
  publishMapToCloud,
  saveLocalMap,
  deleteMapFromEverywhere,
  isForbiddenPlayerName,
  generateMapId,
  getMyCreatorId,
  getLocalMaps,
} from '../services/mapStorage';
import {
  Play,
  CheckCircle2,
  Download,
  Upload,
  Cloud,
  Trash2,
  Copy,
  Plus,
  ArrowLeft,
  Settings,
  Grid,
  RotateCw,
  RotateCcw,
  Share2,
  Check,
  AlertCircle,
  Eye,
  Save,
  X,
  Palette,
  Package,
} from 'lucide-react';
import { drawPumpkin, drawJackOLantern, getGrassHalloweenDecorations } from '../services/halloweenDecorations';
import { ElementThumbnail } from './ElementThumbnail';
import { getAllActiveAddonElements } from '../services/addonService';
import { getCachedImage } from '../services/imageCache';
import { CustomAddonElement } from '../types';
import { AddonHubModal } from './AddonHubModal';

interface LevelEditorProps {
  initialMap?: GameMap | null;
  avatar: AvatarConfig;
  onExit: () => void;
  onTestPlay: (map: GameMap, isVerification: boolean) => void;
}

export interface PaletteItem {
  type: ElementType;
  label: string;
  defaultW: number;
  defaultH: number;
  color: string;
  desc: string;
  customImg?: string;
  behavior?: 'solid' | 'hazard' | 'spring' | 'decor' | 'coin';
}

const ELEMENT_PALETTE: PaletteItem[] = [
  { type: 'grass', label: 'Grass Block', defaultW: 160, defaultH: 64, color: '#22c55e', desc: 'Solid terrain with grassy top' },
  { type: 'ground', label: 'Ground Block', defaultW: 160, defaultH: 64, color: '#78350f', desc: 'Solid dirt/stone block' },
  { type: 'platform', label: 'Floating Platform', defaultW: 120, defaultH: 24, color: '#b45309', desc: 'Pass through from below' },
  { type: 'spike', label: 'Spikes', defaultW: 96, defaultH: 32, color: '#ef4444', desc: 'Scalable sharp spikes hazard' },
  { type: 'lava', label: 'Lava Pool', defaultW: 192, defaultH: 64, color: '#f97316', desc: 'Scalable sizzling deadly magma' },
  { type: 'flag', label: 'Checkered Flag', defaultW: 40, defaultH: 80, color: '#facc15', desc: 'The goal finish line' },
  { type: 'spawn', label: 'Spawn Point', defaultW: 32, defaultH: 32, color: '#38bdf8', desc: 'Player start location' },
  { type: 'spring', label: 'Spring Pad', defaultW: 32, defaultH: 32, color: '#ec4899', desc: 'Super bounce launch' },
  { type: 'coin', label: 'Star Coin', defaultW: 24, defaultH: 24, color: '#eab308', desc: 'Collectible bonus' },
  { type: 'checkpoint', label: 'Checkpoint', defaultW: 32, defaultH: 60, color: '#10b981', desc: 'Mid-stage respawn point' },
  { type: 'pumpkin', label: 'Pumpkin', defaultW: 24, defaultH: 24, color: '#ea580c', desc: 'Decorative pass-through pumpkin' },
  { type: 'jackolantern', label: 'Jack-o-lantern', defaultW: 26, defaultH: 26, color: '#f59e0b', desc: 'Pass-through lantern emitting light' },
  { type: 'text', label: 'Floating Text', defaultW: 140, defaultH: 40, color: '#38bdf8', desc: 'Rotatable pass-through text' },
  { type: 'arrow', label: 'Arrow', defaultW: 48, defaultH: 48, color: '#38bdf8', desc: 'Rotatable pass-through arrow' },
];

export const LevelEditor: React.FC<LevelEditorProps> = ({
  initialMap,
  avatar,
  onExit,
  onTestPlay,
}) => {
  // Map State (Always has a valid CAG-XXXXX ID so it appears in Explore)
  const [map, setMap] = useState<GameMap>(() => {
    if (initialMap) {
      return {
        ...JSON.parse(JSON.stringify(initialMap)),
        id: initialMap.id || generateMapId(),
        authorName: avatar.name || initialMap.authorName || 'Creator',
      };
    }
    const newId = generateMapId();
    const myCreatorId = getMyCreatorId();
    return {
      id: newId,
      title: '', // Require user to add their own custom map name!
      description: 'Can you beat this challenge?',
      authorName: avatar.name || 'Creator',
      authorId: myCreatorId,
      elements: [
        { id: 'spawn', type: 'spawn', x: 80, y: 380, width: 32, height: 32 },
        { id: 'start_grass', type: 'grass', x: 40, y: 440, width: 280, height: 160 },
        { id: 'end_grass', type: 'grass', x: 600, y: 440, width: 280, height: 160 },
        { id: 'goal_flag', type: 'flag', x: 740, y: 360, width: 40, height: 80 },
      ],
      verified: false,
      playCount: 0,
      clearCount: 0,
      likesCount: 0,
      difficulty: 'Normal',
      theme: 'Grassland',
      createdAt: new Date().toISOString(),
    };
  });

  // Editor interaction states
  const [selectedElemId, setSelectedElemId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ElementType>('grass');
  const [activeTab, setActiveTab] = useState<'palette' | 'properties' | 'settings'>('palette');
  const [gridSnap, setGridSnap] = useState(true);
  const gridSize = 16;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Dragging & Resizing elements
  const [isDraggingElem, setIsDraggingElem] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Customizable Prop Settings (Text & Arrow)
  const [propColor, setPropColor] = useState<string>('#38bdf8');
  const [propText, setPropText] = useState<string>('Text');
  const [propRotation, setPropRotation] = useState<number>(0);

  // Active custom add-on elements
  const [addonElements, setAddonElements] = useState<CustomAddonElement[]>(() => getAllActiveAddonElements());
  const [showAddonHub, setShowAddonHub] = useState(false);
  useEffect(() => {
    const handleAddonUpdate = () => {
      setAddonElements(getAllActiveAddonElements());
    };
    window.addEventListener('cag_addon_update', handleAddonUpdate);
    return () => window.removeEventListener('cag_addon_update', handleAddonUpdate);
  }, []);

  const combinedPalette: PaletteItem[] = [
    ...ELEMENT_PALETTE,
    ...addonElements.map((ae) => ({
      type: ae.id,
      label: ae.name,
      defaultW: ae.defaultW || 32,
      defaultH: ae.defaultH || 32,
      color: '#6366f1',
      desc: ae.desc || `${ae.behavior} custom element`,
      customImg: ae.imageDataUrl,
      behavior: ae.behavior,
    })),
  ];

  // Circular resize handles state ('tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r')
  type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [canvasCursor, setCanvasCursor] = useState<string>('crosshair');
  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    mouseStartX: number;
    mouseStartY: number;
  }>({ startX: 0, startY: 0, startW: 0, startH: 0, mouseStartX: 0, mouseStartY: 0 });

  // Name Required & Delete Map Modals
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameModalInput, setNameModalInput] = useState('');
  const [nameModalError, setNameModalError] = useState('');
  const [pendingActionAfterName, setPendingActionAfterName] = useState<'verify' | 'save' | 'publish' | null>(null);
  const [showDeleteMapModal, setShowDeleteMapModal] = useState(false);

  // Publishing & modal states
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedElement = map.elements.find((e) => e.id === selectedElemId);
  const selectedElemIdRef = useRef<string | null>(selectedElemId);
  selectedElemIdRef.current = selectedElemId;
  const selectedElemRef = useRef<LevelElement | undefined>(selectedElement);
  selectedElemRef.current = selectedElement;
  const selectedToolRef = useRef<ElementType>(selectedTool);
  selectedToolRef.current = selectedTool;

  // Keep author synced with avatar name (always uses avatar name!)
  useEffect(() => {
    if (avatar.name && map.authorName !== avatar.name) {
      setMap((prev) => ({ ...prev, authorName: avatar.name }));
    }
  }, [avatar.name, map.authorName]);

  // Auto-save map locally so your map ALWAYS shows in Explore menu!
  useEffect(() => {
    if (!map.id) return;
    const timer = setTimeout(() => {
      saveLocalMap({
        ...map,
        authorName: avatar.name,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [map, avatar.name]);

  // Snap helper
  const snap = useCallback((val: number) => {
    if (!gridSnap) return Math.round(val);
    return Math.round(val / gridSize) * gridSize;
  }, [gridSnap]);

  // Add Element
  const addElementAt = (type: ElementType, worldX: number, worldY: number) => {
    sounds.playPlace();
    const preset = combinedPalette.find((p) => p.type === type) || {
      type,
      label: 'Custom Element',
      defaultW: 32,
      defaultH: 32,
      color: '#6366f1',
      desc: '',
    };

    // Only one spawn and flag allowed
    if (type === 'spawn') {
      const existingSpawn = map.elements.find((e) => e.type === 'spawn');
      if (existingSpawn) {
        setMap((prev) => ({
          ...prev,
          verified: false,
          elements: prev.elements.map((e) =>
            e.type === 'spawn' ? { ...e, x: snap(worldX), y: snap(worldY) } : e
          ),
        }));
        setSelectedElemId(existingSpawn.id);
        return;
      }
    }

    const newId = `elem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const isProp = type === 'text' || type === 'arrow';
    const newElement: LevelElement = {
      id: newId,
      type,
      x: snap(worldX - preset.defaultW / 2),
      y: snap(worldY - preset.defaultH / 2),
      width: preset.defaultW,
      height: preset.defaultH,
      spikeDir: type === 'spike' ? 'up' : undefined,
      customImg: preset.customImg,
      customName: preset.label,
      behavior: isProp ? 'decor' : preset.behavior,
      text: type === 'text' ? propText : undefined,
      color: isProp ? propColor : undefined,
      rotation: isProp ? propRotation : 0,
      fontSize: type === 'text' ? 22 : undefined,
    };

    setMap((prev) => ({
      ...prev,
      verified: false, // Invalidate verification when map changes
      elements: [...prev.elements, newElement],
    }));
    setSelectedElemId(newId);
    setActiveTab('properties');
  };

  // Delete Element
  const deleteSelected = () => {
    const targetId = selectedElemIdRef.current || selectedElemId;
    if (!targetId) return;
    sounds.playErase();
    setMap((prev) => ({
      ...prev,
      verified: false,
      elements: prev.elements.filter((e) => e.id !== targetId),
    }));
    setSelectedElemId(null);
  };

  // Duplicate Element
  const duplicateSelected = () => {
    const target = selectedElemRef.current || selectedElement;
    if (!target || target.type === 'spawn') return;
    sounds.playPlace();
    const dupId = `elem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const dup: LevelElement = {
      ...target,
      id: dupId,
      x: target.x + 32,
      y: target.y + 32,
    };
    setMap((prev) => ({
      ...prev,
      verified: false,
      elements: [...prev.elements, dup],
    }));
    setSelectedElemId(dupId);
  };

  // Update selected element property
  const updateSelected = (partial: Partial<LevelElement>) => {
    const targetId = selectedElemIdRef.current || selectedElemId;
    if (!targetId) return;
    setMap((prev) => ({
      ...prev,
      verified: false,
      elements: prev.elements.map((e) => (e.id === targetId ? { ...e, ...partial } : e)),
    }));
  };

  // Rotate spike direction
  const rotateSpike = () => {
    if (!selectedElement || selectedElement.type !== 'spike') return;
    sounds.playClick();
    const dirs: SpikeDirection[] = ['up', 'right', 'down', 'left'];
    const curIdx = dirs.indexOf(selectedElement.spikeDir || 'up');
    const nextDir = dirs[(curIdx + 1) % dirs.length];

    // Swap width and height if changing between vertical and horizontal
    const isCurVertical = selectedElement.spikeDir === 'up' || selectedElement.spikeDir === 'down';
    const isNextVertical = nextDir === 'up' || nextDir === 'down';
    let w = selectedElement.width;
    let h = selectedElement.height;
    if (isCurVertical !== isNextVertical) {
      w = selectedElement.height;
      h = selectedElement.width;
    }

    updateSelected({ spikeDir: nextDir, width: w, height: h });
  };

  // Circular resize handles definition
  const getResizeHandles = (elem: LevelElement) => {
    const x = elem.x;
    const y = elem.y;
    const w = elem.width;
    const h = elem.height;
    return [
      { key: 'tl' as const, x, y, cursor: 'nwse-resize' },
      { key: 't' as const, x: x + w / 2, y, cursor: 'ns-resize' },
      { key: 'tr' as const, x: x + w, y, cursor: 'nesw-resize' },
      { key: 'r' as const, x: x + w, y: y + h / 2, cursor: 'ew-resize' },
      { key: 'br' as const, x: x + w, y: y + h, cursor: 'nwse-resize' },
      { key: 'b' as const, x: x + w / 2, y: y + h, cursor: 'ns-resize' },
      { key: 'bl' as const, x, y: y + h, cursor: 'nesw-resize' },
      { key: 'l' as const, x, y: y + h / 2, cursor: 'ew-resize' },
    ];
  };

  const getHandleAt = (worldX: number, worldY: number, elem: LevelElement, currentZoom: number) => {
    if (elem.type === 'spawn') return null;
    const handles = getResizeHandles(elem);
    // Large, generous hit threshold so circles are easy to drag and expand
    const threshold = Math.max(16, 20 / currentZoom);
    for (const h of handles) {
      const dist = Math.hypot(worldX - h.x, worldY - h.y);
      if (dist <= threshold) {
        return h;
      }
    }
    return null;
  };

  // Canvas Mouse / Touch Handlers for Editing & Selection
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handlePointerDown = (clientX: number, clientY: number, isRightOrMiddleClick: boolean) => {
    // Middle click or drag for Panning
    if (isRightOrMiddleClick) {
      setIsPanning(true);
      panStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
      return;
    }

    const world = screenToWorld(clientX, clientY);

    // 1. Check if user clicked directly on one of the CIRCLE HANDLES of the selected element!
    if (selectedElement) {
      const hitHandle = getHandleAt(world.x, world.y, selectedElement, zoom);
      if (hitHandle) {
        sounds.playClick();
        setActiveHandle(hitHandle.key);
        setCanvasCursor(hitHandle.cursor);
        resizeStartRef.current = {
          startX: selectedElement.x,
          startY: selectedElement.y,
          startW: selectedElement.width,
          startH: selectedElement.height,
          mouseStartX: world.x,
          mouseStartY: world.y,
        };
        return;
      }
    }

    // 2. Check if clicked an existing element (search top-to-bottom)
    let clickedId: string | null = null;
    for (let i = map.elements.length - 1; i >= 0; i--) {
      const el = map.elements[i];
      if (
        world.x >= el.x &&
        world.x <= el.x + el.width &&
        world.y >= el.y &&
        world.y <= el.y + el.height
      ) {
        clickedId = el.id;
        break;
      }
    }

    if (clickedId) {
      sounds.playClick();
      setSelectedElemId(clickedId);
      setIsDraggingElem(true);
      setCanvasCursor('move');
      const el = map.elements.find((e) => e.id === clickedId)!;
      dragOffsetRef.current = { x: world.x - el.x, y: world.y - el.y };
      setActiveTab('properties');
    } else {
      // Clicked on empty canvas space -> Place currently selected tool element!
      addElementAt(selectedTool, world.x, world.y);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    handlePointerDown(clientX, clientY, e.button === 1 || e.altKey);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (isPanning) {
      setPan({
        x: clientX - panStartRef.current.x,
        y: clientY - panStartRef.current.y,
      });
      return;
    }

    const world = screenToWorld(clientX, clientY);

    // 1. Actively dragging a CIRCLE RESIZE HANDLE to expand/shrink element!
    if (activeHandle && selectedElement) {
      const rawDx = world.x - resizeStartRef.current.mouseStartX;
      const rawDy = world.y - resizeStartRef.current.mouseStartY;
      const dx = snap(rawDx);
      const dy = snap(rawDy);

      let newX = resizeStartRef.current.startX;
      let newY = resizeStartRef.current.startY;
      let newW = resizeStartRef.current.startW;
      let newH = resizeStartRef.current.startH;
      const minSize = 16;

      if (activeHandle === 'r' || activeHandle === 'tr' || activeHandle === 'br') {
        newW = Math.max(minSize, resizeStartRef.current.startW + dx);
      }
      if (activeHandle === 'l' || activeHandle === 'tl' || activeHandle === 'bl') {
        const attemptedW = resizeStartRef.current.startW - dx;
        newW = Math.max(minSize, attemptedW);
        newX = resizeStartRef.current.startX + (resizeStartRef.current.startW - newW);
      }
      if (activeHandle === 'b' || activeHandle === 'bl' || activeHandle === 'br') {
        newH = Math.max(minSize, resizeStartRef.current.startH + dy);
      }
      if (activeHandle === 't' || activeHandle === 'tl' || activeHandle === 'tr') {
        const attemptedH = resizeStartRef.current.startH - dy;
        newH = Math.max(minSize, attemptedH);
        newY = resizeStartRef.current.startY + (resizeStartRef.current.startH - newH);
      }

      setMap((prev) => ({
        ...prev,
        verified: false,
        elements: prev.elements.map((el) =>
          el.id === selectedElemId
            ? { ...el, x: newX, y: newY, width: newW, height: newH }
            : el
        ),
      }));
      return;
    }

    // 2. Dragging whole element to move it
    if (isDraggingElem && selectedElemId) {
      const newX = snap(world.x - dragOffsetRef.current.x);
      const newY = snap(world.y - dragOffsetRef.current.y);

      setMap((prev) => ({
        ...prev,
        verified: false,
        elements: prev.elements.map((el) =>
          el.id === selectedElemId ? { ...el, x: newX, y: newY } : el
        ),
      }));
      return;
    }

    // 3. Hover detection for dynamic circle handles and cursor update
    if (selectedElement) {
      const hitHandle = getHandleAt(world.x, world.y, selectedElement, zoom);
      if (hitHandle) {
        setHoveredHandle(hitHandle.key);
        setCanvasCursor(hitHandle.cursor);
        return;
      } else {
        setHoveredHandle(null);
      }

      // Check if hovering over element body
      if (
        world.x >= selectedElement.x &&
        world.x <= selectedElement.x + selectedElement.width &&
        world.y >= selectedElement.y &&
        world.y <= selectedElement.y + selectedElement.height
      ) {
        setCanvasCursor('move');
        return;
      }
    }

    // Check if hovering over another unselected element
    let hoveringElement = false;
    for (const el of map.elements) {
      if (
        world.x >= el.x &&
        world.x <= el.x + el.width &&
        world.y >= el.y &&
        world.y <= el.y + el.height
      ) {
        hoveringElement = true;
        break;
      }
    }

    setCanvasCursor(hoveringElement ? 'pointer' : 'crosshair');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    handlePointerMove(clientX, clientY);
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setIsDraggingElem(false);
    if (activeHandle) {
      sounds.playPlace();
      setActiveHandle(null);
    }
  };

  const handleMouseUp = () => {
    handlePointerUp();
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = e.touches[0].clientX - rect.left;
      const clientY = e.touches[0].clientY - rect.top;
      handlePointerDown(clientX, clientY, false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = e.touches[0].clientX - rect.left;
      const clientY = e.touches[0].clientY - rect.top;
      handlePointerMove(clientX, clientY);
    }
  };

  const handleTouchEnd = () => {
    handlePointerUp();
  };

  // Global pointer tracking when actively dragging a circle resize handle, element, or pan
  useEffect(() => {
    if (!activeHandle && !isDraggingElem && !isPanning) return;

    const onGlobalMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      handlePointerMove(e.clientX - rect.left, e.clientY - rect.top);
    };

    const onGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        handlePointerMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      }
    };

    const onGlobalPointerEnd = () => {
      handlePointerUp();
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalPointerEnd);
    window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', onGlobalPointerEnd);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalPointerEnd);
      window.removeEventListener('touchmove', onGlobalTouchMove);
      window.removeEventListener('touchend', onGlobalPointerEnd);
    };
  }, [activeHandle, isDraggingElem, isPanning, handlePointerMove, handlePointerUp]);

  // Wheel to Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(Math.max(z * zoomFactor, 0.4), 2.5));
  };

  // Continuous WASD and Arrow Keys Camera Panning in Editor
  const heldPanKeysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    let animId: number;

    const tickPan = () => {
      const keys = heldPanKeysRef.current;
      let dx = 0;
      let dy = 0;
      const speed = keys['Shift'] ? 22 : 12;

      // W / Up -> Move Camera Up (World moves down -> pan.y increases)
      if (keys['KeyW'] || keys['w'] || keys['W'] || keys['ArrowUp']) {
        dy += speed;
      }
      // S / Down -> Move Camera Down (World moves up -> pan.y decreases)
      if (keys['KeyS'] || keys['s'] || keys['S'] || keys['ArrowDown']) {
        dy -= speed;
      }
      // A / Left -> Move Camera Left (World moves right -> pan.x increases)
      if (keys['KeyA'] || keys['a'] || keys['A'] || keys['ArrowLeft']) {
        dx += speed;
      }
      // D / Right -> Move Camera Right (World moves left -> pan.x decreases)
      if ((keys['KeyD'] || keys['d'] || keys['D'] || keys['ArrowRight']) && !keys['Control'] && !keys['Meta']) {
        dx -= speed;
      }

      if (dx !== 0 || dy !== 0) {
        setPan((prev) => ({
          x: Math.round(prev.x + dx),
          y: Math.round(prev.y + dy),
        }));
      }

      animId = requestAnimationFrame(tickPan);
    };

    animId = requestAnimationFrame(tickPan);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const code = e.code;
      const key = e.key;

      if (e.shiftKey) heldPanKeysRef.current['Shift'] = true;
      if (e.ctrlKey) heldPanKeysRef.current['Control'] = true;
      if (e.metaKey) heldPanKeysRef.current['Meta'] = true;

      // Duplicate shortcut (Ctrl+D / Cmd+D)
      if ((key === 'd' || key === 'D') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Delete shortcut
      if (key === 'Delete' || key === 'Backspace') {
        deleteSelected();
        return;
      }

      // Rotate Text & Arrow shortcut with Q and E (strictly for text and arrow ONLY)
      if (key === 'q' || key === 'Q' || code === 'KeyQ') {
        const curElem = selectedElemRef.current;
        if (curElem) {
          if (curElem.type === 'text' || curElem.type === 'arrow') {
            e.preventDefault();
            sounds.playClick();
            const curRot = curElem.rotation || 0;
            const nextRot = (curRot - 15 + 360) % 360;
            updateSelected({ rotation: nextRot });
          }
          return;
        } else if (selectedToolRef.current === 'text' || selectedToolRef.current === 'arrow') {
          e.preventDefault();
          sounds.playClick();
          setPropRotation((prev) => (prev - 15 + 360) % 360);
          return;
        }
      }

      if (key === 'e' || key === 'E' || code === 'KeyE') {
        const curElem = selectedElemRef.current;
        if (curElem) {
          if (curElem.type === 'text' || curElem.type === 'arrow') {
            e.preventDefault();
            sounds.playClick();
            const curRot = curElem.rotation || 0;
            const nextRot = (curRot + 15) % 360;
            updateSelected({ rotation: nextRot });
          }
          return;
        } else if (selectedToolRef.current === 'text' || selectedToolRef.current === 'arrow') {
          e.preventDefault();
          sounds.playClick();
          setPropRotation((prev) => (prev + 15) % 360);
          return;
        }
      }

      // WASD / Arrow keys camera panning
      if (
        code === 'KeyW' ||
        code === 'KeyA' ||
        code === 'KeyS' ||
        code === 'KeyD' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight'
      ) {
        e.preventDefault();
        heldPanKeysRef.current[code] = true;
        heldPanKeysRef.current[key] = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key;
      delete heldPanKeysRef.current[code];
      delete heldPanKeysRef.current[key];
      if (!e.shiftKey) delete heldPanKeysRef.current['Shift'];
      if (!e.ctrlKey) delete heldPanKeysRef.current['Control'];
      if (!e.metaKey) delete heldPanKeysRef.current['Meta'];
    };

    const onWindowBlur = () => {
      heldPanKeysRef.current = {};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, []);

  // Render Editor Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sizing
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Theme-Aware Live Background Sky
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
      // Spooky Halloween night sky
      grad.addColorStop(0, '#0f051d');
      grad.addColorStop(0.5, '#2e1065');
      grad.addColorStop(1, '#7c2d12');
    } else {
      // Sunny Grassland sky
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.6, '#7dd3fc');
      grad.addColorStop(1, '#bae6fd');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Distant Theme Scenery (e.g. Harvest Moon on Halloween night sky)
    if (theme === 'Halloween') {
      ctx.save();
      ctx.fillStyle = 'rgba(254, 215, 170, 0.25)';
      ctx.beginPath();
      ctx.arc(canvas.width * 0.78, 110, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(canvas.width * 0.78, 110, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Pan & Zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw Grid
    if (gridSnap) {
      const startX = -pan.x / zoom;
      const startY = -pan.y / zoom;
      const endX = startX + canvas.width / zoom;
      const endY = startY + canvas.height / zoom;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      const step = 32;

      for (let x = Math.floor(startX / step) * step; x < endX; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = Math.floor(startY / step) * step; y < endY; y += step) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
    }

    // World floor indicator
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(-1000, 1800);
    ctx.lineTo(5000, 1800);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Map Elements
    for (const elem of map.elements) {
      const isSelected = elem.id === selectedElemId;

      // Draw each element type cleanly with theme awareness
      if (elem.type === 'grass' || elem.type === 'ground') {
        const dirtColor =
          theme === 'Volcano'
            ? '#291e1d'
            : theme === 'Cyber'
            ? '#181829'
            : theme === 'Halloween'
            ? '#180d29'
            : '#573d2a';
        const grassTopColor =
          theme === 'Volcano'
            ? '#78350f'
            : theme === 'Cyber'
            ? '#06b6d4'
            : theme === 'Halloween'
            ? '#ea580c'
            : '#22c55e';

        ctx.fillStyle = dirtColor;
        ctx.fillRect(elem.x, elem.y, elem.width, elem.height);

        if (elem.type === 'grass') {
          ctx.fillStyle = grassTopColor;
          ctx.fillRect(elem.x, elem.y, elem.width, 14);
        }
      } else if (elem.type === 'platform') {
        ctx.fillStyle =
          theme === 'Cyber'
            ? '#3b82f6'
            : theme === 'Halloween'
            ? '#3b0764'
            : '#b45309';
        ctx.fillRect(elem.x, elem.y, elem.width, elem.height);
        ctx.fillStyle = theme === 'Cyber' ? '#93c5fd' : '#d97706';
        ctx.fillRect(elem.x, elem.y, elem.width, 4);
      } else if (elem.type === 'spike') {
        const dir = elem.spikeDir || 'up';
        const count = Math.max(1, Math.round(dir === 'up' || dir === 'down' ? elem.width / 16 : elem.height / 16));
        const step = (dir === 'up' || dir === 'down' ? elem.width : elem.height) / count;

        ctx.fillStyle = '#cbd5e1';
        for (let i = 0; i < count; i++) {
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
        }
      } else if (elem.type === 'lava') {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(elem.x, elem.y, elem.width, elem.height);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(elem.x, elem.y, elem.width, 5);
      } else if (elem.type === 'spring') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(elem.x + 2, elem.y + elem.height - 6, elem.width - 4, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(elem.x + 4, elem.y + 2, elem.width - 8, 8);
      } else if (elem.type === 'coin') {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(elem.x + elem.width / 2, elem.y + elem.height / 2, elem.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (elem.type === 'checkpoint') {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(elem.x + 4, elem.y, 4, elem.height);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(elem.x + 8, elem.y + 4);
        ctx.lineTo(elem.x + elem.width, elem.y + 16);
        ctx.lineTo(elem.x + 8, elem.y + 28);
        ctx.closePath();
        ctx.fill();
      } else if (elem.type === 'flag') {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(elem.x + 4, elem.y, 4, elem.height);
        // Checkered pattern
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(elem.x + 8, elem.y + 4, elem.width - 8, 30);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(elem.x + 8, elem.y + 4, (elem.width - 8) / 2, 15);
        ctx.fillRect(elem.x + 8 + (elem.width - 8) / 2, elem.y + 19, (elem.width - 8) / 2, 15);
      } else if (elem.type === 'spawn') {
        // Player square preview
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(elem.x, elem.y, elem.width, elem.height);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
        // Clean eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(elem.x + 8, elem.y + 10, 3, 5);
        ctx.fillRect(elem.x + 18, elem.y + 10, 3, 5);
      } else if (elem.type === 'pumpkin') {
        drawPumpkin(ctx, elem.x + elem.width / 2, elem.y + elem.height, elem.width);
      } else if (elem.type === 'jackolantern') {
        drawJackOLantern(ctx, elem.x + elem.width / 2, elem.y + elem.height, elem.width, 0);
      } else if (elem.type === 'text') {
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
        ctx.shadowBlur = 4;
        ctx.fillText(content, 0, 0);
        ctx.restore();
      } else if (elem.type === 'arrow') {
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
        ctx.lineWidth = Math.max(1.5, 1.5 / zoom);
        ctx.stroke();
        ctx.restore();
      } else if (elem.customImg) {
        const imgObj = getCachedImage(elem.customImg);
        if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
          ctx.drawImage(imgObj, elem.x, elem.y, elem.width, elem.height);
        } else {
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(elem.x, elem.y, elem.width, elem.height);
        }
      }

      // Border outline for elements
      if (isSelected) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(2, 2 / zoom);
        ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
      } else if (elem.type === 'text' || elem.type === 'arrow') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
      }
    }

    // In Halloween theme: render decorative pumpkins and glowing jack-o'-lanterns on top of grass
    if (theme === 'Halloween') {
      for (const elem of map.elements) {
        if (elem.type === 'grass') {
          const decors = getGrassHalloweenDecorations(elem);
          for (const dec of decors) {
            if (dec.type === 'jackolantern') {
              drawJackOLantern(ctx, dec.x, dec.y, 24, 0);
            } else {
              drawPumpkin(ctx, dec.x, dec.y, 22);
            }
          }
        }
      }
    }

    // CIRCULAR RESIZE HANDLES & DIMENSIONS PILL
    for (const elem of map.elements) {
      const isSelected = elem.id === selectedElemId;

      // CIRCULAR RESIZE HANDLES & DIMENSIONS PILL
      if (isSelected && elem.type !== 'spawn') {
        const handles = getResizeHandles(elem);
        const handleRadius = Math.max(6, 7.5 / zoom);

        // 1. Draw all 8 circular handles around the element perimeter
        for (const h of handles) {
          const isInteracting = activeHandle === h.key || hoveredHandle === h.key;

          // Glowing aura ring around circle
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleRadius + (isInteracting ? 5 : 2.5), 0, Math.PI * 2);
          ctx.fillStyle = isInteracting ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.25)';
          ctx.fill();

          // Main Circle Handle Body
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleRadius, 0, Math.PI * 2);
          ctx.fillStyle = isInteracting ? '#38bdf8' : '#ffffff';
          ctx.fill();

          // Crisp Circle Border
          ctx.lineWidth = Math.max(2, 2 / zoom);
          ctx.strokeStyle = '#0284c7';
          ctx.stroke();

          // Inner bullseye center
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleRadius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = isInteracting ? '#ffffff' : '#0284c7';
          ctx.fill();
        }

        // 2. Floating Dimensions & Drag Hint Badge above element
        ctx.save();
        const isRotatableProp = elem.type === 'text' || elem.type === 'arrow';
        const badgeText = isRotatableProp
          ? `${elem.width} × ${elem.height} px • ${elem.rotation || 0}° • [Q / E] Rotate`
          : `${elem.width} × ${elem.height} px • Drag circles to expand`;
        ctx.font = `bold ${Math.max(10, 11 / zoom)}px monospace`;
        const textMetrics = ctx.measureText(badgeText);
        const badgeW = textMetrics.width + 16;
        const badgeH = Math.max(18, 20 / zoom);
        const badgeX = elem.x + elem.width / 2 - badgeW / 2;
        const badgeY = elem.y - badgeH - 8;

        // Badge pill background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Badge text
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, elem.x + elem.width / 2, badgeY + badgeH / 2);
        ctx.restore();
      }
    }

    ctx.restore();
  }, [map, selectedElemId, pan, zoom, gridSnap, activeHandle, hoveredHandle]);

  const handleSaveMap = () => {
    sounds.playClick();
    const cleanTitle = (map.title || '').trim() || 'My Platformer';
    const updated: GameMap = {
      ...map,
      id: map.id || generateMapId(),
      title: cleanTitle,
      authorName: avatar.name || 'White Square',
      authorId: getMyCreatorId(),
    };
    setMap(updated);
    saveLocalMap(updated);
    sounds.playVictory();
    setPublishNotice(`Map "${cleanTitle}" saved to your storage and synced to cloud!`);
  };

  const handleConfirmDeleteMap = async () => {
    sounds.playErase();
    if (map.id) {
      await deleteMapFromEverywhere(map.id);
    }
    setShowDeleteMapModal(false);
    onExit();
  };

  // Handle Publish to Cloud
  const handlePublish = async () => {
    sounds.playClick();
    const cleanTitle = (map.title || '').trim() || 'My Platformer';

    // Verification check
    if (!map.verified) {
      setPublishNotice('You must beat this map from start to checkered flag before publishing! Click "Verify (Beat to Publish)".');
      sounds.playSpikeDeath();
      return;
    }

    const hasFlag = map.elements.some((e) => e.type === 'flag');
    if (!hasFlag) {
      setPublishNotice('Your map needs a checkered flag at the end so players can finish it!');
      sounds.playSpikeDeath();
      return;
    }

    setIsPublishing(true);
    setPublishNotice(null);

    try {
      const mapToPublish: GameMap = {
        ...map,
        id: map.id || generateMapId(),
        title: cleanTitle,
        authorName: avatar.name || 'White Square',
        authorId: getMyCreatorId(),
      };
      const newId = await publishMapToCloud(mapToPublish);
      setPublishedId(newId);
      setMap(mapToPublish);
      sounds.playVictory();
      setPublishNotice(`Published to cloud with ID: ${newId}`);
    } catch {
      setPublishNotice('Saved to your storage and synced!');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConfirmMapName = (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = nameModalInput.trim();
    if (!clean || clean.toLowerCase() === 'untitled map' || clean.toLowerCase() === 'my custom platformer') {
      setNameModalError('Please enter a valid name for your map!');
      sounds.playSpikeDeath();
      return;
    }
    sounds.playClick();
    const updatedMap = {
      ...map,
      id: map.id || generateMapId(),
      title: clean,
      authorName: avatar.name,
      authorId: getMyCreatorId(),
    };
    setMap(updatedMap);
    saveLocalMap(updatedMap);
    setShowNameModal(false);
    setNameModalError('');

    if (pendingActionAfterName === 'save') {
      sounds.playVictory();
      setPublishNotice(`Map "${clean}" saved! It is now listed in Explore.`);
    } else if (pendingActionAfterName === 'verify') {
      const hasFlag = updatedMap.elements.some((el) => el.type === 'flag');
      if (!hasFlag) {
        setPublishNotice('Your map needs a checkered flag at the end so players can finish it!');
        sounds.playSpikeDeath();
        return;
      }
      onTestPlay(updatedMap, true);
    } else if (pendingActionAfterName === 'publish') {
      handlePublish();
    }
    setPendingActionAfterName(null);
  };

  // Handle Import .cag
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importMapFromCagFile(file);
      setMap(imported);
      setSelectedElemId(null);
      sounds.playVictory();
      setPublishNotice(`Loaded map: "${imported.title}" successfully!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Invalid .cag file');
    }
  };

  const getShareLink = () => {
    const id = publishedId || map.id;
    return `${window.location.origin}${window.location.pathname}#/play/${id}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    sounds.playCoin();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-white select-none">
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/15 backdrop-blur-xl bg-black/60 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              saveLocalMap(map);
              onExit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <div className="h-4 w-px bg-neutral-700"></div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={map.title}
              maxLength={40}
              onChange={(e) => setMap((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Map Name (Required)..."
              className={`font-bold text-sm text-white px-2.5 py-1 rounded border transition focus:outline-none ${
                !map.title.trim() || map.title === 'My Custom Platformer'
                  ? 'border-amber-500/80 bg-amber-950/20 placeholder-amber-400/60'
                  : 'bg-neutral-800/80 border-neutral-700 focus:border-indigo-500'
              }`}
            />
            {map.verified ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium">
                Unverified
              </span>
            )}

            {/* Quick Live Theme Switcher */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-md bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={map.theme || 'Grassland'}
                onChange={(e) => {
                  sounds.playClick();
                  setMap((prev) => ({ ...prev, theme: e.target.value as ThemeType }));
                }}
                title="Change theme live"
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="Grassland" className="bg-neutral-900 text-white">Theme: Grassland</option>
                <option value="Halloween" className="bg-neutral-900 text-white">Theme: Halloween</option>
                <option value="Volcano" className="bg-neutral-900 text-white">Theme: Volcano</option>
                <option value="Cyber" className="bg-neutral-900 text-white">Theme: Cyber</option>
                <option value="Underground" className="bg-neutral-900 text-white">Theme: Underground</option>
              </select>
            </div>
          </div>
        </div>

        {/* Center / Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Test Play (Non-verification preview) */}
          <button
            onClick={() => {
              sounds.playClick();
              onTestPlay({ ...map, authorName: avatar.name }, false);
            }}
            title="Quick Practice Test"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Practice</span>
          </button>

          {/* Verify & Beat Map (Required for publishing) */}
          <button
            onClick={() => {
              const cleanTitle = (map.title || '').trim() || 'My Platformer';
              sounds.playClick();
              onTestPlay({ ...map, title: cleanTitle, authorName: avatar.name || 'White Square' }, true);
            }}
            title="Beat the map to verify and unlock cloud publishing"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition cursor-pointer ${
              map.verified
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black animate-pulse font-extrabold'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{map.verified ? 'Re-Verify Run' : 'Verify (Beat to Publish)'}</span>
          </button>

          {/* Save Map button */}
          <button
            onClick={handleSaveMap}
            title="Save map to local storage so it shows in Explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Map</span>
          </button>

          {/* Download .cag */}
          <button
            onClick={() => {
              sounds.playCoin();
              exportMapToCagFile({ ...map, authorName: avatar.name });
            }}
            title="Download .cag map file to your computer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export .cag</span>
          </button>

          {/* Delete Map */}
          <button
            onClick={() => setShowDeleteMapModal(true)}
            title="Delete this map"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-800 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Load .cag */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import an existing .cag map file"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".cag,.json"
            onChange={handleImportFile}
            className="hidden"
          />

          {/* Publish to Cloud (Firebase) */}
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            title={map.verified ? 'Publish map to community cloud' : 'Beat your map first to verify!'}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-md ${
              map.verified
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 border border-neutral-800 cursor-not-allowed'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'Publishing...' : 'Publish to Cloud'}</span>
          </button>
        </div>
      </header>

      {/* Verification Notice banner if triggered */}
      {publishNotice && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{publishNotice}</span>
          </div>
          <button
            onClick={() => setPublishNotice(null)}
            className="text-amber-400 hover:text-white p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Element Palette & Tools */}
        <div className="w-64 border-r border-white/15 backdrop-blur-xl bg-black/60 flex flex-col shrink-0">
          {/* Tab buttons */}
          <div className="flex border-b border-white/10 backdrop-blur-md bg-white/5">
            <button
              onClick={() => setActiveTab('palette')}
              className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                activeTab === 'palette'
                  ? 'border-indigo-500 text-white bg-white/10'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Palette
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                activeTab === 'properties'
                  ? 'border-indigo-500 text-white bg-neutral-800/50'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Inspector
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-white bg-neutral-800/50'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Tab 1: Palette */}
          {activeTab === 'palette' && (
            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Select Tool to Place:
                </span>
                <button
                  onClick={() => setShowAddonHub(true)}
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition"
                  title="Open Add-on Studio (Create & Install custom blocks)"
                >
                  <Package className="w-3 h-3" />
                  <span>Add-on Studio</span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {combinedPalette.map((item) => {
                  const isSelected = selectedTool === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedTool(item.type);
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition border ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-neutral-800/70 bg-neutral-900/60 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <ElementThumbnail type={item.type} customImg={item.customImg} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-neutral-400 truncate">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Tool Setup Card when Text or Arrow is selected */}
              {(selectedTool === 'text' || selectedTool === 'arrow') && (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {selectedTool === 'text' ? 'Text Setup' : 'Arrow Setup'}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded backdrop-blur-md bg-black/40 border border-white/10">
                      {propRotation}°
                    </span>
                  </div>

                  {selectedTool === 'text' && (
                    <div>
                      <label className="text-[11px] text-neutral-300 block mb-1">Text String</label>
                      <input
                        type="text"
                        value={propText}
                        onChange={(e) => setPropText(e.target.value)}
                        placeholder="Text to place..."
                        maxLength={60}
                        className="w-full backdrop-blur-md bg-black/40 border border-white/20 rounded-lg px-2.5 py-1 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-neutral-300 block mb-1">Color</label>
                    <div className="flex items-center gap-1 flex-wrap">
                      {['#ffffff', '#38bdf8', '#22c55e', '#facc15', '#f97316', '#ef4444', '#ec4899', '#a855f7'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            sounds.playClick();
                            setPropColor(c);
                          }}
                          className={`w-5 h-5 rounded border transition cursor-pointer hover:scale-110 ${
                            propColor.toLowerCase() === c.toLowerCase()
                              ? 'border-white ring-1 ring-cyan-400 scale-105'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                      <label
                        className="relative w-5 h-5 rounded border border-white/30 backdrop-blur-md bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition overflow-hidden"
                        title="Custom Color"
                      >
                        <input
                          type="color"
                          value={propColor}
                          onChange={(e) => setPropColor(e.target.value)}
                          className="absolute -top-4 -left-4 w-12 h-12 cursor-pointer opacity-0"
                        />
                        <div
                          className="w-2.5 h-2.5 rounded-xs border border-white/40"
                          style={{ backgroundColor: propColor }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-300 mb-1">
                      <span>Rotation</span>
                      <span className="text-[10px] text-cyan-300 font-mono">Q / E</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setPropRotation((prev) => (prev - 15 + 360) % 360);
                        }}
                        className="flex items-center justify-center gap-1 py-1 rounded backdrop-blur-md bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white border border-white/15 transition active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-400" />
                        <span>-15° (Q)</span>
                      </button>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setPropRotation((prev) => (prev + 15) % 360);
                        }}
                        className="flex items-center justify-center gap-1 py-1 rounded backdrop-blur-md bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white border border-white/15 transition active:scale-95 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3 text-cyan-400" />
                        <span>+15° (E)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick instructions hint */}
              <div className="mt-auto pt-3 border-t border-neutral-800/60 text-[11px] text-neutral-400 space-y-1">
                <div>• WASD or Arrow Keys to move camera view</div>
                <div>• Click canvas to place selected tool</div>
                <div>• Q / E to rotate Text & Arrow props</div>
                <div>• Click element to inspect & scale</div>
                <div>• Middle-click or Alt+Drag to pan</div>
              </div>
            </div>
          )}

          {/* Tab 2: Properties Inspector */}
          {activeTab === 'properties' && (
            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-4">
              {selectedElement ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ElementThumbnail type={selectedElement.type} customImg={selectedElement.customImg} size={22} />
                      <span>{selectedElement.customName || selectedElement.type}</span>
                    </span>
                    <button
                      onClick={deleteSelected}
                      title="Delete element (Del)"
                      className="p-1 rounded hover:bg-red-500/20 text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Width Slider / Scaler */}
                  <div>
                    <label className="text-xs text-neutral-400 flex items-center justify-between mb-1">
                      <span>Width</span>
                      <span className="font-mono text-white">{selectedElement.width}px</span>
                    </label>
                    <input
                      type="range"
                      min={16}
                      max={800}
                      step={16}
                      value={selectedElement.width}
                      onChange={(e) => updateSelected({ width: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Height Slider / Scaler */}
                  <div>
                    <label className="text-xs text-neutral-400 flex items-center justify-between mb-1">
                      <span>Height</span>
                      <span className="font-mono text-white">{selectedElement.height}px</span>
                    </label>
                    <input
                      type="range"
                      min={16}
                      max={600}
                      step={16}
                      value={selectedElement.height}
                      onChange={(e) => updateSelected({ height: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Spike Orientation Toggle */}
                  {selectedElement.type === 'spike' && (
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1.5">Spike Point Direction</label>
                      <button
                        onClick={rotateSpike}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition border border-neutral-700"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Direction: {selectedElement.spikeDir?.toUpperCase() || 'UP'}</span>
                      </button>
                    </div>
                  )}

                  {/* Text Prop Content */}
                  {selectedElement.type === 'text' && (
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
                      <label className="text-xs text-neutral-300 font-semibold block">Text Content</label>
                      <input
                        type="text"
                        value={selectedElement.text !== undefined ? selectedElement.text : ''}
                        onChange={(e) => updateSelected({ text: e.target.value })}
                        placeholder="Type text message..."
                        maxLength={60}
                        className="w-full backdrop-blur-md bg-black/40 border border-white/20 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition"
                      />

                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span>Font Size</span>
                        <span className="font-mono text-white">{selectedElement.fontSize || 22}px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={64}
                        step={2}
                        value={selectedElement.fontSize || 22}
                        onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Color Customization (Text & Arrow) */}
                  {(selectedElement.type === 'text' || selectedElement.type === 'arrow') && (
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-300 font-semibold">Color</span>
                        <span className="text-[10px] font-mono text-cyan-300 uppercase">{selectedElement.color || '#38bdf8'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['#ffffff', '#38bdf8', '#22c55e', '#facc15', '#f97316', '#ef4444', '#ec4899', '#a855f7'].map((col) => (
                          <button
                            key={col}
                            onClick={() => {
                              sounds.playClick();
                              updateSelected({ color: col });
                              setPropColor(col);
                            }}
                            className={`w-6 h-6 rounded-md border transition cursor-pointer hover:scale-110 ${
                              (selectedElement.color || '#38bdf8').toLowerCase() === col.toLowerCase()
                                ? 'border-white ring-2 ring-cyan-400 ring-offset-1 ring-offset-black scale-105'
                                : 'border-white/20'
                            }`}
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                        ))}
                        <label
                          className="relative w-6 h-6 rounded-md border border-white/30 backdrop-blur-md bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition overflow-hidden"
                          title="Custom Color"
                        >
                          <input
                            type="color"
                            value={selectedElement.color || '#38bdf8'}
                            onChange={(e) => {
                              updateSelected({ color: e.target.value });
                              setPropColor(e.target.value);
                            }}
                            className="absolute -top-4 -left-4 w-14 h-14 cursor-pointer opacity-0"
                          />
                          <div
                            className="w-3.5 h-3.5 rounded-sm border border-white/40"
                            style={{ backgroundColor: selectedElement.color || '#38bdf8' }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Rotation Controls: STRICTLY for Text and Arrow ONLY */}
                  {(selectedElement.type === 'text' || selectedElement.type === 'arrow') && (
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-300 font-semibold">Rotation</span>
                        <span className="text-xs font-mono font-bold text-cyan-400 backdrop-blur-md bg-black/40 px-2 py-0.5 rounded border border-white/10">
                          {selectedElement.rotation || 0}°
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            const cur = selectedElement.rotation || 0;
                            updateSelected({ rotation: (cur - 15 + 360) % 360 });
                          }}
                          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg backdrop-blur-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 transition active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                          <span>-15° (Q)</span>
                        </button>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            const cur = selectedElement.rotation || 0;
                            updateSelected({ rotation: (cur + 15) % 360 });
                          }}
                          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg backdrop-blur-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 transition active:scale-95 cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                          <span>+15° (E)</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1">
                        {[0, 90, 180, 270].map((deg) => (
                          <button
                            key={deg}
                            onClick={() => {
                              sounds.playClick();
                              updateSelected({ rotation: deg });
                            }}
                            className={`py-1 rounded text-[11px] font-mono font-semibold transition border ${
                              (selectedElement.rotation || 0) === deg
                                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                                : 'border-white/10 bg-black/30 hover:bg-white/10 text-neutral-300'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={345}
                        step={15}
                        value={selectedElement.rotation || 0}
                        onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />

                      <div className="text-[10px] text-cyan-300/80 backdrop-blur-md bg-cyan-950/30 border border-cyan-800/40 rounded px-2 py-1 text-center">
                        Keyboard: Press Q or E to rotate
                      </div>
                    </div>
                  )}

                  {/* Pass-through Notice */}
                  {(selectedElement.type === 'text' || selectedElement.type === 'arrow') && (
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-neutral-300 flex items-center justify-between">
                      <span className="font-semibold text-white">Collision:</span>
                      <span className="text-emerald-400 font-bold">Pass-through</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-neutral-800">
                    <button
                      onClick={duplicateSelected}
                      className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={deleteSelected}
                      className="flex-1 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-xs font-semibold text-red-300 border border-red-900/40 transition"
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  Click an element on the canvas to inspect and scale it.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Level Settings */}
          {activeTab === 'settings' && (
            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1 flex items-center justify-between">
                  <span>Map Title <strong className="text-amber-400">*</strong></span>
                  {!map.title.trim() && <span className="text-[10px] text-amber-400 font-bold">Required</span>}
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={map.title}
                  onChange={(e) => setMap((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your map a unique name..."
                  className={`w-full bg-neutral-900 border rounded px-2.5 py-1.5 text-white focus:outline-none ${
                    !map.title.trim()
                      ? 'border-amber-500/80 focus:border-amber-500'
                      : 'border-neutral-700 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={map.description}
                  onChange={(e) => setMap((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional challenge description..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1 flex items-center justify-between">
                  <span>Author Name</span>
                  <span className="text-[10px] text-indigo-400 font-medium">Uses your avatar name</span>
                </label>
                <div className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-2 text-white font-bold text-xs flex items-center justify-between">
                  <span>{avatar.name || 'Anonymous Square'}</span>
                  <span className="text-[10px] text-neutral-500">Locked to Avatar</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Visual Theme</label>
                <select
                  value={map.theme}
                  onChange={(e) => setMap((prev) => ({ ...prev, theme: e.target.value as ThemeType }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Grassland">Grassland (Sunny Sky & Lush Hills)</option>
                  <option value="Volcano">Volcano (Burning Magma & Smoke)</option>
                  <option value="Cyber">Cyber (Synthwave Neon Night)</option>
                  <option value="Underground">Underground (Cavern Rocks)</option>
                  <option value="Halloween">Halloween (Spooky Midnight & Harvest Moon)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Difficulty Rating</label>
                <select
                  value={map.difficulty}
                  onChange={(e) => setMap((prev) => ({ ...prev, difficulty: e.target.value as DifficultyType }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Normal">Normal</option>
                  <option value="Hard">Hard</option>
                  <option value="Insane">Insane</option>
                </select>
              </div>

              {/* Elements summary */}
              <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                <span>Total Placed Elements:</span>
                <span className="font-mono text-white font-bold">{map.elements.length}</span>
              </div>

              {/* Delete map button */}
              <div className="pt-3 border-t border-neutral-800">
                <button
                  onClick={() => setShowDeleteMapModal(true)}
                  className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete This Map</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center: Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-neutral-950">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            style={{ cursor: canvasCursor }}
            className="w-full h-full block touch-none"
          />

          {/* Floating Canvas Controls (Grid Snap, Zoom) */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 shadow-xl">
            <button
              onClick={() => setGridSnap(!gridSnap)}
              title="Toggle Grid Snapping"
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                gridSnap ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Snap 16px</span>
            </button>

            <div className="h-4 w-px bg-neutral-700"></div>

            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="px-2 py-1 hover:bg-neutral-800 text-white font-mono text-sm rounded"
            >
              -
            </button>
            <span className="text-xs font-mono text-neutral-300 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="px-2 py-1 hover:bg-neutral-800 text-white font-mono text-sm rounded"
            >
              +
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 60, y: 40 });
              }}
              className="text-[10px] text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded"
            >
              Reset View
            </button>
          </div>
        </div>
      </div>

      {/* Published to Cloud Success Modal */}
      {publishedId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="backdrop-blur-2xl bg-black/75 border border-white/20 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">Map Published to Cloud</h3>
            <p className="text-xs text-neutral-300 mb-5">
              Your map is live in the community explore list and accessible worldwide via its special ID.
            </p>

            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-3.5 w-full mb-5 flex flex-col gap-2">
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Special Map ID
              </div>
              <div className="text-2xl font-mono font-extrabold text-indigo-400 tracking-widest">
                {publishedId}
              </div>
            </div>

            <div className="w-full flex items-center gap-2 mb-6">
              <input
                type="text"
                readOnly
                value={getShareLink()}
                className="backdrop-blur-md bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-neutral-300 flex-1 truncate select-all"
              />
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1.5 px-3.5 py-2 backdrop-blur-md bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            <button
              onClick={() => setPublishedId(null)}
              className="w-full py-2.5 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm transition cursor-pointer"
            >
              Continue Editing
            </button>
          </div>
        </div>
      )}

      {/* Delete Map Confirmation Modal */}
      {showDeleteMapModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="backdrop-blur-2xl bg-black/75 border border-white/20 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Delete This Map</h3>
            <p className="text-xs text-neutral-300 mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{map.title || 'this map'}"</strong>? This will permanently erase it from your storage and the cloud.
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowDeleteMapModal(false)}
                className="flex-1 py-2.5 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/15 border border-white/10 text-neutral-300 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteMap}
                className="flex-1 py-2.5 rounded-xl backdrop-blur-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Delete Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add-on Studio Modal */}
      {showAddonHub && (
        <AddonHubModal
          onClose={() => {
            setShowAddonHub(false);
            setAddonElements(getAllActiveAddonElements());
          }}
          creatorName={avatar.name}
          onAddonUpdated={() => {
            setAddonElements(getAllActiveAddonElements());
          }}
        />
      )}
    </div>
  );
};
