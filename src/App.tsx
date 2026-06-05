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

export default function App() {
  // Sync state stores with LocalStorage
  const [guidelines, setGuidelines] = useState<Guideline[]>(() => {
    const local = localStorage.getItem("rams_guidelines");
    return local ? JSON.parse(local) : INITIAL_GUIDELINES;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const local = localStorage.getItem("rams_categories");
    return local ? JSON.parse(local) : INITIAL_CATEGORIES;
  });

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const local = localStorage.getItem("rams_bookmarks");
    return local ? JSON.parse(local) : [];
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

  // Auto save database backups inside local scope
  useEffect(() => {
    localStorage.setItem("rams_guidelines", JSON.stringify(guidelines));
  }, [guidelines]);

  useEffect(() => {
    localStorage.setItem("rams_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("rams_bookmarks", JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  // Handle toggling of favorite states
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  // Create new procedure card
  const handleCreateGuideline = (newGuideline: Guideline) => {
    setGuidelines(prev => [newGuideline, ...prev]);
    setIsCreatingGuideline(false);
    setSelectedGuidelineId(newGuideline.id); // open newly created guide immediately
  };

  // Modify currently selected guideline card
  const handleEditGuideline = (updatedGuideline: Guideline) => {
    setGuidelines(prev => prev.map(g => g.id === updatedGuideline.id ? updatedGuideline : g));
    setIsEditingGuideline(false);
  };

  // Delete guideline permanent action
  const handleDeleteGuideline = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this guidelines procedural card from the catalog? This is irreversible.")) {
      setGuidelines(prev => prev.filter(g => g.id !== id));
      setSelectedGuidelineId(null);
    }
  };

  // Trigger default recovery resetting seed data if the guidelines repository becomes empty
  const handleResetCatalogToSeeds = () => {
    if (confirm("Reset current procedures catalog and custom categories back to master template seeds? This deletes custom items.")) {
      setGuidelines(INITIAL_GUIDELINES);
      setCategories(INITIAL_CATEGORIES);
      setSelectedCategory(null);
      setSearchQuery("");
      setBookmarkedIds([]);
      setSelectedGuidelineId(null);
      setIsEditingGuideline(false);
      setIsCreatingGuideline(false);
    }
  };

  const handleCreateCategory = (newCat: Category) => {
    setCategories(prev => [...prev, newCat]);
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
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
              {filteredGuidelines.length === 0 ? (
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
