/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Moon, Settings } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onNavigateToSettings: () => void;
}

export default function Header({ theme, onThemeToggle, onNavigateToSettings }: HeaderProps) {
  const isDark = theme === "dark";
  return (
    <header className="relative flex items-start justify-between pt-6 pb-2 px-1 z-10" id="app-header">
      <div className="flex gap-4 items-center">
        {/* Real Custom UD Flame Logo representing the uploaded design */}
        <div 
          className={`w-13 h-13 border rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-transform hover:scale-105 ${
            isDark ? "bg-slate-950 border-white/5" : "bg-white border-slate-200 shadow-sm"
          }`} 
          id="logo-badge"
        >
          <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Pink Flame (Left) */}
            <path 
              d="M34 56C30 50 32 41 34 38C35.5 42 38.5 44 38.5 47.5C38.5 53.5 35 55 34 56Z" 
              fill="#F472B6" 
            />
            {/* Orange Flame (Middle) */}
            <path 
              d="M48 60C45 52 36 34 43 23C40 33 46 43 47.5 49C48.5 42 51 34 54 28C54 36 50 42 54 49C54.5 45 57 41 57.5 37C58 41 57.5 46 56.5 50C56 52 54.5 56 48 60Z" 
              fill="#F97316" 
            />
            {/* Yellow Flame (Right) */}
            <path 
              d="M51 60C54 53 52 37 53 8C55 24 64 36 65 46.5C65.5 51.5 64 54.5 56 55.5C54 56 52 58 51 60Z" 
              fill="#EAB308" 
            />
            {/* Green 'U' Bottom Container */}
            <path 
              d="M35 54.5C35 53.5 35.5 53 36 53H64C64.5 53 65 53.5 65 54.5V70C65 78 58 85 50 85C42 85 35 78 35 70V54.5ZM56 68.5C56 68 55.5 67.5 55 67.5H45C44.5 67.5 44 68 44 68.5V70C44 73 46.5 75.5 50 75.5C53.5 75.5 56 73 56 70V68.5Z" 
              fill="#22C55E" 
              fillRule="evenodd" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" id="header-title">
            <span className="text-[#22C55E]">UD </span>
            <span className="bg-gradient-to-r from-orange-400 via-yellow-400 to-pink-500 bg-clip-text text-transparent">Course Finder</span>
          </h1>
          <p 
            className={`text-xs sm:text-sm font-medium mt-0.5 leading-relaxed ${
              isDark ? "text-[#A0AEC0]" : "text-slate-650"
            }`} 
            id="header-subtitle"
          >
            Search any course and get random accounts instantly ⚡
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 relative" id="header-actions">
        {/* Theme Toggle Button */}
        <button
          id="theme-toggle-btn"
          onClick={onThemeToggle}
          className={`p-2.5 rounded-full border backdrop-blur-md active:scale-95 transition-all duration-200 cursor-pointer ${
            isDark 
              ? "border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.6)] text-white hover:bg-[rgba(255,255,255,0.06)]" 
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
          }`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
        </button>

        {/* Settings Button */}
        <button
          id="settings-nav-btn"
          onClick={onNavigateToSettings}
          className={`p-2.5 rounded-full border backdrop-blur-md active:scale-95 transition-all duration-200 cursor-pointer ${
            isDark 
              ? "border-[rgba(255,255,255,0.08)] bg-[rgba(20,25,45,0.6)] text-[#A0AEC0] hover:text-white hover:bg-[rgba(255,255,255,0.06)]" 
              : "border-slate-200 bg-white text-slate-500 hover:text-slate-950 hover:bg-slate-50 shadow-sm"
          }`}
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
