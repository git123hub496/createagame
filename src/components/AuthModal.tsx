import React, { useState } from 'react';
import { Lock, Key, Shield, User, X, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  setAccountPassword,
  loginWithAccount,
  createAccountWithPassword,
} from '../services/authService';
import { sounds } from '../services/sound';
import { AvatarConfig } from '../types';

interface AuthModalProps {
  initialMode?: 'secure' | 'login' | 'register';
  forcedSecure?: boolean;
  onClose?: () => void;
  onAuthenticated?: (avatar?: AvatarConfig) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'secure',
  forcedSecure = false,
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'secure' | 'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    sounds.playClick();

    const res = await setAccountPassword(password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to set password.');
    } else {
      setSuccessMessage('Password saved to Firebase. Account secured.');
      setTimeout(() => {
        onAuthenticated?.();
        onClose?.();
      }, 1000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    sounds.playClick();

    const res = await loginWithAccount(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      if (res.requiresPasswordSetup) {
        setMode('secure');
        setErrorMessage('Secure your account! Add a password now.');
      } else {
        setErrorMessage(res.error || 'Login failed.');
      }
    } else {
      setSuccessMessage('Logged in successfully.');
      setTimeout(() => {
        onAuthenticated?.(res.profile?.avatar);
        onClose?.();
      }, 800);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (username.trim().length < 2) {
      setErrorMessage('Username must be at least 2 characters.');
      return;
    }
    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    sounds.playClick();

    const res = await createAccountWithPassword(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create account.');
    } else {
      setSuccessMessage('Account created and secured with password.');
      setTimeout(() => {
        onAuthenticated?.();
        onClose?.();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-md rounded-3xl backdrop-blur-2xl bg-neutral-900/90 border border-white/20 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white">
                {mode === 'secure'
                  ? 'Secure your account! Add a password now.'
                  : mode === 'login'
                  ? 'Account Login'
                  : 'Create Account'}
              </h2>
              <div className="text-[10px] text-neutral-400">
                {mode === 'secure'
                  ? 'A password is required to protect your profile'
                  : 'Firebase secured password credentials'}
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-2 rounded-xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
              title="Skip"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Status Notices */}
          {errorMessage && (
            <div className="p-3 rounded-2xl backdrop-blur-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl backdrop-blur-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Mode: Secure Account / Add Password */}
          {mode === 'secure' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-neutral-200 leading-relaxed">
                <span className="font-bold text-white block mb-1">
                  Secure your account! Add a password now.
                </span>
                To prevent unauthorized access and keep your published maps, add-ons, and records safe, you must add a password to your account.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      required
                      className="w-full px-3.5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 focus:border-indigo-400 text-white placeholder-white/40 text-xs outline-none transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 focus:border-indigo-400 text-white placeholder-white/40 text-xs outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-2xl backdrop-blur-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/40 text-white font-black text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving to Firebase...' : 'Save Password & Secure Account'}</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                  }}
                  className="w-full py-2 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white font-bold text-xs transition cursor-pointer"
                >
                  Skip for now
                </button>
              )}

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('login');
                  }}
                  className="text-xs text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Already have an account? Log in with password
                </button>
              </div>
            </form>
          )}

          {/* Mode: Login */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your account username"
                      required
                      className="w-full px-3.5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 focus:border-indigo-400 text-white placeholder-white/40 text-xs outline-none transition pl-9"
                    />
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Account password"
                      required
                      className="w-full px-3.5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 focus:border-indigo-400 text-white placeholder-white/40 text-xs outline-none transition pl-9 pr-10"
                    />
                    <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-2xl backdrop-blur-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/40 text-white font-black text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Authenticating...' : 'Log In'}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('register');
                  }}
                  className="text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Create new account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('secure');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 transition cursor-pointer font-bold"
                >
                  Add a password
                </button>
              </div>
            </form>
          )}

          {/* Mode: Register */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Choose Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username (2-32 characters)"
                      required
                      className="w-full px-3.5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 focus:border-indigo-400 text-white placeholder-white/40 text-xs outline-none transition pl-9"
                    />
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set password (min 4 characters)"
                      required
                      className="w-full px-3.5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 focus:border-indigo-400 text-white placeholder-white/40 text-xs outline-none transition pl-9 pr-10"
                    />
                    <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 focus:border-indigo-400 text-white placeholder-white/40 text-xs outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-2xl backdrop-blur-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/40 text-white font-black text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Creating account...' : 'Create Account & Password'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('login');
                  }}
                  className="text-xs text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Already have an account? Log in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
