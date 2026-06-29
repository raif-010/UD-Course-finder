/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, Key, Copy, Check, Trash2, Shield, HeartOff, Users, Tag, Plus, X, Download, Upload, Search, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AccountRecord } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';
import { getApiUrl } from '../utils/api';

interface FavoritesPanelProps {
  favorites: AccountRecord[];
  onRemoveFavorite: (id: string) => void;
  onClearAll: () => void;
  soundEnabled: boolean;
  onShowNotification: (message: string) => void;
  onUpdateLabels: (id: string, labels: string[]) => void;
  onImportFavorites?: (records: AccountRecord[]) => void;
  theme?: 'dark' | 'light';
}

export default function FavoritesPanel({
  favorites,
  onRemoveFavorite,
  onClearAll,
  soundEnabled,
  onShowNotification,
  onUpdateLabels,
  onImportFavorites,
  theme = 'dark'
}: FavoritesPanelProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: 'id' | 'password' | null }>({});
  const [labelInputs, setLabelInputs] = useState<{ [id: string]: string }>({});
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const isDark = theme === 'dark';

  const handleVerify = async (id: string, passwordString?: string) => {
    const pw = passwordString || `password_${id}`;
    setVerifyingId(id);
    setVerificationResults(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    try {
      const response = await fetch(getApiUrl('/api/verify-account'), {
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

  const handleExportFavorites = () => {
    if (favorites.length === 0) {
      onShowNotification("⚠ No favorites to export!");
      return;
    }
    try {
      const dataStr = JSON.stringify({
        source: "UD-Premium-Account-Keeper",
        type: "favorites_backup",
        exportedAt: new Date().toISOString(),
        favorites: favorites
      }, null, 2);
      
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `favorites_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onShowNotification("📥 Favorites exported successfully!");
    } catch (e) {
      console.error("Export failed", e);
      onShowNotification("❌ Export failed");
    }
  };

  const handleImportClick = () => {
    const fileInput = document.getElementById("import-favorites-file-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        let importedRecords: AccountRecord[] = [];
        if (json && Array.isArray(json)) {
          importedRecords = json;
        } else if (json && json.favorites && Array.isArray(json.favorites)) {
          importedRecords = json.favorites;
        } else {
          onShowNotification("⚠ Invalid backup file format");
          return;
        }

        if (importedRecords.length === 0) {
          onShowNotification("⚠ No records found in the backup file");
          return;
        }

        if (onImportFavorites) {
          onImportFavorites(importedRecords);
        }
        
        event.target.value = '';
      } catch (err) {
        console.error("Import failed", err);
        onShowNotification("❌ Failed to parse backup file");
      }
    };
    reader.readAsText(file);
  };

  // Compute unique labels and their appearance counts
  const allUniqueLabels = React.useMemo(() => {
    const labels = favorites.flatMap(rec => rec.labels || []);
    return Array.from(new Set(labels)).sort();
  }, [favorites]);

  const labelCounts = React.useMemo(() => {
    return favorites.reduce<{ [label: string]: number }>((acc, rec) => {
      const labels = rec.labels || [];
      labels.forEach(l => {
        acc[l] = (acc[l] || 0) + 1;
      });
      return acc;
    }, {});
  }, [favorites]);

  // Safe active filter that gets reset if that label no longer exists
  const activeFilter = selectedLabelFilter && allUniqueLabels.includes(selectedLabelFilter)
    ? selectedLabelFilter
    : null;

  const searchedFavorites = React.useMemo(() => {
    let result = favorites;
    
    // Filter by label if selected
    if (activeFilter) {
      result = result.filter(rec => (rec.labels || []).includes(activeFilter));
    }
    
    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(rec => {
        if (rec.id.toLowerCase().includes(q)) return true;
        if (rec.password && rec.password.toLowerCase().includes(q)) return true;
        if (rec.courses.some(c => c.toLowerCase().includes(q))) return true;
        if (rec.labels && rec.labels.some(l => l.toLowerCase().includes(q))) return true;
        return false;
      });
    }
    
    return result;
  }, [favorites, activeFilter, searchQuery]);

  const handleAddLabel = (recordId: string) => {
    const rawVal = labelInputs[recordId] || '';
    const labelVal = rawVal.trim();
    if (!labelVal) return;

    const record = favorites.find(r => r.id === recordId);
    if (!record) return;

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

  const handleRemoveLabel = (recordId: string, labelToRemove: string) => {
    const record = favorites.find(r => r.id === recordId);
    if (!record) return;

    const currentLabels = record.labels || [];
    const nextLabels = currentLabels.filter(l => l !== labelToRemove);
    onUpdateLabels(recordId, nextLabels);
    onShowNotification(`Removed label: ${labelToRemove}`);
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
    } catch (e) {}
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

  return (
    <div className="flex flex-col gap-5" id="favorites-panel-root">
      <div className="flex items-center justify-between" id="favorites-header">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-850"}`}>Favorites</h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>Your pinned and fast-access credentials</p>
        </div>

        {favorites.length > 0 && (
          <button
            id="clear-all-favorites-btn"
            onClick={onClearAll}
            className="text-xs font-bold text-red-500 hover:text-red-650 flex items-center gap-1.5 hover:bg-red-500/5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Backup & Restore Action Bar */}
      <div className={`border p-3.5 rounded-[20px] flex items-center justify-between gap-3 ${
        isDark ? "bg-white/[0.02] border-white/[0.08]" : "bg-white border-slate-200 shadow-sm"
      }`} id="backup-restore-action-bar">
        <div className="flex flex-col gap-0.5">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>Backup & Restore</span>
          <span className={`text-[10px] ${isDark ? "text-[#A0AEC0]/60" : "text-slate-400"}`}>Save or load your bookmarked keys</span>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            id="import-favorites-file-input" 
            accept=".json" 
            onChange={handleImportFile} 
            className="hidden" 
          />
          <button
            type="button"
            onClick={handleImportClick}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
              isDark 
                ? "bg-purple-500/15 hover:bg-purple-500/35 border-purple-500/35 text-purple-300 hover:text-purple-100" 
                : "bg-purple-100/50 border-purple-200 text-purple-750 hover:bg-purple-100 hover:text-purple-800 hover:border-purple-300 font-bold"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={handleExportFavorites}
            disabled={favorites.length === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              favorites.length > 0
                ? isDark 
                  ? "bg-white/[0.04] text-white border-white/[0.08] hover:bg-white/[0.1] active:scale-95"
                  : "bg-slate-50 text-slate-700 border-slate-250 hover:bg-slate-100/50 active:scale-95 shadow-xs"
                : "opacity-40 cursor-not-allowed bg-transparent border-white/[0.01] text-slate-405"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div 
          className={`rounded-[20px] border border-dashed p-10 text-center flex flex-col items-center justify-center gap-3 ${
            isDark 
              ? "border-white/[0.1] bg-[rgba(20,25,45,0.2)] text-[#A0AEC0]" 
              : "border-slate-300 bg-slate-50/50 text-slate-500"
          }`} 
          id="empty-favorites-view"
        >
          <Heart className={`w-[42px] h-[42px] animate-pulse ${isDark ? "text-[#A0AEC0]/30" : "text-slate-350"}`} />
          <h3 className="text-sm font-semibold">No Pinned Credentials</h3>
          <p className={`text-xs max-w-[220px] ${isDark ? "text-[#A0AEC0]/60" : "text-slate-500"}`}>Tap the heart icon on any random or alternative record to bookmark them here!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4" id="favorites-items-list-container">
          {/* Favorites Search Bar */}
          <div className="relative flex items-center" id="favorites-search-bar-wrapper">
            <Search className={`absolute left-3.5 w-4 h-4 ${isDark ? "text-purple-400/70" : "text-purple-650/70"}`} />
            <input
              type="text"
              id="favorites-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search favorites by ID, courses, labels..."
              className={`w-full pl-10 pr-10 py-3 text-xs font-semibold rounded-2xl border outline-none transition-all duration-350 shadow-md ${
                isDark 
                  ? "bg-[#0c0f20] border-purple-500/15 focus:border-purple-500/45 text-white placeholder-white/20 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                  : "bg-white border-slate-205 focus:border-purple-400 text-slate-800 placeholder-slate-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.08)]"
              }`}
            />
            {searchQuery && (
              <button
                id="favorites-search-clear-btn"
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-3.5 p-1 rounded-full transition-colors ${
                  isDark ? "hover:bg-white/5 text-[#A0AEC0]" : "hover:bg-slate-100 text-slate-400"
                }`}
                title="Clear Search Query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Label Selector Filter Dropdown */}
          {allUniqueLabels.length > 0 && (
            <div className="relative" id="favorites-label-filter-dropdown-container">
              <div className={`border p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? "bg-[rgba(20,25,45,0.4)] border-white/[0.04]" : "bg-white border-slate-200 shadow-sm"
              }`} id="favorites-label-filter-bar">
                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>
                  <Tag className={`w-3.5 h-3.5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                  <span>Filter by Label</span>
                </div>
                
                <div className="relative flex-1 sm:max-w-xs" id="dropdown-select-wrapper">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isDark
                        ? "bg-[#0c0f20] border-white/10 text-white hover:border-purple-500/40"
                        : "bg-white border-slate-205 text-slate-800 hover:border-purple-400"
                    }`}
                  >
                    <span className="truncate">
                      {activeFilter ? `Label: ${activeFilter} (${labelCounts[activeFilter] || 0})` : 'All Labels / No Filter'}
                    </span>
                    {isDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 ml-2 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)} 
                      />
                      <div 
                        className={`absolute right-0 left-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl border p-1 shadow-xl z-20 ${
                          isDark 
                            ? "bg-[#0c0f20] border-white/10 text-slate-200" 
                            : "bg-white border-slate-200 text-slate-800"
                        }`}
                        id="dropdown-options"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLabelFilter(null);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                            !activeFilter
                              ? isDark ? "bg-purple-500/10 text-purple-300" : "bg-purple-50 text-purple-850"
                              : isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                          }`}
                        >
                          <span>Show All Labels</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            !activeFilter ? "bg-purple-500/20 text-purple-300" : "bg-slate-100 text-slate-600"
                          }`}>
                            {favorites.length}
                          </span>
                        </button>
                        
                        <div className={`my-1 border-t ${isDark ? "border-white/5" : "border-slate-100"}`} />

                        {allUniqueLabels.map((lbl) => {
                          const count = labelCounts[lbl] || 0;
                          const isSelected = activeFilter === lbl;
                          return (
                            <button
                              type="button"
                              key={lbl}
                              onClick={() => {
                                setSelectedLabelFilter(isSelected ? null : lbl);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? isDark ? "bg-purple-550/25 text-purple-300 font-bold" : "bg-purple-50 text-purple-800 font-bold"
                                  : isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                              }`}
                            >
                              <span>{lbl}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected 
                                  ? isDark ? "bg-purple-500/30 text-purple-200" : "bg-purple-100 text-purple-700"
                                  : isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {searchedFavorites.length === 0 ? (
            <div 
              className={`rounded-[20px] border border-dashed p-10 text-center flex flex-col items-center justify-center gap-2.5 ${
                isDark 
                  ? "border-white/[0.08] bg-[rgba(20,25,45,0.2)] text-[#A0AEC0]" 
                  : "border-slate-200 bg-slate-50/50 text-slate-400"
              }`} 
              id="empty-favorites-search"
            >
              <Search className={`w-8 h-8 ${isDark ? "text-purple-400/30" : "text-purple-500/40"}`} />
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-500/75">No Search Matches</h3>
              <p className={`text-[11px] max-w-[220px] leading-relaxed ${isDark ? "text-slate-450" : "text-slate-500"}`}>
                No pinned credentials match your query "{searchQuery}".
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4" id="favorites-items-list-cards">
              {searchedFavorites.map((record) => (
            <div
              key={record.id}
              id={`favorite-card-${record.id}`}
              className={`rounded-[20px] border p-[18px] flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                isDark 
                  ? "border-[rgba(255,255,255,0.06)] bg-[rgba(20,25,45,0.85)]" 
                  : "border-slate-200 bg-white text-slate-800 shadow-sm"
              }`}
            >
              {/* Top Row: Shield & Delete Favorite */}
              <div className="flex items-center justify-between" id={`favorite-top-${record.id}`}>
                <div className="flex items-center gap-2" id={`favorite-badge-badge-${record.id}`}>
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? "text-[#A855F7]" : "text-purple-700"}`}>Pinned Credential</span>
                </div>
                <button
                  id={`favorite-remove-${record.id}`}
                  onClick={() => onRemoveFavorite(record.id)}
                  className="p-1.5 rounded-lg text-rose-450 hover:bg-rose-500/10 active:scale-95 transition-all shrink-0 cursor-pointer"
                  title="Remove Bookmark"
                >
                  <HeartOff className="w-4 h-4" />
                </button>
              </div>

              {/* Central Information */}
              <div className={`grid grid-cols-2 gap-4 pb-1 border-b ${isDark ? "border-white/[0.04]" : "border-slate-100"}`} id={`favorite-info-grid-${record.id}`}>
                {/* ID section */}
                <div id={`favorite-id-field-${record.id}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-[#A0AEC0]" : "text-slate-450"}`}>ID</span>
                  <div className={`flex items-center justify-between mt-1 select-all font-bold tracking-tight text-md ${isDark ? "text-white" : "text-slate-805"}`}>
                    <span>{record.id}</span>
                    <button
                      id={`favorite-copy-id-${record.id}`}
                      onClick={() => handleCopy(record.id, record.id, 'id')}
                      className={`p-1 rounded transition-all cursor-pointer ${isDark ? "text-purple-300 hover:text-white hover:bg-white/5" : "text-purple-600 hover:text-purple-800 hover:bg-slate-100"}`}
                    >
                      {copiedStates[record.id] === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-505 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Password section */}
                <div id={`favorite-pw-field-${record.id}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-[#A0AEC0]" : "text-slate-450"}`}>Password</span>
                  <div className={`flex items-center justify-between mt-1 select-all font-bold font-mono tracking-tight text-md ${isDark ? "text-white" : "text-slate-805"}`}>
                    <span>{record.password || `password_${record.id}`}</span>
                    <button
                      id={`favorite-copy-pw-${record.id}`}
                      onClick={() => handleCopy(record.password || `password_${record.id}`, record.id, 'password')}
                      className={`p-1 rounded transition-all cursor-pointer ${isDark ? "text-purple-300 hover:text-white hover:bg-white/5" : "text-purple-650 hover:text-purple-800 hover:bg-slate-100"}`}
                    >
                      {copiedStates[record.id] === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-550 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Attached Courses list summary */}
              <div className="flex flex-col gap-2 text-xs mt-1" id={`favorite-footer-meta-${record.id}`}>
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-450"}`}>Linked Courses:</span>
                  <ul className={`list-disc pl-3 space-y-1 ${isDark ? "text-[#A0AEC0]" : "text-slate-600 font-medium"}`}>
                    {record.courses.map((course, i) => (
                      <li key={i} className="text-[11px] leading-relaxed">
                        {course}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Account Login Verification Button & Status */}
              <div className={`mt-2 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? "border-white/[0.06]" : "border-slate-100"
              }`} id={`favorite-verification-block-${record.id}`}>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-[#A0AEC0]" : "text-slate-450"}`}>
                    Uttoron Academy Login Check
                  </span>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      {verificationResults[record.id] ? (
                        verificationResults[record.id].success ? (
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
                    {verificationResults[record.id] && !verificationResults[record.id].success && (
                      <p className="text-[11px] font-medium text-rose-450 leading-tight max-w-xs mt-0.5">
                        Reason: {verificationResults[record.id].message}
                      </p>
                    )}
                    {verificationResults[record.id] && verificationResults[record.id].success && (
                      <p className="text-[11px] font-medium text-emerald-450 leading-tight max-w-xs mt-0.5">
                        {verificationResults[record.id].message}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  id={`favorite-verify-login-btn-${record.id}`}
                  type="button"
                  disabled={verifyingId === record.id}
                  onClick={() => handleVerify(record.id, record.password)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    verifyingId === record.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                      : verificationResults[record.id]
                        ? verificationResults[record.id].success
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400'
                        : isDark
                          ? 'bg-[#8F5CFF] hover:bg-[#7B4AE2] text-white border-none shadow-[0_4px_14px_rgba(143,92,255,0.32)] active:scale-95'
                          : 'bg-purple-650 hover:bg-purple-750 text-white border-none shadow-xs active:scale-95 font-bold'
                  }`}
                >
                  {verifyingId === record.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : verificationResults[record.id] ? (
                    <span>Verify Again</span>
                  ) : (
                    <span>Check Credentials</span>
                  )}
                </button>
              </div>

              {/* Dynamic Multiple Labels/Tags Section */}
              <div className={`flex flex-col gap-2.5 pt-3 border-t text-xs ${isDark ? "border-white/[0.04]" : "border-slate-100"}`} id={`favorite-labels-section-${record.id}`}>
                <div className="flex items-center justify-between" id={`favorite-labels-header-${record.id}`}>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>
                    <Tag className="w-3 h-3 text-purple-500" />
                    <span>Labels</span>
                  </span>
                  {record.labels && record.labels.length > 0 && (
                    <span className="text-[9px] font-bold text-purple-500 italic">
                      {record.labels.length} {record.labels.length === 1 ? 'label' : 'labels'}
                    </span>
                  )}
                </div>

                {/* Displaying Labels as sleek pill badges */}
                <div className="flex flex-wrap gap-1.5" id={`favorite-labels-pills-${record.id}`}>
                  {record.labels && record.labels.length > 0 ? (
                    record.labels.map((label, labelIdx) => (
                      <div
                        key={labelIdx}
                        id={`favorite-label-pill-${record.id}-${label}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-normal transition-all duration-150 ${
                          isDark 
                            ? "bg-purple-500/10 border border-purple-500/25 text-[#D8B4FE] hover:bg-purple-500/15" 
                            : "bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100"
                        }`}
                      >
                        <span>{label}</span>
                        <button
                          type="button"
                          id={`favorite-label-remove-btn-${record.id}-${label}`}
                          onClick={() => handleRemoveLabel(record.id, label)}
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
                  id={`favorite-add-label-form-${record.id}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddLabel(record.id);
                  }}
                  className="flex gap-2 items-center mt-0.5"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id={`favorite-label-input-${record.id}`}
                      value={labelInputs[record.id] || ''}
                      onChange={(e) => setLabelInputs(prev => ({ ...prev, [record.id]: e.target.value }))}
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
                    id={`favorite-label-submit-${record.id}`}
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

            </div>
          ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
