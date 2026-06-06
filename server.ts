/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import fs from "fs";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Load Firebase configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: any = null;

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = initializeApp(config);
    db = getFirestore(firebaseApp, config.firestoreDatabaseId);
    console.log("✓ Centralized cloud Firestore client initialized successfully on backend.");
  } catch (err: any) {
    console.error("⚠️ Failed to initialize Firebase client SDK on backend. Falling back to local file. Error:", err.message || err);
  }
}

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

const DEFAULT_GUIDELINES: any[] = [];

const STORE_PATH = path.join(process.cwd(), "db_shared_store.json");

// Helper to load shared data (Legacy fallback)
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
    categories: DEFAULT_CATEGORIES,
    bookmarkedIds: []
  };
  saveSharedStore(seed);
  return seed;
}

// Helper to save shared data (Legacy fallback)
function saveSharedStore(data: any) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing shared store to file system:", error);
    return false;
  }
}

// --- Firebase Firestore API Operations & Error Handling ---

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error("Firestore Error Detailed Logs:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 1. Guidelines
async function getGuidelinesFromFirestore(): Promise<any[]> {
  try {
    if (!db) {
      const store = loadSharedStore();
      return store.guidelines || [];
    }
    const colRef = collection(db, "guidelines");
    const snapshot = await getDocs(colRef);
    const list: any[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data() });
    });
    
    // If database is empty, fallback to shared local file or empty
    if (list.length === 0) {
      const store = loadSharedStore();
      if (store.guidelines && store.guidelines.length > 0) {
        // Seed to Firestore in background
        await saveGuidelinesToFirestore(store.guidelines);
        return store.guidelines;
      }
    }
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "guidelines");
    const store = loadSharedStore();
    return store.guidelines || [];
  }
}

async function saveGuidelinesToFirestore(guidelines: any[]) {
  try {
    // Also save to local backup file
    const store = loadSharedStore();
    store.guidelines = guidelines;
    saveSharedStore(store);

    if (!db) return;

    // Direct write-through to Cloud Firestore
    const colRef = collection(db, "guidelines");
    const snapshot = await getDocs(colRef);
    const existingIds = new Set<string>();
    snapshot.forEach((d) => {
      existingIds.add(d.id);
    });

    const activeIds = new Set(guidelines.map(g => g.id));
    for (const g of guidelines) {
      if (g && g.id) {
        await setDoc(doc(db, "guidelines", g.id), g);
      }
    }

    // Clean deleted records from firestore
    for (const id of existingIds) {
      if (!activeIds.has(id)) {
        await deleteDoc(doc(db, "guidelines", id));
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "guidelines");
  }
}

// 2. Categories
async function getCategoriesFromFirestore(): Promise<any[]> {
  try {
    if (!db) {
      const store = loadSharedStore();
      return store.categories || DEFAULT_CATEGORIES;
    }
    const colRef = collection(db, "categories");
    const snapshot = await getDocs(colRef);
    const list: any[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data() });
    });

    if (list.length === 0) {
      const store = loadSharedStore();
      const initialCats = (store.categories && store.categories.length > 0) ? store.categories : DEFAULT_CATEGORIES;
      await saveCategoriesToFirestore(initialCats);
      return initialCats;
    }
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "categories");
    const store = loadSharedStore();
    return store.categories || DEFAULT_CATEGORIES;
  }
}

async function saveCategoriesToFirestore(categories: any[]) {
  try {
    const store = loadSharedStore();
    store.categories = categories;
    saveSharedStore(store);

    if (!db) return;

    const colRef = collection(db, "categories");
    const snapshot = await getDocs(colRef);
    const existingIds = new Set<string>();
    snapshot.forEach((d) => {
      existingIds.add(d.id);
    });

    const activeIds = new Set(categories.map(c => c.id));
    for (const c of categories) {
      if (c && c.id) {
        await setDoc(doc(db, "categories", c.id), c);
      }
    }

    for (const id of existingIds) {
      if (!activeIds.has(id)) {
        await deleteDoc(doc(db, "categories", id));
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "categories");
  }
}

// 3. Bookmarks
async function getBookmarksFromFirestore(): Promise<string[]> {
  try {
    if (!db) {
      const store = loadSharedStore();
      return store.bookmarkedIds || [];
    }
    const docRef = doc(db, "metadata", "bookmarks");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().bookmarkedIds || [];
    }
    
    // Seed from local if empty
    const store = loadSharedStore();
    const initialB = store.bookmarkedIds || [];
    await saveBookmarksToFirestore(initialB);
    return initialB;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "metadata/bookmarks");
    const store = loadSharedStore();
    return store.bookmarkedIds || [];
  }
}

async function saveBookmarksToFirestore(bookmarkedIds: string[]) {
  try {
    const store = loadSharedStore();
    store.bookmarkedIds = bookmarkedIds;
    saveSharedStore(store);

    if (!db) return;
    await setDoc(doc(db, "metadata", "bookmarks"), { bookmarkedIds });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "metadata/bookmarks");
  }
}

// API Endpoints for Guidelines and Categories
app.get("/api/guidelines", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const guidelines = await getGuidelinesFromFirestore();
  res.json(guidelines);
});

app.post("/api/guidelines", async (req, res) => {
  const { guidelines } = req.body;
  if (!Array.isArray(guidelines)) {
    res.status(400).json({ error: "guidelines must be an array" });
    return;
  }
  await saveGuidelinesToFirestore(guidelines);
  res.json(guidelines);
});

// Sync both lists simultaneously in a single transaction if needed
app.post("/api/sync-both", async (req, res) => {
  const { guidelines, categories } = req.body;
  if (Array.isArray(guidelines)) {
    await saveGuidelinesToFirestore(guidelines);
  }
  if (Array.isArray(categories)) {
    await saveCategoriesToFirestore(categories);
  }
  const currentG = await getGuidelinesFromFirestore();
  const currentC = await getCategoriesFromFirestore();
  res.json({ success: true, guidelines: currentG, categories: currentC });
});

app.get("/api/categories", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const categories = await getCategoriesFromFirestore();
  res.json(categories || DEFAULT_CATEGORIES);
});

app.post("/api/categories", async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    res.status(400).json({ error: "categories must be an array" });
    return;
  }
  await saveCategoriesToFirestore(categories);
  res.json(categories);
});

app.get("/api/bookmarks", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const bookmarks = await getBookmarksFromFirestore();
  res.json(bookmarks || []);
});

app.post("/api/bookmarks", async (req, res) => {
  const { bookmarkedIds } = req.body;
  if (!Array.isArray(bookmarkedIds)) {
    res.status(400).json({ error: "bookmarkedIds must be an array" });
    return;
  }
  await saveBookmarksToFirestore(bookmarkedIds);
  res.json(bookmarkedIds);
});

app.post("/api/reset", async (req, res) => {
  await saveGuidelinesToFirestore([]);
  await saveCategoriesToFirestore(DEFAULT_CATEGORIES);
  await saveBookmarksToFirestore([]);
  res.json({ success: true, guidelines: [], categories: DEFAULT_CATEGORIES, bookmarkedIds: [] });
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
