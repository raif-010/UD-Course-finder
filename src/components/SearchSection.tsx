/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, X, History, Layers } from 'lucide-react';
import { RECENT_SEARCHES_LIST } from '../data';

interface SearchSectionProps {
  onSearch: (term: string) => void;
  activeSearchTerm: string;
  exactMatchOnly?: boolean;
  onToggleExactMatchOnly?: () => void;
  exclusiveMatch?: boolean;
  onToggleExclusiveMatch?: () => void;
  theme?: 'dark' | 'light';
}

export default function SearchSection({ 
  onSearch, 
  activeSearchTerm, 
  exactMatchOnly = false,
  onToggleExactMatchOnly,
  exclusiveMatch = false,
  onToggleExclusiveMatch,
  theme = 'dark'
}: SearchSectionProps) {
  const [inputValue, setInputValue] = useState(activeSearchTerm);
  const isDark = theme === 'dark';

  // Sync state if activeSearchTerm changes externally (e.g. from clicked chip)
  React.useEffect(() => {
    setInputValue(activeSearchTerm);
  }, [activeSearchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  const handleChipClick = (chipTerm: string) => {
    setInputValue(chipTerm);
    onSearch(chipTerm);
  };

  return (
    <div className="flex flex-col gap-3.5" id="search-section">
      <form onSubmit={handleSubmit} className="flex gap-2.5 items-center w-full" id="search-form">
        {/* Rounded Input Container */}
        <div 
          className={`relative flex-1 flex items-center rounded-[20px] px-4 py-3.5 focus-within:ring-2 transition-all duration-250 shadow-md group ${
            isDark 
              ? "bg-[rgba(20,25,45,0.85)] border border-[rgba(255,255,255,0.08)] focus-within:border-purple-500/50 focus-within:ring-purple-500/10" 
              : "bg-white border border-slate-200 focus-within:border-purple-600 focus-within:ring-purple-650/10"
          }`}
          id="search-input-wrapper"
        >
          <Search className={`w-5 h-5 transition-colors ${isDark ? "text-[#A0AEC0] group-focus-within:text-purple-400" : "text-slate-400 group-focus-within:text-purple-650"}`} id="search-input-icon" />
          
          <input
            id="course-search-field"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search course..."
            className={`flex-1 bg-transparent border-none outline-none ml-3 text-sm font-medium tracking-wide w-full ${isDark ? "text-white placeholder-[#A0AEC0]" : "text-slate-800 placeholder-slate-450"}`}
          />

          {inputValue && (
            <button
              id="clear-search-btn"
              type="button"
              onClick={handleClear}
              className={`p-1 rounded-full active:scale-90 transition-all cursor-pointer ${isDark ? "text-[#A0AEC0] hover:text-white hover:bg-white/5" : "text-slate-450 hover:text-slate-800 hover:bg-slate-100"}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Strict Single Course "1" Toggle Button */}
        {onToggleExactMatchOnly && (
          <button
            id="toggle-strict-single-course-btn"
            type="button"
            onClick={onToggleExactMatchOnly}
            className={`p-3 rounded-[20px] transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer h-full shrink-0 border ${
              exactMatchOnly
                ? "border-amber-500 bg-amber-500/15 text-amber-600 shadow-[0_4px_15px_rgba(245,158,11,0.25)] font-bold"
                : isDark
                  ? "border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.85)] text-[#A0AEC0] hover:text-white hover:border-amber-500/30"
                  : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-sm hover:border-amber-400"
            }`}
            title="Toggle Strict Filter: Match accounts containing ONLY this 1 course"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
              exactMatchOnly 
                ? "bg-amber-550 text-white scale-105" 
                : isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              1
            </div>
            <span className="text-[10px] font-extrabold tracking-widest uppercase hidden xs:inline">Strict</span>
          </button>
        )}

        {/* Strict Bundle Toggle Button */}
        {onToggleExclusiveMatch && (
          <button
            id="toggle-strict-bundle-btn"
            type="button"
            onClick={onToggleExclusiveMatch}
            className={`p-3 rounded-[20px] transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer h-full shrink-0 border ${
              exclusiveMatch
                ? "border-purple-500 bg-purple-500/15 text-purple-600 shadow-[0_4px_15px_rgba(168,85,247,0.25)] font-bold"
                : isDark
                  ? "border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.85)] text-[#A0AEC0] hover:text-white hover:border-purple-500/30"
                  : "border-slate-200 bg-white text-slate-600 hover:text-[#A855F7] shadow-sm hover:border-purple-400"
            }`}
            title="Toggle Bundle Strict: Only show IDs containing exclusively searched courses (no extra courses allowed)"
          >
            <Layers className={`w-4 h-4 transition-all ${
              exclusiveMatch ? "text-purple-600 scale-110" : "text-slate-400"
            }`} />
            <span className="text-[10px] font-extrabold tracking-widest uppercase hidden xs:inline">Bundle</span>
          </button>
        )}

        {/* Large Purple Gradient Search Button */}
        <button
          id="submit-search-btn"
          type="submit"
          className="px-6 py-4 bg-gradient-to-r from-[#6D3BFF] to-[#8F5CFF] hover:from-[#7F4FFF] hover:to-[#9F6FFF] text-white text-sm font-extrabold uppercase tracking-widest rounded-[20px] transition-all duration-200 active:scale-95 shadow-[0_4px_20px_rgba(109,59,255,0.3)] hover:shadow-[0_4px_25px_rgba(109,59,255,0.45)] flex items-center gap-2 cursor-pointer h-full shrink-0"
        >
          <Search className="w-4 h-4 stroke-[2.5]" />
          <span>Search</span>
        </button>
      </form>

      {/* Interactive Quick Help Badge */}
      <div 
        className={`rounded-xl px-3 py-2.5 text-[11px] flex flex-col gap-2 leading-relaxed border ${
          isDark 
            ? "bg-[rgba(20,25,45,0.45)] border-dashed border-white/[0.04] text-[#A0AEC0]" 
            : "bg-purple-50/50 border-dashed border-purple-200/50 text-slate-650"
        }`} 
        id="search-feature-tips"
      >
        <div className="flex items-start gap-1.5">
          <span className={`font-bold shrink-0 ${isDark ? "text-[#A855F7]" : "text-purple-650"}`}>💡 Tip:</span>
          <span className="flex-1">
            If courses have punctuation (like <span className={isDark ? "text-purple-300" : "text-purple-800 font-semibold"}>Bangla-English</span>), search with space-separated words like <span className={`font-mono px-1.5 py-0.5 rounded ${isDark ? "bg-white/5 text-purple-300" : "bg-purple-100/50 text-purple-805"}`}>"Bangla English"</span>.
          </span>
        </div>
        <div className={`border-t pt-2 flex flex-col gap-1 text-[10.5px] ${isDark ? "border-white/[0.04]" : "border-purple-100"}`}>
          <div>• <strong className={isDark ? "text-amber-400" : "text-amber-750 font-bold"}>Strict mode (1)</strong>: Only shows IDs consisting of <em className="underline not-italic font-semibold">exactly one</em> course matching your search.</div>
          <div>• <strong className={isDark ? "text-purple-400" : "text-purple-750 font-bold"}>Bundle mode</strong>: Hides IDs containing <em className="underline not-italic font-semibold">any extra/additional</em> courses outside your searched ones.</div>
        </div>
      </div>

      {/* Popular/Recent Searches Container */}
      <div className="flex flex-col gap-2" id="popular-searches-container">
        <span className={`text-xs font-semibold tracking-wider ${isDark ? "text-[#A0AEC0]/80" : "text-slate-500"}`}>
          Popular searches
        </span>
        
        {/* Horizontal Chips Wrap */}
        <div className="flex flex-wrap gap-2" id="popular-searches-chips">
          {RECENT_SEARCHES_LIST.map((term, i) => {
            const isSelected = activeSearchTerm.toLowerCase() === term.toLowerCase();
            return (
              <button
                key={term + i}
                id={`popular-chip-${i}`}
                type="button"
                onClick={() => handleChipClick(term)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                  isSelected
                    ? isDark 
                      ? "border-purple-500/50 bg-gradient-to-r from-[#6D3BFF]/20 to-[#8F5CFF]/20 text-purple-200"
                      : "border-purple-400 bg-purple-50 text-purple-800 shadow-sm"
                    : isDark
                      ? "border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.5)] text-[#A0AEC0] hover:text-white hover:border-[#A855F7]/30 hover:bg-[#14192D]/80"
                      : "border-slate-200 bg-white text-slate-650 hover:text-purple-750 hover:border-purple-250 hover:bg-purple-100/30"
                }`}
              >
                <History className={`w-3.5 h-3.5 ${isSelected ? "text-purple-500" : isDark ? "text-[#A0AEC0]/70" : "text-slate-400"}`} />
                <span>{term}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
