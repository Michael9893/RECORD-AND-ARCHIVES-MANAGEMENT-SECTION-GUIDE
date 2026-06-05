/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Layers, 
  FolderHeart, 
  Info,
  Archive,
  FileDigit,
  ShieldAlert,
  Warehouse,
  BookOpen,
  Search,
  Bookmark,
  FileText
} from "lucide-react";
import { Category, Guideline } from "../types";
import { CategoryIcon } from "./Sidebar";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  guidelines: Guideline[];
  onCreateCategory: (cat: Category) => void;
  onDeleteCategory: (catId: string) => void;
}

const COLOR_PRESETS = [
  { id: "amber", label: "Gold / Amber", class: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "blue", label: "Marine Blue", class: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "violet", label: "Deep Violet", class: "bg-violet-100 text-violet-800 border-violet-200" },
  { id: "rose", label: "Crimson Rose", class: "bg-rose-100 text-rose-800 border-rose-200" },
  { id: "emerald", label: "Emerald Green", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "indigo", label: "Royal Indigo", class: "bg-indigo-100 text-indigo-805 border-indigo-200" },
  { id: "slate", label: "Classic Slate", class: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "cyan", label: "Electric Cyan", class: "bg-cyan-100 text-cyan-800 border-cyan-200" },
];

const ICON_PRESETS = [
  { name: "Archive", label: "Archive Box" },
  { name: "FileDigit", label: "Binary File" },
  { name: "ShieldAlert", label: "Secure Shield" },
  { name: "Warehouse", label: "Storage Depot" },
  { name: "Layers", label: "Stack Layers" },
  { name: "BookOpen", label: "Open Manual" },
  { name: "Search", label: "Search Magnifier" },
  { name: "Bookmark", label: "Ribbon Pin" },
  { name: "FileText", label: "Plain Dossier" },
];

export default function CategoryManager({
  isOpen,
  onClose,
  categories,
  guidelines,
  onCreateCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Layers");
  const [colorClass, setColorClass] = useState("bg-indigo-100 text-indigo-805 border-indigo-200");
  const [activePresetId, setActivePresetId] = useState("indigo");
  const [formError, setFormError] = useState("");

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Category title/name is required.");
      return;
    }

    const proposedId = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    if (!proposedId) {
      setFormError("Invalid title. Use letters and numbers.");
      return;
    }

    if (categories.some((c) => c.id === proposedId)) {
      setFormError("A category with a similar identifier already exists.");
      return;
    }

    const newCategory: Category = {
      id: proposedId,
      name: name.trim(),
      description: description.trim() || ("Standard guideline division for " + name.trim()),
      iconName,
      colorClass,
    };

    onCreateCategory(newCategory);
    setName("");
    setDescription("");
    setIconName("Layers");
    setColorClass("bg-indigo-100 text-indigo-805 border-indigo-200");
    setActivePresetId("indigo");
    alert(`Successfully registered "${newCategory.name}" Category! It is now instantly hotlinked inside your division catalogs.`);
  };

  const handleTriggerDelete = (cat: Category) => {
    const assignedCount = guidelines.filter((g) => g.category === cat.id).length;
    let confirmPrompt = `Are you sure you want to permanently delete the category "${cat.name}"?`;
    if (assignedCount > 0) {
      confirmPrompt = `WARNING: There are ${assignedCount} active guideline(s) currently registered under "${cat.name}".\n\nDeleting this category will strip their taxonomy badge, falling back to basic unclassified labels.\n\nProceed with deleting "${cat.name}" anyway?`;
    }

    if (confirm(confirmPrompt)) {
      onDeleteCategory(cat.id);
    }
  };

  return (
    <div 
      id="category-management-backdrop" 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div 
        id="category-management-dialog" 
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header section */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 font-sans tracking-tight leading-none">
                Manage Operational Categories
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Establish custom workflow taxonomy structures for standard procedures.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            type="button"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form and List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Left Column: Create New Form */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">
                Create Taxonomy Category
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Register a new group to map business checklist cards, folders, and retention pipelines.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title Name text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="cat-inp-name">
                  Category Name / Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="cat-inp-name"
                  type="text"
                  required
                  placeholder="e.g., Vault Climate & Air logs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="cat-inp-desc">
                  Operational Description
                </label>
                <input
                  id="cat-inp-desc"
                  type="text"
                  placeholder="e.g., Temperature levels, air conditioning, and fire prevention..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800"
                />
              </div>

              {/* Color Preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Visual Badge Color Accent
                </label>
                <div id="badge-color-palette" className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((p) => {
                    const isSelected = activePresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActivePresetId(p.id);
                          setColorClass(p.class);
                        }}
                        className={`text-[10px] p-2 text-center rounded-lg border font-semibold truncate transition-all cursor-pointer ${
                          isSelected 
                            ? "ring-2 ring-indigo-500 border-indigo-300 scale-105" 
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                        title={p.label}
                      >
                        <span className="block truncate">{p.label.split(" ")[0]}</span>
                        <div className={`w-3.5 h-1.5 mx-auto mt-1 rounded-full border ${p.class}`}></div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Graphic Icon Indicator
                </label>
                <div id="badge-icon-palette" className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1">
                  {ICON_PRESETS.map((icon) => {
                    const isSelected = iconName === icon.name;
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setIconName(icon.name)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer hover:bg-slate-50 ${
                          isSelected 
                            ? "ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/50" 
                            : "bg-white border-slate-200"
                        }`}
                        title={icon.label}
                      >
                        <CategoryIcon name={icon.name} className="w-4 h-4 text-slate-600" />
                        <span className="text-[9px] font-mono text-slate-500 truncate max-w-full">{icon.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview block panel */}
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                  Live Preview:
                </span>
                <span className={`px-2.5 py-1 text-[11px] font-sans font-semibold rounded-lg border inline-flex items-center gap-1.5 ${colorClass}`}>
                  <CategoryIcon name={iconName} className="w-3.5 h-3.5" />
                  {name || "Untitled Category"}
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Register New Category
              </button>
            </form>
          </div>

          {/* Right Column: Existing Categories and Delete option */}
          <div className="pt-6 md:pt-0 md:pl-8 flex flex-col h-full min-h-[300px]">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">
                Existing Taxonomies ({categories.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review established groups. Delete redundant structures or unused taxonomies.
              </p>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 flex-1">
              {categories.map((cat) => {
                const guideCount = guidelines.filter((g) => g.category === cat.id).length;
                return (
                  <div 
                    key={cat.id} 
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-xl flex items-center justify-between gap-4 group/item transition-all"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border font-mono text-xs font-bold shrink-0 mt-0.5 ${cat.colorClass}`}>
                        <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 font-sans truncate">{cat.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate leading-snug">{cat.description}</p>
                        <span className="inline-block mt-1 text-[9px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border">
                          {guideCount} assigned procedures
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTriggerDelete(cat)}
                      className="p-2 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-650 border border-slate-200 hover:border-red-200 rounded-lg shrink-0 opacity-80 group-hover/item:opacity-100 transition-all cursor-pointer"
                      title={`Remove ${cat.name}`}
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            type="button"
          >
            Finished Setup
          </button>
        </div>

      </div>
    </div>
  );
}
