/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Firebase integration on Server-Side
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, query, orderBy } from "firebase/firestore";

const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = null;
if (fs.existsSync(CONFIG_PATH)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch (err) {
    console.error("Error reading firebase-applet-config.json in backend server:", err);
  }
}

let db: any = null;
if (firebaseConfig) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("✓ Firestore client initialized on Server-Side successfully.");
  } catch (err) {
    console.error("Failed to initialize Firestore on server-side:", err);
  }
}

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Default data seeds to instantiate on the shared backend if no store file exists.
const DEFAULT_CATEGORIES = [
  {
    id: "physical-archiving",
    name: "Physical Archiving & Intake",
    description: "Procedures for cataloging, packing, indexing, and storing hard-copy files safely in the storage facility.",
    iconName: "Archive",
    colorClass: "bg-amber-100 text-amber-800 border-amber-200"
  },
  {
    id: "digital-ingestion",
    name: "Digital Ingestion & OCR",
    description: "Instructions for high-resolution document scanning, optical character recognition (OCR), metadata mapping, and digital repository storage.",
    iconName: "FileDigit",
    colorClass: "bg-blue-100 text-blue-800 border-blue-200"
  },
  {
    id: "compliance-retention",
    name: "Compliance & FOI Requests",
    description: "Rules for legal retention calendars, personal data (PII) redaction, and Freedom of Information disclosure protocols.",
    iconName: "ShieldAlert",
    colorClass: "bg-violet-100 text-violet-800 border-violet-200"
  },
  {
    id: "disposal-destruction",
    name: "Secure Disposal & Shredding",
    description: "Approved pipelines for destroying expired files safely, dual-witness sign-offs, and updating the Destruction Register.",
    iconName: "Trash2",
    colorClass: "bg-rose-100 text-rose-800 border-rose-200"
  },
  {
    id: "vault-integrity",
    name: "Vault Climate & Security",
    description: "Atmospheric guidelines, humidity levels, access authorization logs, and fire prevention codes inside the core vaults.",
    iconName: "Warehouse",
    colorClass: "bg-emerald-100 text-emerald-800 border-emerald-200"
  }
];

const DEFAULT_GUIDELINES: any[] = [
  {
    id: "gd-vlt-101",
    title: "Vault Intake & Physical Tagging Protocol",
    description: "Standard operating procedures for registering incoming physical documents, applying unique barcode tags, and registering safe shelving vault coordinates.",
    category: "physical-archiving",
    steps: [
      "Inspect the physical dossier file for paper contamination or transport damage.",
      "Recheck dossier index keys against the sender physical manifestation sheet.",
      "Generate and print a unique 3-of-9 symbology barcode label containing the dossier ID.",
      "Affix the barcode label firmly onto the upper-right corner of the physical dossier cover.",
      "Move the folder to its allotted secure shelving unit (Vault B, Bay 4, Shelf 12) and record coordinates in the ledger."
    ],
    imageUrls: ["https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=800"],
    videoUrls: ["https://www.w3schools.com/html/mov_bbb.mp4"],
    attachments: [
      { name: "Safe_Vault_Shelving_Coordinates.pdf", url: "#", size: "240 KB" },
      { name: "Dossier_Intake_Audit_Sheet.csv", url: "#", size: "45 KB" }
    ],
    flowchart: [
      { id: "v1-start", label: "Inspect Paper Delivery Integrity", type: "start" },
      { id: "v1-manifest", label: "Verify Manifest with Delivery Ledger", type: "process" },
      { id: "v1-decide", label: "Dossier Integrity Verified?", type: "decision" },
      { id: "v1-quarantine", label: "Log quarantine / Send File rejection slip", type: "end" },
      { id: "v1-db-log", label: "Affix Barcode, Shelter in Vault Shelving", type: "end" }
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

const STORE_PATH = path.join(process.cwd(), "db_shared_store.json");

// Maintain an active SSE client pool for real-time pushing
let clients: express.Response[] = [];

// Helper to broadcast data changes to all active listeners globally
function broadcastUpdate(type: string, data: any) {
  const payload = JSON.stringify({ type, data });
  clients.forEach((client) => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error("Failed to write to SSE client connection:", err);
    }
  });
}

// Helper to load shared data
function loadSharedStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (!parsed.guidelines || parsed.guidelines.length === 0) {
        parsed.guidelines = DEFAULT_GUIDELINES;
        saveSharedStore(parsed);
      }
      return parsed;
    }
  } catch (error) {
    console.error("Error loading shared store, returning default templates:", error);
  }
  const seed = {
    guidelines: DEFAULT_GUIDELINES,
    categories: DEFAULT_CATEGORIES
  };
  saveSharedStore(seed);
  return seed;
}

// Helper to save shared data
function saveSharedStore(data: { guidelines: any[]; categories: any[] }) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing shared store to file system:", error);
    return false;
  }
}

// Real-time synchronization from Firestore to local filesystem
if (db) {
  try {
    const qGuidelines = query(collection(db, "guidelines"), orderBy("order", "asc"));
    onSnapshot(qGuidelines, (snapshot) => {
      const gList: any[] = [];
      snapshot.forEach((doc) => {
        gList.push(doc.data());
      });
      if (gList.length > 0) {
        // Deep compare or simple memory check to avoid excessive writes
        const store = loadSharedStore();
        if (JSON.stringify(store.guidelines) !== JSON.stringify(gList)) {
          console.log("✓ Cloud sync updated local server memory cache guidelines");
          store.guidelines = gList;
          saveSharedStore(store);
          broadcastUpdate("update", store);
        }
      }
    }, (error) => {
      console.warn("Firestore onSnapshot guidelines server sync failed/quenced:", error);
    });

    onSnapshot(collection(db, "categories"), (snapshot) => {
      const cList: any[] = [];
      snapshot.forEach((doc) => {
        cList.push(doc.data());
      });
      if (cList.length > 0) {
        const store = loadSharedStore();
        if (JSON.stringify(store.categories) !== JSON.stringify(cList)) {
          console.log("✓ Cloud sync updated local server memory cache categories");
          store.categories = cList;
          saveSharedStore(store);
          broadcastUpdate("update", store);
        }
      }
    }, (error) => {
      console.warn("Firestore onSnapshot categories server sync failed/quenced:", error);
    });
  } catch (err) {
    console.error("Failed to setup server-side Firestore subscription:", err);
  }
}

// SSE Push stream setup
app.get("/api/sync/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Heartbeat message
  res.write(`data: ${JSON.stringify({ type: "init", message: "SSE Connection established with division JSON Store" })}\n\n`);

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
  });
});

// API Endpoints for Guidelines and Categories
app.get("/api/guidelines", (req, res) => {
  const store = loadSharedStore();
  res.json(store.guidelines || []);
});

app.post("/api/guidelines", (req, res) => {
  const { guidelines } = req.body;
  if (!Array.isArray(guidelines)) {
    res.status(400).json({ error: "guidelines must be an array" });
    return;
  }
  const store = loadSharedStore();
  store.guidelines = guidelines;
  saveSharedStore(store);
  broadcastUpdate("update", store);
  res.json(store.guidelines);
});

// Sync both lists simultaneously in a single transaction if needed
app.post("/api/sync-both", (req, res) => {
  const { guidelines, categories } = req.body;
  const store = loadSharedStore();
  if (Array.isArray(guidelines)) {
    store.guidelines = guidelines;
  }
  if (Array.isArray(categories)) {
    store.categories = categories;
  }
  saveSharedStore(store);
  broadcastUpdate("update", store);
  res.json({ success: true, guidelines: store.guidelines, categories: store.categories });
});

app.get("/api/categories", (req, res) => {
  const store = loadSharedStore();
  res.json(store.categories || DEFAULT_CATEGORIES);
});

app.post("/api/categories", (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    res.status(400).json({ error: "categories must be an array" });
    return;
  }
  const store = loadSharedStore();
  store.categories = categories;
  saveSharedStore(store);
  broadcastUpdate("update", store);
  res.json(store.categories);
});

app.post("/api/reset", (req, res) => {
  const defaultStore = {
    guidelines: DEFAULT_GUIDELINES,
    categories: DEFAULT_CATEGORIES
  };
  saveSharedStore(defaultStore);
  broadcastUpdate("update", defaultStore);
  res.json({ success: true, ...defaultStore });
});

// Lazy-initialize Gemini SDK to prevent server crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// REST API for Gemini procedures assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, guidelinesContext } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (credentialError: any) {
      // Graceful fallback for missing key so the UX doesn't break
      // We will answer with a helpful message indicating how to proceed
      res.json({
        content: `👋 I'm MJB HELPER, your shared guidelines assistant! 

⚠️ **Configuration Note:** The **GEMINI_API_KEY** is not configured. Administrators can configure it in **Settings > Secrets** in the developer panel.

However, based on standard Records Management guidelines:
- Physical archiving should adhere strictly to cataloging, packing upright, and barcode scanning.
- Digital digitization scans records at **300 DPI, Grayscale, Double-Sided**.
- Redacting private data (PII) before publishing disclosures is legally mandated.
- Any destruction of expired records *must* be physically signed off under dual-witness audits.

How else can I assist you today?`,
        suggestedPrompts: [
          "Explain Physical Ingestion",
          "What resolution is required for digital scans?",
          "How are confidential documents redacted?"
        ]
      });
      return;
    }

    // Format the current state of guidelines for the model context
    let guidelinesSummary = "No guidelines loaded.";
    if (guidelinesContext && Array.isArray(guidelinesContext)) {
      guidelinesSummary = guidelinesContext.map((g: any, index: number) => {
        return `
[GUIDELINE #${index + 1}]
ID: ${g.id}
Title: ${g.title}
Category: ${g.category}
Description: ${g.description}
Steps:
${g.steps.map((s: string, sIdx: number) => `  ${sIdx + 1}. ${s}`).join("\n")}
Flowchart Steps:
${g.flowchart?.map((f: any) => `  - [Shape: ${f.type}] Label: "${f.label}" (Next: ${f.nextStepId || "None"})`).join("\n") || "No flowchart specified."}
Attachments: ${g.attachments?.map((a: any) => a.name).join(", ") || "None"}
`;
      }).join("\n---\n");
    }

    const systemInstruction = `
You are "MJB HELPER", a friendly, polished, and highly professional procedural mentor for newly hired employees in the Records and Archive Management Section (RAMS).
Your primary objective is to teach, guide, and answer questions regarding standard records management procedures.

Here is the absolute source of truth regarding the current active guidelines in the division:
=========================================
${guidelinesSummary}
=========================================

Instructions:
1. **Be Shared knowledge-backed:** You have live access to all user inputs, guidelines, categories, and documents. These are fully saved and shared across all sessions. Answer questions strictly using the active guidelines provided above. If the guidelines do not cover a specific query range, politely explain that it is outside current division documentation but explain matching standard practices helper-wise.
2. **Beginner Friendly:** Newly hired division personnel are reading your tips. Use bulleted summaries, simple tables, and clear language.
3. **Professional Tone:** Keep responses supportive, objective, logical, and clear. Avoid overly technical jargon when simplicity works, but maintain absolute security/compliance rigor.
4. **Identify Roles:** Refer to differences between Administrator permissions (modifying guidelines) and Viewer permissions (checking out records) clearly if asked.
5. If someone asks for a guide's particular step or flowchart path, summarize it clearly with visual text flow representations.
`;

    // Format chat history for @google/genai Chat structure
    // Each history item is { role: "user" | "model", parts: [{ text: "..." }] }
    const modelHistory = history ? history.map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }]
    })) : [];

    // Start a chat with systemic configuration
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
      history: modelHistory
    });

    const response = await chat.sendMessage({ message: message });
    const replyText = response.text || "I was unable to process your query. Please try again.";

    res.json({
      content: replyText
    });

  } catch (error: any) {
    console.error("Gemini API error in /api/chat:", error);
    res.status(500).json({
      error: "Failed to communicate with AI Assistant.",
      detail: error.message
    });
  }
});

// Configure Vite or production static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ RAMS Guidelines server running on port ${PORT}`);
  });
}

startServer();
