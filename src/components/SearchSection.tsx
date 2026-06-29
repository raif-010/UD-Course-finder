/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, X, Layers, History, Sparkles } from 'lucide-react';
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full" id="search-form">
        {/* Row 1: Fully Spacious Search Bar */}
        <div className="flex gap-2 w-full items-center" id="search-input-row">
          <div 
            className={`relative flex-1 flex items-center rounded-2xl px-4 py-3.5 focus-within:ring-2 transition-all duration-250 shadow-sm group ${
              isDark 
                ? "bg-[rgba(20,25,45,0.85)] border border-[rgba(255,255,255,0.08)] focus-within:border-purple-500/50 focus-within:ring-purple-500/10" 
                : "bg-white border border-slate-200 focus-within:border-purple-600 focus-within:ring-purple-600/10"
            }`}
            id="search-input-wrapper"
          >
            <Search className={`w-5 h-5 transition-colors ${isDark ? "text-slate-400 group-focus-within:text-purple-400" : "text-slate-400 group-focus-within:text-purple-600"}`} id="search-input-icon" />
            
            <input
              id="course-search-field"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search course..."
              className={`flex-1 bg-transparent border-none outline-none ml-2.5 text-sm font-medium tracking-wide w-full ${isDark ? "text-white placeholder-slate-500" : "text-slate-800 placeholder-slate-400"}`}
            />

            {inputValue && (
              <button
                id="clear-search-btn"
                type="button"
                onClick={handleClear}
                className={`p-1 rounded-full active:scale-90 transition-all cursor-pointer ${isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            id="submit-search-btn"
            type="submit"
            className="px-5 py-3.5 bg-gradient-to-r from-[#6D3BFF] to-[#8F5CFF] hover:from-[#7F4FFF] hover:to-[#9F6FFF] text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all duration-200 active:scale-95 shadow-[0_4px_14px_rgba(109,59,255,0.2)] flex items-center justify-center gap-1.5 cursor-pointer h-[48px] shrink-0"
          >
            <span>Search</span>
          </button>
        </div>

        {/* Row 2: Strict Mode Toggles Side-by-Side */}
        <div className="flex gap-2 w-full justify-start items-center" id="search-filters-row">
          {onToggleExactMatchOnly && (
            <button
              id="toggle-strict-single-course-btn"
              type="button"
              onClick={onToggleExactMatchOnly}
              className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border text-xs font-bold ${
                exactMatchOnly
                  ? isDark
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.15)]"
                    : "border-amber-400 bg-amber-50/70 text-amber-700 shadow-sm"
                  : isDark
                    ? "border-white/[0.04] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:border-white/[0.08]"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-sm hover:border-slate-300"
              }`}
              title="Toggle Strict Filter: Match accounts containing ONLY this 1 course"
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                exactMatchOnly 
                  ? "bg-amber-500 text-white" 
                  : isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"
              }`}>
                1
              </div>
              <span>Strict Mode</span>
            </button>
          )}

          {onToggleExclusiveMatch && (
            <button
              id="toggle-strict-bundle-btn"
              type="button"
              onClick={onToggleExclusiveMatch}
              className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border text-xs font-bold ${
                exclusiveMatch
                  ? isDark
                    ? "border-purple-500/50 bg-purple-500/10 text-purple-400 shadow-[0_2px_8px_rgba(168,85,247,0.15)]"
                    : "border-purple-400 bg-purple-50/70 text-purple-700 shadow-sm"
                  : isDark
                    ? "border-white/[0.04] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:border-white/[0.08]"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-sm hover:border-purple-450"
              }`}
              title="Toggle Bundle Strict: Only show IDs containing exclusively searched courses"
            >
              <Layers className={`w-3.5 h-3.5 ${exclusiveMatch ? "text-purple-400" : "text-slate-400"}`} />
              <span>Bundle Mode</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
