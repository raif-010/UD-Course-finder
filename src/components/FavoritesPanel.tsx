/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, Key, Copy, Check, Trash2, Shield, HeartOff, Users } from 'lucide-react';
import { AccountRecord } from '../types';

interface FavoritesPanelProps {
  favorites: AccountRecord[];
  onRemoveFavorite: (id: string) => void;
  onClearAll: () => void;
  soundEnabled: boolean;
  onShowNotification: (message: string) => void;
}

export default function FavoritesPanel({
  favorites,
  onRemoveFavorite,
  onClearAll,
  soundEnabled,
  onShowNotification
}: FavoritesPanelProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: 'id' | 'password' | null }>({});

  const playCopySound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.05); // A5
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  };

  const handleCopy = (text: string, recordId: string, type: 'id' | 'password') => {
    navigator.clipboard.writeText(text).then(() => {
      playCopySound();
      setCopiedStates(prev => ({ ...prev, [recordId]: type }));
      onShowNotification(`✓ Copied ${type.toUpperCase()}: ${text}`);
      
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [recordId]: null }));
      }, 1500);
    });
  };

  return (
    <div className="flex flex-col gap-5" id="favorites-panel-root">
      <div className="flex items-center justify-between" id="favorites-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Favorites</h2>
          <p className="text-xs text-[#A0AEC0] mt-0.5">Your pinned and fast-access credentials</p>
        </div>

        {favorites.length > 0 && (
          <button
            id="clear-all-favorites-btn"
            onClick={onClearAll}
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[rgba(255,255,255,0.1)] p-10 text-center text-[#A0AEC0] flex flex-col items-center justify-center gap-3 bg-[rgba(20,25,45,0.2)]" id="empty-favorites-view">
          <Heart className="w-[42px] h-[42px] text-[#A0AEC0]/30 animate-pulse" />
          <h3 className="text-sm font-semibold">No Pinned Credentials</h3>
          <p className="text-xs text-[#A0AEC0]/60 max-w-[220px]">Tap the heart icon on any random or alternative record to bookmark them here!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4" id="favorites-items-list">
          {favorites.map((record) => (
            <div
              key={record.id}
              id={`favorite-card-${record.id}`}
              className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(20,25,45,0.85)] p-[18px] flex flex-col gap-4 relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]"
            >
              {/* Top Row: Shield & Delete Favorite */}
              <div className="flex items-center justify-between" id={`favorite-top-${record.id}`}>
                <div className="flex items-center gap-2" id={`favorite-badge-badge-${record.id}`}>
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-extrabold text-[#A855F7] uppercase tracking-wider">Pinned Credential</span>
                </div>
                <button
                  id={`favorite-remove-${record.id}`}
                  onClick={() => onRemoveFavorite(record.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
                  title="Remove Bookmark"
                >
                  <HeartOff className="w-4 h-4" />
                </button>
              </div>

              {/* Central Information */}
              <div className="grid grid-cols-2 gap-4 pb-1 border-b border-white/[0.04]" id={`favorite-info-grid-${record.id}`}>
                {/* ID section */}
                <div id={`favorite-id-field-${record.id}`}>
                  <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider block">ID</span>
                  <div className="flex items-center justify-between mt-1 select-all font-bold text-white tracking-tight text-md">
                    <span>{record.id}</span>
                    <button
                      id={`favorite-copy-id-${record.id}`}
                      onClick={() => handleCopy(record.id, record.id, 'id')}
                      className="text-purple-300 hover:text-white p-1 rounded hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                    >
                      {copiedStates[record.id] === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Password section */}
                <div id={`favorite-pw-field-${record.id}`}>
                  <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider block">Password</span>
                  <div className="flex items-center justify-between mt-1 select-all font-bold text-white font-mono tracking-tight text-md">
                    <span>{record.password || `password_${record.id}`}</span>
                    <button
                      id={`favorite-copy-pw-${record.id}`}
                      onClick={() => handleCopy(record.password || `password_${record.id}`, record.id, 'password')}
                      className="text-purple-300 hover:text-white p-1 rounded hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                    >
                      {copiedStates[record.id] === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Attached Courses list summary */}
              <div className="flex flex-col gap-2 text-xs mt-1" id={`favorite-footer-meta-${record.id}`}>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider">Linked Courses:</span>
                  <ul className="list-disc pl-3 text-[#A0AEC0] space-y-1">
                    {record.courses.map((course, i) => (
                      <li key={i} className="text-[11px] leading-relaxed">
                        {course}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
