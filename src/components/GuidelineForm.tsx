/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Layers, 
  Video, 
  Image as ImageIcon, 
  Paperclip, 
  Workflow, 
  Check, 
  ArrowLeft,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Category, Guideline, Attachment, FlowchartStep, FlowchartStepType } from "../types";

interface GuidelineFormProps {
  categories: Category[];
  guidelineToEdit?: Guideline | null;
  onSave: (guideline: Guideline) => void;
  onCancel: () => void;
}

export default function GuidelineForm({
  categories,
  guidelineToEdit,
  onSave,
  onCancel
}: GuidelineFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [flowchart, setFlowchart] = useState<FlowchartStep[]>([]);

  // Temp values for adding elements
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentSize, setNewAttachmentSize] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const [newFlowNodeLabel, setNewFlowNodeLabel] = useState("");
  const [newFlowNodeType, setNewFlowNodeType] = useState<FlowchartStepType>("process");

  // Populate form if we are in Edit Mode
  useEffect(() => {
    if (guidelineToEdit) {
      setTitle(guidelineToEdit.title);
      setDescription(guidelineToEdit.description);
      setCategory(guidelineToEdit.category);
      setSteps(guidelineToEdit.steps.length > 0 ? [...guidelineToEdit.steps] : [""]);
      setImageUrls(guidelineToEdit.imageUrls.length > 0 ? [...guidelineToEdit.imageUrls] : [""]);
      setVideoUrls(guidelineToEdit.videoUrls || []);
      setAttachments(guidelineToEdit.attachments || []);
      setFlowchart(guidelineToEdit.flowchart || []);
    } else {
      // Setup Defaults
      setTitle("");
      setDescription("");
      setCategory(categories[0]?.id || "");
      setSteps([""]);
      setImageUrls([""]);
      setVideoUrls([]);
      setAttachments([]);
      setFlowchart([
        { id: "node-1", label: "Start of Procedure", type: "start", nextStepId: "node-2" },
        { id: "node-2", label: "Operational step", type: "process", nextStepId: "node-3" },
        { id: "node-3", label: "Verify criteria correctness?", type: "decision", yesRouteId: "node-4", noRouteId: "node-fail" },
        { id: "node-fail", label: "Isolate dossier/log rejection slip", type: "end" },
        { id: "node-4", label: "Log completion metadata into register", type: "end" }
      ]);
    }
  }, [guidelineToEdit, categories]);

  // Handle steps updates
  const addStepField = () => setSteps([...steps, ""]);
  const removeStepField = (index: number) => {
    const updated = steps.filter((_, idx) => idx !== index);
    setSteps(updated.length > 0 ? updated : [""]);
  };
  const handleStepChange = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
  };
  const moveStepField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const updated = [...steps];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      setSteps(updated);
    } else if (direction === "down" && index < steps.length - 1) {
      const updated = [...steps];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      setSteps(updated);
    }
  };

  // Handle image URLs updates
  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  // Add Attachments elements
  const addAttachment = () => {
    if (!newAttachmentName.trim()) return;
    setAttachments([
      ...attachments, 
      { 
        name: newAttachmentName.trim(), 
        url: "#", 
        size: newAttachmentSize.trim() || "150 KB" 
      }
    ]);
    setNewAttachmentName("");
    setNewAttachmentSize("");
  };
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, idx) => idx !== index));
  };

  // Add Video elements
  const addVideo = () => {
    if (!newVideoUrl.trim()) return;
    setVideoUrls([...videoUrls, newVideoUrl.trim()]);
    setNewVideoUrl("");
  };
  const removeVideo = (index: number) => {
    setVideoUrls(videoUrls.filter((_, idx) => idx !== index));
  };

  // Custom Flowchart elements
  const addFlowNode = () => {
    if (!newFlowNodeLabel.trim()) return;
    const newNodeId = `node-${Date.now()}`;
    const newNode: FlowchartStep = {
      id: newNodeId,
      label: newFlowNodeLabel.trim(),
      type: newFlowNodeType
    };

    // If decision block, let's link or create placeholders for branches
    if (newFlowNodeType === "decision") {
      newNode.yesRouteId = `node-yes-${Date.now()}`;
      newNode.noRouteId = `node-no-${Date.now()}`;
    }

    setFlowchart([...flowchart, newNode]);
    setNewFlowNodeLabel("");
  };

  const removeFlowNode = (nodeId: string) => {
    setFlowchart(flowchart.filter(fb => fb.id !== nodeId));
  };

  const moveFlowNode = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const updated = [...flowchart];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      setFlowchart(updated);
    } else if (direction === "down" && index < flowchart.length - 1) {
      const updated = [...flowchart];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      setFlowchart(updated);
    }
  };

  const clearForm = () => {
    onCancel();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !category || !description.trim()) {
      alert("Please enter Title, Description, and select a valid Category.");
      return;
    }

    // Filter empties
    const filteredSteps = steps.filter(s => s.trim() !== "");
    const filteredImages = imageUrls.filter(img => img.trim() !== "");

    const payload: Guideline = {
      id: guidelineToEdit?.id || `gd-uid-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      description: description.trim(),
      category: category,
      steps: filteredSteps.length > 0 ? filteredSteps : ["Check and verify documentation correctness."],
      imageUrls: filteredImages,
      videoUrls: videoUrls,
      attachments: attachments,
      flowchart: flowchart,
      createdAt: guidelineToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(payload);
  };

  return (
    <div id="guideline-form-page" className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          id="btn-form-back-or-cancel"
          type="button"
          onClick={clearForm}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-sans font-semibold text-sm transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Cancel and return
        </button>
        <span className="text-xs font-mono bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
          ADMIN SECURITY SYSTEM OVERLAY
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-bold font-sans text-slate-900 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-blue-600" />
            {guidelineToEdit ? "Modify Existent Procedure Card" : "Design New Procedure Guideline"}
          </h1>
          <p className="text-slate-500 text-xs">
            Complete the fields below to update standard operational protocols. Newly saved guidelines compile instantly across viewer workstations.
          </p>
        </div>

        <form id="procedural-config-form" onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Core Fields */}
          <section className="space-y-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
              1. Core Metadata
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="inp-title">
                  Procedure / Guide Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="inp-title"
                  type="text"
                  required
                  placeholder="e.g., Records Redaction and Sanctity Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="inp-category-sec">
                  Operational Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="inp-category-sec"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white font-medium text-slate-700"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700" htmlFor="inp-desc">
                Concise Operational Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="inp-desc"
                rows={3}
                required
                placeholder="Provide a high-level summary of the protocol objectives, dependencies, and regulatory mandates."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed"
              />
            </div>
          </section>

          {/* Section 2: Step-by-Step Editor */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                2. Step-by-Step Instructions
              </h3>
              <button
                id="btn-add-step"
                type="button"
                onClick={addStepField}
                className="text-xs text-blue-600 hover:text-blue-800 font-sans font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Instruction Step
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-slate-400 w-16 shrink-0">
                    Step {idx + 1}
                  </span>
                  <input
                    id={`inp-step-${idx}`}
                    type="text"
                    required
                    placeholder="Describe specific task actions to execute (e.g. Verify the container barcodes...)"
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    className="flex-1 text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  
                  {/* Step Rearrange Controls */}
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-0.5 shrink-0 shadow-3xs">
                    <button
                      type="button"
                      onClick={() => moveStepField(idx, "up")}
                      className="p-1 text-slate-500 hover:bg-white hover:text-slate-900 rounded transition-all cursor-pointer"
                      title="Move Step Up"
                      disabled={idx === 0}
                      style={{ opacity: idx === 0 ? 0.3 : 1 }}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStepField(idx, "down")}
                      className="p-1 text-slate-500 hover:bg-white hover:text-slate-900 rounded transition-all cursor-pointer"
                      title="Move Step Down"
                      disabled={idx === steps.length - 1}
                      style={{ opacity: idx === steps.length - 1 ? 0.3 : 1 }}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    id={`btn-del-step-${idx}`}
                    type="button"
                    onClick={() => removeStepField(idx)}
                    className="p-3 text-red-500 hover:text-red-700 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Remove Step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Media References Setup */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
              3. Visual & Video Media Assets
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image url field */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700" htmlFor="inp-image-box">
                  Illustrative Hero Image Link
                </label>
                <input
                  id="inp-image-box"
                  type="url"
                  placeholder="Paste secure Unsplash photo URL or local folder relative path"
                  value={imageUrls[0] || ""}
                  onChange={(e) => handleImageUrlChange(0, e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[10px] text-slate-400">
                  Provide an image link representing correct lodging positions or system dashboards.
                </p>
              </div>

              {/* Video inputs */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700" htmlFor="inp-video-adder">
                  Video Demonstration Link (Support mp4 embeds/web links)
                </label>
                <div className="flex gap-2">
                  <input
                    id="inp-video-adder"
                    type="text"
                    placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="flex-1 text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none"
                  />
                  <button
                    id="btn-add-video"
                    type="button"
                    onClick={addVideo}
                    className="text-xs bg-slate-100 border border-slate-200 hover:bg-slate-200 px-3 rounded-lg text-slate-700 font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 font-sans">
                  {videoUrls.map((vUrl, vIdx) => (
                    <div key={vIdx} className="flex items-center justify-between py-1 px-3 bg-slate-50 rounded-lg text-xs border">
                      <span className="truncate max-w-[200px] text-slate-500 text-xs">{vUrl}</span>
                      <button 
                        type="button" 
                        onClick={() => removeVideo(vIdx)}
                        className="text-red-500 hover:text-red-700 font-semibold text-[11px]"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Attachments Config */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
              4. Document Downloads (PDF Forms / Checklists)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600" htmlFor="inp-doc-name">Document Label</label>
                <input
                  id="inp-doc-name"
                  type="text"
                  placeholder="e.g. Vault_Intake_Manifest.pdf"
                  value={newAttachmentName}
                  onChange={(e) => setNewAttachmentName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600" htmlFor="inp-doc-sz">Approximate File Size</label>
                <input
                  id="inp-doc-sz"
                  type="text"
                  placeholder="e.g. 1.5 MB or 320 KB"
                  value={newAttachmentSize}
                  onChange={(e) => setNewAttachmentSize(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <button
                id="btn-add-attachment"
                type="button"
                onClick={addAttachment}
                className="w-full p-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-colors text-xs font-bold rounded-lg cursor-pointer"
              >
                Add Document Attachment
              </button>
            </div>

            {/* List attached documents */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl text-xs">
                    <div className="truncate flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-sans font-semibold text-slate-700">{file.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{file.size}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 5: Custom Flowchart Diagram nodes */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
              5. Procedural Map (Flowchart Nodes builder)
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600" htmlFor="inp-flow-step-lbl">Diagram Label Instruction</label>
                <input
                  id="inp-flow-step-lbl"
                  type="text"
                  placeholder="e.g. Catalog package coordinates into register database"
                  value={newFlowNodeLabel}
                  onChange={(e) => setNewFlowNodeLabel(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600" htmlFor="inp-flow-step-type">Process Stage Shape Type</label>
                <select
                  id="inp-flow-step-type"
                  value={newFlowNodeType}
                  onChange={(e) => setNewFlowNodeType(e.target.value as FlowchartStepType)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
                >
                  <option value="start">Green Start pill</option>
                  <option value="process">Standard Blue box</option>
                  <option value="decision">Amber Diamond Gate</option>
                  <option value="end">Pill Stop state</option>
                </select>
              </div>

              <button
                id="btn-add-flowchart-node"
                type="button"
                onClick={addFlowNode}
                className="md:col-span-3 w-full p-2.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Diagram Step
              </button>
            </div>

            {/* Configured Diagram timeline visualization list */}
            {flowchart.length > 0 && (
              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-4 bg-slate-900">
                <span className="text-[9px] font-mono font-bold text-slate-400 block pb-2 uppercase tracking-widest">
                  Live Diagram Timeline Stages:
                </span>
                
                {flowchart.map((node, index) => (
                  <div key={node.id} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white gap-2 animated-fade-in">
                    <div className="flex items-center gap-3 truncate flex-1 md:min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 w-8">#{index + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        node.type === "start" 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : node.type === "end" 
                          ? "bg-slate-500/10 text-slate-400"
                          : node.type === "decision"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {node.type.toUpperCase()}
                      </span>
                      <span className="truncate text-slate-200 font-sans">{node.label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Flow Node Rearranging and Delete actions */}
                      <div className="flex bg-slate-800 p-0.5 rounded-md border border-slate-700">
                        <button
                          type="button"
                          onClick={() => moveFlowNode(index, "up")}
                          className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                          title="Move Node Up Diagram"
                          disabled={index === 0}
                          style={{ opacity: index === 0 ? 0.3 : 1 }}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFlowNode(index, "down")}
                          className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                          title="Move Node Down Diagram"
                          disabled={index === flowchart.length - 1}
                          style={{ opacity: index === flowchart.length - 1 ? 0.3 : 1 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFlowNode(node.id)}
                        className="text-red-400 hover:text-red-300 font-semibold cursor-pointer text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Form Actions footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              id="btn-cancel-draft"
              type="button"
              onClick={clearForm}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              id="btn-save-guideline-payload"
              type="submit"
              className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-colors text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Guideline Protocol
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
