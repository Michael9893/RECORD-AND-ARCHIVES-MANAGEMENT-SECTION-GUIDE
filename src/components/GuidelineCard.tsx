/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Bookmark, 
  Layers, 
  Paperclip, 
  Flame, 
  Video, 
  ArrowRight,
  Eye
} from "lucide-react";
import { Category, Guideline } from "../types";

interface GuidelineCardProps {
  key?: string | number;
  guideline: Guideline;
  categories: Category[];
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onSelect: () => void;
}

export default function GuidelineCard({
  guideline,
  categories,
  isBookmarked,
  onToggleBookmark,
  onSelect
}: GuidelineCardProps) {
  // Find category metadata
  const categoryMeta = categories.find(c => c.id === guideline.category) || {
    name: guideline.category,
    colorClass: "bg-slate-100 text-slate-800 border-slate-200"
  };

  const stepCount = guideline.steps.length;
  const attachmentCount = guideline.attachments?.length || 0;
  const hasFlowchart = guideline.flowchart && guideline.flowchart.length > 0;
  const hasVideo = guideline.videoUrls && guideline.videoUrls.length > 0;

  return (
    <article 
      id={`gd-card-${guideline.id}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200 hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Visual Header Image if present, else a matching colored slate background */}
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {guideline.imageUrls && guideline.imageUrls[0] ? (
          <img 
            src={guideline.imageUrls[0]} 
            alt={guideline.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <Layers className="w-12 h-12 text-slate-300 stroke-[1.5]" />
          </div>
        )}
        
        {/* Category Badge overlay */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 text-[11px] font-sans font-semibold rounded-lg border shadow-xs ${categoryMeta.colorClass}`}>
            {categoryMeta.name}
          </span>
        </div>

        {/* Bookmark heart overlay */}
        <button
          id={`btn-bookmark-card-id-${guideline.id}`}
          onClick={(e) => onToggleBookmark(guideline.id, e)}
          className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md shadow-sm border transition-all ${
            isBookmarked 
              ? "bg-rose-50 border-rose-250 text-rose-500 hover:scale-110" 
              : "bg-white/80 hover:bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:scale-110"
          }`}
          title={isBookmarked ? "Remove Bookmark" : "Save Pin"}
          type="button"
        >
          <Bookmark className="w-4 h-4 fill-current stroke-[2]" />
        </button>
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-sans font-bold text-slate-800 text-base leading-snug group-hover:text-indigo-650 transition-colors mb-2 line-clamp-2">
            {guideline.title}
          </h3>
          <p className="text-slate-500 text-xs font-sans leading-relaxed mb-4 line-clamp-3">
            {guideline.description}
          </p>
        </div>

        <div>
          {/* procedural stat chips */}
          <div className="flex flex-wrap items-center gap-1.5 py-4 border-t border-slate-100 mb-4 text-[11px] text-slate-500 font-sans font-medium">
            <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              {stepCount} Steps
            </span>
            {hasFlowchart && (
              <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Flowchart
              </span>
            )}
            {hasVideo && (
              <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                <Video className="w-3.5 h-3.5 text-indigo-500" />
                Video Guide
              </span>
            )}
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                {attachmentCount} Attachments
              </span>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              ID: {guideline.id}
            </span>
            <button
              id={`btn-open-card-guideline-id-${guideline.id}`}
              onClick={onSelect}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>View Guideline</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
