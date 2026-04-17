'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PrivacyPanel } from '@/components/features/PrivacyPanel';

// ── Preset Options ─────────────────────────────────────────────

const CARD_GRADIENTS = [
  { id: 'frost', label: 'Frost', from: '#091731', to: '#19549b', preview: 'linear-gradient(135deg, #091731, #19549b)' },
  { id: 'midnight', label: 'Midnight', from: '#0a0a1a', to: '#1e1e3f', preview: 'linear-gradient(135deg, #0a0a1a, #1e1e3f)' },
  { id: 'ocean', label: 'Ocean', from: '#0d2137', to: '#0d9373', preview: 'linear-gradient(135deg, #0d2137, #0d9373)' },
  { id: 'ember', label: 'Ember', from: '#1a0a0a', to: '#8b2020', preview: 'linear-gradient(135deg, #1a0a0a, #8b2020)' },
  { id: 'aurora', label: 'Aurora', from: '#0a1628', to: '#4c1d95', preview: 'linear-gradient(135deg, #0a1628, #4c1d95)' },
  { id: 'carbon', label: 'Carbon', from: '#111113', to: '#2d2d2d', preview: 'linear-gradient(135deg, #111113, #2d2d2d)' },
];

const CTA_COLORS = [
  { id: 'blue', label: 'Blue', hex: '#3B7DDD' },
  { id: 'emerald', label: 'Emerald', hex: '#059669' },
  { id: 'violet', label: 'Violet', hex: '#7C3AED' },
  { id: 'rose', label: 'Rose', hex: '#E11D48' },
  { id: 'amber', label: 'Amber', hex: '#D97706' },
  { id: 'cyan', label: 'Cyan', hex: '#0891B2' },
];

// ── Storage Keys ───────────────────────────────────────────────

const STORAGE_KEY_GRADIENT = 'defi-cockpit.card-gradient';
const STORAGE_KEY_CTA = 'defi-cockpit.cta-color';

// ── Exports for consuming components ───────────────────────────

export function getStoredGradient(): typeof CARD_GRADIENTS[0] {
  if (typeof window === 'undefined') return CARD_GRADIENTS[0];
  const stored = localStorage.getItem(STORAGE_KEY_GRADIENT);
  return CARD_GRADIENTS.find(g => g.id === stored) ?? CARD_GRADIENTS[0];
}

export function getStoredCtaColor(): typeof CTA_COLORS[0] {
  if (typeof window === 'undefined') return CTA_COLORS[0];
  const stored = localStorage.getItem(STORAGE_KEY_CTA);
  return CTA_COLORS.find(c => c.id === stored) ?? CTA_COLORS[0];
}

/** Apply CSS variables to document root */
export function applyThemeSettings() {
  if (typeof window === 'undefined') return;
  const gradient = getStoredGradient();
  const cta = getStoredCtaColor();
  const root = document.documentElement;
  root.style.setProperty('--card-gradient-from', gradient.from);
  root.style.setProperty('--card-gradient-to', gradient.to);
  root.style.setProperty('--cta-color', cta.hex);
}

// ── Component ──────────────────────────────────────────────────

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [selectedGradient, setSelectedGradient] = useState(() => {
    if (typeof window === 'undefined') return CARD_GRADIENTS[0].id;
    return localStorage.getItem(STORAGE_KEY_GRADIENT) ?? CARD_GRADIENTS[0].id;
  });
  const [selectedCta, setSelectedCta] = useState(() => {
    if (typeof window === 'undefined') return CTA_COLORS[0].id;
    return localStorage.getItem(STORAGE_KEY_CTA) ?? CTA_COLORS[0].id;
  });

  const handleGradientChange = (id: string) => {
    setSelectedGradient(id);
    localStorage.setItem(STORAGE_KEY_GRADIENT, id);
    applyThemeSettings();
  };

  const handleCtaChange = (id: string) => {
    setSelectedCta(id);
    localStorage.setItem(STORAGE_KEY_CTA, id);
    applyThemeSettings();
  };

  if (!isOpen) return null;

  const activeGradient = CARD_GRADIENTS.find(g => g.id === selectedGradient) ?? CARD_GRADIENTS[0];
  const activeCta = CTA_COLORS.find(c => c.id === selectedCta) ?? CTA_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.15)] max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#e2e8f0]">
          <h2 className="font-ibm-plex-sans font-semibold text-lg text-[#11274d]">Settings</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[#f1f5f9] transition-colors"
          >
            <X size={16} className="text-[#6a7282]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Card Gradient */}
          <div>
            <p className="label-section-light mb-3">Card Gradient</p>
            <div className="grid grid-cols-3 gap-2">
              {CARD_GRADIENTS.map(g => (
                <button
                  key={g.id}
                  onClick={() => handleGradientChange(g.id)}
                  className={`relative h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                    selectedGradient === g.id
                      ? 'ring-2 ring-[var(--cta-color,#3B7DDD)] ring-offset-2 ring-offset-white scale-[1.02]'
                      : 'hover:scale-[1.02] border border-[#e2e8f0]'
                  }`}
                  style={{ background: g.preview }}
                >
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-ibm-plex-sans font-medium text-white/70">
                    {g.label}
                  </span>
                  {selectedGradient === g.id && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full" style={{ background: activeCta.hex }} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Button Color */}
          <div>
            <p className="label-section-light mb-3">Primary Button Color</p>
            <div className="grid grid-cols-6 gap-2">
              {CTA_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleCtaChange(c.id)}
                  className={`relative flex flex-col items-center gap-1.5 py-2 rounded-lg transition-all duration-200 ${
                    selectedCta === c.id
                      ? 'bg-[#f1f5f9] ring-1 ring-[#cbd5e1]'
                      : 'hover:bg-[#f8fafc]'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedCta === c.id ? 'border-[#11274d] scale-110' : 'border-transparent'
                    }`}
                    style={{ background: c.hex }}
                  />
                  <span className="text-[9px] font-ibm-plex-sans text-[#6a7282]">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Compliance */}
          <PrivacyPanel />

          {/* Preview */}
          <div>
            <p className="label-section-light mb-3">Preview</p>
            <div
              className="rounded-lg p-4 flex items-center justify-between"
              style={{ background: activeGradient.preview }}
            >
              <div>
                <p className="text-white/50 text-[10px] font-ibm-plex-sans uppercase tracking-wider">Sample Card</p>
                <p className="data-lg text-white mt-1">$12,345.67</p>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-white text-xs font-ibm-plex-sans font-semibold transition-colors"
                style={{ background: activeCta.hex }}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
