/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Bookmark, 
  Video, 
  Download, 
  HelpCircle,
  CheckCircle,
  FileText,
  ChevronDown,
  PlayCircle
} from "lucide-react";
import { Category, Guideline, UserRole } from "../types";

interface GuidelineDetailProps {
  guideline: Guideline;
  categories: Category[];
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  currentRole: UserRole;
  onOpenAiAssistant: () => void;
}

export default function GuidelineDetail({
  guideline,
  categories,
  isBookmarked,
  onToggleBookmark,
  onEdit,
  onDelete,
  onBack,
  currentRole,
  onOpenAiAssistant
}: GuidelineDetailProps) {
  // Check off steps inside session mapping (for training training progress)
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Clean checked states when guideline shifts
  useEffect(() => {
    setCheckedSteps({});
    setShowVideoPlayer(false);
  }, [guideline.id]);

  const toggleStep = (index: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const stepsLength = guideline.steps.length;
  const checkedCount = Object.values(checkedSteps).filter(Boolean).length;
  const progressPercent = stepsLength > 0 ? Math.round((checkedCount / stepsLength) * 100) : 0;

  const categoryMeta = categories.find(c => c.id === guideline.category) || {
    name: guideline.category,
    colorClass: "bg-slate-100 text-slate-800 border-slate-200"
  };

  // Render a visual SVG arrow connector
  const RenderRowConnector = () => (
    <div className="flex flex-col items-center py-2">
      <svg className="w-6 h-6 text-slate-300 stroke-[2] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  );

  return (
    <div id="guideline-detail-container" className="flex flex-col h-full bg-slate-50">
      
      {/* Detail Sticky Header bar */}
      <div id="detail-ctrls" className="bg-white px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <button
          id="btn-detail-back-to-grid"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-sans font-semibold text-sm transition-colors cursor-pointer group"
          type="button"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </button>

        <div className="flex items-center gap-2">
          {/* Bookmark check */}
          <button
            id={`btn-detail-bookmark-id-${guideline.id}`}
            onClick={(e) => onToggleBookmark(guideline.id, e)}
            className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs font-sans font-semibold transition-colors ${
              isBookmarked 
                ? "bg-rose-50 border-rose-200 text-rose-500" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            type="button"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            {isBookmarked ? "Bookmarked" : "Bookmark procedure"}
          </button>

          {/* Ask AI about this current procedure */}
          <button
            id="btn-ask-ai-detail"
            onClick={onOpenAiAssistant}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-semibold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-500/10 cursor-pointer"
            type="button"
          >
            <span>GONSULT ME</span>
          </button>

          {/* Admin Tools */}
          {currentRole === "ADMIN" && (
            <>
              <button
                id="btn-admin-modify"
                onClick={onEdit}
                className="p-2 border border-indigo-200 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 text-xs font-sans font-semibold cursor-pointer"
                type="button"
                title="Edit Procedure"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                id="btn-admin-purge"
                onClick={onDelete}
                className="p-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 text-xs font-sans font-semibold cursor-pointer"
                type="button"
                title="Delete Procedure"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Detail Body: Divided 12-grid layout */}
      <div id="detail-main" className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: 7/12 layout - Content & Training Checklist */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Card Meta details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <span className={`inline-block px-3 py-1 text-xs font-sans font-bold rounded-full border ${categoryMeta.colorClass}`}>
              {categoryMeta.name}
            </span>
            <h1 className="text-2xl font-sans font-bold text-slate-900 tracking-tight leading-snug">
              {guideline.title}
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {guideline.description}
            </p>
          </div>

          {/* Interactive Training Checklist */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-slate-900 font-sans font-bold text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Procedural Checklist
                </h2>
                <p className="text-slate-500 text-xs">
                  Newly hired employees should complete and check off steps sequentially as they practice.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
                {progressPercent}% Done
              </span>
            </div>

            {/* Progress Slider bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Checklist elements block */}
            <div className="space-y-3">
              {guideline.steps.map((step, idx) => {
                const isChecked = !!checkedSteps[idx];
                return (
                  <label
                    id={`lbl-step-checkbox-${idx}`}
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked 
                        ? "bg-slate-50 border-slate-200" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="pt-0.5">
                      <input
                        id={`check-step-${idx}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Swallowed, handled by parent click
                        className="rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 w-4.5 h-4.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className={`text-xs font-mono font-bold ${isChecked ? "text-slate-400" : "text-slate-500"}`}>
                        Step {idx + 1}
                      </span>
                      <p className={`text-sm font-sans leading-relaxed ${isChecked ? "text-slate-400 line-through" : "text-slate-700"}`}>
                        {step}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Video Attachment Segment if present */}
          {guideline.videoUrls && guideline.videoUrls.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-slate-900 font-sans font-bold text-base flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-500" />
                Departmental Video Walkthrough
              </h2>
              <p className="text-slate-500 text-xs">
                A video reference demonstrating this procedural guide in action.
              </p>

              {!showVideoPlayer ? (
                <div 
                  onClick={() => setShowVideoPlayer(true)}
                  className="relative group h-48 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center cursor-pointer shadow-inner border border-slate-800"
                >
                  {guideline.imageUrls && guideline.imageUrls[0] && (
                    <img 
                      src={guideline.imageUrls[0]} 
                      alt="video thumbnail" 
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-950/40"></div>
                  <div className="relative flex flex-col items-center gap-2 text-white">
                    <PlayCircle className="w-16 h-16 text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-all filter drop-shadow" />
                    <span className="text-xs font-semibold tracking-wider font-mono uppercase">
                      STATIONS VIDEO LOGS
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden bg-black border border-slate-200">
                  <video 
                    className="w-full h-auto aspect-video" 
                    controls 
                    autoPlay
                    src={guideline.videoUrls[0]}
                  />
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-500 truncate">{guideline.videoUrls[0]}</span>
                    <button 
                      onClick={() => setShowVideoPlayer(false)}
                      className="text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Dismount Player
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attachments Section */}
          {guideline.attachments && guideline.attachments.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-slate-900 font-sans font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Required Documentation & Forms
              </h2>
              <p className="text-slate-500 text-xs">- Use standard forms to dispatch transfers or file destructions.</p>
              
              <div className="space-y-2">
                {guideline.attachments.map((file, idx) => (
                  <div 
                    id={`file-attachment-row-${idx}`}
                    key={idx} 
                    className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 bg-slate-200/50 rounded text-slate-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-sans font-semibold text-slate-800 truncate">
                          {file.name}
                        </h4>
                        {file.size && (
                          <span className="text-[10px] font-mono text-slate-400">
                            Size: {file.size}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      id={`btn-download-attach-${idx}`}
                      onClick={() => alert(`Initiating mock secure file pipeline download for ${file.name}`)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                      title="Download document reference copy"
                      type="button"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: 5/12 layout - Graphical flowchart visualizer */}
        <section id="flowchart-visualization-area" className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-24">
            <div>
              <h2 className="text-slate-900 font-sans font-bold text-base">
                Core Process Flow Diagram
              </h2>
              <p className="text-slate-500 text-xs">
                Structural mapping representing operational pathways and system decision models.
              </p>
            </div>

            {/* Custom Interactive Flowchart nodes diagram block */}
            {guideline.flowchart && guideline.flowchart.length > 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-900 space-y-1.5 flex flex-col items-center">
                <span className="text-[9px] font-mono text-cyan-400 self-start uppercase tracking-widest border border-cyan-800/20 px-2 py-0.5 rounded-full mb-4">
                  DIAGRAM STAGES
                </span>

                {guideline.flowchart.map((node, index) => {
                  let borderStyle = "";
                  let shapeStyle = "";
                  let iconElement = null;

                  // Apply customized visuals based on types
                  switch (node.type) {
                    case "start":
                      borderStyle = "border-emerald-500 text-emerald-400 bg-emerald-500/5";
                      shapeStyle = "rounded-full py-1.5 px-6 font-semibold";
                      break;
                    case "end":
                      borderStyle = "border-slate-500 text-slate-400 bg-slate-500/5";
                      shapeStyle = "rounded-full py-1.5 px-6 font-semibold";
                      break;
                    case "decision":
                      borderStyle = "border-amber-500 text-amber-400 bg-amber-500/5";
                      shapeStyle = "rounded-lg p-4 font-bold border-2 max-w-[200px] text-center rotate-3 hover:rotate-0 transition-transform duration-300";
                      break;
                    case "process":
                    default:
                      borderStyle = "border-sky-500 text-sky-400 bg-sky-500/5";
                      shapeStyle = "rounded-xl py-3 px-4 text-center border font-medium w-full max-w-[250px]";
                      break;
                  }

                  return (
                    <React.Fragment key={node.id}>
                      {/* Node capsule container */}
                      <div 
                        id={`viewport-node-${node.id}`}
                        className={`border-2 text-xs font-sans tracking-wide leading-normal flex flex-col items-center text-center justify-center relative shadow ${borderStyle} ${shapeStyle}`}
                      >
                        {node.type === "decision" && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-1.5 py-0.5 text-[8px] font-bold rounded">
                            DECISION GATE
                          </div>
                        )}
                        
                        <span>{node.label}</span>

                        {node.type === "decision" && (
                          <div className="flex gap-4 justify-between w-full mt-3 text-[10px] border-t border-amber-500/20 pt-2 font-mono font-bold">
                            <span className="text-emerald-400">Yes →</span>
                            <span className="text-red-400">← No</span>
                          </div>
                        )}
                      </div>

                      {/* Append sequential lines down if there is another step layout */}
                      {index < guideline.flowchart.length - 1 && <RenderRowConnector />}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50/50 p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 flex flex-col items-center gap-2">
                <HelpCircle className="w-8 h-8 text-slate-300" />
                <p className="text-xs italic">No procedural flow map config available.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
