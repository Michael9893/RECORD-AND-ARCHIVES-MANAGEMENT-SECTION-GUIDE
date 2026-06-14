/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Guideline } from "./types";

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_GUIDELINES: Guideline[] = [
  {
    id: "gd-vlt-101",
    title: "Official Mail Dispatch & Courier Routing Protocol",
    description: "Guiding records officers through bulk envelope sorting, courier dispatch logging, and tracking official intra-agency messengerial rounds.",
    category: "messengerial-services",
    steps: [
      "Sort incoming physical envelopes and parcels by division codes and urgent flags.",
      "Scan existing tracking barcodes or attach a custom RAMS transmission slip.",
      "Register package sender details and department routing paths in the dispatch book.",
      "Assign urgent items to designated runners or local official courier riders.",
      "Obtain recipient digital or ink signatures on completion slips and log into the system."
    ],
    imageUrls: ["https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=800"],
    videoUrls: ["https://www.w3schools.com/html/mov_bbb.mp4"],
    attachments: [
      { name: "Priority_Mail_Dispatch_Log.pdf", url: "#", size: "180 KB" },
      { name: "Official_Delivery_Receipt.docx", url: "#", size: "42 KB" }
    ],
    flowchart: [
      { id: "v1-start", label: "Inspect Parcel & Mail Deliveries", type: "start" },
      { id: "v1-manifest", label: "Verify Manifest with Route Dispatch Sheet", type: "process" },
      { id: "v1-decide", label: "Urgent Priority flag present?", type: "decision" },
      { id: "v1-quarantine", label: "Route as standard bulk mail delivery", type: "end" },
      { id: "v1-db-log", label: "Assign to Runner rider for immediate dispatch", type: "end" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "gd-ocr-202",
    title: "High-Resolution Scanning & OCR Transcription Pipeline",
    description: "Official scanning pipeline for digital archival ingestion. Guides operators through scanner DPI setups, grayscale rendering, and automated OCR accuracy checks.",
    category: "digital-ingestion",
    steps: [
      "Verify scanning equipment glass is clean and output profile is configured to 300 DPI, Grayscale, Double-Sided.",
      "Feed pages progressively into the scanner tray to prevent paper jams.",
      "Attach standard XML archival index fields to the target digital directory.",
      "Run the automated Tesseract transcription OCR module to capture textual data.",
      "Validate OCR text confidence levels, correcting spelling artifacts before database commit."
    ],
    imageUrls: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"],
    videoUrls: ["https://www.w3schools.com/html/movie.mp4"],
    attachments: [
      { name: "Scanning_Device_Calibration_Profile.xml", url: "#", size: "12 KB" },
      { name: "OCR_Standard_Transcription_Form.docx", url: "#", size: "88 KB" }
    ],
    flowchart: [
      { id: "o2-start", label: "Configure scanner to 300 DPI Grayscale", type: "start" },
      { id: "o2-transcribe", label: "Execute Optical Character Recognition", type: "process" },
      { id: "o2-decide", label: "OCR Accuracy text confidence > 95%?", type: "decision" },
      { id: "o2-manual", label: "Route to manual indexing remediation", type: "process" },
      { id: "o2-commit", label: "Commit to Cloud Archival Repository", type: "end" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "gd-foi-303",
    title: "Freedom of Information Disclosure & Redaction Audit",
    description: "Strict audit workflow for reviewing public FOI requests. Explains the process for masking personally identifiable data (PII) before publishing digital disclosure dockets.",
    category: "compliance-retention",
    steps: [
      "Review incoming FOI disclosure request docket for legal jurisdiction boundaries.",
      "Acquire digital master copies of target documentation securely.",
      "Scan each page for PII elements (Names, Tax identification, Medical codes, Addresses).",
      "Apply opaque black solid block marks over target redacted lines.",
      "Initiate Supervisor dual-auditor check and submit authorized release file."
    ],
    imageUrls: ["https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800"],
    videoUrls: [],
    attachments: [
      { name: "FOI_Egress_Disclosure_Register.pdf", url: "#", size: "1.1 MB" }
    ],
    flowchart: [
      { id: "f3-start", label: "Receive Public FOI Request Docket", type: "start" },
      { id: "f3-pii", label: "Apply Black Mask Over PII Fields", type: "process" },
      { id: "f3-decide", label: "Compliance auditor sign-off?", type: "decision" },
      { id: "f3-review", label: "Escalate to Legal Counsel panel", type: "end" },
      { id: "f3-egress", label: "Publish Redacted Document Copy", type: "end" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "gd-shrd-404",
    title: "Secure Physical Disposal & Audit Witness Shredding",
    description: "Permanent destruction routine for files exceeding their legally mandated retention cycles. Requires double supervisor verification and logging.",
    category: "disposal-destruction",
    steps: [
      "Access legal retention schedule and extract records matching expire date parameters.",
      "Physically load files into containment secure security carts.",
      "Transfer records to industrial shredding facility under active escort.",
      "Verify double-witness present signature credentials on the Destruction Manifest.",
      "Execute molecular cross-cut shredding process and file final certified records into database."
    ],
    imageUrls: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"],
    videoUrls: [],
    attachments: [
      { name: "Destruction_Manifest_Certificate.docx", url: "#", size: "110 KB" }
    ],
    flowchart: [
      { id: "s4-start", label: "Extract Files Beyond Retention Dates", type: "start" },
      { id: "s4-authorise", label: "Obtain Internal Division Clearances", type: "process" },
      { id: "s4-decide", label: "Double-Witness Sign-Off Secured?", type: "decision" },
      { id: "s4-halt", label: "Halt shredding order / quarantine cart", type: "end" },
      { id: "s4-shred", label: "Cross-cut destruction & update log register", type: "end" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
