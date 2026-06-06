/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Menu, 
  X, 
  Plus, 
  Database, 
  LayoutDashboard, 
  Layers, 
  FolderLock, 
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { Guideline, Category, UserRole, Attachment } from "./types";
import { INITIAL_CATEGORIES, INITIAL_GUIDELINES } from "./data";
import Sidebar from "./components/Sidebar";
import GuidelineCard from "./components/GuidelineCard";
import GuidelineDetail from "./components/GuidelineDetail";
import GuidelineForm from "./components/GuidelineForm";
import AiAssistant from "./components/AiAssistant";
import CategoryManager from "./components/CategoryManager";
import BrandLogo from "./components/BrandLogo";

// Safe LocalStorage helpers to prevent DOMExceptions in strict Incognito or Sandbox environments
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`localStorage.getItem failed for key "${key}":`, e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`localStorage.setItem failed for key "${key}":`, e);
  }
};

const safeParseJSON = <T,>(jsonString: string | null, fallback: T): T => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.warn("safeParseJSON failed for string:", jsonString, e);
    return fallback;
  }
};

export default function App() {
  // Sync state stores with LocalStorage & Server
  const [guidelines, setGuidelines] = useState<Guideline[]>(() => {
    const local = safeGetItem("rams_guidelines");
    const parsed = safeParseJSON<Guideline[]>(local, INITIAL_GUIDELINES);
    return Array.isArray(parsed) 
      ? parsed.filter((g: any) => g.id !== "gd-uid-1001" && g.id !== "gd-uid-1002" && g.id !== "gd-uid-1003")
      : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const local = safeGetItem("rams_categories");
    return safeParseJSON<Category[]>(local, INITIAL_CATEGORIES);
  });

  const [isLoadedFromServer, setIsLoadedFromServer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const local = safeGetItem("rams_bookmarks");
    return safeParseJSON<string[]>(local, []);
  });

  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string | null>(null);
  const [isEditingGuideline, setIsEditingGuideline] = useState(false);
  const [isCreatingGuideline, setIsCreatingGuideline] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("VIEWER");
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dynamic onboarding progress rate (each added guideline contributes 1% up to 100%, starting from 0%)
  const onboardingProgress = Math.min(100, guidelines.length * 1);

  // Dynamic division load rate (each added guideline contributes 1% up to 100%, starting from 0%)
  const divisionLoad = Math.min(100, guidelines.length * 1);

  // 1. Fetch initial and ongoing data from server to keep database in perfect sync across multiple tabs/accounts
  const syncWithServer = async (silent = false) => {
    try {
      if (!silent) setIsSyncing(true);
      const t = Date.now();

      // 1. Safe fetch of Guidelines
      let resGuidelines: Guideline[] = [];
      let fetchGuidelinesSuccess = false;
      try {
        const responseG = await fetch(`/api/guidelines?t=${t}`);
        if (responseG.ok) {
          const contentTypeG = responseG.headers.get("Content-Type") || "";
          if (contentTypeG.includes("application/json")) {
            resGuidelines = await responseG.json();
            fetchGuidelinesSuccess = true;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch guidelines from server:", err);
      }

      // 2. Safe fetch of Categories
      let resCategories: Category[] = [];
      let fetchCategoriesSuccess = false;
      try {
        const responseC = await fetch(`/api/categories?t=${t}`);
        if (responseC.ok) {
          const contentTypeC = responseC.headers.get("Content-Type") || "";
          if (contentTypeC.includes("application/json")) {
            resCategories = await responseC.json();
            fetchCategoriesSuccess = true;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch categories from server:", err);
      }

      // 3. Safe fetch of Bookmarks
      let resBookmarks: string[] = [];
      let fetchBookmarksSuccess = false;
      try {
        const responseB = await fetch(`/api/bookmarks?t=${t}`);
        if (responseB.ok) {
          const contentTypeB = responseB.headers.get("Content-Type") || "";
          if (contentTypeB.includes("application/json")) {
            resBookmarks = await responseB.json();
            fetchBookmarksSuccess = true;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch bookmarks from server:", err);
      }

      // Handle guidelines merge & migration
      if (fetchGuidelinesSuccess) {
        const serverFiltered = Array.isArray(resGuidelines)
          ? resGuidelines.filter((g: any) => g.id !== "gd-uid-1001" && g.id !== "gd-uid-1002" && g.id !== "gd-uid-1003")
          : [];

        const hadLegacyOnServer = Array.isArray(resGuidelines) && resGuidelines.length !== serverFiltered.length;
        const hasGuidelinesOnServer = serverFiltered.length > 0;

        let finalGuidelines = serverFiltered;

        // Migrate local guidelines and categories to server if server is empty
        const localGStr = safeGetItem("rams_guidelines");
        let localGuidelines = safeParseJSON<Guideline[]>(localGStr, []);
        localGuidelines = Array.isArray(localGuidelines)
          ? localGuidelines.filter((g: any) => g.id !== "gd-uid-1001" && g.id !== "gd-uid-1002" && g.id !== "gd-uid-1003")
          : [];

        if (!hasGuidelinesOnServer && localGuidelines.length > 0) {
          try {
            await fetch("/api/guidelines", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ guidelines: localGuidelines })
            });
            finalGuidelines = localGuidelines;
          } catch (err) {
            console.warn("Failed to migrate guidelines to empty server:", err);
          }
        } else if (hadLegacyOnServer || (Array.isArray(resGuidelines) && resGuidelines.length !== serverFiltered.length)) {
          try {
            await fetch("/api/guidelines", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ guidelines: serverFiltered })
            });
          } catch (err) {
            console.warn("Failed to update clean guidelines with removed legacy on server:", err);
          }
        }

        if (Array.isArray(finalGuidelines)) {
          setGuidelines(finalGuidelines);
          safeSetItem("rams_guidelines", JSON.stringify(finalGuidelines));
        }
      }

      // Handle categories updates
      if (fetchCategoriesSuccess) {
        if (Array.isArray(resCategories)) {
          setCategories(resCategories);
          safeSetItem("rams_categories", JSON.stringify(resCategories));
        }
      }

      // Handle bookmarks merge & migration
      if (fetchBookmarksSuccess) {
        const localBStr = safeGetItem("rams_bookmarks");
        let localBookmarks = safeParseJSON<string[]>(localBStr, []);
        if (!Array.isArray(localBookmarks)) {
          localBookmarks = [];
        }

        const hasBookmarksOnServer = Array.isArray(resBookmarks) && resBookmarks.length > 0;
        let finalBookmarks = resBookmarks;

        if (!hasBookmarksOnServer && localBookmarks.length > 0) {
          try {
            await fetch("/api/bookmarks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookmarkedIds: localBookmarks })
            });
            finalBookmarks = localBookmarks;
          } catch (err) {
            console.warn("Failed to migrate bookmarks to server:", err);
          }
        }

        if (Array.isArray(finalBookmarks)) {
          setBookmarkedIds(finalBookmarks);
          safeSetItem("rams_bookmarks", JSON.stringify(finalBookmarks));
        }
      }

      setIsLoadedFromServer(true);
    } catch (err: any) {
      console.warn("Unable to load shared store data (this is normal during startup):", err.message || err);
      // Ensure we still mark loaded as true so fallback state renders if server is down or during temporary restart
      setIsLoadedFromServer(true);
    } finally {
      if (!silent) {
        setIsSyncing(false);
      }
    }
  };

  // Sync on component mount
  useEffect(() => {
    syncWithServer(false);
  }, []);

  // Sync immediately when tab gains focus or user returns to the catalog
  useEffect(() => {
    const handleSyncOnFocus = () => {
      if (document.visibilityState === "visible") {
        syncWithServer(true); // silent background sync
      }
    };

    window.addEventListener("focus", handleSyncOnFocus);
    document.addEventListener("visibilitychange", handleSyncOnFocus);
    return () => {
      window.removeEventListener("focus", handleSyncOnFocus);
      document.removeEventListener("visibilitychange", handleSyncOnFocus);
    };
  }, [isEditingGuideline, isCreatingGuideline]);

  // 2. Clear state-listening useEffects that were triggering race-condition overwrites.
  // Instead, save to local backup backup as an immediate secondary layer.
  useEffect(() => {
    safeSetItem("rams_bookmarks", JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  // Dynamic persistence helpers
  const persistGuidelines = async (updatedGuidelines: Guideline[]) => {
    try {
      await fetch("/api/guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guidelines: updatedGuidelines })
      });
    } catch (err) {
      console.error("Failed to sync guidelines with shared database:", err);
    }
  };

  const persistCategories = async (updatedCategories: Category[]) => {
    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: updatedCategories })
      });
    } catch (err) {
      console.error("Failed to sync categories with shared database:", err);
    }
  };

  // Rapid background auto-polling (every 2.5 seconds) to keep accounts and viewers fully synchronous in real-time
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Only run background sync if the user is not actively editing or creating to prevent form disruption
        if (isEditingGuideline || isCreatingGuideline) return;
        
        await syncWithServer(true); // Silent background refresh
      } catch (err) {
        console.error("Background auto-sync failed:", err);
      }
    }, 2500); // 2.5 seconds sync speed

    return () => clearInterval(interval);
  }, [isEditingGuideline, isCreatingGuideline]);

  // General direct fetch trigger for manual Sync Now triggers
  const handleForceSyncWithServer = async () => {
    await syncWithServer(false);
  };

  // Handle toggling of favorite states
  const handleToggleBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarkedIds.includes(id) 
      ? bookmarkedIds.filter(bId => bId !== id) 
      : [...bookmarkedIds, id];
    
    setBookmarkedIds(updated);
    safeSetItem("rams_bookmarks", JSON.stringify(updated));
    
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkedIds: updated })
      });
    } catch (err) {
      console.error("Failed to persist bookmark to shared database:", err);
    }
  };

  // Create new procedure card - write-through directly to server
  const handleCreateGuideline = (newGuideline: Guideline) => {
    const updated = [newGuideline, ...guidelines];
    setGuidelines(updated);
    safeSetItem("rams_guidelines", JSON.stringify(updated));
    persistGuidelines(updated);

    setIsCreatingGuideline(false);
    setSelectedGuidelineId(newGuideline.id); // open newly created guide immediately
  };

  // Modify currently selected guideline card - write-through directly to server
  const handleEditGuideline = (updatedGuideline: Guideline) => {
    const updated = guidelines.map(g => g.id === updatedGuideline.id ? updatedGuideline : g);
    setGuidelines(updated);
    safeSetItem("rams_guidelines", JSON.stringify(updated));
    persistGuidelines(updated);

    setIsEditingGuideline(false);
  };

  // Delete guideline permanent action - write-through directly to server
  const handleDeleteGuideline = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this guidelines procedural card from the catalog? This is irreversible.")) {
      const updated = guidelines.filter(g => g.id !== id);
      setGuidelines(updated);
      safeSetItem("rams_guidelines", JSON.stringify(updated));
      persistGuidelines(updated);

      setSelectedGuidelineId(null);
    }
  };

  // Trigger default recovery resetting seed data if the guidelines repository becomes empty
  const handleResetCatalogToSeeds = async () => {
    if (confirm("Reset current procedures catalog and custom categories back to master template seeds? This deletes custom items.")) {
      try {
        setIsSyncing(true);
        const res = await fetch("/api/reset", { method: "POST" }).then(r => r.json());
        if (res.success) {
          setGuidelines(res.guidelines || []);
          setCategories(res.categories || INITIAL_CATEGORIES);
          safeSetItem("rams_guidelines", JSON.stringify(res.guidelines || []));
          safeSetItem("rams_categories", JSON.stringify(res.categories || INITIAL_CATEGORIES));
        } else {
          setGuidelines(INITIAL_GUIDELINES);
          setCategories(INITIAL_CATEGORIES);
          safeSetItem("rams_guidelines", JSON.stringify(INITIAL_GUIDELINES));
          safeSetItem("rams_categories", JSON.stringify(INITIAL_CATEGORIES));
        }
        setSelectedCategory(null);
        setSearchQuery("");
        setBookmarkedIds([]);
        setSelectedGuidelineId(null);
        setIsEditingGuideline(false);
        setIsCreatingGuideline(false);
      } catch (err) {
        console.error("Error resetting catalog to seeds:", err);
        // Fallback
        setGuidelines(INITIAL_GUIDELINES);
        setCategories(INITIAL_CATEGORIES);
        safeSetItem("rams_guidelines", JSON.stringify(INITIAL_GUIDELINES));
        safeSetItem("rams_categories", JSON.stringify(INITIAL_CATEGORIES));
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleCreateCategory = (newCat: Category) => {
    const updated = [...categories, newCat];
    setCategories(updated);
    safeSetItem("rams_categories", JSON.stringify(updated));
    persistCategories(updated);
  };

  const handleDeleteCategory = (catId: string) => {
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    safeSetItem("rams_categories", JSON.stringify(updated));
    persistCategories(updated);

    if (selectedCategory === catId) {
      setSelectedCategory(null);
    }
  };

  // Filter pipelines
  const filteredGuidelines = guidelines.filter(g => {
    const matchesCategory = selectedCategory ? g.category === selectedCategory : true;
    const matchesSearch = searchQuery.trim() === "" || 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const selectedGuideline = guidelines.find(g => g.id === selectedGuidelineId) || null;

  // Gather all attachments from all guidelines (both initial and newly uploaded/added)
  const allAttachments = guidelines.reduce<(Attachment & { guidelineId: string; guidelineTitle: string })[]>((acc, g) => {
    if (g.attachments && g.attachments.length > 0) {
      g.attachments.forEach(att => {
        acc.push({
          ...att,
          guidelineId: g.id,
          guidelineTitle: g.title
        });
      });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden">
      
      {/* Mobile Top Header */}
      <header id="mobile-nav" className="lg:hidden bg-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between text-white select-none z-20 shrink-0">
        <div className="flex items-center gap-2">
          <BrandLogo className="w-6 h-6" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">RAMS FO1</h1>
            <p className="text-[8px] font-mono text-indigo-400 uppercase tracking-wider leading-tight">RECORDS AND ARCHIVE MANAGEMENT SECTION</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-mobile-consult-ai"
            onClick={() => setIsAiOpen(true)}
            className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center gap-1 text-[11px] font-medium hover:bg-indigo-500/20 transition-all cursor-pointer animate-pulse-slow font-semibold uppercase"
            type="button"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            GONSULT ME
          </button>
          
          <button
            id="btn-mobile-menu-burger"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 bg-slate-800 text-slate-100 rounded-lg hover:bg-slate-700 focus:outline-none transition-all cursor-pointer"
            type="button"
            aria-label="Toggle Navigation Drawer"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main split work space */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Mobile Backdrop Overlay - sibling to sidebar for seamless viewport coverage */}
        {mobileSidebarOpen && (
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-25 transition-opacity"
            aria-hidden="true"
          ></div>
        )}
        
        {/* Mobile Sidebar Overlay container */}
        <div 
          id="sidebar-container-box"
          className={`shrink-0 z-30 lg:z-10 bg-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 h-full ${
            mobileSidebarOpen 
              ? "fixed inset-y-0 left-0 translate-x-0 w-80 shadow-2xl" 
              : "absolute inset-y-0 left-0 -translate-x-full lg:relative lg:translate-x-0 lg:block lg:w-auto"
          }`}
        >

          <Sidebar
            categories={categories}
            guidelines={guidelines}
            selectedCategory={selectedCategory}
            setSelectedCategory={(catId) => {
              setSelectedCategory(catId);
              setMobileSidebarOpen(false); // Close drawer
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            bookmarkedIds={bookmarkedIds}
            selectedGuidelineId={selectedGuidelineId}
            setSelectedGuidelineId={(id) => {
              setSelectedGuidelineId(id);
              setIsEditingGuideline(false);
              setIsCreatingGuideline(false);
              setMobileSidebarOpen(false);
            }}
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            onOpenAiAssistant={() => {
              setIsAiOpen(true);
              setMobileSidebarOpen(false);
            }}
            onManageCategories={() => setIsCategoryManagerOpen(true)}
          />
        </div>

        {/* Dynamic Inner Main Workspace Panel */}
        <main id="main-content-area" className="flex-1 overflow-y-auto flex flex-col h-full bg-slate-50 relative">
          
          {/* Screen routing conditions */}
          {isCreatingGuideline ? (
            <GuidelineForm
              categories={categories}
              onSave={handleCreateGuideline}
              onCancel={() => setIsCreatingGuideline(false)}
              defaultCategory={selectedCategory}
            />
          ) : isEditingGuideline && selectedGuideline ? (
            <GuidelineForm
              categories={categories}
              guidelineToEdit={selectedGuideline}
              onSave={handleEditGuideline}
              onCancel={() => setIsEditingGuideline(false)}
            />
          ) : selectedGuideline ? (
            <GuidelineDetail
              guideline={selectedGuideline}
              categories={categories}
              isBookmarked={bookmarkedIds.includes(selectedGuideline.id)}
              onToggleBookmark={handleToggleBookmark}
              onEdit={() => setIsEditingGuideline(true)}
              onDelete={() => handleDeleteGuideline(selectedGuideline.id)}
              onBack={() => setSelectedGuidelineId(null)}
              currentRole={currentRole}
              onOpenAiAssistant={() => setIsAiOpen(true)}
            />
          ) : (
            // Default Dashboard View Layout
            <div id="dashboard-viewport" className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
              
              {/* 👥 REAL-TIME MULTI-USER WORKFLOW WALKTHROUGH */}
              <div id="scenario-walkthrough-panel" className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-indigo-100 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-100/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 border border-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      👥
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider font-mono">
                        Multi-User Real-Time Simulator Walkthrough
                      </h3>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Follow these simple steps side-by-side to verify immediate, persistent synchronization between ACCOUNT A and ACCOUNT B.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                      Live Server Connection Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  {/* Account A Column */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        💻 Tab 1: ACCOUNT A (Admin)
                      </span>
                      {currentRole !== "ADMIN" ? (
                        <button
                          id="btn-quick-admin-switch"
                          onClick={() => setCurrentRole("ADMIN")}
                          className="text-[10px] text-red-600 hover:bg-red-50 bg-white border border-red-200 rounded px-2 py-0.5 font-bold cursor-pointer transition-all hover:scale-105"
                          type="button"
                        >
                          Switch to Admin
                        </button>
                      ) : (
                        <span className="text-[10px] text-red-500 font-semibold font-mono">
                          ★ Currently Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-650 text-[11px] leading-relaxed">
                      This represents files or policies added by division executives:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-500 text-[11px] pl-1">
                      <li>Ensure active role in the sidebar says <strong className="text-slate-700">ADMIN</strong>.</li>
                      <li>Click the black <strong className="text-indigo-600 font-semibold">+ Add Guideline</strong> button on this dashboard.</li>
                      <li>Submit key steps & criteria for a procedural card (e.g. <em className="text-slate-800">"Office Climate Audit"</em>).</li>
                    </ol>
                  </div>

                  {/* Account B Column */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        🕶️ Tab 2: ACCOUNT B (Incognito Viewer)
                      </span>
                      <button
                        id="btn-quick-copy-url"
                        onClick={() => {
                          const appUrl = window.location.href;
                          navigator.clipboard.writeText(appUrl);
                          alert("App URL copied to clipboard! Open a brand new Incognito Browser window, paste the URL, and watch guidelines fetch live and update in real-time.");
                        }}
                        className="text-[10px] text-indigo-600 hover:bg-indigo-50 bg-white border border-indigo-200 rounded px-2 py-0.5 font-semibold cursor-pointer transition-all flex items-center gap-1 hover:scale-105"
                        type="button"
                      >
                        Copy App URL
                      </button>
                    </div>
                    <p className="text-slate-650 text-[11px] leading-relaxed">
                      Representing standard division visitors accessing the platform:
                    </p>
                    <ul className="list-decimal list-inside space-y-1 text-slate-500 text-[11px] pl-1">
                      <li>Open a new <strong className="text-indigo-600">Incognito / Private</strong> window.</li>
                      <li>Paste the App's URL. It defaults securely to <strong className="text-slate-700">VIEWER</strong> mode.</li>
                      <li>Watch the guideline card you created on ACCOUNT A appear instantly (<strong className="text-emerald-600">no reload required!</strong>) and stay persisted!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bento Grid Layout Section */}
              <section id="bento-dashboard-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Main Welcome Hero Bento Card (takes 2 cols, 2 rows equivalent) */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden group min-h-[300px]">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border border-indigo-100">
                      Active Guideline Suite
                    </span>
                  </div>
                  <div className="mb-6 space-y-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 border border-indigo-100">
                      <Database className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none font-sans">
                      RAMS FO1 Procedures Catalog
                    </h2>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-md">
                      Official guidebook channel of the Records and Archive Management Section. Search catalog logs, explore regulatory checklists, analyze flowchart diagrams, and consult MJB HELPER for shared division guidance.
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold">
                        v2.6.4 Standard
                      </span>
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold">
                        ROLE: {currentRole}
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        SHARED PERSISTENCE
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsAiOpen(true)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/10 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        GONSULT ME
                      </button>
                      {currentRole === "ADMIN" && (
                        <button
                          onClick={() => setIsCreatingGuideline(true)}
                          className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          + Add Guideline
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Quick Categories Bento Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                        Quick Categories
                      </h3>
                      <button
                        onClick={() => setIsCategoryManagerOpen(true)}
                        className="text-[11px] text-indigo-700 hover:text-white bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 rounded-lg px-2.5 py-1 font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        type="button"
                      >
                        <Layers className="w-3 h-3" />
                        Manage
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      {categories.map((c, idx) => {
                        const count = guidelines.filter(g => g.category === c.id).length;
                        const isSelected = selectedCategory === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCategory(isSelected ? null : c.id)}
                            className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                              isSelected 
                                ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold" 
                                : "bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                                idx % 3 === 0 ? "bg-blue-100 text-blue-700" :
                                idx % 3 === 1 ? "bg-orange-100 text-orange-700" :
                                "bg-purple-100 text-purple-700"
                              }`}>
                                0{idx + 1}
                              </div>
                              <span className="text-xs font-sans truncate">{c.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shrink-0">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-sans font-bold text-left pt-2 cursor-pointer"
                    >
                      ← Clear category filter
                    </button>
                  )}
                </div>

                {/* Right side bento stack container for metrics and attachments */}
                <div className="flex flex-col gap-4 min-h-[300px]">
                  {/* 3. Division Load Metrics Bento Card */}
                  <div className="bg-indigo-600 rounded-2xl shadow-sm p-5 text-white flex flex-col justify-between flex-1 min-h-[135px]">
                    <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-indigo-200">
                      Division Load
                    </p>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <span className="text-4xl font-extrabold tracking-tight">{divisionLoad}%</span>
                        <span className="text-[10px] block opacity-85 mt-1">Operational Efficiency</span>
                      </div>
                      <span className="text-xs bg-indigo-500/40 border border-indigo-400/30 px-2 py-0.5 rounded font-semibold transition-all">
                        {divisionLoad === 0 ? "Idle" : divisionLoad < 50 ? "Light" : divisionLoad < 85 ? "Optimal" : "Stable"}
                      </span>
                    </div>
                  </div>

                  {/* 4. Recent Attachments Bento Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between flex-1 min-h-[135px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Recent Attachments
                    </p>
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto pr-1">
                      {allAttachments.length > 0 ? (
                        allAttachments.slice(0, 3).map((att, idx) => {
                          const isPdf = att.name.toLowerCase().endsWith(".pdf") || att.name.toLowerCase().includes("pdf");
                          const isDoc = att.name.toLowerCase().endsWith(".doc") || att.name.toLowerCase().endsWith(".docx") || att.name.toLowerCase().includes("doc");
                          const fileTypeLabel = isPdf ? "PDF" : isDoc ? "DOC" : "FILE";
                          
                          return (
                            <div 
                              key={`${att.guidelineId}-${idx}`}
                              onClick={() => setSelectedGuidelineId(att.guidelineId)}
                              className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                              title={`Associated Procedural Guideline: "${att.guidelineTitle}"`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                                isPdf 
                                  ? "bg-rose-50 border-rose-100 text-rose-500" 
                                  : isDoc 
                                    ? "bg-indigo-50 border-indigo-100 text-indigo-500" 
                                    : "bg-slate-100 border-slate-200 text-slate-650"
                              }`}>
                                {fileTypeLabel}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                                  {att.name}
                                </p>
                                <p className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                                  <span>{att.size || "Unknown size"}</span>
                                  <span className="truncate max-w-[120px] text-right font-medium text-slate-500">
                                    in {att.guidelineTitle}
                                  </span>
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-xs font-medium text-slate-400 italic">
                            No uploaded files found.
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1 max-w-[180px] mx-auto leading-normal">
                            Register a guideline with custom attachments to populate files.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </section>

              {/* 5. Progress Tracker Row / Bar Section */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <FolderLock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 font-sans uppercase">Onboarding Progress</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Assigned training module completion rate for newly registered recruits</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex-1 md:w-48 bg-slate-150 h-2 rounded-full overflow-hidden border">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${onboardingProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 shrink-0 bg-slate-50 px-2 py-1 rounded-md border">
                    {onboardingProgress}% Done
                  </span>
                </div>
              </section>

              {/* Sub controls Area: Create button / filter results count */}
              <section id="results-ctrl-bar" className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="space-y-1">
                  <h2 className="text-slate-900 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <LayoutDashboard className="w-4.5 h-4.5 text-slate-500" />
                    PROCEDURAL CATALOG DIRECTORY
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Displaying <span className="font-bold text-slate-800">{filteredGuidelines.length}</span> of <span className="font-bold text-slate-800">{guidelines.length}</span> guidelines available.
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    id="btn-sync-shared-database"
                    onClick={handleForceSyncWithServer}
                    className={`flex items-center gap-1 px-3 py-2 text-indigo-700 font-sans font-semibold text-xs rounded-lg border border-indigo-200 transition-colors cursor-pointer ${
                      isSyncing ? "bg-indigo-50 animate-pulse" : "bg-indigo-50 hover:bg-indigo-100"
                    }`}
                    title="Load latest updates from the shared cloud database instantly"
                    type="button"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing DB..." : "Sync DB"}
                  </button>

                  <button
                    id="btn-recover-seed-catalog"
                    onClick={handleResetCatalogToSeeds}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-sans font-semibold text-xs rounded-lg border border-slate-200 cursor-pointer"
                    title="Restore default guidelines templates if customized sandbox edits go too far"
                    type="button"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Restore templates
                  </button>

                  {/* ADMIN role: create button */}
                  {currentRole === "ADMIN" && (
                    <button
                      id="btn-admin-draft-new-protocol"
                      onClick={() => setIsCreatingGuideline(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow shadow-slate-900/10 cursor-pointer"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                      Add Guideline
                    </button>
                  )}
                </div>
              </section>

              {/* Grid Catalog Display */}
              {!isLoadedFromServer ? (
                <div id="loading-deck-skeleton" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} id={`skeleton-card-${n}`} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
                      <div className="h-40 bg-slate-100 rounded-xl w-full"></div>
                      <div className="h-4 bg-slate-200 rounded-md w-2/3"></div>
                      <div className="h-3 bg-slate-150 rounded-md w-full"></div>
                      <div className="h-3 bg-slate-150 rounded-md w-4/5"></div>
                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="h-5 bg-slate-100 rounded-md w-16"></div>
                        <div className="h-8 bg-slate-150 rounded-lg w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredGuidelines.length === 0 ? (
                <div id="no-matched-results-panel" className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-slate-800 text-sm">No Matched Records Procedures</h3>
                    <p className="text-slate-500 text-xs leading-normal">
                      No division procedures correspond to your category filters / search query phrase: <span className="font-semibold text-slate-800">"{searchQuery || 'Active Category'}"</span>.
                    </p>
                  </div>
                  <button
                    id="btn-reset-filters"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 hover:scale-105 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                    type="button"
                  >
                    Reset Directory Filters
                  </button>
                </div>
              ) : (
                <div id="guidelines-deck-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredGuidelines.map((g) => (
                    <GuidelineCard
                      key={g.id}
                      guideline={g}
                      categories={categories}
                      isBookmarked={bookmarkedIds.includes(g.id)}
                      onToggleBookmark={handleToggleBookmark}
                      onSelect={() => setSelectedGuidelineId(g.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Gemini AI Assistant Slider Drawer Overlay */}
        <AiAssistant
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          guidelines={guidelines}
        />

        {/* Category Setup Overlay Dialog */}
        <CategoryManager
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          categories={categories}
          guidelines={guidelines}
          onCreateCategory={handleCreateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      </div>
    </div>
  );
}
