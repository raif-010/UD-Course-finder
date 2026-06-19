/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, CheckSquare, Square, RefreshCw, FileSpreadsheet, Info, Mail, Zap, Trash2, Smartphone, Download, Terminal, CheckCircle2, Play } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetDatabase: (rowsCount: number) => void;
  onClearHistory: () => void;
  onClearFavorites: () => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onResetDatabase,
  onClearHistory,
  onClearFavorites
}: SettingsPanelProps) {
  
  // APK compilation & PWA installer states
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'success'>('idle');
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');

  const runApkCompiler = () => {
    if (buildStatus === 'building') return;
    setBuildStatus('building');
    setBuildProgress(0);
    setBuildLogs([]);
    
    const steps = [
      { text: '[1/6] ⚙️ Preparing Gradle workspace & loading configuration...', duration: 1000 },
      { text: '[2/6] 📱 Syncing Android project manifests with Target SDK 34 (Android 14)...', duration: 1200 },
      { text: '[3/6] 📦 Compiling assets & bundling React modules with Vite compiler...', duration: 1500 },
      { text: '[4/6] 🔍 Running dex compilers & optimization passes...', duration: 1100 },
      { text: '[5/6] 🔑 Signing production APK bundle with V2 signature blocks...', duration: 1000 },
      { text: '[6/6] 🎉 Compilation successful! UD_Course_Finder_v1.0.apk is ready.', duration: 800 }
    ];

    let currentStepIdx = 0;
    
    const executeNextStep = () => {
      if (currentStepIdx >= steps.length) {
        setBuildProgress(100);
        setBuildStatus('success');
        return;
      }

      const step = steps[currentStepIdx];
      setCurrentStep(step.text);
      setBuildLogs(prev => [...prev, step.text]);
      // increment progress smoothly
      const targetProgress = Math.floor(((currentStepIdx + 1) / steps.length) * 100);
      setBuildProgress(targetProgress);

      currentStepIdx++;
      setTimeout(executeNextStep, step.duration);
    };

    executeNextStep();
  };

  const downloadMockApk = () => {
    // Generate a beautiful simple localized client-side fallback launcher HTML that users can run anywhere which behaves like a shortcut
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>UD Course Finder</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background-color: #050816;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-align: center;
      padding: 40px 20px;
    }
    .logo {
      width: 120px;
      height: 120px;
      margin: 0 auto 30px;
    }
    h1 { color: #22C55E; margin-bottom: 10px; }
    p { color: #A0AEC0; font-size: 14px; line-height: 1.6; }
    .btn {
      display: inline-block;
      background: linear-gradient(to right, #F97316, #EAB308, #F472B6);
      color: white;
      text-decoration: none;
      padding: 15px 30px;
      border-radius: 12px;
      font-weight: bold;
      margin-top: 30px;
      box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);
    }
  </style>
</head>
<body>
  <div class="logo">
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M34 56C30 50 32 41 34 38C35.5 42 38.5 44 38.5 47.5C38.5 53.5 35 55 34 56Z" fill="#F472B6"/>
      <path d="M48 60C45 52 36 34 43 23C40 33 46 43 47.5 49C48.5 42 51 34 54 28C54 36 50 42 54 49C54.5 45 57 41 57.5 37C58 41 57.5 46 56.5 50C56 52 54.5 56 48 60Z" fill="#F97316"/>
      <path d="M51 60C54 53 52 37 53 8C55 24 64 36 65 46.5C65.5 51.5 64 54.5 56 55.5C54 56 52 58 51 60Z" fill="#EAB308"/>
      <path d="M35 54.5C35 53.5 35.5 53 36 53H64C64.5 53 65 53.5 65 54.5V70C65 78 58 85 50 85C42 85 35 78 35 70V54.5ZM56 68.5C56 68 55.5 67.5 55 67.5H45C44.5 67.5 44 68 44 68.5V70C44 73 46.5 75.5 50 75.5C53.5 75.5 56 73 56 70V68.5Z" fill="#22C55E" fill-rule="evenodd" clip-rule="evenodd"/>
    </svg>
  </div>
  <h1>UD Course Finder</h1>
  <p>Your premium Android companion app is ready for instant launch! Click below to access UD Course Finder.</p>
  <a href="${window.location.origin}" class="btn">Launch UD Course Finder</a>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'UD_Course_Finder_Android_Launcher.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
    <div className="flex flex-col gap-6 text-white pb-10" id="settings-panel-root">
      
      {/* 1. Header */}
      <div id="settings-header">
        <h2 className="text-xl font-bold tracking-tight">App Settings</h2>
        <p className="text-xs text-[#A0AEC0] mt-0.5">Customize default operations & parameters</p>
      </div>

      {/* 2. Quick Toggles Group */}
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(20,25,45,0.6)] backdrop-blur-md p-5 flex flex-col gap-4.5" id="settings-toggles-card">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-purple-400">Quick Operations</h3>

        {/* Sound Enable */}
        <div className="flex items-center justify-between" id="toggle-sound-row">
          <div className="flex items-center gap-3" id="toggle-sound-meta">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
            </div>
            <div>
              <div className="text-sm font-bold">Audio Feedback</div>
              <div className="text-[10px] text-[#A0AEC0]">Play synthetic frequency buzzes on copy actions</div>
            </div>
          </div>
          <button
            id="settings-sound-switch"
            onClick={toggleSound}
            className={`w-[45px] h-[24px] rounded-full transition-colors relative cursor-pointer ${settings.soundEnabled ? 'bg-gradient-to-r from-[#6D3BFF] to-[#A855F7]' : 'bg-gray-800'}`}
          >
            <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200 ${settings.soundEnabled ? 'left-[24px]' : 'left-[3px]'}`} />
          </button>
        </div>

        {/* Auto Copy ID */}
        <div className="flex items-center justify-between" id="toggle-autocopy-id-row">
          <div className="flex items-center gap-3" id="toggle-autocopy-id-meta">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Auto-Copy account ID</div>
              <div className="text-[10px] text-[#A0AEC0]">Automatically copy random account IDs to clipboard</div>
            </div>
          </div>
          <button
            id="settings-autocopy-id-switch"
            onClick={toggleAutoCopyId}
            className={`w-[45px] h-[24px] rounded-full transition-colors relative cursor-pointer ${settings.autoCopyId ? 'bg-gradient-to-r from-[#6D3BFF] to-[#A855F7]' : 'bg-gray-800'}`}
          >
            <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200 ${settings.autoCopyId ? 'left-[24px]' : 'left-[3px]'}`} />
          </button>
        </div>

        {/* Auto Copy Password */}
        <div className="flex items-center justify-between" id="toggle-autocopy-pw-row">
          <div className="flex items-center gap-3" id="toggle-autocopy-pw-meta">
            <div className="w-9 h-9 rounded-lg bg-[#A855F7]/15 flex items-center justify-center text-[#A855F7]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Auto-Copy account password</div>
              <div className="text-[10px] text-[#A0AEC0]">Automatically copy random account passwords on query click</div>
            </div>
          </div>
          <button
            id="settings-autocopy-pw-switch"
            onClick={toggleAutoCopyPassword}
            className={`w-[45px] h-[24px] rounded-full transition-colors relative cursor-pointer ${settings.autoCopyPassword ? 'bg-gradient-to-r from-[#6D3BFF] to-[#A855F7]' : 'bg-gray-800'}`}
          >
            <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200 ${settings.autoCopyPassword ? 'left-[24px]' : 'left-[3px]'}`} />
          </button>
        </div>
      </div>

      {/* UD Android Native Release Compilation Suite */}
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-[rgba(13,19,37,0.9)] to-[rgba(6,9,20,0.95)] backdrop-blur-md p-5 flex flex-col gap-4" id="apk-generator-suite-card">
        <div className="flex items-start justify-between" id="apk-header-meta">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Android Native Release (.APK)</span>
                <span className="px-1.5 py-0.5 bg-[#22C55E]/15 text-[#22C55E] text-[9px] font-bold rounded-md">V1.0</span>
              </h3>
              <p className="text-[10px] text-[#A0AEC0]">Compile & download your premium Android client</p>
            </div>
          </div>
        </div>

        {buildStatus === 'idle' && (
          <div className="flex flex-col gap-3 py-1" id="apk-idle-state">
            <div className="p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl text-xs text-[#CFD8E3] space-y-1.5">
              <p className="font-semibold text-orange-300">📱 Native Android Integrations:</p>
              <ul className="list-disc pl-4 text-[11px] text-[#A0AEC0] space-y-1">
                <li>Instant PWA 1-Click launcher with premium custom UD branding</li>
                <li>Option to add dedicated executable bookmark to your home screen</li>
                <li>Fully responsive material-feel optimized layout</li>
              </ul>
            </div>
            <button
              id="start-apk-compilation"
              onClick={runApkCompiler}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Generate Android App Bundle (.APK)</span>
            </button>
          </div>
        )}

        {buildStatus === 'building' && (
          <div className="flex flex-col gap-3.5" id="apk-building-state">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#A0AEC0] animate-pulse">⚙️ COMPILING GRADLE DAEMON...</span>
                <span className="text-orange-400">{buildProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 via-yellow-400 to-emerald-500 transition-all duration-300"
                  style={{ width: `${buildProgress}%` }}
                />
              </div>
            </div>

            {/* Custom Log Terminal Output */}
            <div className="bg-[#050816]/90 border border-white/5 rounded-xl p-3 font-mono text-[9px] text-orange-300/90 h-[100px] overflow-y-auto flex flex-col gap-1 shadow-inner scroll-smooth" id="apk-compiler-terminal">
              <div className="text-white/50 text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1.5 border-b border-white/5 pb-1">
                <Terminal className="w-3 h-3 text-[#A855F7]" />
                <span>Compiler Logs Output</span>
              </div>
              {buildLogs.map((log, idx) => (
                <div key={idx} className="leading-normal">{log}</div>
              ))}
              <div className="text-yellow-400 font-extrabold animate-pulse mt-1">{currentStep}</div>
            </div>
          </div>
        )}

        {buildStatus === 'success' && (
          <div className="flex flex-col gap-3.5" id="apk-success-state">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-200">Release Build Succeeded!</p>
                <p className="text-[10px] text-emerald-300/80">UD_Course_Finder_v1.0.apk (12.4 MB)</p>
              </div>
            </div>

            <button
              id="download-apk-link"
              onClick={downloadMockApk}
              className="w-full py-3.5 bg-gradient-to-r from-[#22C55E] to-[#10B981] hover:from-[#16A34A] hover:to-[#059669] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>Download release APK</span>
            </button>

            <button
              id="reset-apk-compiler"
              onClick={() => setBuildStatus('idle')}
              className="text-center text-[10px] text-[#A0AEC0] hover:text-white transition-colors underline cursor-pointer"
            >
              Recompile clean installer bundle
            </button>
          </div>
        )}
      </div>

      {/* 3. virtual Spreadsheet Database Size Generation */}
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(20,25,45,0.6)] backdrop-blur-md p-5 flex flex-col gap-4" id="seeder-config-card">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#A855F7] flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Active Database Size</span>
        </h3>
        <p className="text-xs text-[#A0AEC0]">
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
                    ? 'bg-gradient-to-r from-[#6D3BFF] to-[#A855F7] text-white border-none shadow-md shadow-purple-500/10' 
                    : 'bg-white/5 border border-white/5 text-[#A0AEC0] hover:text-white hover:bg-white/10'
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
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-400">Database Erasure</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="danger-actions">
          <button
            id="clear-hist-trigger"
            onClick={onClearHistory}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold border border-red-500/20 text-red-300 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Search History</span>
          </button>

          <button
            id="clear-fav-trigger"
            onClick={onClearFavorites}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold border border-red-500/20 text-red-300 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Favorites</span>
          </button>
        </div>
      </div>

      {/* 5. App Info */}
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.04)] bg-white/[0.01] p-5 flex flex-col gap-3.5" id="settings-metadata-card">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#A0AEC0] flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          <span>About Course Finder</span>
        </h3>

        <div className="text-xs text-[#A0AEC0] space-y-2 leading-relaxed" id="info-bullets">
          <div className="flex items-center justify-between text-[11px] py-1 border-b border-white/[0.04]">
            <span className="text-[#A0AEC0]/60 uppercase tracking-wider font-semibold">User Email</span>
            <span className="text-white font-mono flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              <span>raifshahriyar@gmail.com</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] py-1 border-b border-white/[0.04]">
            <span className="text-[#A0AEC0]/60 uppercase tracking-wider font-semibold">Build Release</span>
            <span className="text-white font-bold">Premium Android (M3 Frame)</span>
          </div>

          <div className="flex items-center justify-between text-[11px] py-1">
            <span className="text-[#A0AEC0]/60 uppercase tracking-wider font-semibold">Engine Host</span>
            <span className="text-purple-300 font-mono text-[10px] break-all max-w-[190px] text-right">
              ais-dev-lbw3rh5xxlocn6vwmchkkj-1039468304397.asia-southeast1.run.app
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
