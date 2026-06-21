/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History, Search, ArrowRight, Trash2 } from 'lucide-react';
import { SearchHistory } from '../types';

interface HistoryPanelProps {
  history: SearchHistory[];
  onSelectSearch: (term: string) => void;
  onClearHistory: () => void;
  theme?: 'dark' | 'light';
}

export default function HistoryPanel({ history, onSelectSearch, onClearHistory, theme = 'dark' }: HistoryPanelProps) {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-5" id="history-panel-root">
      <div className="flex items-center justify-between" id="history-header">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-850"}`}>Search History</h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>Quickly access and reload past course queries</p>
        </div>

        {history.length > 0 && (
          <button
            id="clear-all-history-btn"
            onClick={onClearHistory}
            className="text-xs font-bold text-red-500 hover:text-red-650 flex items-center gap-1.5 hover:bg-red-500/5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div 
          className={`rounded-[20px] border border-dashed p-10 text-center flex flex-col items-center justify-center gap-3 ${
            isDark 
              ? "border-white/[0.1] bg-[rgba(20,25,45,0.2)] text-[#A0AEC0]" 
              : "border-slate-300 bg-slate-50/50 text-slate-500"
          }`} 
          id="empty-history-view"
        >
          <History className={`w-[42px] h-[42px] animate-pulse ${isDark ? "text-[#A0AEC0]/30" : "text-slate-300"}`} />
          <h3 className="text-sm font-semibold">No Queries Logged</h3>
          <p className={`text-xs max-w-[220px] ${isDark ? "text-[#A0AEC0]/60" : "text-slate-500"}`}>Any keywords you search on the homepage will be preserved here!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5" id="history-items-list">
          {history.map((item) => (
            <button
              key={item.id}
              id={`history-item-${item.id}`}
              onClick={() => onSelectSearch(item.term)}
              className={`w-full text-left rounded-[20px] p-4 border transition-all flex items-center justify-between group cursor-pointer ${
                isDark 
                  ? "border-white/[0.06] bg-[rgba(20,25,45,0.6)] backdrop-blur-md hover:border-purple-500/30 hover:bg-[rgba(20,25,45,0.85)] active:scale-99" 
                  : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/20 active:scale-99 text-slate-800 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3.5" id={`history-meta-${item.id}`}>
                <div className="w-[38px] h-[38px] rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors" id={`history-icon-${item.id}`}>
                  <Search className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className={`font-bold text-md tracking-tight transition-colors ${isDark ? "text-white group-hover:text-purple-300" : "text-slate-850 group-hover:text-purple-750"}`}>{item.term}</div>
                  <div className={`text-[10px] font-bold flex items-center gap-1.5 mt-0.5 ${isDark ? "text-[#A0AEC0]/70" : "text-slate-500"}`}>
                    <span>{item.timestamp}</span>
                    <span>•</span>
                    <span className={isDark ? "text-purple-400" : "text-purple-650 font-semibold"}>{item.resultsCount} matches</span>
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-1 transition-colors ${isDark ? "text-[#A0AEC0] group-hover:text-white" : "text-slate-450 group-hover:text-slate-800"}`} id={`history-arrow-${item.id}`}>
                <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Quick Search</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
