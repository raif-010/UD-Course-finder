/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, History, Heart, Settings } from 'lucide-react';

export type TabID = 'home' | 'history' | 'favorites' | 'settings';

interface BottomNavProps {
  activeTab: TabID;
  onChangeTab: (tab: TabID) => void;
  favoritesCount: number;
}

export default function BottomNav({ activeTab, onChangeTab, favoritesCount }: BottomNavProps) {
  const tabs = [
    { id: 'home' as TabID, label: 'Home', icon: Home },
    { id: 'history' as TabID, label: 'History', icon: History },
    { id: 'favorites' as TabID, label: 'Favorites', icon: Heart, badge: favoritesCount },
    { id: 'settings' as TabID, label: 'Settings', icon: Settings }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D1325]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.08)] py-2 pb-3 px-4 shadow-[0_-10px_30px_rgba(5,8,22,0.6)] flex items-center justify-around"
      id="android-bottom-nav"
    >
      <div className="w-full max-w-md mx-auto flex items-center justify-between" id="bottom-nav-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 relative group transition-all duration-200 cursor-pointer"
              aria-label={tab.label}
            >
              {/* Highlight underline indicating selected state */}
              {isActive && (
                <div 
                  className="absolute bottom-[-10px] w-8 h-[3px] bg-gradient-to-r from-[#6D3BFF] to-[#A855F7] rounded-t-full shadow-[0_-4px_12px_rgba(109,59,255,0.6)]" 
                  id={`nav-active-highlight-${tab.id}`}
                />
              )}

              {/* Icon with scaling/pulsation on tap */}
              <div className="relative" id={`nav-icon-container-${tab.id}`}>
                <Icon 
                  className={`w-[22px] h-[22px] transition-all duration-250 ${
                    isActive 
                      ? 'text-[#A855F7] scale-110 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]' 
                      : 'text-[#A0AEC0] group-hover:text-white group-hover:scale-105'
                  }`} 
                />
                
                {/* Optional Badge Indicator Bubble */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span 
                    className="absolute -top-1.5 -right-2 bg-rose-500 border border-slate-900 text-white text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce duration-1000"
                    id={`nav-badge-${tab.id}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label text */}
              <span 
                className={`text-[10px] font-bold tracking-wider mt-1 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-[#A0AEC0] group-hover:text-white/80'
                }`}
                id={`nav-label-${tab.id}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
