/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, CheckSquare, Square, RefreshCw, FileSpreadsheet, Info, Mail, Zap, Trash2 } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetDatabase: (rowsCount: number) => void;
  onClearHistory: () => void;
  onClearFavorites: () => void;
  theme?: 'dark' | 'light';
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onResetDatabase,
  onClearHistory,
  onClearFavorites,
  theme = 'dark'
}: SettingsPanelProps) {
  const isDark = theme === 'dark';
  
  const toggleSound = () => {
    onUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleAutoCopyId = () => {
    onUpdateSettings({ autoCopyId: !settings.autoCopyId });
  };

  const toggleAutoCopyPassword = () => {
    onUpdateSettings({ autoCopyPassword: !settings.autoCopyPassword });
  };

  return (
    <div className={`flex flex-col gap-6 pb-10 ${isDark ? "text-white" : "text-slate-800"}`} id="settings-panel-root">
      
      {/* 1. Header */}
      <div id="settings-header">
        <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-850"}`}>App Settings</h2>
        <p className={`text-xs mt-0.5 ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>Customize default operations & parameters</p>
      </div>

      {/* 2. Quick Toggles Group */}
      <div className={`rounded-[20px] border p-5 flex flex-col gap-4.5 ${
        isDark ? "border-white/[0.06] bg-[rgba(20,25,45,0.6)] backdrop-blur-md" : "border-slate-200 bg-white shadow-sm"
      }`} id="settings-toggles-card">
        <h3 className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? "text-purple-400" : "text-purple-650"}`}>Quick Operations</h3>

        {/* Sound Enable */}
        <div className="flex items-center justify-between" id="toggle-sound-row">
          <div className="flex items-center gap-3" id="toggle-sound-meta">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-600"}`}>
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
            </div>
            <div>
              <div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Audio Feedback</div>
              <div className={`text-[10px] ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>Play synthetic frequency buzzes on copy actions</div>
            </div>
          </div>
          <button
            id="settings-sound-switch"
            onClick={toggleSound}
            className={`w-[45px] h-[24px] rounded-full transition-colors relative cursor-pointer ${
              settings.soundEnabled 
                ? 'bg-gradient-to-r from-[#6D3BFF] to-[#A855F7]' 
                : isDark ? 'bg-gray-800' : 'bg-slate-200'
            }`}
          >
            <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200 ${settings.soundEnabled ? 'left-[24px]' : 'left-[3px]'}`} />
          </button>
        </div>

        {/* Auto Copy ID */}
        <div className="flex items-center justify-between" id="toggle-autocopy-id-row">
          <div className="flex items-center gap-3" id="toggle-autocopy-id-meta">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Auto-Copy account ID</div>
              <div className={`text-[10px] ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>Automatically copy random account IDs to clipboard</div>
            </div>
          </div>
          <button
            id="settings-autocopy-id-switch"
            onClick={toggleAutoCopyId}
            className={`w-[45px] h-[24px] rounded-full transition-colors relative cursor-pointer ${
              settings.autoCopyId 
                ? 'bg-gradient-to-r from-[#6D3BFF] to-[#A855F7]' 
                : isDark ? 'bg-gray-800' : 'bg-slate-200'
            }`}
          >
            <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200 ${settings.autoCopyId ? 'left-[24px]' : 'left-[3px]'}`} />
          </button>
        </div>

        {/* Auto Copy Password */}
        <div className="flex items-center justify-between" id="toggle-autocopy-pw-row">
          <div className="flex items-center gap-3" id="toggle-autocopy-pw-meta">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-[#A855F7]/15 text-[#A855F7]" : "bg-purple-100/60 text-purple-700"}`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Auto-Copy account password</div>
              <div className={`text-[10px] ${isDark ? "text-[#A0AEC0]" : "text-slate-500"}`}>Automatically copy random account passwords on query click</div>
            </div>
          </div>
          <button
            id="settings-autocopy-pw-switch"
            onClick={toggleAutoCopyPassword}
            className={`w-[45px] h-[24px] rounded-full transition-colors relative cursor-pointer ${
              settings.autoCopyPassword 
                ? 'bg-gradient-to-r from-[#6D3BFF] to-[#A855F7]' 
                : isDark ? 'bg-gray-800' : 'bg-slate-200'
            }`}
          >
            <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200 ${settings.autoCopyPassword ? 'left-[24px]' : 'left-[3px]'}`} />
          </button>
        </div>
      </div>

      {/* 3. virtual Spreadsheet Database Size Generation */}
      <div className={`rounded-[20px] border p-5 flex flex-col gap-4 ${
        isDark ? "border-white/[0.06] bg-[rgba(20,25,45,0.6)] backdrop-blur-md" : "border-slate-200 bg-white shadow-sm"
      }`} id="seeder-config-card">
        <h3 className={`text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
          isDark ? "text-[#A855F7]" : "text-purple-600"
        }`}>
          <FileSpreadsheet className="w-4 h-4" />
          <span>Active Database Size</span>
        </h3>
        <p className={`text-xs ${isDark ? "text-[#A0AEC0]" : "text-slate-500 font-medium"}`}>
          Alter the generated mock dataset size to verify loading performance or restore default values.
        </p>

        <div className="grid grid-cols-2 gap-2 mt-1" id="seeder-size-buttons">
          {[100, 1000, 12458, 25000].map((size) => {
            const isCurrent = settings.mockRowCount === size;
            return (
              <button
                key={size}
                id={`seeder-size-trigger-${size}`}
                onClick={() => onResetDatabase(size)}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                  isCurrent 
                    ? 'bg-gradient-to-r from-[#6D3BFF] to-[#A855F7] text-white border-none shadow-md shadow-purple-500/10 font-bold' 
                    : isDark 
                      ? 'bg-white/5 border border-white/5 text-[#A0AEC0] hover:text-white hover:bg-white/10' 
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs'
                }`}
              >
                {size.toLocaleString()} Rows {size === 12458 && ' (Default)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Danger actions */}
      <div className="rounded-[20px] border border-red-500/15 bg-red-500/[0.02] backdrop-blur-md p-5 flex flex-col gap-3.5" id="settings-danger-card">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-500">Database Erasure</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="danger-actions">
          <button
            id="clear-hist-trigger"
            onClick={onClearHistory}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold border border-red-500/20 text-red-500 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Search History</span>
          </button>

          <button
            id="clear-fav-trigger"
            onClick={onClearFavorites}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold border border-red-500/20 text-red-500 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Favorites</span>
          </button>
        </div>
      </div>

      {/* 5. App Info */}
      <div className={`rounded-[20px] border p-5 flex flex-col gap-3.5 ${
        isDark ? "border-white/[0.04] bg-white/[0.01]" : "border-slate-200 bg-white shadow-sm"
      }`} id="settings-metadata-card">
        <h3 className={`text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
          isDark ? "text-[#A0AEC0]" : "text-slate-500"
        }`}>
          <Info className="w-4 h-4" />
          <span>About Course Finder</span>
        </h3>

        <div className={`text-xs space-y-2 leading-relaxed ${isDark ? "text-[#A0AEC0]" : "text-slate-600"}`} id="info-bullets">
          <div className={`flex items-center justify-between text-[11px] py-1 border-b ${isDark ? "border-white/[0.04]" : "border-slate-100"}`}>
            <span className={`uppercase tracking-wider font-semibold ${isDark ? "text-[#A0AEC0]/60" : "text-slate-450"}`}>User Email</span>
            <span className={`font-mono flex items-center gap-1 ${isDark ? "text-white" : "text-slate-800"}`}>
              <Mail className="w-3.5 h-3.5 text-purple-500" />
              <span>raifshahriyar@gmail.com</span>
            </span>
          </div>

          <div className={`flex items-center justify-between text-[11px] py-1 border-b ${isDark ? "border-white/[0.04]" : "border-slate-100"}`}>
            <span className={`uppercase tracking-wider font-semibold ${isDark ? "text-[#A0AEC0]/60" : "text-slate-450"}`}>Build Release</span>
            <span className={`font-bold ${isDark ? "text-white" : "text-slate-805"}`}>Premium Android (M3 Frame)</span>
          </div>

          <div className="flex items-center justify-between text-[11px] py-1">
            <span className={`uppercase tracking-wider font-semibold ${isDark ? "text-[#A0AEC0]/60" : "text-slate-450"}`}>Engine Host</span>
            <span className={`font-mono text-[10px] break-all max-w-[190px] text-right ${isDark ? "text-purple-400" : "text-purple-750 font-semibold"}`}>
              ais-dev-lbw3rh5xxlocn6vwmchkkj-1039468304397.asia-southeast1.run.app
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
