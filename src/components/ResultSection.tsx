/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RefreshCw, Copy, Check, Users, ChevronRight, Trash2, Shield, Heart, HelpCircle, Plus } from 'lucide-react';
import { AccountRecord } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';

interface ResultSectionProps {
  filteredRecords: AccountRecord[];
  randomRecord: AccountRecord | null;
  onPickNewRandom: () => void;
  onClearResults: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  soundEnabled: boolean;
  onShowNotification: (message: string) => void;
  activeCustomId?: string | null;
  onAddCourseToActive?: (courseName: string) => void;
  exactMatchOnly?: boolean;
  theme?: 'dark' | 'light';
}

export default function ResultSection({
  filteredRecords,
  randomRecord,
  onPickNewRandom,
  onClearResults,
  favorites,
  onToggleFavorite,
  soundEnabled,
  onShowNotification,
  activeCustomId,
  onAddCourseToActive,
  exactMatchOnly = false,
  theme = 'dark'
}: ResultSectionProps) {
  // Visible list count for compact secondary records
  const [visibleCount, setVisibleCount] = useState(3);
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
    } catch (e) {
      console.warn("Web Audio Blocked", e);
    }
  };

  const handleCopy = (text: string, recordId: string, type: 'id' | 'password') => {
    copyTextToClipboard(text).then((success) => {
      if (success) {
        playCopySound();
        setCopiedStates(prev => ({ ...prev, [recordId]: type }));
        onShowNotification(`✓ Copied ${type.toUpperCase()}: ${text}`);
        
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [recordId]: null }));
        }, 1500);
      } else {
        onShowNotification(`❌ Copy failed`);
      }
    });
  };

  // Get additional results excluding the core random one
  const secondaryResults = filteredRecords.filter(r => !randomRecord || r.id !== randomRecord.id);
  const isDark = theme === 'dark';
  const remainingCount = Math.max(0, filteredRecords.length - (randomRecord ? 1 : 0) - visibleCount);

  return (
    <div className="flex flex-col gap-6" id="result-section-root">
      
      {/* 1. RANDOM RESULT CARD */}
      {randomRecord ? (
        <div 
          className={`rounded-[20px] border p-[18px] shadow-2xl relative overflow-hidden flex flex-col gap-5 transition-all duration-300 ${
            isDark 
              ? "border-[#A855F7]/30 bg-radial from-[#14192D]/95 to-[#1A0B3F]/90 backdrop-blur-2xl text-white" 
              : "border-purple-200/80 bg-white text-slate-800 shadow-md"
          }`} 
          id="random-result-card"
        >
          {/* Subtle background glow */}
          {isDark && <div className="absolute top-0 right-0 w-36 h-36 bg-[#8F5CFF]/10 rounded-full filter blur-2xl pointer-events-none" />}

          {/* Random result header */}
          <div className="flex items-center justify-between z-10" id="random-card-header">
            {/* Left badge */}
            <div className="flex items-center gap-2 flex-wrap" id="random-badges-row">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${
                isDark 
                  ? "bg-purple-500/10 border-purple-500/20 text-[#A855F7]" 
                  : "bg-purple-50 border-purple-200 text-purple-700"
              }`} id="random-badge">
                <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? "bg-purple-500" : "bg-purple-600"}`}></span>
                <span>🎲 Random Result</span>
              </div>
              {exactMatchOnly && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                  isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"
                }`} id="strict-match-badge">
                  <span>✨ 1 Course Only</span>
                </div>
              )}
            </div>

            {/* Right button */}
            <div className="flex items-center gap-1.5">
              <button
                id="fav-toggle-btn"
                onClick={() => onToggleFavorite(randomRecord.id)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all text-xs font-bold"
                title="Save to Favorites"
              >
                <Heart className={`w-[18px] h-[18px] ${favorites.includes(randomRecord.id) ? 'fill-rose-500 text-rose-500' : 'text-rose-450'}`} />
              </button>

              <button
                id="new-random-btn"
                onClick={onPickNewRandom}
                className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer ${
                  isDark ? "text-[#A0AEC0] hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Random</span>
              </button>
            </div>
          </div>

          {/* Core credential details */}
          <div className="flex items-start gap-4" id="random-card-body">
            {/* Shield profile avatar */}
            <div className={`w-[64px] h-[64px] rounded-2xl flex items-center justify-center border shrink-0 shadow-lg relative overflow-hidden ${
              isDark 
                ? "bg-gradient-to-br from-[#6D3BFF]/30 to-[#A855F7]/30 border-[#A855F7]/20 text-[#A855F7]/80" 
                : "bg-purple-50 border-purple-200 text-[#A855F7]"
            }`} id="card-shield-glow">
              {isDark && <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />}
              <Shield className="w-7 h-7 stroke-[1.8] relative z-10" />
            </div>

            {/* Credential entries */}
            <div className="flex-1 flex flex-col gap-4" id="credential-entries">
              {/* ID Entry */}
              <div className={`flex items-center justify-between pb-3 border-b ${isDark ? "border-white/[0.04]" : "border-slate-100"}`} id="entry-id-row">
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-400"}`}>ID</div>
                  <div className={`text-xl font-bold tracking-tight mt-0.5 ${isDark ? "text-white" : "text-slate-800"}`} id="val-id">{randomRecord.id}</div>
                </div>
                <button
                  id="copy-id-btn"
                  onClick={() => handleCopy(randomRecord.id, randomRecord.id, 'id')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                    copiedStates[randomRecord.id] === 'id'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : isDark
                        ? 'border-purple-500/20 bg-purple-500/5 text-purple-300 hover:text-white hover:bg-purple-600/15 hover:border-purple-500/40'
                        : 'border-purple-200 bg-purple-50 text-purple-650 hover:bg-purple-100/50 hover:text-purple-800 hover:border-purple-300 shadow-xs'
                  }`}
                >
                  {copiedStates[randomRecord.id] === 'id' ? <Check className="w-3.5 h-3.5 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStates[randomRecord.id] === 'id' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Password Entry */}
              <div className="flex items-center justify-between pb-1" id="entry-pw-row">
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-400"}`}>Password</div>
                  <div className={`text-xl font-bold font-mono tracking-tight mt-0.5 ${isDark ? "text-white" : "text-slate-800"}`} id="val-password">
                    {randomRecord.password || `password_${randomRecord.id}`}
                  </div>
                </div>
                <button
                  id="copy-pw-btn"
                  onClick={() => handleCopy(randomRecord.password || `password_${randomRecord.id}`, randomRecord.id, 'password')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all duration-350 active:scale-95 ${
                    copiedStates[randomRecord.id] === 'password'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : isDark
                        ? 'border-purple-500/20 bg-purple-500/5 text-purple-300 hover:text-white hover:bg-purple-600/15 hover:border-purple-500/40'
                        : 'border-purple-200 bg-purple-50 text-purple-650 hover:bg-purple-100/50 hover:text-purple-800 hover:border-purple-300 shadow-xs'
                  }`}
                >
                  {copiedStates[randomRecord.id] === 'password' ? <Check className="w-3.5 h-3.5 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStates[randomRecord.id] === 'password' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className={`h-[1px] w-full ${isDark ? "bg-[rgba(255,255,255,0.06)]" : "bg-slate-100"}`} />

          {/* Courses lists */}
          <div className="flex flex-col gap-2.5 z-10" id="card-courses-info-block">
            <div className="flex flex-col gap-1.5" id="courses-bullets">
              <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-400"}`}>Courses</div>
              <ul className="list-none pl-1 flex flex-col gap-1.5" id="courses-ul">
                {randomRecord.courses.map((course, idx) => (
                  <li key={idx} className={`text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 leading-relaxed ${isDark ? "text-white" : "text-slate-700"}`} id={`bullet-${idx}`}>
                    <span className="flex items-start gap-2">
                      <span className="text-[#A855F7] text-md mt-0.5">•</span>
                      <span>{course}</span>
                    </span>
                    {activeCustomId && randomRecord.id !== activeCustomId && onAddCourseToActive && (
                      <button
                        onClick={() => onAddCourseToActive(course)}
                        className={`px-2.5 py-1 border rounded-md text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                          isDark 
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/15 text-emerald-300"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        title="Add this course to your active bundle"
                      >
                        <Plus className="w-3 h-3 text-emerald-505" />
                        <span>Add</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-[20px] border border-dashed p-8 text-center flex flex-col items-center justify-center gap-3 ${
          isDark ? "border-white/[0.12] bg-white/[0.01] text-[#A0AEC0]" : "border-slate-300 bg-slate-50/50 text-slate-500 shadow-inner"
        }`} id="no-filtered-results">
          <HelpCircle className={`w-10 h-10 ${isDark ? "text-[#A0AEC0]/40" : "text-slate-350"}`} />
          <p className="text-sm font-bold">No active search matches found.</p>
          <p className={`text-xs max-w-[240px] leading-relaxed ${isDark ? "text-[#A0AEC0]/60" : "text-slate-500"}`}>
            {exactMatchOnly 
              ? "We couldn't find any account containing ONLY the exact course name searched. Try switching off 'Strict' search match mode." 
              : "Type in the search field above or upload a database sheet to begin finding accounts!"}
          </p>
        </div>
      )}

      {/* 2. MORE RESULTS */}
      {secondaryResults.length > 0 && (
        <div className="flex flex-col gap-4 mt-2" id="more-results-container">
          <div className="flex items-center justify-between" id="more-results-header">
            <div className="flex items-center gap-2" id="more-title-wrapper">
              <h3 className={`text-sm font-extrabold uppercase tracking-widest ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>More Results</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark 
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-200 border-blue-500/20" 
                  : "bg-purple-50 text-purple-700 border-purple-200"
              }`} id="val-remaining-badge">
                {secondaryResults.length.toLocaleString()} remaining
              </span>
            </div>
            
            <button
              id="clear-results-action"
              onClick={onClearResults}
              className="text-xs font-bold text-red-500 hover:text-red-650 flex items-center gap-1.5 hover:bg-red-500/5 px-2 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Results</span>
            </button>
          </div>

          {/* Infinite list of detailed secondary cards */}
          <div className={`flex flex-col gap-4 divide-y ${isDark ? "divide-white/[0.06]" : "divide-slate-200"}`} id="secondary-results-list">
            {secondaryResults.slice(0, visibleCount).map((record, index) => (
              <div 
                key={record.id} 
                className={`flex flex-col gap-3 group transition-colors rounded-2xl ${index > 0 ? 'pt-4' : ''}`}
                id={`secondary-card-${record.id}`}
              >
                <div className="flex items-start justify-between" id={`secondary-top-${record.id}`}>
                  <div className="flex items-center gap-3">
                    {/* Circle group avatar */}
                    <div className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center text-blue-500 shrink-0 border ${
                      isDark ? "bg-blue-500/10 border-blue-500/15" : "bg-blue-50 border-blue-200"
                    }`} id={`secondary-avatar-${record.id}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-400"}`}>Alternative Result</div>
                      <div className={`text-xs font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-800"}`} id={`secondary-id-lbl-${record.id}`}>ID: {record.id}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" id={`secondary-actions-${record.id}`}>
                    {/* Mini Heart indicator */}
                    <button
                      id={`secondary-fav-${record.id}`}
                      onClick={() => {
                        onToggleFavorite(record.id);
                        if (soundEnabled) playCopySound();
                      }}
                      className="p-1.5 rounded-lg text-rose-450 hover:bg-rose-500/10 active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(record.id) ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}`} />
                    </button>
                  </div>
                </div>

                {/* ID & Password columns with separate copy buttons */}
                <div className="grid grid-cols-2 gap-3" id={`secondary-credentials-grid-${record.id}`}>
                  {/* ID Block */}
                  <div className={`border rounded-xl p-3 flex items-center justify-between ${
                    isDark ? "bg-[#050816] border-white/[0.05]" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? "text-[#A0AEC0]" : "text-slate-400"}`}>Account ID</p>
                      <p className={`text-sm font-mono font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-800"}`}>{record.id}</p>
                    </div>
                    <button
                      id={`secondary-copy-id-${record.id}`}
                      onClick={() => handleCopy(record.id, record.id, 'id')}
                      className={`p-1.5 rounded hover:bg-white/5 transition-all active:scale-90 cursor-pointer ${copiedStates[record.id] === 'id' ? 'text-emerald-500 font-bold' : isDark ? 'text-purple-300 hover:text-white' : 'text-purple-650 hover:text-purple-800'}`}
                    >
                      {copiedStates[record.id] === 'id' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Block */}
                  <div className={`border rounded-xl p-3 flex items-center justify-between ${
                    isDark ? "bg-[#050816] border-white/[0.05]" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? "text-[#A0AEC0]" : "text-slate-400"}`}>Password</p>
                      <p className={`text-sm font-mono font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-800"}`}>{record.password || `password_${record.id}`}</p>
                    </div>
                    <button
                      id={`secondary-copy-pw-${record.id}`}
                      onClick={() => handleCopy(record.password || `password_${record.id}`, record.id, 'password')}
                      className={`p-1.5 rounded hover:bg-white/5 transition-all active:scale-90 cursor-pointer ${copiedStates[record.id] === 'password' ? 'text-emerald-500 font-bold' : isDark ? 'text-purple-300 hover:text-white' : 'text-purple-650 hover:text-purple-800'}`}
                    >
                      {copiedStates[record.id] === 'password' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Courses block displaying every course */}
                <div className="flex flex-col gap-1.5 pb-2" id={`secondary-courses-bullets-${record.id}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-400"}`}>Courses</div>
                  <ul className="list-none pl-1 flex flex-col gap-1.5" id={`secondary-courses-ul-${record.id}`}>
                    {record.courses.map((course, idx) => (
                      <li key={idx} className={`text-xs font-semibold flex items-center justify-between gap-3 leading-relaxed ${isDark ? "text-[#CFD8E3]" : "text-slate-650"}`} id={`secondary-bullet-${record.id}-${idx}`}>
                        <span className="flex items-start gap-2">
                          <span className="text-[#A855F7] mt-0.5">•</span>
                          <span>{course}</span>
                        </span>
                        {activeCustomId && record.id !== activeCustomId && onAddCourseToActive && (
                          <button
                            onClick={() => onAddCourseToActive(course)}
                            className={`px-2 py-0.5 border rounded-md text-[9px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                              isDark 
                                ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/15 text-emerald-300"
                                : "bg-emerald-5 border-emerald-250 text-emerald-700 hover:bg-emerald-100/50"
                            }`}
                            title="Add this course to your active bundle"
                          >
                            <Plus className="w-3 h-3 text-emerald-500" />
                            <span>Add</span>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* LOAD MORE BUTTON */}
          {remainingCount > 0 && (
            <button
              id="load-more-results-btn"
              onClick={() => {
                setVisibleCount(prev => prev + 5);
                if (soundEnabled) playCopySound();
              }}
              className={`mt-2 w-full py-3.5 border text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                isDark 
                  ? "bg-gradient-to-r from-[#6D3BFF]/15 to-[#8F5CFF]/15 border-[#8F5CFF]/20 hover:border-[#8F5CFF]/45 text-white"
                  : "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-750"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load More Results ({Math.min(5, remainingCount)})</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
