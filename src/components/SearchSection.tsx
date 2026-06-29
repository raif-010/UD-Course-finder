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
    <div className="flex flex-col gap-4" id="search-section">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-stretch w-full" id="search-form">
        {/* Rounded Input Container */}
        <div 
          className={`relative flex-1 flex items-center rounded-2xl px-4 py-3 focus-within:ring-2 transition-all duration-250 shadow-sm group ${
            isDark 
              ? "bg-[rgba(15,20,35,0.8)] border border-[rgba(255,255,255,0.06)] focus-within:border-purple-500/50 focus-within:ring-purple-500/10" 
              : "bg-white border border-slate-200 focus-within:border-purple-600 focus-within:ring-purple-600/10"
          }`}
          id="search-input-wrapper"
        >
          <Search className={`w-5 h-5 transition-colors ${isDark ? "text-slate-400 group-focus-within:text-purple-400" : "text-slate-400 group-focus-within:text-purple-650"}`} id="search-input-icon" />
          
          <input
            id="course-search-field"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search course..."
            className={`flex-1 bg-transparent border-none outline-none ml-3 text-sm font-medium tracking-wide w-full ${isDark ? "text-white placeholder-slate-500" : "text-slate-800 placeholder-slate-400"}`}
          />

          {inputValue && (
            <button
              id="clear-search-btn"
              type="button"
              onClick={handleClear}
              className={`p-1 rounded-full active:scale-90 transition-all cursor-pointer ${isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-405 hover:text-slate-800 hover:bg-slate-100"}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2.5 shrink-0" id="search-actions-row">
          {/* Strict Single Course "1" Toggle Button */}
          {onToggleExactMatchOnly && (
            <button
              id="toggle-strict-single-course-btn"
              type="button"
              onClick={onToggleExactMatchOnly}
              className={`px-4 py-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border ${
                exactMatchOnly
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.15)] font-bold"
                  : isDark
                    ? "border-[rgba(255,255,255,0.06)] bg-[rgba(15,20,35,0.8)] text-slate-400 hover:text-white hover:border-amber-500/30"
                    : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-sm hover:border-amber-400"
              }`}
              title="Toggle Strict Filter: Match accounts containing ONLY this 1 course"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                exactMatchOnly 
                  ? "bg-amber-500 text-white scale-105 shadow-sm" 
                  : isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"
              }`}>
                1
              </div>
              <span className="text-xs font-bold tracking-wide">Strict</span>
            </button>
          )}

          {/* Strict Bundle Toggle Button */}
          {onToggleExclusiveMatch && (
            <button
              id="toggle-strict-bundle-btn"
              type="button"
              onClick={onToggleExclusiveMatch}
              className={`px-4 py-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border ${
                exclusiveMatch
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-400 shadow-[0_4px_12px_rgba(168,85,247,0.15)] font-bold"
                  : isDark
                    ? "border-[rgba(255,255,255,0.06)] bg-[rgba(15,20,35,0.8)] text-slate-400 hover:text-white hover:border-purple-500/30"
                    : "border-slate-200 bg-white text-slate-600 hover:text-[#A855F7] shadow-sm hover:border-purple-450"
              }`}
              title="Toggle Bundle Strict: Only show IDs containing exclusively searched courses (no extra courses allowed)"
            >
              <Layers className={`w-4 h-4 transition-all ${
                exclusiveMatch ? "text-purple-400 scale-110" : "text-slate-400"
              }`} />
              <span className="text-xs font-bold tracking-wide">Bundle</span>
            </button>
          )}

          {/* Large Purple Gradient Search Button */}
          <button
            id="submit-search-btn"
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-[#6D3BFF] to-[#8F5CFF] hover:from-[#7F4FFF] hover:to-[#9F6FFF] text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all duration-200 active:scale-95 shadow-[0_4px_14px_rgba(109,59,255,0.2)] hover:shadow-[0_4px_20px_rgba(109,59,255,0.35)] flex items-center justify-center gap-2 cursor-pointer min-w-[100px]"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}
