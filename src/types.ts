/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "ADMIN" | "VIEWER";

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type FlowchartStepType = "start" | "process" | "decision" | "end";

export interface FlowchartStep {
  id: string;
  label: string;
  type: FlowchartStepType;
  nextStepId?: string | null;
  yesRouteId?: string | null; // For decision type
  noRouteId?: string | null;  // For decision type
}

export interface Attachment {
  name: string;
  url: string;
  size?: string;
}

export interface Guideline {
  id: string;
  title: string;
  description: string;
  category: string; // e.g., 'Messengerial Services', 'Digital Ingestion', 'Compliance & Retention', 'Disposal'
  steps: string[];
  imageUrls: string[];
  videoUrls: string[];
  attachments: Attachment[];
  flowchart: FlowchartStep[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  iconName: string; // matches Lucide icon names
  colorClass: string; // Tailwind colors e.g. 'bg-emerald-100 text-emerald-800'
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}
