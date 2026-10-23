import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  ArrowLeft,
  Check,
  Trash2,
  Palette,
  Box,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import {
  PublishedAddon,
  CustomAddonElement,
  CustomAddonHat,
  CustomAddonColor,
  AvatarConfig,
} from '../types';
import {
  fetchCommunityAddons,
  publishCommunityAddon,
  getInstalledAddons,
  installAddon,
  uninstallAddon,
  isAddonInstalled,
  isAddonEnabled,
  toggleAddonEnabled,
} from '../services/addonService';
import { ElementThumbnail } from './ElementThumbnail';
import { sounds } from '../services/sound';
import { incrementProfileStat } from '../services/profileService';

interface AddonViewProps {
  avatar: AvatarConfig;
  initialStudioMode?: boolean;
  onBack: () => void;
  onNavigateToStudio?: () => void;
  onNavigateToBrowse?: () => void;
}

export const AddonView: React.FC<AddonViewProps> = ({
  avatar,
  initialStudioMode = false,
  onBack,
  onNavigateToStudio,
  onNavigateToBrowse,
}) => {
  const [isStudioMode, setIsStudioMode] = useState(initialStudioMode);
  const [activeTab, setActiveTab] = useState<'browse' | 'installed'>(
    initialStudioMode ? 'browse' : 'browse'
  );

  useEffect(() => {
    setIsStudioMode(initialStudioMode);
  }, [initialStudioMode]);

  // Community and installed add-ons
  const [communityAddons, setCommunityAddons] = useState<PublishedAddon[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [installedList, setInstalledList] = useState<PublishedAddon[]>([]);

  // Studio Creator Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState(avatar.name || 'Creator');

  // Custom blocks being built
  const [elements, setElements] = useState<CustomAddonElement[]>([]);
  const [elemName, setElemName] = useState('');
  const [elemDesc, setElemDesc] = useState('');
  const [elemBehavior, setElemBehavior] = useState<
    'solid' | 'hazard' | 'spring' | 'decor' | 'coin'
  >('solid');
  const [elemImg, setElemImg] = useState<string>('');
  const [elemImgScale, setElemImgScale] = useState(1);

  // Custom hats being built
  const [hats, setHats] = useState<CustomAddonHat[]>([]);
  const [hatName, setHatName] = useState('');
  const [hatImg, setHatImg] = useState<string>('');

  // Custom colors being built
  const [colors, setColors] = useState<CustomAddonColor[]>([]);
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#38bdf8');

  // Publishing status
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputElemRef = useRef<HTMLInputElement | null>(null);
  const fileInputHatRef = useRef<HTMLInputElement | null>(null);

  const reloadData = () => {
    setInstalledList(getInstalledAddons());
    setLoadingCommunity(true);
    fetchCommunityAddons()
      .then((list) => {
        setCommunityAddons(list);
      })
      .finally(() => setLoadingCommunity(false));
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleToggleInstall = (addon: PublishedAddon) => {
    sounds.playClick();
    if (isAddonInstalled(addon.id)) {
      uninstallAddon(addon.id);
    } else {
      installAddon(addon);
    }
    reloadData();
  };

  const handleToggleActive = (addonId: string) => {
    sounds.playClick();
    toggleAddonEnabled(addonId);
    reloadData();
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'elem' | 'hat'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      setErrorMessage('Image size must be under 800KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'elem') {
        setElemImg(result);
      } else {
        setHatImg(result);
      }
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAddElement = () => {
    if (!elemName.trim()) {
      setErrorMessage('Please enter a name for the block.');
      return;
    }

    sounds.playPlace();
    const finalImage =
      elemImg || generateDefaultIcon(elemBehavior, elemName.trim());

    const newElement: CustomAddonElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: elemName.trim(),
      desc: elemDesc.trim() || undefined,
      imageDataUrl: finalImage,
      behavior: elemBehavior,
      defaultW: 40,
      defaultH: 40,
    };

    setElements([...elements, newElement]);
    setElemName('');
    setElemDesc('');
    setElemImg('');
    setErrorMessage(null);
  };

  const handleRemoveElement = (id: string) => {
    sounds.playErase();
    setElements(elements.filter((e) => e.id !== id));
  };

  const handleAddHat = () => {
    if (!hatName.trim()) {
      setErrorMessage('Please enter a name for the hat.');
      return;
    }

    sounds.playPlace();
    const finalImage = hatImg || generateDefaultHatIcon(hatName.trim());

    const newHat: CustomAddonHat = {
      id: `hat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: hatName.trim(),
      imageDataUrl: finalImage,
    };

    setHats([...hats, newHat]);
    setHatName('');
    setHatImg('');
    setErrorMessage(null);
  };

  const handleRemoveHat = (id: string) => {
    sounds.playErase();
    setHats(hats.filter((h) => h.id !== id));
  };

  const handleAddColor = () => {
    if (!colorName.trim()) {
      setErrorMessage('Please enter a color name.');
      return;
    }

    sounds.playPlace();
    const newColor: CustomAddonColor = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: colorName.trim(),
      hex: colorHex,
    };

    setColors([...colors, newColor]);
    setColorName('');
    setErrorMessage(null);
  };

  const handleRemoveColor = (id: string) => {
    sounds.playErase();
    setColors(colors.filter((c) => c.id !== id));
  };

  const handlePublishAddon = async () => {
    if (!title.trim()) {
      setErrorMessage('Please give your add-on package a title.');
      return;
    }

    if (elements.length === 0 && hats.length === 0 && colors.length === 0) {
      setErrorMessage(
        'Please add at least 1 custom block, hat, or color before publishing.'
      );
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setStatusMessage('Compiling and publishing add-on to community...');
    sounds.playClick();

    const addonPayload: PublishedAddon = {
      id: `addon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      authorName: authorName.trim() || 'Anonymous',
      authorId: 'player',
      elements,
      hats,
      colors,
      installCount: 1,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await publishCommunityAddon(addonPayload);
      setIsPublishing(false);
      sounds.playVictory();
      setStatusMessage('Add-on published successfully! Installed and ready to use.');
      installAddon(addonPayload);
      incrementProfileStat('addonsCreated');

      setTimeout(() => {
        setTitle('');
        setDescription('');
        setElements([]);
        setHats([]);
        setColors([]);
        setStatusMessage(null);
        if (onNavigateToBrowse) {
          onNavigateToBrowse();
        } else {
          setIsStudioMode(false);
          setActiveTab('browse');
        }
        reloadData();
      }, 1500);
    } catch (err) {
      setIsPublishing(false);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to publish add-on.');
      setStatusMessage(null);
    }
  };

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto bg-neutral-950 text-white flex flex-col pb-24">
      {/* Top Sticky Header */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              if (isStudioMode) {
                if (onNavigateToBrowse) onNavigateToBrowse();
                else setIsStudioMode(false);
              } else {
                onBack();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isStudioMode ? 'Back to Add-ons' : 'Home'}</span>
          </button>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-bold tracking-tight">
              {isStudioMode ? 'Add-on Studio' : 'Community Add-ons'}
            </h1>
          </div>
        </div>

        {/* Action Toggle (Browse / Installed / Studio) */}
        <div className="flex items-center gap-2">
          {!isStudioMode ? (
            <>
              <div className="flex items-center gap-1 p-1 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('browse');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'browse'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Browse Packs
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('installed');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'installed'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Installed ({installedList.length})
                </button>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  if (onNavigateToStudio) onNavigateToStudio();
                  else setIsStudioMode(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl backdrop-blur-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open Add-on Studio</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                if (onNavigateToBrowse) onNavigateToBrowse();
                else setIsStudioMode(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              <span>View All Add-ons</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-6 pt-6 flex-1">
        {/* Studio Mode: Full Screen Creation Workbench */}
        {isStudioMode ? (
          <div className="space-y-6">
            {/* Studio Welcome Banner */}
            <div className="p-6 rounded-3xl backdrop-blur-2xl bg-neutral-900/80 border border-white/20 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>Create Custom Add-on Package</span>
                </h2>
                <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                  Build custom terrain blocks, deadly hazards, bouncy springs,
                  custom wearable hats, and avatar color palettes. Once
                  published, anyone can play maps using your custom blocks.
                </p>
              </div>
              <button
                onClick={handlePublishAddon}
                disabled={isPublishing}
                className="px-6 py-3 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition transform active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Add-on</span>
                  </>
                )}
              </button>
            </div>

            {/* Error or Success Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-bold">
                {errorMessage}
              </div>
            )}
            {statusMessage && (
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-bold">
                {statusMessage}
              </div>
            )}

            {/* Grid Workbench: Left Columns Form, Right Column Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Creation Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Add-on Package Details Card */}
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-neutral-900/70 border border-white/15 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Sliders className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      1. Package Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Add-on Title *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Neon City Pack"
                        className="w-full px-4 py-2.5 rounded-xl backdrop-blur-xl bg-black/40 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-purple-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Creator Name
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Your display name"
                        className="w-full px-4 py-2.5 rounded-xl backdrop-blur-xl bg-black/40 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-purple-400 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell creators what blocks and hats are included..."
                      className="w-full px-4 py-2.5 rounded-xl backdrop-blur-xl bg-black/40 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-purple-400 transition resize-none"
                    />
                  </div>
                </div>

                {/* 2. Custom Level Blocks Builder */}
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-neutral-900/70 border border-white/15 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Box className="w-4 h-4" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        2. Custom Map Blocks ({elements.length})
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">
                          Block Name
                        </label>
                        <input
                          type="text"
                          value={elemName}
                          onChange={(e) => setElemName(e.target.value)}
                          placeholder="e.g. Neon Brick"
                          className="w-full px-3 py-2 rounded-xl backdrop-blur-xl bg-black/40 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-1">
                          Block Behavior
                        </label>
                        <select
                          value={elemBehavior}
                          onChange={(e) =>
                            setElemBehavior(e.target.value as any)
                          }
                          className="w-full px-3 py-2 rounded-xl backdrop-blur-xl bg-neutral-900 border border-white/15 text-white text-xs focus:outline-none focus:border-indigo-400"
                        >
                          <option value="solid">Solid Terrain (Walkable)</option>
                          <option value="hazard">Deadly Hazard (Spike/Trap)</option>
                          <option value="spring">Bouncy Spring (High Jump)</option>
                          <option value="coin">Collectible Item (Coin)</option>
                          <option value="decor">Pass-through Decor</option>
                        </select>
                      </div>
                    </div>

                    {/* Image Upload or Generated Visual */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Block Texture / Icon (Optional Upload or Auto-Generated)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputElemRef}
                          onChange={(e) => handleImageUpload(e, 'elem')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputElemRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl backdrop-blur-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{elemImg ? 'Replace Image' : 'Upload PNG/SVG'}</span>
                        </button>
                        {elemImg && (
                          <div className="flex items-center gap-2">
                            <img
                              src={elemImg}
                              alt="preview"
                              className="w-8 h-8 rounded-lg object-contain bg-black/50 border border-white/20 p-0.5"
                            />
                            <button
                              type="button"
                              onClick={() => setElemImg('')}
                              className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddElement}
                      className="w-full py-2 rounded-xl backdrop-blur-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Block to Package</span>
                    </button>
                  </div>

                  {/* List of elements added so far */}
                  {elements.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                      {elements.map((el) => (
                        <div
                          key={el.id}
                          className="p-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <ElementThumbnail
                              type={el.behavior}
                              customImg={el.imageDataUrl}
                              size={32}
                            />
                            <div>
                              <div className="text-xs font-bold text-white truncate max-w-[90px]">
                                {el.name}
                              </div>
                              <div className="text-[10px] text-neutral-400 capitalize">
                                {el.behavior}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveElement(el.id)}
                            className="p-1 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Custom Hats & Accessories */}
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-neutral-900/70 border border-white/15 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      3. Custom Avatar Hats ({hats.length})
                    </h3>
                  </div>

                  <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Hat Name
                      </label>
                      <input
                        type="text"
                        value={hatName}
                        onChange={(e) => setHatName(e.target.value)}
                        placeholder="e.g. Wizard Hat"
                        className="w-full px-3 py-2 rounded-xl backdrop-blur-xl bg-black/40 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Hat Image (PNG / SVG with transparency)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputHatRef}
                          onChange={(e) => handleImageUpload(e, 'hat')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputHatRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl backdrop-blur-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>{hatImg ? 'Replace Hat Image' : 'Upload Hat Image'}</span>
                        </button>
                        {hatImg && (
                          <div className="flex items-center gap-2">
                            <img
                              src={hatImg}
                              alt="preview"
                              className="w-8 h-8 rounded-lg object-contain bg-black/50 border border-white/20 p-0.5"
                            />
                            <button
                              type="button"
                              onClick={() => setHatImg('')}
                              className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddHat}
                      className="w-full py-2 rounded-xl backdrop-blur-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Hat to Package</span>
                    </button>
                  </div>

                  {hats.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                      {hats.map((h) => (
                        <div
                          key={h.id}
                          className="p-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={h.imageDataUrl}
                              alt={h.name}
                              className="w-7 h-7 object-contain rounded bg-white/5"
                            />
                            <span className="text-xs font-bold text-white truncate max-w-[90px]">
                              {h.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveHat(h.id)}
                            className="p-1 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Custom Avatar Colors */}
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-neutral-900/70 border border-white/15 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Palette className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      4. Custom Colors ({colors.length})
                    </h3>
                  </div>

                  <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10 flex items-center gap-3">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="Color Name (e.g. Midnight Blue)"
                      className="flex-1 px-3 py-2 rounded-xl backdrop-blur-xl bg-black/40 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="px-4 py-2 rounded-xl backdrop-blur-xl bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Add Color
                    </button>
                  </div>

                  {colors.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                      {colors.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-md border border-white/20"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-xs font-bold text-white truncate max-w-[90px]">
                              {c.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveColor(c.id)}
                            className="p-1 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Package Summary & Actions */}
              <div className="space-y-6">
                <div className="p-6 rounded-3xl backdrop-blur-2xl bg-neutral-900/80 border border-white/20 shadow-2xl sticky top-24 space-y-4">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Package className="w-4 h-4" />
                    <h3 className="text-sm font-black text-white">Package Manifest</h3>
                  </div>

                  <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 space-y-2">
                    <div className="text-sm font-black text-white">
                      {title.trim() || 'Untitled Package'}
                    </div>
                    <div className="text-xs text-neutral-400">
                      By {authorName.trim() || 'Anonymous'}
                    </div>
                    <div className="text-xs text-neutral-300 pt-1 border-t border-white/10">
                      {description.trim() || 'No description provided.'}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                      <span className="text-neutral-400">Custom Blocks</span>
                      <span className="font-bold text-white">{elements.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                      <span className="text-neutral-400">Custom Hats</span>
                      <span className="font-bold text-white">{hats.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                      <span className="text-neutral-400">Custom Colors</span>
                      <span className="font-bold text-white">{colors.length}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePublishAddon}
                    disabled={isPublishing}
                    className="w-full py-3 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing to Cloud...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Publish & Install Package</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Browse / Installed Tabs View */
          <div>
            {activeTab === 'browse' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">Community Add-ons</h2>
                    <p className="text-xs text-neutral-400">
                      Discover custom block packs, cosmetic items, and seasonal themes
                    </p>
                  </div>
                </div>

                {loadingCommunity ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    <span>Loading add-ons...</span>
                  </div>
                ) : communityAddons.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400 text-xs rounded-3xl backdrop-blur-2xl bg-neutral-900/60 border border-white/15 p-8">
                    No community add-ons published yet. Be the first to publish one using Add-on Studio!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {communityAddons.map((addon) => {
                      const installed = isAddonInstalled(addon.id);
                      return (
                        <div
                          key={addon.id}
                          className="p-5 rounded-3xl backdrop-blur-2xl bg-neutral-900/70 border border-white/15 hover:border-purple-500/40 shadow-xl transition flex flex-col justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-base font-black text-white flex items-center gap-2">
                                  <span>{addon.title}</span>
                                  {addon.id === 'builtin_halloween' && (
                                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold">
                                      Official
                                    </span>
                                  )}
                                </h3>
                                <div className="text-xs text-neutral-400 mt-0.5">
                                  By {addon.authorName}
                                </div>
                              </div>

                              <button
                                onClick={() => handleToggleInstall(addon)}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer backdrop-blur-xl border ${
                                  installed
                                    ? 'bg-neutral-800/80 hover:bg-red-500/20 text-neutral-300 hover:text-red-300 border-white/10 hover:border-red-500/30'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/50 shadow-md'
                                }`}
                              >
                                {installed ? 'Installed' : 'Install'}
                              </button>
                            </div>

                            <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed">
                              {addon.description || 'Custom expansion pack for Createagame.'}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
                            <div>
                              {addon.elements?.length || 0} blocks · {addon.hats?.length || 0} hats · {addon.colors?.length || 0} colors
                            </div>
                            <div className="font-mono">{addon.installCount || 0} installs</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'installed' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-white">Installed Add-ons</h2>
                  <p className="text-xs text-neutral-400">
                    Enable or disable content in your level editor and wardrobe
                  </p>
                </div>

                {installedList.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400 text-xs rounded-3xl backdrop-blur-2xl bg-neutral-900/60 border border-white/15 p-8">
                    No add-ons installed. Browse community packs to install additions!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {installedList.map((addon) => {
                      const enabled = isAddonEnabled(addon.id);
                      return (
                        <div
                          key={addon.id}
                          className="p-5 rounded-3xl backdrop-blur-2xl bg-neutral-900/70 border border-white/15 flex items-center justify-between shadow-xl"
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`p-3 rounded-2xl border ${
                                enabled
                                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                                  : 'bg-neutral-800/40 border-neutral-700/50 text-neutral-500'
                              }`}
                            >
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-white flex items-center gap-2">
                                <span>{addon.title}</span>
                                <span className="text-xs text-neutral-400 font-normal">
                                  By {addon.authorName}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-400 mt-0.5">
                                {addon.elements?.length || 0} blocks · {addon.hats?.length || 0} hats · {addon.colors?.length || 0} colors
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(addon.id)}
                              className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer backdrop-blur-xl border ${
                                enabled
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                                  : 'bg-neutral-800/60 hover:bg-neutral-700/60 text-neutral-400 border-white/10'
                              }`}
                            >
                              {enabled ? 'Active' : 'Disabled'}
                            </button>

                            {addon.id !== 'builtin_halloween' && (
                              <button
                                onClick={() => handleToggleInstall(addon)}
                                title="Uninstall Add-on"
                                className="p-2.5 rounded-xl backdrop-blur-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

function generateDefaultIcon(behavior: string, name: string): string {
  const color =
    behavior === 'hazard'
      ? '#ef4444'
      : behavior === 'spring'
      ? '#ec4899'
      : behavior === 'coin'
      ? '#eab308'
      : behavior === 'decor'
      ? '#a855f7'
      : '#10b981';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect x="4" y="4" width="56" height="56" rx="8" fill="${color}" stroke="#ffffff" stroke-width="3" stroke-opacity="0.3"/>
    <text x="32" y="38" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${name.slice(0, 2).toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function generateDefaultHatIcon(name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 36" width="64" height="36">
    <polygon points="12,32 52,32 32,4" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
    <circle cx="32" cy="4" r="3" fill="#ef4444"/>
    <text x="32" y="26" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1f2937" text-anchor="middle">${name.slice(0, 3).toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
