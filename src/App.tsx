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
import { CheckCircle2, AlertCircle, Layers, Plus, Trash2, X, Sparkles, Lock } from 'lucide-react';

export default function App() {
  // --------- CORE STATE ---------
  const [records, setRecords] = useState<AccountRecord[]>([]);
  const [fileName, setFileName] = useState<string>("1.xlsx");
  const [activeTab, setActiveTab] = useState<TabID>("home");
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>("");
  const [activeCustomRecordId, setActiveCustomRecordId] = useState<string | null>(null);
  const [exactMatchOnly, setExactMatchOnly] = useState<boolean>(false);
  const [exclusiveMatchOnly, setExclusiveMatchOnly] = useState<boolean>(false);
  
  // Selected single random record for home card
  const [randomRecord, setRandomRecord] = useState<AccountRecord | null>(null);

  // Active custom list record memo
  const activeCustomRecord = useMemo(() => {
    if (!activeCustomRecordId) return null;
    return records.find(r => r.id === activeCustomRecordId) || null;
  }, [activeCustomRecordId, records]);

  // Lists state
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("favorites_list");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("favorites_list", JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to commit favorites to storage", e);
    }
  }, [favorites]);
  
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
    const savedRecordsJSON = localStorage.getItem("uploaded_records");
    const savedFileName = localStorage.getItem("uploaded_file_name");
    if (savedRecordsJSON && savedFileName) {
      try {
        const parsed = JSON.parse(savedRecordsJSON);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          setFileName(savedFileName);
          setSettings(prev => ({ ...prev, mockRowCount: parsed.length }));
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved records from localStorage", e);
      }
    }
    const defaultData = generateDefaultRecords();
    setRecords(defaultData);
    setFileName("1.xlsx");
    setSettings(prev => ({ ...prev, mockRowCount: defaultData.length }));
  }, []);

  // --------- REAL-TIME SEARCH INDEXES ---------
  const filteredRecords = useMemo(() => {
    if (!activeSearchTerm.trim()) return [];
    
    const query = activeSearchTerm.toLowerCase().trim();
    
    // Check if looking up ID directly
    if (records.some(rec => rec.id.toLowerCase() === query)) {
      return records.filter(rec => rec.id.toLowerCase() === query);
    }
    
    // Normalize punctuation/dashes/chars/years for lenient matching
    const normalizeTextForSearch = (str: string) => {
      let temp = str.toLowerCase();
      // Replace apostrophes/quotes, dashes, separators, commas, periods with spaces
      temp = temp.replace(/['"’‘`\-_–—/\\,.]/g, ' ');
      // Unify 4-digit years starting with 20 (e.g. 2027 -> 27)
      temp = temp.replace(/\b20([0-9]{2})\b/g, '$1');
      // Collapse spaces
      return temp.replace(/\s+/g, ' ').trim();
    };

    const cleanQuery = normalizeTextForSearch(query);
    const searchWords = cleanQuery.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) return [];

    return records.filter(rec => {
      // Look up ID partially
      if (rec.id.toLowerCase().includes(query)) return true;
      
      // Normalize record courses
      const normalizedCourses = rec.courses.map(course => normalizeTextForSearch(course));
      
      // Each searched word must be found as a substring in at least one of the normalized courses
      const allWordsMatch = searchWords.every(word => {
        return normalizedCourses.some(normCourse => normCourse.includes(word));
      });

      if (!allWordsMatch) return false;

      // If exactMatchOnly is checked, make sure the ID contains exactly 1 course in total
      if (exactMatchOnly) {
        return rec.courses.length === 1;
      }

      // If exclusiveMatchOnly is checked, make sure the ID contains ONLY searched courses
      if (exclusiveMatchOnly) {
        const hasOnlySearchedCourses = normalizedCourses.every(normCourse => {
          return searchWords.some(word => normCourse.includes(word));
        });
        if (!hasOnlySearchedCourses) return false;
      }

      return true;
    });
  }, [activeSearchTerm, records, exactMatchOnly, exclusiveMatchOnly]);

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

  // Helper to persist record updates consistently
  const updateRecordsStateAndCache = (newRecords: AccountRecord[]) => {
    setRecords(newRecords);
    setSettings(prev => ({ ...prev, mockRowCount: newRecords.length }));
    try {
      localStorage.setItem("uploaded_records", JSON.stringify(newRecords));
    } catch (e) {
      console.error("Failed to commit updated records to storage", e);
    }
  };

  // Create a brand new custom account ID containing only 1 searched course
  const handleCreateCustomId = (courseName: string) => {
    const course = courseName.trim();
    if (!course) {
      showNotification("⚠ Type a course name first to generate a custom ID bundle", true);
      playBeepSound(300, 150, 0.2);
      return;
    }

    // Generate random premium 6-digit style course ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newId = `UD-${randomNum}`;
    const newPassword = `pass_${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: AccountRecord = {
      id: newId,
      password: newPassword,
      courses: [course],
      isFavorite: false
    };

    updateRecordsStateAndCache([newRecord, ...records]);
    
    // Set this custom record as the active builder bundle
    setActiveCustomRecordId(newId);
    // Put search index focusing on this custom ID so it renders right away
    setActiveSearchTerm(newId);
    
    showNotification(`✨ Generated Custom ID: ${newId} containing "${course}"`);
    playBeepSound(600, 900, 0.2);
  };

  // Add course to the active custom ID bundle
  const handleAddCourseToActiveCustomId = (courseName: string) => {
    const course = courseName.trim();
    if (!course) {
      showNotification("⚠ Course name cannot be empty", true);
      return;
    }
    if (!activeCustomRecordId) return;

    const recordIndex = records.findIndex(rec => rec.id === activeCustomRecordId);
    if (recordIndex === -1) {
      showNotification("Active custom ID bundle not found", true);
      return;
    }

    const rec = records[recordIndex];
    if (rec.courses.some(c => c.toLowerCase() === course.toLowerCase())) {
      showNotification(`Already has course: "${course}"`, true);
      return;
    }

    const updatedCourses = [...rec.courses, course];
    const updatedRecord = { ...rec, courses: updatedCourses };

    const newRecords = [...records];
    newRecords[recordIndex] = updatedRecord;
    updateRecordsStateAndCache(newRecords);

    // Sync active randomRecord view immediately
    if (randomRecord && randomRecord.id === activeCustomRecordId) {
      setRandomRecord(updatedRecord);
    }

    showNotification(`✓ Added "${course}" to ID ${activeCustomRecordId}`);
    playBeepSound(440, 660, 0.15);
  };

  // Remove a course from the active custom ID bundle
  const handleRemoveCourseFromActiveCustomId = (courseName: string) => {
    if (!activeCustomRecordId) return;

    const recordIndex = records.findIndex(rec => rec.id === activeCustomRecordId);
    if (recordIndex === -1) return;

    const rec = records[recordIndex];
    if (rec.courses.length <= 1) {
      showNotification("⚠ Bundle must contain at least 1 course", true);
      return;
    }

    const updatedCourses = rec.courses.filter(c => c !== courseName);
    const updatedRecord = { ...rec, courses: updatedCourses };

    const newRecords = [...records];
    newRecords[recordIndex] = updatedRecord;
    updateRecordsStateAndCache(newRecords);

    // Sync active randomRecord view immediately
    if (randomRecord && randomRecord.id === activeCustomRecordId) {
      setRandomRecord(updatedRecord);
    }

    showNotification(`Removed course: "${courseName}"`);
    playBeepSound(660, 440, 0.15);
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

    try {
      localStorage.setItem("uploaded_records", JSON.stringify(resultRecords));
      localStorage.setItem("uploaded_file_name", "1.xlsx");
    } catch (e) {
      console.error("Failed to commit seeded database to storage", e);
    }
  };

  const handleFileLoaded = (parsedList: AccountRecord[], name: string) => {
    setRecords(parsedList);
    setFileName(name);
    setSettings(prev => ({ ...prev, mockRowCount: parsedList.length }));
    setActiveSearchTerm("");
    playBeepSound(440, 880, 0.2);

    try {
      localStorage.setItem("uploaded_records", JSON.stringify(parsedList));
      localStorage.setItem("uploaded_file_name", name);
    } catch (e) {
      console.error("Failed to commit custom uploaded database to storage", e);
      showNotification("⚠ Database content is too large to fully save in local browser cache", true);
    }
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

  const handleUpdateLabels = (id: string, nextLabels: string[]) => {
    const updatedRecords = records.map(rec => {
      if (rec.id === id) {
        return {
          ...rec,
          labels: nextLabels
        };
      }
      return rec;
    });
    updateRecordsStateAndCache(updatedRecords);

    // Sync active randomRecord view immediately
    const found = updatedRecords.find(r => r.id === id);
    if (found && randomRecord && randomRecord.id === id) {
      setRandomRecord(found);
    }
  };

  const handleImportFavorites = (importedRecords: AccountRecord[]) => {
    if (!Array.isArray(importedRecords) || importedRecords.length === 0) return;

    const validImported = importedRecords.filter(rec => rec && typeof rec.id === 'string' && rec.id.trim() !== '');
    if (validImported.length === 0) {
      showNotification("⚠ No valid records in backup file", true);
      return;
    }

    setRecords(prevRecords => {
      const merged = [...prevRecords];
      validImported.forEach(impRec => {
        const existingIdx = merged.findIndex(r => r.id === impRec.id);
        if (existingIdx !== -1) {
          merged[existingIdx] = {
            ...merged[existingIdx],
            ...impRec
          };
        } else {
          merged.push(impRec);
        }
      });
      
      try {
        localStorage.setItem("uploaded_records", JSON.stringify(merged));
      } catch (e) {
        console.error("Failed to save imported records", e);
      }
      return merged;
    });

    setFavorites(prevFavorites => {
      const importedIds = validImported.map(rec => rec.id);
      const combined = Array.from(new Set([...prevFavorites, ...importedIds]));
      return combined;
    });

    playBeepSound(650, 950, 0.25);
    showNotification(`📥 Imported ${validImported.length} favorite IDs!`);
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
                theme={settings.theme}
              />

              {/* Search Course input */}
              <SearchSection 
                onSearch={handleSearchCommit} 
                activeSearchTerm={activeSearchTerm}
                exactMatchOnly={exactMatchOnly}
                onToggleExactMatchOnly={() => {
                  const newVal = !exactMatchOnly;
                  setExactMatchOnly(newVal);
                  if (newVal) setExclusiveMatchOnly(false);
                  playBeepSound(newVal ? 550 : 380, newVal ? 820 : 540, 0.12);
                  showNotification(newVal ? "✨ Exact match enabled: Finding IDs containing ONLY 1 course in total." : "Exact match disabled.");
                }}
                exclusiveMatch={exclusiveMatchOnly}
                onToggleExclusiveMatch={() => {
                  const newVal = !exclusiveMatchOnly;
                  setExclusiveMatchOnly(newVal);
                  if (newVal) setExactMatchOnly(false);
                  playBeepSound(newVal ? 580 : 380, newVal ? 850 : 540, 0.12);
                  showNotification(newVal ? "📦 Bundle mode enabled: Hiding accounts with extra courses." : "Bundle mode disabled.");
                }}
                theme={settings.theme}
              />

              {/* Active Bundle ID Builder panel */}
              {activeCustomRecord && (
                <div 
                  className={`p-4 rounded-[20px] border flex flex-col gap-4.5 shadow-xl transition-all ${
                    isDarkTheme
                      ? "bg-gradient-to-br from-[rgba(13,25,37,0.85)] to-[rgba(6,9,20,0.95)] border-emerald-500/25 text-white"
                      : "bg-white border-emerald-500/30 text-slate-800"
                  }`}
                  id="active-bundle-panel"
                >
                  <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Layers className="w-4 h-4 animate-pulse text-emerald-300" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#10B981]">Custom Bundle Builder</h4>
                        <p className="text-[10px] text-[#A0AEC0] font-mono mt-0.5">Active ID: <span className="text-emerald-300 font-bold">{activeCustomRecord.id}</span></p>
                      </div>
                    </div>
                    
                    <button
                      id="close-bundle-builder"
                      onClick={() => {
                        setActiveCustomRecordId(null);
                        showNotification("Closed Custom Bundle Builder.");
                        playBeepSound(400, 300, 0.15);
                      }}
                      className="p-1 rounded-lg hover:bg-white/5 text-[#A0AEC0] hover:text-white transition-colors cursor-pointer"
                      title="Lock & Exit Builder"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Course lists */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider">Courses in bundle ({activeCustomRecord.courses.length}):</span>
                    
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                      {activeCustomRecord.courses.map((course, idx) => (
                        <div 
                          key={course + idx}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-[rgba(20,25,45,0.55)] border border-white/5 text-xs font-semibold"
                          id={`bundle-course-${idx}`}
                        >
                          <span className="truncate max-w-[200px] text-[#CFD8E3]">{course}</span>
                          <button
                            id={`remove-course-bundle-${idx}`}
                            onClick={() => handleRemoveCourseFromActiveCustomId(course)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg active:scale-90 transition-all cursor-pointer"
                            title="Remove Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Course manually */}
                  <div className="mt-1 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider">Add course directly:</span>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const cText = formData.get("manualCourseName") as string;
                        if (cText && cText.trim()) {
                          handleAddCourseToActiveCustomId(cText);
                          e.currentTarget.reset();
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        id="manual-course-add-input"
                        name="manualCourseName"
                        type="text"
                        placeholder="e.g. Mechanical Eng 302..."
                        className="flex-1 px-3 py-2 bg-[rgba(5,8,22,0.8)] border border-white/10 rounded-xl text-xs text-white placeholder-[#A0AEC0] focus:outline-none focus:border-purple-500/50"
                      />
                      <button
                        id="manual-course-add-btn"
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-[#10B981] text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </form>
                    <p className="text-[9px] text-emerald-400/80 italic leading-relaxed mt-0.5">
                      💡 Tip: Search courses below and tap "+" to add them directly to this active ID pack!
                    </p>
                  </div>
                </div>
              )}

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
                activeCustomId={activeCustomRecordId}
                onAddCourseToActive={handleAddCourseToActiveCustomId}
                exactMatchOnly={exactMatchOnly}
                theme={settings.theme}
                onUpdateLabels={handleUpdateLabels}
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
              theme={settings.theme}
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
              onUpdateLabels={handleUpdateLabels}
              onImportFavorites={handleImportFavorites}
              theme={settings.theme}
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
              onShowNotification={(msg) => showNotification(msg)}
              theme={settings.theme}
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
