/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, Key, Copy, Check, Trash2, Shield, HeartOff, Users, Tag, Plus, X, Download, Upload } from 'lucide-react';
import { AccountRecord } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';

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
  const isDark = theme === 'dark';

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

  const filteredFavorites = activeFilter
    ? favorites.filter(rec => (rec.labels || []).includes(activeFilter))
    : favorites;

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
          {/* Label Selector Filter Chips */}
          {allUniqueLabels.length > 0 && (
            <div className={`border p-4 rounded-[20px] flex flex-col gap-3 ${
              isDark ? "bg-[rgba(20,25,45,0.4)] border-white/[0.04]" : "bg-white border-slate-200 shadow-sm"
            }`} id="favorites-label-filter-bar">
              <div className="flex items-center justify-between" id="filter-bar-header">
                <div className={`flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>
                  <Tag className={`w-3.5 h-3.5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                  <span>Filter by Custom Label ({allUniqueLabels.length})</span>
                </div>
                {activeFilter && (
                  <button
                    id="clear-label-filter-badge-btn"
                    type="button"
                    onClick={() => setSelectedLabelFilter(null)}
                    className="text-[10px] text-purple-650 hover:text-purple-800 flex items-center gap-1 hover:underline cursor-pointer font-bold"
                  >
                    Reset Filter <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2" id="label-filter-chips">
                {/* Individual Labels list */}
                {allUniqueLabels.map((lbl) => {
                  const count = labelCounts[lbl] || 0;
                  const isSelected = activeFilter === lbl;
                  return (
                    <button
                      type="button"
                      key={lbl}
                      id={`filter-chip-${lbl}`}
                      onClick={() => setSelectedLabelFilter(isSelected ? null : lbl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-purple-650 text-white border-purple-400 shadow-[0_4px_12px_rgba(168,85,247,0.22)]"
                          : isDark
                            ? "bg-white/[0.01] text-[#A0AEC0] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] hover:text-white"
                            : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span>{lbl}</span>
                      <span className={`text-[10.5px] font-black px-1.5 py-0.5 rounded-md ${
                        isSelected ? "bg-purple-500 text-white" : isDark ? "bg-white/10 text-[#A0AEC0]" : "bg-slate-200/50 text-slate-600"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4" id="favorites-items-list-cards">
            {filteredFavorites.map((record) => (
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
        </div>
      )}
    </div>
  );
}
