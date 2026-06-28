/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RefreshCw, Copy, Check, Users, ChevronRight, Trash2, Shield, Heart, HelpCircle, Plus, Loader2, AlertCircle, Tag, X } from 'lucide-react';
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
  onUpdateLabels: (id: string, labels: string[]) => void;
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
  theme = 'dark',
  onUpdateLabels
}: ResultSectionProps) {
  // Visible list count for compact secondary records
  const [visibleCount, setVisibleCount] = useState(3);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: 'id' | 'password' | null }>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [labelInputs, setLabelInputs] = useState<{ [id: string]: string }>({});

  const handleAddLabel = (recordId: string, record: AccountRecord) => {
    const rawVal = labelInputs[recordId] || '';
    const labelVal = rawVal.trim();
    if (!labelVal) return;

    const currentLabels = record.labels || [];
    if (currentLabels.includes(labelVal)) {
      onShowNotification(`⚠ Label "${labelVal}" already exists on this ID`);
      return;
    }

    const nextLabels = [...currentLabels, labelVal];
    onUpdateLabels(recordId, nextLabels);
    setLabelInputs(prev => ({ ...prev, [recordId]: '' }));
    onShowNotification(`🏷️ Added label: ${labelVal}`);
  };

  const handleRemoveLabel = (recordId: string, record: AccountRecord, labelToRemove: string) => {
    const currentLabels = record.labels || [];
    const nextLabels = currentLabels.filter(l => l !== labelToRemove);
    onUpdateLabels(recordId, nextLabels);
    onShowNotification(`Removed label: ${labelToRemove}`);
  };

  const handleVerify = async (id: string, passwordString?: string) => {
    const pw = passwordString || `password_${id}`;
    setVerifyingId(id);
    // Clear previous result for this ID
    setVerificationResults(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    try {
      const response = await fetch('/api/verify-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, password: pw })
      });
      
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || contentType.includes("text/html")) {
        if (contentType.includes("text/html")) {
          throw new Error("Sandbox proxy cookie protection active. Please open the app in a new tab using the top-right button to verify.");
        }
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setVerificationResults(prev => ({
          ...prev,
          [id]: { success: true, message: data.message || 'Login verified successfully!' }
        }));
        onShowNotification(`✓ Account ${id} verified: ACTIVE`);
      } else {
        setVerificationResults(prev => ({
          ...prev,
          [id]: { success: false, message: data.error || 'Incorrect ID or password' }
        }));
        onShowNotification(`❌ Account ${id} failed: ${data.error || 'Incorrect credentials'}`);
      }
    } catch (error: any) {
      console.error('Verification failed', error);
      const isProxyError = error.message && (error.message.includes("Sandbox proxy") || error.message.includes("Unexpected token '<'"));
      const finalMsg = isProxyError 
        ? "Please open the app in a new tab (using the button in top-right) to bypass iframe sandbox restrictions."
        : (error.message || 'Verification failed');
        
      setVerificationResults(prev => ({
        ...prev,
        [id]: { success: false, message: finalMsg }
      }));
      onShowNotification(isProxyError ? `⚠️ Open in a new tab to bypass cookie protection` : `❌ Verification request failed`);
    } finally {
      setVerifyingId(null);
    }
  };

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

          {/* Dynamic Multiple Labels/Tags Section */}
          <div className={`flex flex-col gap-2.5 pt-3 border-t text-xs ${isDark ? "border-white/[0.04]" : "border-slate-100"}`} id={`random-labels-section-${randomRecord.id}`}>
            <div className="flex items-center justify-between" id={`random-labels-header-${randomRecord.id}`}>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>
                <Tag className="w-3 h-3 text-purple-500" />
                <span>Labels</span>
              </span>
              {randomRecord.labels && randomRecord.labels.length > 0 && (
                <span className="text-[9px] font-bold text-purple-500 italic">
                  {randomRecord.labels.length} {randomRecord.labels.length === 1 ? 'label' : 'labels'}
                </span>
              )}
            </div>

            {/* Displaying Labels as sleek pill badges */}
            <div className="flex flex-wrap gap-1.5" id={`random-labels-pills-${randomRecord.id}`}>
              {randomRecord.labels && randomRecord.labels.length > 0 ? (
                randomRecord.labels.map((label, labelIdx) => (
                  <div
                    key={labelIdx}
                    id={`random-label-pill-${randomRecord.id}-${label}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-normal transition-all duration-150 ${
                      isDark 
                        ? "bg-purple-500/10 border border-purple-500/25 text-[#D8B4FE] hover:bg-purple-500/15" 
                        : "bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100"
                    }`}
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      id={`random-label-remove-btn-${randomRecord.id}-${label}`}
                      onClick={() => handleRemoveLabel(randomRecord.id, randomRecord, label)}
                      className="hover:bg-purple-500/30 text-purple-500 hover:text-purple-800 rounded-full p-0.5 transition-colors cursor-pointer shrink-0"
                      title={`Delete label "${label}"`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-[10px] text-slate-450 italic">No custom labels added yet</span>
              )}
            </div>

            {/* Add dynamic labels input form */}
            <form
              id={`random-add-label-form-${randomRecord.id}`}
              onSubmit={(e) => {
                e.preventDefault();
                handleAddLabel(randomRecord.id, randomRecord);
              }}
              className="flex gap-2 items-center mt-0.5"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  id={`random-label-input-${randomRecord.id}`}
                  value={labelInputs[randomRecord.id] || ''}
                  onChange={(e) => setLabelInputs(prev => ({ ...prev, [randomRecord.id]: e.target.value }))}
                  placeholder="Add label (e.g. Premium, Exam)"
                  maxLength={24}
                  className={`w-full border rounded-xl px-3 py-1.5 text-[11px] outline-none transition-all duration-200 ${
                    isDark 
                      ? "bg-[#14192D]/40 border-white/[0.06] focus:border-purple-500/30 text-white placeholder-[#A0AEC0]/40" 
                      : "bg-slate-50 border-slate-205 focus:border-purple-400 text-slate-800 placeholder-slate-400"
                  }`}
                />
              </div>
              <button
                type="submit"
                id={`random-label-submit-${randomRecord.id}`}
                className={`p-1.5 border rounded-xl transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${
                  isDark 
                    ? "bg-purple-500/20 hover:bg-purple-500/35 border-purple-500/30 text-purple-200" 
                    : "bg-purple-100 border-purple-250 text-purple-750 hover:bg-purple-200"
                }`}
                title="Add Label Tag"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Account Login Verification Button & Status */}
          <div className={`mt-2 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? "border-white/[0.06]" : "border-slate-100"
          }`} id={`random-verification-block-${randomRecord.id}`}>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-[#A0AEC0]" : "text-slate-450"}`}>
                Uttoron Academy Login Check
              </span>
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="flex items-center gap-1.5">
                  {verificationResults[randomRecord.id] ? (
                    verificationResults[randomRecord.id].success ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <Check className="w-3.5 h-3.5" /> Checked: Verified Right
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> Checked: Verified Wrong
                      </span>
                    )
                  ) : (
                    <span className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                      Not checked yet
                    </span>
                  )}
                </div>
                {verificationResults[randomRecord.id] && !verificationResults[randomRecord.id].success && (
                  <p className="text-[11px] font-medium text-rose-450 leading-tight max-w-xs mt-0.5">
                    Reason: {verificationResults[randomRecord.id].message}
                  </p>
                )}
                {verificationResults[randomRecord.id] && verificationResults[randomRecord.id].success && (
                  <p className="text-[11px] font-medium text-emerald-450 leading-tight max-w-xs mt-0.5">
                    {verificationResults[randomRecord.id].message}
                  </p>
                )}
              </div>
            </div>

            <button
              id="verify-login-btn"
              type="button"
              disabled={verifyingId === randomRecord.id}
              onClick={() => handleVerify(randomRecord.id, randomRecord.password)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                verifyingId === randomRecord.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                  : verificationResults[randomRecord.id]
                    ? verificationResults[randomRecord.id].success
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400'
                    : isDark
                      ? 'bg-[#8F5CFF] hover:bg-[#7B4AE2] text-white border-none shadow-[0_4px_14px_rgba(143,92,255,0.32)] active:scale-95'
                      : 'bg-purple-650 hover:bg-purple-750 text-white border-none shadow-xs active:scale-95 font-bold'
              }`}
            >
              {verifyingId === randomRecord.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : verificationResults[randomRecord.id] ? (
                <span>Verify Again</span>
              ) : (
                <span>Check Credentials</span>
              )}
            </button>
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

                {/* Dynamic Multiple Labels/Tags Section */}
                <div className={`flex flex-col gap-2 pt-2 border-t text-[11px] ${isDark ? "border-white/[0.04]" : "border-slate-100"}`} id={`secondary-labels-section-${record.id}`}>
                  <div className="flex items-center justify-between" id={`secondary-labels-header-${record.id}`}>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>
                      <Tag className="w-2.5 h-2.5 text-purple-500" />
                      <span>Labels</span>
                    </span>
                    {record.labels && record.labels.length > 0 && (
                      <span className="text-[8px] font-bold text-purple-500 italic">
                        {record.labels.length} {record.labels.length === 1 ? 'label' : 'labels'}
                      </span>
                    )}
                  </div>

                  {/* Displaying Labels as sleek pill badges */}
                  <div className="flex flex-wrap gap-1" id={`secondary-labels-pills-${record.id}`}>
                    {record.labels && record.labels.length > 0 ? (
                      record.labels.map((label, labelIdx) => (
                        <div
                          key={labelIdx}
                          id={`secondary-label-pill-${record.id}-${label}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-normal transition-all duration-150 ${
                            isDark 
                              ? "bg-purple-500/10 border border-purple-500/20 text-[#D8B4FE] hover:bg-purple-500/15" 
                              : "bg-purple-50 border border-purple-150 text-purple-700 hover:bg-purple-100"
                          }`}
                        >
                          <span>{label}</span>
                          <button
                            type="button"
                            id={`secondary-label-remove-btn-${record.id}-${label}`}
                            onClick={() => handleRemoveLabel(record.id, record, label)}
                            className="hover:bg-purple-500/30 text-purple-500 hover:text-purple-800 rounded-full p-0.5 transition-colors cursor-pointer shrink-0"
                            title={`Delete label "${label}"`}
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-[9px] text-slate-450 italic">No custom labels</span>
                    )}
                  </div>

                  {/* Add dynamic labels input form */}
                  <form
                    id={`secondary-add-label-form-${record.id}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddLabel(record.id, record);
                    }}
                    className="flex gap-1.5 items-center mt-0.5"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id={`secondary-label-input-${record.id}`}
                        value={labelInputs[record.id] || ''}
                        onChange={(e) => setLabelInputs(prev => ({ ...prev, [record.id]: e.target.value }))}
                        placeholder="Add label tag"
                        maxLength={24}
                        className={`w-full border rounded-lg px-2.5 py-1 text-[10px] outline-none transition-all duration-200 ${
                          isDark 
                            ? "bg-[#14192D]/40 border-white/[0.05] focus:border-purple-500/30 text-white placeholder-[#A0AEC0]/35" 
                            : "bg-slate-50 border-slate-200 focus:border-purple-400 text-slate-800 placeholder-slate-450"
                        }`}
                      />
                    </div>
                    <button
                      type="submit"
                      id={`secondary-label-submit-${record.id}`}
                      className={`p-1 border rounded-lg transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${
                        isDark 
                          ? "bg-purple-500/20 hover:bg-purple-500/35 border-purple-500/25 text-purple-200" 
                          : "bg-purple-100 border-purple-200 text-purple-750 hover:bg-purple-200"
                      }`}
                      title="Add Label"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </form>
                </div>

                {/* Secondary Account Login Verification Button & Status */}
                <div className={`mt-1.5 pt-2 border-t flex flex-row items-center justify-between gap-3 ${
                  isDark ? "border-white/[0.04]" : "border-slate-100"
                }`} id={`secondary-verification-block-${record.id}`}>
                  <div className="flex items-center gap-1.5 flex-1">
                    {verificationResults[record.id] ? (
                      verificationResults[record.id].success ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3" /> Verified Right
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">
                          <AlertCircle className="w-3 h-3 animate-pulse" /> Verified Wrong
                        </span>
                      )
                    ) : (
                      <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                        Not checked
                      </span>
                    )}
                  </div>

                  <button
                    id={`secondary-verify-btn-${record.id}`}
                    type="button"
                    disabled={verifyingId === record.id}
                    onClick={() => handleVerify(record.id, record.password)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      verifyingId === record.id
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                        : verificationResults[record.id]
                          ? verificationResults[record.id].success
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400'
                          : isDark
                            ? 'bg-[#8F5CFF] hover:bg-[#7B4AE2] text-white border-none shadow-[0_2px_8px_rgba(143,92,255,0.22)] active:scale-95'
                            : 'bg-purple-650 hover:bg-purple-750 text-white border-none shadow-xs active:scale-95 font-bold'
                    }`}
                  >
                    {verifyingId === record.id ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : verificationResults[record.id] ? (
                      <span>Re-verify</span>
                    ) : (
                      <span>Verify</span>
                    )}
                  </button>
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
