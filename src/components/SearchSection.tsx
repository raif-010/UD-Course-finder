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
}

export default function SearchSection({ 
  onSearch, 
  activeSearchTerm, 
  exactMatchOnly = false,
  onToggleExactMatchOnly,
  exclusiveMatch = false,
  onToggleExclusiveMatch
}: SearchSectionProps) {
  const [inputValue, setInputValue] = useState(activeSearchTerm);

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
          className="relative flex-1 flex items-center bg-[rgba(20,25,45,0.85)] border border-[rgba(255,255,255,0.08)] rounded-[20px] px-4 py-3.5 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/10 transition-all duration-250 shadow-md group"
          id="search-input-wrapper"
        >
          <Search className="w-5 h-5 text-[#A0AEC0] group-focus-within:text-purple-400 transition-colors" id="search-input-icon" />
          
          <input
            id="course-search-field"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search course..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-[#A0AEC0] ml-3 text-sm font-medium tracking-wide w-full"
          />

          {inputValue && (
            <button
              id="clear-search-btn"
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-[#A0AEC0] hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
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
                ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-[0_4px_15px_rgba(245,158,11,0.25)]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.85)] text-[#A0AEC0] hover:text-white hover:border-amber-500/30"
            }`}
            title="Toggle Strict Filter: Match accounts containing ONLY this 1 course"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
              exactMatchOnly ? "bg-amber-400 text-slate-950 scale-105" : "bg-white/10 text-white"
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
                ? "border-purple-500 bg-purple-500/15 text-purple-300 shadow-[0_4px_15px_rgba(168,85,247,0.25)]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.85)] text-[#A0AEC0] hover:text-white hover:border-purple-500/30"
            }`}
            title="Toggle Bundle Strict: Only show IDs containing exclusively searched courses (no extra courses allowed)"
          >
            <Layers className={`w-4 h-4 transition-all ${
              exclusiveMatch ? "text-purple-400 scale-110" : "text-[#A0AEC0]"
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
      <div className="bg-[rgba(20,25,45,0.45)] border border-dashed border-white/[0.04] rounded-xl px-3 py-2.5 text-[11px] text-[#A0AEC0] flex flex-col gap-2 leading-relaxed" id="search-feature-tips">
        <div className="flex items-start gap-1.5">
          <span className="text-[#A855F7] font-bold shrink-0">💡 Tip:</span>
          <span className="flex-1">
            If courses have punctuation (like <span className="text-purple-300">Bangla-English</span>), search with space-separated words like <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-purple-300">"Bangla English"</span>.
          </span>
        </div>
        <div className="border-t border-white/[0.04] pt-2 flex flex-col gap-1 text-[10.5px]">
          <div>• <strong className="text-amber-400">Strict mode (1)</strong>: Only shows IDs consisting of <em className="underline not-italic">exactly one</em> course matching your search.</div>
          <div>• <strong className="text-purple-400">Bundle mode</strong>: Hides IDs containing <em className="underline not-italic">any extra/additional</em> courses outside your searched ones.</div>
        </div>
      </div>

      {/* Popular/Recent Searches Container */}
      <div className="flex flex-col gap-2" id="popular-searches-container">
        <span className="text-xs font-semibold text-[#A0AEC0]/80 tracking-wider">
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
                    ? "border-purple-500/50 bg-gradient-to-r from-[#6D3BFF]/20 to-[#8F5CFF]/20 text-purple-200"
                    : "border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.5)] text-[#A0AEC0] hover:text-white hover:border-[#A855F7]/30 hover:bg-[#14192D]/80"
                }`}
              >
                <History className={`w-3.5 h-3.5 ${isSelected ? "text-purple-400" : "text-[#A0AEC0]/70"}`} />
                <span>{term}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
