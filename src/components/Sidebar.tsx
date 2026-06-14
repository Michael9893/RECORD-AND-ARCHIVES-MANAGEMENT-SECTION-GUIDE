/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Archive, 
  FileDigit, 
  ShieldAlert, 
  Trash2, 
  Warehouse, 
  BookOpen, 
  Search, 
  Bookmark, 
  User, 
  Shield, 
  Sparkles,
  FileText,
  Layers,
  Send,
  Mail
} from "lucide-react";
import { Category, Guideline, UserRole } from "../types";
import BrandLogo from "./BrandLogo";

interface SidebarProps {
  categories: Category[];
  guidelines: Guideline[];
  selectedCategory: string | null;
  setSelectedCategory: (catId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  bookmarkedIds: string[];
  selectedGuidelineId: string | null;
  setSelectedGuidelineId: (id: string | null) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onOpenAiAssistant: () => void;
  onManageCategories: () => void;
}

// Icon helper to dynamically load a Lucide Icon string
export const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case "Archive":
      return <Archive className={className} />;
    case "FileDigit":
      return <FileDigit className={className} />;
    case "ShieldAlert":
      return <ShieldAlert className={className} />;
    case "Trash2":
      return <Trash2 className={className} />;
    case "Warehouse":
      return <Warehouse className={className} />;
    case "Layers":
      return <Layers className={className} />;
    case "BookOpen":
      return <BookOpen className={className} />;
    case "Search":
      return <Search className={className} />;
    case "Bookmark":
      return <Bookmark className={className} />;
    case "Send":
      return <Send className={className} />;
    case "Mail":
      return <Mail className={className} />;
    default:
      return <FileText className={className} />;
  }
};

export default function Sidebar({
  categories,
  guidelines,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  bookmarkedIds,
  selectedGuidelineId,
  setSelectedGuidelineId,
  currentRole,
  setCurrentRole,
  onOpenAiAssistant,
  onManageCategories
}: SidebarProps) {
  // Count how many guidelines are in each category
  const getCategoryCount = (categoryId: string) => {
    return guidelines.filter(g => g.category === categoryId).length;
  };

  const bookmarkedGuidelines = guidelines.filter(g => bookmarkedIds.includes(g.id));

  return (
    <aside id="rams-sidebar" className="w-full lg:w-80 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800">
      {/* Brand Header */}
      <div id="sidebar-header" className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo className="w-8 h-8" />
          <div>
            <h1 className="font-sans font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              RAMS <span className="text-indigo-400">FO1</span>
            </h1>
            <p className="text-[8px] font-mono text-slate-400 tracking-wider font-semibold uppercase leading-tight">
              RECORDS AND ARCHIVE MANAGEMENT SECTION
            </p>
          </div>
        </div>
      </div>

      {/* Role Management Panel */}
      <div id="role-panel" className="p-4 mx-4 my-2 mt-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-sans font-medium text-slate-400">ACTIVE WORKSPACE DECK:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1 shadow-sm ${
            currentRole === "ADMIN" 
              ? "bg-red-500/10 text-red-400 border border-red-500/20" 
              : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentRole === "ADMIN" ? "bg-red-500" : "bg-indigo-500 animate-pulse"}`}></span>
            {currentRole}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            id="toggle-role-viewer"
            type="button"
            onClick={() => setCurrentRole("VIEWER")}
            className={`py-1.5 px-3 rounded-md text-xs font-sans font-medium transition-all flex items-center justify-center gap-1.5 ${
              currentRole === "VIEWER"
                ? "bg-slate-800 text-indigo-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Viewer
          </button>
          <button
            id="toggle-role-admin"
            type="button"
            onClick={() => setCurrentRole("ADMIN")}
            className={`py-1.5 px-3 rounded-md text-xs font-sans font-medium transition-all flex items-center justify-center gap-1.5 ${
              currentRole === "ADMIN"
                ? "bg-slate-800 text-red-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>
        
        <p className="text-[10px] text-slate-550 leading-normal">
          {currentRole === "ADMIN" 
            ? "✓ Authorized to catalog, edit, and purge division-wide procedures."
            : "✓ Standard training access. Review guidelines and track step-by-step progress."}
        </p>
      </div>

      {/* Main Search */}
      <div id="search-container" className="px-6 py-4">
        <label className="sr-only">Search procedures</label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            id="sidebar-search"
            type="text"
            placeholder="Search procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Scrollable Navigation Sections */}
      <div id="nav-sections" className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        
        {/* Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
              Categories
            </span>
            <div className="flex items-center gap-2">
              <button
                id="btn-sidebar-manage-categories"
                onClick={onManageCategories}
                type="button"
                className="text-[10px] text-indigo-400 hover:underline hover:text-indigo-300 font-sans cursor-pointer font-bold transition-all"
              >
                Manage
              </button>
              {selectedCategory && (
                <span className="text-slate-700 font-mono text-[9px] select-none">|</span>
              )}
              {selectedCategory && (
                <button 
                  id="clear-category-filter"
                  onClick={() => setSelectedCategory(null)}
                  className="text-[10px] text-indigo-400 hover:underline hover:text-indigo-300 font-sans cursor-pointer font-semibold transition-all"
                >
                  Show All
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <button
              id="category-btn-all"
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-sans font-medium rounded-lg transition-colors ${
                selectedCategory === null 
                  ? "bg-slate-800 text-indigo-400 font-semibold" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>All Guidelines</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                {guidelines.length}
              </span>
            </button>
            
            {categories.map((category) => {
              const count = getCategoryCount(category.id);
              return (
                <button
                  id={`category-btn-${category.id}`}
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-sans font-medium rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? "bg-slate-800 text-indigo-400 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <CategoryIcon name={category.iconName} className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{category.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bookmarks Section */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Bookmark className="w-3.5 h-3.5 text-rose-450" />
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-semibold block">
              My Bookmarks
            </span>
          </div>
          
          {bookmarkedGuidelines.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-sans italic pl-3 leading-normal">
              No bookmarked guidelines yet. Click the bookmark icon on any guide checklist.
            </p>
          ) : (
            <div className="space-y-1 pl-1">
              {bookmarkedGuidelines.map((g) => (
                <button
                  id={`bookmark-shortcut-${g.id}`}
                  key={g.id}
                  onClick={() => setSelectedGuidelineId(g.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-sans font-medium rounded-lg truncate block transition-colors ${
                    selectedGuidelineId === g.id
                      ? "bg-slate-800 text-slate-100 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Assistant Banner */}
      <div id="ai-banner" className="m-4 p-4 rounded-2xl bg-indigo-950 border border-indigo-850 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-400/10 flex items-center justify-center animate-pulse-slow border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-indigo-200">MJB HELPER</h4>
            <p className="text-[10px] text-indigo-400">Ask questions instantly</p>
          </div>
        </div>
        <button
          id="btn-sidebar-ask-ai"
          onClick={onOpenAiAssistant}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          GONSULT ME
        </button>
      </div>
    </aside>
  );
}
