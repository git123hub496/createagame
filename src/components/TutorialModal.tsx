import React, { useState } from 'react';
import {
  Gamepad2,
  Hammer,
  Users,
  Palette,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
} from 'lucide-react';
import { sounds } from '../services/sound';

interface TutorialModalProps {
  onClose: () => void;
}

interface TutorialStep {
  title: string;
  tag: string;
  description: string;
  details: string[];
  icon: React.ElementType;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Createagame',
    tag: 'Platformer Sandbox',
    description:
      'Createagame lets you design treacherous courses, test play and beat your own levels to verify them, and publish your creations worldwide.',
    details: [
      'Jump across obstacles, avoid deadly hazards, and reach the checkered flag.',
      'Play official featured stages or dive into hundreds of community maps.',
      'Explore community courses or test your skills in speedruns.',
    ],
    icon: Gamepad2,
  },
  {
    title: 'Controls & Movement',
    tag: 'Quick Navigation',
    description:
      'Smooth, responsive platforming controls designed for speedruns and precision navigation.',
    details: [
      'Move: Use A / D or Left / Right arrow keys.',
      'Jump: Press W, Up arrow key, or Spacebar.',
      'Instant Map: Press K at any time on the title screen to jump into a random community map.',
      'Restart: Press R in play mode to instantly respawn at the starting spawn point.',
    ],
    icon: Gamepad2,
  },
  {
    title: 'Level Editor & Verification',
    tag: 'Build & Publish',
    description:
      'An intuitive tile-based editor where you place terrain, spikes, springs, and goal posts.',
    details: [
      'Select elements from the top palette and click or drag onto the canvas.',
      'Place bouncy springs, deadly spikes, lava pools, and animated barriers.',
      'Anti-Cheating Verification: You must complete your map from start to finish before publishing.',
      'Once verified, publish to the explore feed with your custom title and theme.',
    ],
    icon: Hammer,
  },
  {
    title: 'Add-on Studio & Account Security',
    tag: 'Customization & Protection',
    description:
      'Customize your character skin, craft add-on blocks and accessories, and keep your data safe.',
    details: [
      'Equip custom hats, eye styles, motion aura trails, and colors.',
      'Craft custom blocks, themes, and items in the full-screen Add-on Studio.',
      'Password Protection: All accounts require a password saved to Firebase to keep your progress and records secure.',
    ],
    icon: Shield,
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const step = TUTORIAL_STEPS[currentStepIndex];
  const StepIcon = step.icon;
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    sounds.playClick();
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    sounds.playClick();
    try {
      localStorage.setItem('cag_tutorial_seen', 'true');
    } catch {}
    onClose();
  };

  const handleSkip = () => {
    sounds.playClick();
    try {
      localStorage.setItem('cag_tutorial_seen', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-65 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl backdrop-blur-2xl bg-neutral-900/90 border border-white/20 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                Tutorial · Step {currentStepIndex + 1} of {TUTORIAL_STEPS.length}
              </div>
              <h2 className="text-sm font-black text-white">{step.title}</h2>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="px-3 py-1.5 rounded-xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/10 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
          >
            Skip Tutorial
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Step Pill */}
          <div className="inline-block px-3 py-1 rounded-full backdrop-blur-xl bg-white/10 border border-white/15 text-[11px] font-bold text-indigo-300">
            {step.tag}
          </div>

          <p className="text-sm text-neutral-200 leading-relaxed font-medium">
            {step.description}
          </p>

          {/* Details list */}
          <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 space-y-2.5">
            {step.details.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sounds.playClick();
                  setCurrentStepIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-indigo-400'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/40">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`px-4 py-2 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 text-xs font-bold text-neutral-300 hover:text-white transition flex items-center gap-1.5 ${
              currentStepIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-black/60'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-2xl backdrop-blur-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/40 text-xs font-black text-white shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isLast ? 'Finish Tutorial' : 'Next Step'}</span>
            {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
