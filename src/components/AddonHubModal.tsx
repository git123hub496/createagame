import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  X,
  Check,
  Download,
  Trash2,
  Sliders,
  Palette,
  Crown,
  Box,
  Share2,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  PublishedAddon,
  CustomAddonElement,
  CustomAddonHat,
  CustomAddonColor,
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

interface AddonHubModalProps {
  onClose: () => void;
  creatorName?: string;
  creatorId?: string;
  onAddonUpdated?: () => void;
}

export const AddonHubModal: React.FC<AddonHubModalProps> = ({
  onClose,
  creatorName = 'Creator',
  creatorId = 'player',
  onAddonUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'installed'>('browse');

  // Community add-ons
  const [communityAddons, setCommunityAddons] = useState<PublishedAddon[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [installedList, setInstalledList] = useState<PublishedAddon[]>([]);

  // Addon Creator State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState(creatorName);

  // New element being built
  const [elements, setElements] = useState<CustomAddonElement[]>([]);
  const [elemName, setElemName] = useState('');
  const [elemDesc, setElemDesc] = useState('');
  const [elemBehavior, setElemBehavior] = useState<'solid' | 'hazard' | 'spring' | 'decor' | 'coin'>('solid');
  const [elemImg, setElemImg] = useState<string>('');
  const [elemImgScale, setElemImgScale] = useState(1);

  // New hat being built
  const [hats, setHats] = useState<CustomAddonHat[]>([]);
  const [hatName, setHatName] = useState('');
  const [hatImg, setHatImg] = useState<string>('');

  // New colors being built
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

  // Handle image upload for block element (transparent background)
  const handleElemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setElemImg(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload for hat (transparent background)
  const handleHatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setHatImg(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add element to draft
  const handleAddElement = () => {
    if (!elemName.trim()) {
      setErrorMessage('Please enter an element name.');
      return;
    }
    // If no custom image was uploaded, generate a clean centered icon
    let finalImg = elemImg;
    if (!finalImg) {
      finalImg = generateDefaultIcon(elemBehavior, elemName);
    }

    const newElem: CustomAddonElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: elemName.trim(),
      desc: elemDesc.trim() || `${elemBehavior} add-on element`,
      imageDataUrl: finalImg,
      behavior: elemBehavior,
      defaultW: 32,
      defaultH: 32,
    };

    setElements([...elements, newElem]);
    setElemName('');
    setElemDesc('');
    setElemImg('');
    setErrorMessage(null);
    sounds.playClick();
  };

  // Add hat to draft
  const handleAddHat = () => {
    if (!hatName.trim()) {
      setErrorMessage('Please enter a hat name.');
      return;
    }
    let finalHatImg = hatImg;
    if (!finalHatImg) {
      finalHatImg = generateDefaultHatIcon(hatName);
    }

    const newHat: CustomAddonHat = {
      id: `hat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: hatName.trim(),
      imageDataUrl: finalHatImg,
    };

    setHats([...hats, newHat]);
    setHatName('');
    setHatImg('');
    setErrorMessage(null);
    sounds.playClick();
  };

  // Add color to draft
  const handleAddColor = () => {
    if (!colorName.trim()) {
      setErrorMessage('Please enter a color name.');
      return;
    }
    const newColor: CustomAddonColor = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: colorName.trim(),
      hex: colorHex,
    };

    setColors([...colors, newColor]);
    setColorName('');
    setErrorMessage(null);
    sounds.playClick();
  };

  // Publish Add-on to Community
  const handlePublish = async () => {
    if (!title.trim()) {
      setErrorMessage('Please provide a title for your add-on.');
      return;
    }
    if (elements.length === 0 && hats.length === 0 && colors.length === 0) {
      setErrorMessage('Add at least one block, hat, or color to publish your add-on.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      sounds.playClick();
      const published = await publishCommunityAddon({
        title: title.trim(),
        description: description.trim(),
        authorName: authorName.trim() || 'Creator',
        authorId: creatorId,
        elements,
        hats,
        colors,
      });

      incrementProfileStat('addonsCreated');
      setStatusMessage(`Add-on "${published.title}" published! Anyone can now get it.`);
      sounds.playVictory();

      // Reset fields
      setTitle('');
      setDescription('');
      setElements([]);
      setHats([]);
      setColors([]);

      reloadData();
      onAddonUpdated?.();

      setTimeout(() => {
        setActiveTab('browse');
        setStatusMessage(null);
      }, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to publish add-on.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Toggle install / uninstall of an add-on
  const handleToggleInstall = (addon: PublishedAddon) => {
    sounds.playClick();
    if (isAddonInstalled(addon.id)) {
      uninstallAddon(addon.id);
    } else {
      installAddon(addon);
    }
    reloadData();
    onAddonUpdated?.();
  };

  const handleToggleActive = (addonId: string) => {
    sounds.playClick();
    toggleAddonEnabled(addonId);
    reloadData();
    onAddonUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl backdrop-blur-2xl bg-neutral-900/90 border border-white/20 shadow-2xl overflow-hidden flex flex-col text-white max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white">Add-on Studio</h2>
              <p className="text-[11px] text-neutral-400">Create, publish, and install community add-ons</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-white/10 bg-black/20 px-6 shrink-0 gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('browse');
            }}
            className={`py-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'browse'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Community Add-ons</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
              {communityAddons.length}
            </span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('create');
            }}
            className={`py-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Create Add-on</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('installed');
            }}
            className={`py-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'installed'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Installed ({installedList.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BROWSE COMMUNITY ADD-ONS */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Community Add-ons</h3>
                  <p className="text-xs text-neutral-400">Discover and install user-created packs with blocks, hats, and colors</p>
                </div>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('create');
                  }}
                  className="px-3 py-1.5 rounded-xl backdrop-blur-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Addon</span>
                </button>
              </div>

              {loadingCommunity ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  <span className="text-xs">Loading community add-ons...</span>
                </div>
              ) : communityAddons.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  No community add-ons found yet. Be the first to create one!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {communityAddons.map((addon) => {
                    const installed = isAddonInstalled(addon.id);
                    const enabled = isAddonEnabled(addon.id);
                    return (
                      <div
                        key={addon.id}
                        className="rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 p-4.5 flex flex-col justify-between hover:border-white/20 transition shadow-lg space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-black text-white">{addon.title}</h4>
                              <div className="text-[10px] text-neutral-400 mt-0.5">
                                By {addon.authorName} · {addon.installCount} installs
                              </div>
                            </div>
                            {installed && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                {enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-neutral-300 mt-2 line-clamp-2 leading-relaxed">
                            {addon.description || 'Custom add-on elements and accessories.'}
                          </p>

                          {/* Preview tags of included items */}
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            {addon.elements?.length > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-300 flex items-center gap-1">
                                <Box className="w-3 h-3 text-emerald-400" />
                                <span>{addon.elements.length} Blocks</span>
                              </span>
                            )}
                            {addon.hats?.length > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-300 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-400" />
                                <span>{addon.hats.length} Hats</span>
                              </span>
                            )}
                            {addon.colors?.length > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-300 flex items-center gap-1">
                                <Palette className="w-3 h-3 text-purple-400" />
                                <span>{addon.colors.length} Colors</span>
                              </span>
                            )}
                          </div>

                          {/* Element visual thumbnails preview */}
                          {addon.elements?.length > 0 && (
                            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto py-1">
                              {addon.elements.slice(0, 5).map((el) => (
                                <div key={el.id} title={el.name} className="shrink-0">
                                  <ElementThumbnail type={el.behavior} customImg={el.imageDataUrl} size={28} />
                                </div>
                              ))}
                              {addon.elements.length > 5 && (
                                <span className="text-[10px] text-neutral-400 font-bold shrink-0">
                                  +{addon.elements.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          <button
                            onClick={() => handleToggleInstall(addon)}
                            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer backdrop-blur-xl ${
                              installed
                                ? 'bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                            }`}
                          >
                            {installed ? (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Uninstall</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Get Addon</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE ADD-ON */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-white">Add-on Creator</h3>
                <p className="text-xs text-neutral-400">
                  Design custom blocks with transparent background images centered on a square, plus hats and character colors
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
                  {errorMessage}
                </div>
              )}

              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* General Pack Details */}
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 space-y-3">
                <div className="text-xs font-black text-neutral-300 uppercase tracking-wider">
                  Pack Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold block mb-1">Add-on Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Candy Land Pack"
                      className="w-full px-3 py-2 rounded-xl backdrop-blur-xl bg-black/50 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold block mb-1">Creator Name</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Your Nickname"
                      className="w-full px-3 py-2 rounded-xl backdrop-blur-xl bg-black/50 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 font-bold block mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of included blocks, hats, and themes..."
                    className="w-full px-3 py-2 rounded-xl backdrop-blur-xl bg-black/50 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Section 1: Custom Blocks / Elements */}
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Custom Blocks & Elements ({elements.length})
                    </span>
                  </div>
                </div>

                {/* Element Creator Fields */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold block mb-1">Block Name</label>
                      <input
                        type="text"
                        value={elemName}
                        onChange={(e) => setElemName(e.target.value)}
                        placeholder="e.g. Candy Cane"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold block mb-1">Behavior / Physics</label>
                      <select
                        value={elemBehavior}
                        onChange={(e) => setElemBehavior(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                      >
                        <option value="solid">Solid Block (Walkable Terrain)</option>
                        <option value="hazard">Hazard (Dangerous Spikes/Lava)</option>
                        <option value="spring">Spring Pad (Super Bounce)</option>
                        <option value="coin">Collectible Star/Coin</option>
                        <option value="decor">Pass-through Decor</option>
                      </select>
                    </div>
                  </div>

                  {/* Image on Transparent Background Centered on Square */}
                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold block mb-1">
                      Transparent Background Image (Centered on Square)
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Live Centered Preview Square */}
                      <div
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-emerald-400/50 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative"
                        title="Centered Square Preview"
                      >
                        {elemImg ? (
                          <img
                            src={elemImg}
                            alt="Centered preview"
                            className="object-contain transition transform"
                            style={{
                              width: `${Math.round(48 * elemImgScale)}px`,
                              height: `${Math.round(48 * elemImgScale)}px`,
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-neutral-500 text-center px-1">Square Preview</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          ref={fileInputElemRef}
                          type="file"
                          accept="image/png, image/webp"
                          onChange={handleElemImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputElemRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl backdrop-blur-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{elemImg ? 'Change Image' : 'Upload PNG (Transparent Background)'}</span>
                        </button>
                        <div className="text-[10px] text-neutral-400">
                          Upload transparent PNG image to center on square, or leave blank for automatic styled shape.
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddElement}
                    className="w-full py-2 px-3 rounded-xl backdrop-blur-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Block to Add-on</span>
                  </button>
                </div>

                {/* List of elements added so far */}
                {elements.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {elements.map((el, idx) => (
                      <div
                        key={el.id}
                        className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <ElementThumbnail type={el.behavior} customImg={el.imageDataUrl} size={32} />
                          <div>
                            <div className="text-xs font-bold text-white">{el.name}</div>
                            <div className="text-[10px] text-neutral-400 capitalize">{el.behavior}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setElements(elements.filter((_, i) => i !== idx))}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Custom Hats */}
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Custom Hats & Accessories ({hats.length})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold block mb-1">Hat Name</label>
                    <input
                      type="text"
                      value={hatName}
                      onChange={(e) => setHatName(e.target.value)}
                      placeholder="e.g. Wizard Hat"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold block mb-1">
                      Hat Graphic (Transparent Background)
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Avatar preview with hat */}
                      <div className="w-16 h-16 rounded-xl border border-white/15 bg-black/40 flex flex-col items-center justify-end pb-1 overflow-hidden shrink-0 relative">
                        {hatImg ? (
                          <img src={hatImg} alt="Hat" className="w-8 h-8 object-contain -mb-1" />
                        ) : (
                          <Crown className="w-5 h-5 text-amber-400 -mb-1" />
                        )}
                        <div className="w-7 h-7 rounded-sm bg-white border border-black/20" />
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <input
                          ref={fileInputHatRef}
                          type="file"
                          accept="image/png, image/webp"
                          onChange={handleHatImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputHatRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl backdrop-blur-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{hatImg ? 'Change Hat Image' : 'Upload Hat Image (PNG)'}</span>
                        </button>
                        <div className="text-[10px] text-neutral-400">
                          Upload transparent PNG placed on top of player's square head.
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddHat}
                    className="w-full py-2 px-3 rounded-xl backdrop-blur-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Hat to Add-on</span>
                  </button>
                </div>

                {hats.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hats.map((ht, idx) => (
                      <div
                        key={ht.id}
                        className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center p-0.5">
                            <img src={ht.imageDataUrl} alt={ht.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="text-xs font-bold text-white">{ht.name}</div>
                        </div>
                        <button
                          onClick={() => setHats(hats.filter((_, i) => i !== idx))}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Custom Character Colors */}
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Custom Character Colors ({colors.length})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold block mb-1">Color Name</label>
                      <input
                        type="text"
                        value={colorName}
                        onChange={(e) => setColorName(e.target.value)}
                        placeholder="e.g. Cyber Neon"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold block mb-1">Pick Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colorHex}
                          onChange={(e) => setColorHex(e.target.value)}
                          className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={colorHex}
                          onChange={(e) => setColorHex(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="w-full py-2 px-3 rounded-xl backdrop-blur-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Color to Add-on</span>
                  </button>
                </div>

                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {colors.map((col, idx) => (
                      <div
                        key={col.id}
                        className="p-2 rounded-xl bg-black/30 border border-white/10 flex items-center gap-2"
                      >
                        <div
                          className="w-5 h-5 rounded-md border border-white/20 shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-xs font-bold text-white">{col.name}</span>
                        <button
                          onClick={() => setColors(colors.filter((_, i) => i !== idx))}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Publish Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublish}
                  className="w-full py-3.5 px-4 rounded-2xl backdrop-blur-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition transform active:scale-98 cursor-pointer"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing Add-on to Community...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Publish Add-on to Community</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INSTALLED ADD-ONS */}
          {activeTab === 'installed' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">Installed Add-ons</h3>
                <p className="text-xs text-neutral-400">Manage your active add-on packages</p>
              </div>

              {installedList.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  No add-ons installed. Browse the community tab to add packs!
                </div>
              ) : (
                <div className="space-y-3">
                  {installedList.map((addon) => {
                    const enabled = isAddonEnabled(addon.id);
                    return (
                      <div
                        key={addon.id}
                        className="p-4 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`p-2.5 rounded-xl border ${
                              enabled
                                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                : 'bg-neutral-800/40 border-neutral-700/50 text-neutral-500'
                            }`}
                          >
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white flex items-center gap-2">
                              <span>{addon.title}</span>
                              <span className="text-[10px] text-neutral-400 font-normal">By {addon.authorName}</span>
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              {addon.elements?.length || 0} blocks · {addon.hats?.length || 0} hats · {addon.colors?.length || 0} colors
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(addon.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer backdrop-blur-xl border ${
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
                              className="p-2 rounded-xl backdrop-blur-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 transition cursor-pointer"
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
      </div>
    </div>
  );
};

// SVG data URI generator for default shaped custom elements
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
