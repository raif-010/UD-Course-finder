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
}

export default function HistoryPanel({ history, onSelectSearch, onClearHistory }: HistoryPanelProps) {
  return (
    <div className="flex flex-col gap-5" id="history-panel-root">
      <div className="flex items-center justify-between" id="history-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Search History</h2>
          <p className="text-xs text-[#A0AEC0] mt-0.5">Quickly access and reload past course queries</p>
        </div>

        {history.length > 0 && (
          <button
            id="clear-all-history-btn"
            onClick={onClearHistory}
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[rgba(255,255,255,0.1)] p-10 text-center text-[#A0AEC0] flex flex-col items-center justify-center gap-3 bg-[rgba(20,25,45,0.2)]" id="empty-history-view">
          <History className="w-[42px] h-[42px] text-[#A0AEC0]/30 animate-pulse" />
          <h3 className="text-sm font-semibold">No Queries Logged</h3>
          <p className="text-xs text-[#A0AEC0]/60 max-w-[220px]">Any keywords you search on the homepage will be preserved here!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5" id="history-items-list">
          {history.map((item) => (
            <button
              key={item.id}
              id={`history-item-${item.id}`}
              onClick={() => onSelectSearch(item.term)}
              className="w-full text-left rounded-[20px] p-4 border border-[rgba(255,255,255,0.06)] bg-[rgba(20,25,45,0.6)] backdrop-blur-md hover:border-purple-500/30 hover:bg-[rgba(20,25,45,0.85)] active:scale-99 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3.5" id={`history-meta-${item.id}`}>
                <div className="w-[38px] h-[38px] rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors" id={`history-icon-${item.id}`}>
                  <Search className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="font-bold text-white text-md tracking-tight group-hover:text-purple-300 transition-colors">{item.term}</div>
                  <div className="text-[10px] font-bold text-[#A0AEC0]/70 flex items-center gap-1.5 mt-0.5">
                    <span>{item.timestamp}</span>
                    <span>•</span>
                    <span className="text-purple-400">{item.resultsCount} matches</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[#A0AEC0] group-hover:text-white transition-colors" id={`history-arrow-${item.id}`}>
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
