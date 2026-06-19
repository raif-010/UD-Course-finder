/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import FileCard from './components/FileCard';
import SearchSection from './components/SearchSection';
import ResultSection from './components/ResultSection';
import BottomNav, { TabID } from './components/BottomNav';
import HistoryPanel from './components/HistoryPanel';
import FavoritesPanel from './components/FavoritesPanel';
import SettingsPanel from './components/SettingsPanel';
import { generateDefaultRecords } from './data';
import { AccountRecord, SearchHistory, AppSettings } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // --------- CORE STATE ---------
  const [records, setRecords] = useState<AccountRecord[]>([]);
  const [fileName, setFileName] = useState<string>("1.xlsx");
  const [activeTab, setActiveTab] = useState<TabID>("home");
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>("");
  
  // Selected single random record for home card
  const [randomRecord, setRandomRecord] = useState<AccountRecord | null>(null);

  // Lists state
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // App Config Settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    autoCopyId: false,
    autoCopyPassword: false,
    soundEnabled: true,
    mockRowCount: 12458
  });

  // Toast Notifications State
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Initialize spreadsheet database on boot
  useEffect(() => {
    const defaultData = generateDefaultRecords();
    setRecords(defaultData);
    setSettings(prev => ({ ...prev, mockRowCount: defaultData.length }));
  }, []);

  // --------- REAL-TIME SEARCH INDEXES ---------
  const filteredRecords = useMemo(() => {
    if (!activeSearchTerm.trim()) return [];
    
    const query = activeSearchTerm.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(Boolean);
    
    return records.filter(rec => {
      // Look up ID directly
      if (rec.id.includes(query)) return true;
      
      if (queryWords.length === 0) return false;
      const joinedCourses = rec.courses.join(' ').toLowerCase();
      return queryWords.every(word => joinedCourses.includes(word));
    });
  }, [activeSearchTerm, records]);

  // Handle auto copy trigger on query change
  useEffect(() => {
    if (filteredRecords.length > 0 && activeSearchTerm) {
      // Pick a random default
      const randomIndex = Math.floor(Math.random() * filteredRecords.length);
      const selected = filteredRecords[randomIndex];
      setRandomRecord(selected);

      // Auto Copy Policy
      if (settings.autoCopyId || settings.autoCopyPassword) {
        let copyText = "";
        let logText = "";
        
        if (settings.autoCopyId && settings.autoCopyPassword) {
          copyText = `ID: ${selected.id}, PW: ${selected.password || 'password_' + selected.id}`;
          logText = "ID & Password";
        } else if (settings.autoCopyId) {
          copyText = selected.id;
          logText = "ID";
        } else {
          copyText = selected.password || 'password_' + selected.id;
          logText = "Password";
        }

        navigator.clipboard.writeText(copyText).then(() => {
          showNotification(`⚡ Auto-Copied ${logText}: ${copyText}`);
          playBeepSound(440, 660);
        }).catch(() => {});
      }
    } else {
      setRandomRecord(null);
    }
  }, [filteredRecords, activeSearchTerm]);

  // --------- HELPERT TRIGGERS ---------
  const showNotification = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
  };

  // Dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Synthetic frequency sound effects generator
  const playBeepSound = (f1 = 587, f2 = 880, duration = 0.1) => {
    if (!settings.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f1, ctx.currentTime);
      if (f2) {
        osc.frequency.setValueAtTime(f2, ctx.currentTime + 0.05);
      }
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch (e) {}
  };

  // Trigger search selection
  const handleSearchCommit = (term: string) => {
    setActiveSearchTerm(term);
    setActiveTab('home');
    playBeepSound(523.25, 784, 0.12);

    if (term.trim()) {
      // Add keyword to history list
      const matchesCount = records.filter(rec => {
        if (rec.id.includes(term.toLowerCase())) return true;
        const joinedCourses = rec.courses.join(' ').toLowerCase();
        const words = term.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return false;
        return words.every(w => joinedCourses.includes(w));
      }).length;

      const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setSearchHistory(prev => {
        // Drop duplicates
        const updated = prev.filter(item => item.term.toLowerCase() !== term.toLowerCase());
        return [
          {
            id: Date.now().toString(),
            term: term.trim(),
            timestamp: dateStr,
            resultsCount: matchesCount
          },
          ...updated
        ];
      });
    }
  };

  // Pick another random record from the filtered outcomes
  const handlePickNewRandom = () => {
    if (filteredRecords.length < 2) {
      showNotification("Only 1 matching account found.");
      return;
    }
    
    playBeepSound(784, 987, 0.15);
    let index = Math.floor(Math.random() * filteredRecords.length);
    // Secure it's not the same id
    if (randomRecord && filteredRecords[index].id === randomRecord.id) {
      index = (index + 1) % filteredRecords.length;
    }
    const selected = filteredRecords[index];
    setRandomRecord(selected);
    showNotification(`🎲 Random selected record: ${selected.id}`);
  };

  // Toggle visual theme
  const handleThemeToggle = () => {
    const isDark = settings.theme === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    setSettings(prev => ({ ...prev, theme: nextTheme }));
    playBeepSound(isDark ? 880 : 440, isDark ? 1200 : 330, 0.15);
    showNotification(`Active Theme: ${nextTheme === 'dark' ? 'Modern M3 Dark' : 'Elegant M3 Light'}`);
  };

  const updateSettingOption = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    playBeepSound(659, 880);
  };

  // Re-seed programmatic database sizes
  const handleResetDatabase = (rowsCount: number) => {
    setFileName("1.xlsx");
    playBeepSound(330, 660, 0.25);
    
    // Generate programmatic database rows
    const baseRecords = generateDefaultRecords().slice(0, 4);
    const resultRecords: AccountRecord[] = [...baseRecords];
    
    for (let i = baseRecords.length; i < rowsCount; i++) {
      const idNum = 3980000 + ((i * 139) % 20000);
      resultRecords.push({
        id: idNum.toString(),
        password: `password_${idNum}`,
        courses: i % 3 === 0 
          ? ["HSC Biology 27 Master Class"] 
          : ["HSC ICT Full Course [HSC'27] New Batch", "HSC Bangla-English Full Course [HSC'27] New Batch"]
      });
    }

    setRecords(resultRecords);
    setSettings(prev => ({ ...prev, mockRowCount: rowsCount }));
    setActiveSearchTerm("");
    showNotification(`✓ Virtual sheet seeded to ${rowsCount.toLocaleString()} rows successfully.`);
  };

  const handleFileLoaded = (parsedList: AccountRecord[], name: string) => {
    setRecords(parsedList);
    setFileName(name);
    setSettings(prev => ({ ...prev, mockRowCount: parsedList.length }));
    setActiveSearchTerm("");
    playBeepSound(440, 880, 0.2);
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => {
      const exists = prev.includes(id);
      if (exists) {
        showNotification("Removed from Favorites");
        return prev.filter(item => item !== id);
      } else {
        showNotification("♥ Pinned to Favorites");
        return [...prev, id];
      }
    });
  };

  // Filter Favorite Records list
  const favoritedRecordsList = useMemo(() => {
    return records.filter(item => favorites.includes(item.id));
  }, [favorites, records]);

  // Determine standard colors based on dark/light settings
  const isDarkTheme = settings.theme === 'dark';

  return (
    <div 
      className={`min-h-screen font-sans antialiased pb-24 transition-colors duration-300 ${
        isDarkTheme ? 'bg-[#050816] text-white' : 'bg-[#F4F5F9] text-[#1E293B]'
      }`}
      id="app-container"
    >
      {/* Main core content viewport */}
      <main className="w-full max-w-md mx-auto px-4 pt-1" id="android-viewport">
        
        {/* Dynamic header toggles & folder illustration */}
        <Header 
          theme={settings.theme} 
          onThemeToggle={handleThemeToggle} 
          onNavigateToSettings={() => {
            setActiveTab('settings');
            playBeepSound(600, 800);
          }}
        />

        {/* Content Tabs Frame switcher */}
        <div className="mt-7 flex flex-col gap-6" id="inner-pages-scroller">
          
          {/* TAB 1: HOME PANEL */}
          {activeTab === 'home' && (
            <div className="flex flex-col gap-5" id="home-panel">
              {/* File Glass Card */}
              <FileCard 
                fileName={fileName} 
                rowCount={records.length} 
                onFileLoaded={handleFileLoaded}
                onShowNotification={(msg, isErr) => showNotification(msg, isErr)}
              />

              {/* Search Course input */}
              <SearchSection 
                onSearch={handleSearchCommit} 
                activeSearchTerm={activeSearchTerm}
              />

              {/* Random / Matched Results Cards */}
              <ResultSection 
                filteredRecords={filteredRecords}
                randomRecord={randomRecord}
                onPickNewRandom={handlePickNewRandom}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                soundEnabled={settings.soundEnabled}
                onClearResults={() => {
                  setActiveSearchTerm("");
                  playBeepSound(300, 200);
                  showNotification("Search matches cleared.");
                }}
                onShowNotification={(msg) => showNotification(msg)}
              />
            </div>
          )}

          {/* TAB 2: HISTORY PANEL */}
          {activeTab === 'history' && (
            <HistoryPanel 
              history={searchHistory} 
              onSelectSearch={handleSearchCommit}
              onClearHistory={() => {
                setSearchHistory([]);
                showNotification("Wiped history.");
                playBeepSound(300, 150);
              }}
            />
          )}

          {/* TAB 3: FAVORITES PANEL */}
          {activeTab === 'favorites' && (
            <FavoritesPanel 
              favorites={favoritedRecordsList}
              onRemoveFavorite={handleToggleFavorite}
              onClearAll={() => {
                setFavorites([]);
                showNotification("Removed all bookmarks.");
                playBeepSound(300, 150);
              }}
              soundEnabled={settings.soundEnabled}
              onShowNotification={(msg) => showNotification(msg)}
            />
          )}

          {/* TAB 4: SETTINGS PANEL */}
          {activeTab === 'settings' && (
            <SettingsPanel 
              settings={settings}
              onUpdateSettings={updateSettingOption}
              onResetDatabase={handleResetDatabase}
              onClearHistory={() => {
                setSearchHistory([]);
                showNotification("Search logs wiped.");
              }}
              onClearFavorites={() => {
                setFavorites([]);
                showNotification("Favorites bookmarks wiped.");
              }}
            />
          )}

        </div>
      </main>

      {/* Floating Animated Toast Banner */}
      {toast && (
        <div 
          className={`fixed bottom-22 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-[0_12px_24px_rgba(5,8,22,0.6)] backdrop-blur-md flex items-center gap-2.5 max-w-[90%] border animate-bounce ${
            toast.isError 
              ? 'bg-red-950/90 border-red-500/30 text-red-200' 
              : 'bg-slate-900/90 border-purple-500/30 text-white'
          }`}
          id="toast-notification-banner"
        >
          {toast.isError ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={2.5} />
          )}
          <span className="text-xs font-bold leading-tight" id="toast-text">
            {toast.message}
          </span>
        </div>
      )}

      {/* Bottom Nav Drawer Bar */}
      <BottomNav 
        activeTab={activeTab} 
        onChangeTab={(tab) => {
          setActiveTab(tab);
          playBeepSound(550, 700);
        }}
        favoritesCount={favorites.length}
      />
    </div>
  );
}
