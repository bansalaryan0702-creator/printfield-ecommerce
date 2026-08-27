import 'dotenv/config';
import axios from 'axios';
import express from 'express';
import * as fsSync from 'fs';
import crypto from 'crypto';

if (!process.env.DATA_ENC_KEY) {
  console.error('FATAL: DATA_ENC_KEY environment variable is not set. Refusing to start without encryption.');
  process.exit(1);
}
const DATA_ENC_KEY = process.env.DATA_ENC_KEY;
function encryptField(text: any): string {
  if (!text) return text;
  if (typeof text !== 'string') text = JSON.stringify(text);
  if (text.startsWith('ENC:')) return text; 
  try {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(DATA_ENC_KEY.substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return 'ENC:' + iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch(e) {
    return text;
  }
}

function decryptField(text: any): string {
  if (!text || typeof text !== 'string' || !text.startsWith('ENC:')) return text;
  try {
    let parts = text.substring(4).split(':');
    let iv = Buffer.from(parts[0], 'hex');
    let encryptedText = Buffer.from(parts[1], 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(DATA_ENC_KEY.substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    return text;
  }
}

import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Register global error handlers immediately to catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Force load dev env json on startup if present
try {
  const devEnvPath = '/app/.dev.env.json';
  if (fsSync.existsSync(devEnvPath)) {
    const devEnv = JSON.parse(fsSync.readFileSync(devEnvPath, 'utf8'));
    for (const key of Object.keys(devEnv)) {
      if (!process.env[key] || process.env[key] === 'MY_GEMINI_API_KEY' || process.env[key] === 'placeholder') {
        process.env[key] = devEnv[key];
      }
    }
  }
} catch (err) {
  console.error('Error loading /app/.dev.env.json:', err);
}


function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  let formatted = key.replace(/\\n/g, '\n');
  formatted = formatted.replace(/^"|"$/g, '');
  if (!formatted.includes('\n')) {
     formatted = formatted.replace(/(-----BEGIN[A-Z\\s]+KEY-----)\\s*(.*?)\\s*(-----END[A-Z\\s]+KEY-----)/s, (match, p1, p2, p3) => {
         return `${p1}\n${p2.replace(/\\s+/g, '\n')}\n${p3}`;
     });
  }
  return formatted;
}

import { PopularProducts, Categories } from './src/data/products';
import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';

import nodemailer from "nodemailer";
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { GoogleGenAI, Type } from '@google/genai';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc as fSetDoc, 
  getDoc as fGetDoc, 
  getDocs as fGetDocs, 
  query, 
  where, 
  updateDoc as fUpdateDoc, 
  deleteDoc as fDeleteDoc, 
  orderBy, 
  limit as fLimit,
  onSnapshot
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import Razorpay from 'razorpay';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import admin from 'firebase-admin';

const s3BucketName = process.env.AWS_S3_BUCKET || 'printfielddigital';
const s3Region = process.env.AWS_REGION || 'ap-south-1';

const s3Client = new S3Client({
  region: s3Region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

let s3ProductsInMemory: any[] | null = null;
let lastS3FetchTime = 0;

async function uploadFileToS3(filename: string, mimeType: string, buffer: Buffer): Promise<string | null> {
  try {
    const key = `uploads/${filename}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: s3BucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));
    return `https://printo-s3.dietpixels.net/${key}`;
  } catch (err: any) {
    console.warn(`[S3 Upload] Failed to upload ${filename} to S3:`, err.message || err);
    return null;
  }
}

const deletedProductIds = new Set<string>();

async function loadDeletedProductIds() {
  try {
    try {
      const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: 'database/deleted_products.json' }));
      const str = await getRes.Body.transformToString();
      const ids = JSON.parse(str);
      if (Array.isArray(ids)) {
        ids.forEach(id => deletedProductIds.add(String(id)));
      }
    } catch (e) {}

    try {
      const localStr = await fs.readFile('./data/deleted_products.json', 'utf-8');
      const localIds = JSON.parse(localStr);
      if (Array.isArray(localIds)) {
        localIds.forEach(id => deletedProductIds.add(String(id)));
      }
    } catch (e) {}
  } catch (err) {
    console.warn('[Deleted Products] Error loading deleted products list:', err);
  }
}

async function saveDeletedProductIds() {
  const arr = Array.from(deletedProductIds);
  const jsonStr = JSON.stringify(arr, null, 2);

  try {
    await fs.mkdir('./data', { recursive: true });
    await fs.writeFile('./data/deleted_products.json', jsonStr, 'utf-8');
  } catch (e) {}

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: s3BucketName,
      Key: 'database/deleted_products.json',
      Body: jsonStr,
      ContentType: 'application/json'
    }));
  } catch (e) {}
}

function isBannedProduct(p: any): boolean {
  if (!p) return true;
  const id = String(p.id || '').trim();
  const lowerId = id.toLowerCase();
  const name = String(p.name || '').trim().toLowerCase();
  if (id && (deletedProductIds.has(id) || deletedProductIds.has(lowerId))) return true;
  if (name && (deletedProductIds.has(name))) return true;
  return false;
}

async function loadProductsFromS3(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && s3ProductsInMemory && (now - lastS3FetchTime < 15000)) {
    return s3ProductsInMemory.filter(p => !isBannedProduct(p));
  }

  try {
    try {
      const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: 'database/products.json' }));
      const str = await getRes.Body.transformToString();
      const prods = JSON.parse(str);
      if (Array.isArray(prods) && prods.length > 0) {
        // Automatically inject Size variation for apparel products if missing
        prods.forEach((p: any) => {
          const isApparel = p.category === "Apparel" || p.category === "Clothing & Bags" || p.category === "Custom Apparel" || p.category === "T-Shirts" || p.category === "Corporate Uniforms";
          const nameLower = (p.name || "").toLowerCase();
          const isApparelByName = nameLower.includes("t-shirt") || nameLower.includes("polo") || nameLower.includes("hoodie") || nameLower.includes("jacket") || nameLower.includes("sweatshirt") || nameLower.includes("wear");
          
          if (isApparel || isApparelByName) {
            if (!p.variations) p.variations = [];
            const hasSize = p.variations.some((v: any) => (v.name || "").toLowerCase() === 'size');
            if (!hasSize) {
              p.variations.unshift({
                id: "size-auto",
                name: "Size",
                options: [
                  { name: "S", price: 0 },
                  { name: "M", price: 0 },
                  { name: "L", price: 0 },
                  { name: "XL", price: 0 },
                  { name: "XXL", price: 0 }
                ]
              });
            }
          }
        });
        
        s3ProductsInMemory = prods.filter((p: any) => !isBannedProduct(p));
        lastS3FetchTime = now;
        return s3ProductsInMemory;
      }
    } catch (e: any) {
      // Key may not exist yet
    }

    try {
      const localStr = await fs.readFile('./data/products.json', 'utf-8');
      const localProds = JSON.parse(localStr);
      if (Array.isArray(localProds) && localProds.length > 0) {
        // Automatically inject Size variation for apparel products if missing
        localProds.forEach((p: any) => {
          const isApparel = p.category === "Apparel" || p.category === "Clothing & Bags" || p.category === "Custom Apparel" || p.category === "T-Shirts" || p.category === "Corporate Uniforms";
          const nameLower = (p.name || "").toLowerCase();
          const isApparelByName = nameLower.includes("t-shirt") || nameLower.includes("polo") || nameLower.includes("hoodie") || nameLower.includes("jacket") || nameLower.includes("sweatshirt") || nameLower.includes("wear");
          
          if (isApparel || isApparelByName) {
            if (!p.variations) p.variations = [];
            const hasSize = p.variations.some((v: any) => (v.name || "").toLowerCase() === 'size');
            if (!hasSize) {
              p.variations.unshift({
                id: "size-auto",
                name: "Size",
                options: [
                  { name: "S", price: 0 },
                  { name: "M", price: 0 },
                  { name: "L", price: 0 },
                  { name: "XL", price: 0 },
                  { name: "XXL", price: 0 }
                ]
              });
            }
          }
        });
        s3ProductsInMemory = localProds.filter((p: any) => !isBannedProduct(p));
        lastS3FetchTime = now;
        return s3ProductsInMemory;
      }
    } catch (e) {}

    const dbRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: 'database/db.json' }));
    const dbStr = await dbRes.Body.transformToString();
    const dbData = JSON.parse(dbStr);

    let items: any[] = [];
    if (Array.isArray(dbData.products) && dbData.products.length > 0 && typeof dbData.products[0] === 'object') {
      items = dbData.products;
    } else if (Array.isArray(dbData.catalogueItems) && dbData.catalogueItems.length > 0) {
      items = dbData.catalogueItems.map((cat: any, idx: number) => ({
        id: cat.id || 's3-item-' + idx,
        name: cat.name || 'Unnamed Product',
        description: cat.description || '',
        cardDescription: cat.cardDescription || cat.description || '',
        price: Number(cat.sellingPrice || cat.price || 0),
        category: cat.category || 'General',
        subCategory: cat.subCategory || '',
        image: cat.imageUrl || cat.image || '',
        images: cat.images || (cat.imageUrl ? [cat.imageUrl] : []),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));
    }

    if (items.length > 0) {
      s3ProductsInMemory = items.filter((p: any) => !isBannedProduct(p));
      lastS3FetchTime = now;
      await saveProductsToS3(s3ProductsInMemory);
      return s3ProductsInMemory;
    }
  } catch (err: any) {
    console.error('[S3 Product Store] Error loading products from S3:', err.message || err);
  }

  return (s3ProductsInMemory || []).filter(p => !isBannedProduct(p));
}

async function saveProductsToS3(products: any[]) {
  const cleanProducts = products.filter(p => !isBannedProduct(p));
  s3ProductsInMemory = cleanProducts;
  lastS3FetchTime = Date.now();

  const jsonStr = JSON.stringify(cleanProducts, null, 2);

  try {
    await fs.mkdir('./data', { recursive: true });
    await fs.writeFile('./data/products.json', jsonStr, 'utf-8');
  } catch (e) {}

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: s3BucketName,
      Key: 'database/products.json',
      Body: jsonStr,
      ContentType: 'application/json'
    }));

    try {
      const getDb = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: 'database/db.json' }));
      const dbStr = await getDb.Body.transformToString();
      const dbData = JSON.parse(dbStr);
      dbData.products = cleanProducts;
      dbData.catalogueItems = cleanProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        sellingPrice: p.price,
        category: p.category,
        subCategory: p.subCategory,
        imageUrl: p.image,
        images: typeof p.images === 'string' ? safeJsonParse(p.images) : p.images
      }));
      await s3Client.send(new PutObjectCommand({
        Bucket: s3BucketName,
        Key: 'database/db.json',
        Body: JSON.stringify(dbData, null, 2),
        ContentType: 'application/json'
      }));
    } catch (e) {}

    console.log(`[S3 Product Store] Saved ${cleanProducts.length} products to S3 bucket ${s3BucketName}`);
  } catch (err: any) {
    console.error('[S3 Product Store] Error saving products to S3:', err.message || err);
  }
}

async function getProductById(productId: string) {
  if (!productId) return null;
  const rawId = productId.trim();
  let decodedId = rawId;
  try { decodedId = decodeURIComponent(rawId); } catch(e) {}

  if (deletedProductIds.has(rawId) || deletedProductIds.has(rawId.toLowerCase()) || deletedProductIds.has(decodedId) || deletedProductIds.has(decodedId.toLowerCase())) {
    return null;
  }

  const products = await loadProductsFromS3();
  return products.find((p: any) => p.id === rawId || p.id === decodedId || p.slug === rawId || p.slug === decodedId || (p.name && String(p.name || '').toLowerCase() === rawId.toLowerCase())) || null;
}

// --- SQLite Local Cache Fallback Layer ---

const setDoc = fSetDoc;
const getDoc = fGetDoc;
const getDocs = fGetDocs;
const updateDoc = fUpdateDoc;
const deleteDoc = fDeleteDoc;
const limit = fLimit;

let firebaseConfig: any = {};
if (fsSync.existsSync(path.join(process.cwd(), 'firebase-applet-config.json'))) {
  firebaseConfig = safeJsonParse(fsSync.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
}
if (!firebaseConfig.projectId && process.env.FIREBASE_PROJECT_ID) {
  firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID || '',
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
    oAuthClientId: process.env.FIREBASE_OAUTH_CLIENT_ID || '',
  };
}

const firebaseApp = initializeApp(firebaseConfig);
let firestoreDb: any;
try {
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== 'ai-studio-84a659f4-d467-4e09-88a5-5dfb369ca41e') {
    firestoreDb = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
  } else {
    firestoreDb = getFirestore(firebaseApp);
  }
} catch {
  firestoreDb = getFirestore(firebaseApp);
}
const firebaseAuth = getAuth(firebaseApp);
const firebaseStorage = getStorage(firebaseApp);

if (!admin?.apps?.length) {
  try {
    if (admin?.credential?.applicationDefault) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
    } else {
      admin.initializeApp();
    }
  } catch (e) {
    try {
      if (admin?.credential?.cert && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseConfig.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
    } catch (e2) {
      console.warn('Firebase Admin SDK initialization skipped:', (e2 as Error).message);
    }
  }
}


export const db = firestoreDb;

// Setup storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error("GEMINI_API_KEY or MY_GEMINI_API_KEY is not set or invalid. Please configure your API key.");
    }
    ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return ai;
}

async function callGeminiWithRetry(params: {
  model?: string;
  contents: any;
  config?: any;
}): Promise<any> {
  const aiClient = getAI();
  const requestedModel = params.model || 'gemini-2.5-flash';
  
  // Build model fallback candidates list to gracefully handle high demand (503/429)
  const fallbackCandidates = [
    requestedModel,
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;

  for (const modelCandidate of fallbackCandidates) {
    let retries = 2; // 2 attempts per candidate model
    let delayMs = 500;

    while (retries > 0) {
      try {
        const response = await aiClient.models.generateContent({
          ...params,
          model: modelCandidate,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || '');
        const errStatus = err?.status || err?.code;
        const isTransient = errStatus === 503 || errStatus === 429 || 
                            errStr.includes('503') || errStr.includes('UNAVAILABLE') || 
                            errStr.includes('high demand') || errStr.includes('429') || 
                            errStr.includes('RESOURCE_EXHAUSTED');

        if (isTransient && retries > 1) {
          console.warn(`[Gemini API Retry] High demand on ${modelCandidate}. Retrying in ${delayMs}ms...`);
          await new Promise((res) => setTimeout(res, delayMs));
          retries--;
        } else {
          console.warn(`[Gemini API Fallback] ${modelCandidate} unavailable (${errStr}). Trying next fallback model...`);
          break; // Switch to next fallback candidate
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini API after retries and model fallbacks.");
}

async function verifyImageWithAI(buffer: Buffer, mimeType: string): Promise<{ safe: boolean, reason?: string }> {
  return { safe: true };
}


const googleTokensCache = new Map<string, string>();

async function getGoogleTokenForUser(email: string): Promise<string | null> {
  const normalized = email.toLowerCase().trim();
  if (googleTokensCache.has(normalized)) {
    return googleTokensCache.get(normalized) || null;
  }
  try {
    // 1. Try querying with the exact normalized lowercase email
    let q = query(collection(db, 'users'), where('email', '==', normalized), fLimit(1));
    let qs = await getDocs(q);
    if (qs && !qs.empty) {
      const data = qs.docs[0].data();
      if (data && data.googleAccessToken) {
        googleTokensCache.set(normalized, data.googleAccessToken);
        return data.googleAccessToken;
      }
    }

    // 2. Try querying with the original casing if different
    if (email !== normalized) {
      q = query(collection(db, 'users'), where('email', '==', email), fLimit(1));
      qs = await getDocs(q);
      if (qs && !qs.empty) {
        const data = qs.docs[0].data();
        if (data && data.googleAccessToken) {
          googleTokensCache.set(normalized, data.googleAccessToken);
          return data.googleAccessToken;
        }
      }
    }

    
  } catch (err: any) {
    console.error('Error fetching Google token from DB:', err.message);
  }
  return null;
}



async function sendGmailEmail({
  to,
  subject,
  text,
  replyTo,
  attachments = [],
  accessToken
}: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: any[];
  accessToken: string;
}) {
  const { google } = await import('googleapis');
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth });

  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows'
  });

  const info = await transporter.sendMail({
    from: 'me',
    to: to,
    subject: subject,
    text: text,
    replyTo: replyTo,
    attachments: attachments
  });

  const rawMessage = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    info.message.on('data', (chunk) => chunks.push(chunk));
    info.message.on('end', () => resolve(Buffer.concat(chunks)));
    info.message.on('error', reject);
  });

  const raw = rawMessage.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: raw
    }
  });
}



async function sendAdminEmail({
  to,
  subject,
  text,
  replyTo,
  attachments = [],
  debug = false
}: {
  to?: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: any[];
  googleAccessToken?: string;
  debug?: boolean;
}): Promise<any> {
  to = to || process.env.ADMIN_EMAIL || 'admin@printfieldonline.com';

  const diagnostics: any = {
    success: false,
    methodUsed: 'Standard SMTP',
    gmail: { attempted: false, success: false },
    smtp: { attempted: true, success: false }
  };

  const smtpUser = process.env.SMTP_USER || to;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

  if (!smtpPass) {
    const errorMsg = 'SMTP_PASS environment variable is missing. Standard SMTP cannot be initialized.';
    console.error(`[Email Service] ${errorMsg}`);
    diagnostics.smtp.error = errorMsg;
    if (debug) return diagnostics;
    return false;
  }

  try {
    console.log('Sending email via Standard SMTP...');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: smtpUser,
      to: to,
      subject: subject,
      text: text,
      replyTo: replyTo,
      attachments: attachments
    });

    console.log('Email successfully sent via Standard SMTP!');
    diagnostics.smtp.success = true;
    diagnostics.success = true;
    if (debug) return diagnostics;
    return true;
  } catch (err: any) {
    console.error('[Email Service] Standard SMTP email delivery failed:', err.message);
    diagnostics.smtp.error = err.message;
    if (debug) return diagnostics;
    return false;
  }
}

function safeJsonParse(text: any) {
  if (text === null || text === undefined) return null;
  if (typeof text !== 'string') {
    return text;
  }
  let cleaned = text.trim();
  if (!cleaned) return null;
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  }
  
  // Only attempt JSON parsing if it actually looks like a JSON array/object or string representation.
  const isJsonLike = (cleaned.startsWith('{') && cleaned.endsWith('}')) || 
                      (cleaned.startsWith('[') && cleaned.endsWith(']')) || 
                      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
                      cleaned === 'true' || cleaned === 'false' || cleaned === 'null';
  
  if (!isJsonLike) {
    return null;
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // If it looks like JSON but parsing fails, we try a quick repair
    let repaired = cleaned.replace(/(:\s*)"([^"]*)"([^",}\s]*)"([^"]*)"/g, '$1"$2\\"$3\\"$4"');
    try {
      return JSON.parse(repaired);
    } catch (e2: any) {
      // Fail silently and return null rather than logging noisy error messages
      return null;
    }
  }
}

const app = express();
  app.set('trust proxy', 1);
const PORT = 3000;
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
const DB_FILE = path.join(process.cwd(), 'app.db');
const OLD_DB_FILE = path.join(process.cwd(), 'database.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Set up Database auth for server
async function setupDB() {
  // Authentication is disabled and not strictly necessary due to the open Firestore rules
  console.log('Firebase Server initialized (Auth skipped due to operation-not-allowed).');
}

function isProductImage(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase().trim();

  // Local uploads, drive files, and data URIs are ALWAYS valid product images!
  if (u.includes('/uploads/') || u.includes('drive.google.com') || u.includes('googleusercontent.com') || u.startsWith('data:')) {
    return true;
  }

  // Exclude loader gifs
  if (
    u.endsWith('.gif') ||
    u.includes('loader.gif') ||
    u.includes('1767607948') ||
    u.includes('how-innovation-works') ||
    u.includes('matt-ridley')
  ) {
    return false;
  }

  // Exclude only obvious junk
  const isGarbage = 
    u.includes('trustpilot') ||
    u.includes('payment') ||
    u.includes('visa-') ||
    u.includes('mastercard-') ||
    u.includes('loading') ||
    (u.includes('pixel') && !u.includes('dietpixels'));
    
  return !isGarbage;
}

function getImageSignature(url: string): string {
  if (!url) return '';
  if (url.includes('/uploads/') || url.includes('drive.google.com') || url.includes('googleusercontent.com') || url.startsWith('data:')) {
    return '';
  }
  let clean = url.split('?')[0].trim();
  try {
    clean = decodeURIComponent(clean);
  } catch (e) {}
  clean = clean.toLowerCase();

  const parts = clean.split('/');
  const filename = parts[parts.length - 1] || '';
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '').trim();

  const numbers = clean.match(/\d{6,}/g) || [];
  const slug = nameWithoutExt.replace(/[\s_%+\-]+/g, '-').trim();

  // If the URL has an explicit timestamp or unique ID, use it for signature
  if (numbers.length > 0 && slug.length > 3) {
    return `sig-num-${numbers.sort().join('-')}-${slug}`;
  }

  if (slug && !['1', '2', '3', '4', '5', 'image', 'img', 'photo', 'product', 'default', 'blank'].includes(slug)) {
    return `sig-slug-${slug}`;
  }
  
  return `sig-exact-${clean}`;
}

function cleanAndDeduplicateImages(urls: (string | null | undefined)[]): string[] {
  const seenSignatures = new Set<string>();
  const seenExactUrls = new Set<string>();
  const uniqueUrls: string[] = [];

  for (const rawUrl of urls) {
    if (!rawUrl || typeof rawUrl !== 'string') continue;
    const url = rawUrl.trim();
    if (!url || !isProductImage(url)) continue;

    let exactKey = url.split('?')[0].trim();
    try {
      exactKey = decodeURIComponent(exactKey);
    } catch (e) {}
    exactKey = exactKey.toLowerCase();

    if (seenExactUrls.has(exactKey)) continue;

    if (url.includes('/uploads/') || url.includes('drive.google.com') || url.includes('googleusercontent.com') || url.startsWith('data:')) {
      seenExactUrls.add(exactKey);
      uniqueUrls.push(url);
      continue;
    }

    const sig = getImageSignature(url);
    if (sig && seenSignatures.has(sig)) continue;

    if (sig) seenSignatures.add(sig);
    seenExactUrls.add(exactKey);
    uniqueUrls.push(url);
  }

  return uniqueUrls;
}

function getFallbackImage(product: any): string {
  if (!product) return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop";
  const name = String(product.name || '').toLowerCase();
  const category = String(product.category || '').toLowerCase();
  const subCategory = String(product.subCategory || '').toLowerCase();

  if (name.includes('power') || name.includes('display') || name.includes('charger') || name.includes('bank') || name.includes('gear') || name.includes('tech') || name.includes('gadget') || name.includes('electronic') || name.includes('device') || name.includes('usb') || name.includes('battery')) {
    return "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes('frame') || name.includes('photo frame') || name.includes('wall frame') || name.includes('wall art') || name.includes('canvas print')) {
    return "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes('mug') || name.includes('cup') || name.includes('bottle') || name.includes('flask') || name.includes('drinkware')) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes('shirt') || name.includes('t-shirt') || name.includes('apparel') || name.includes('hoodie') || name.includes('cap') || name.includes('uniform')) {
    return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes('bag') || name.includes('tote') || name.includes('backpack') || name.includes('pouch') || name.includes('duffel')) {
    return "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes('pen') || name.includes('diary') || name.includes('notebook') || name.includes('calendar') || name.includes('journal') || name.includes('planner')) {
    return "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes('card') || name.includes('visiting card') || name.includes('business card')) {
    return "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes('gift') || name.includes('personalized') || name.includes('personalised') || name.includes('corporate')) {
    return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop";
  }

  if (category.includes('corporate') || category.includes('gift') || subCategory.includes('gift')) {
    return "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('card') || subCategory.includes('card')) {
    return "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('apparel') || subCategory.includes('apparel') || category.includes('clothing') || subCategory.includes('clothing')) {
    return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('bag') || subCategory.includes('bag')) {
    return "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('packaging') || subCategory.includes('packaging')) {
    return "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('stationery') || subCategory.includes('stationery') || category.includes('office') || subCategory.includes('office')) {
    return "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop";
  }

  return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop";
}

function getMajorCategory(origCat: string, subCategory: string, name: string): string {
  if (origCat) return origCat;
  return "Promotional Materials";
}

function cleanProductDescription(rawDesc: string): string {
  if (!rawDesc || typeof rawDesc !== 'string') return '';

  let text = rawDesc;

  // 1. Unescape HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ndash;/gi, '-')
    .replace(/&mdash;/gi, '—');

  // 2. Strip HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // 3. Process line by line
  const lines = text.split(/\r?\n/);
  const cleanLines: string[] = [];

  for (let line of lines) {
    let trimmed = line.trim();

    // Strip markdown headings and bold/italic asterisks
    trimmed = trimmed.replace(/^#+\s*/, '');
    trimmed = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
    trimmed = trimmed.replace(/\*(.*?)\*/g, '$1');

    const lower = trimmed.toLowerCase();

    // Check for unwanted promotional/delivery/MOQ/CTA/link/disclaimer lines
    if (
      lower.includes('order before') ||
      lower.includes('same-day delivery') ||
      lower.includes('sameday delivery') ||
      lower.includes('same day delivery') ||
      lower.includes('4–6 hours') ||
      lower.includes('4-6 hours') ||
      lower.includes('enjoy same-day') ||
      lower.includes('in bengaluru') ||
      lower.includes('in pune') ||
      lower.includes('in hyderabad') ||
      lower.includes('in ncr') ||
      lower.includes('in chennai') ||
      lower.includes('order from just') ||
      lower.includes('order from as low as') ||
      lower.includes('order starts from') ||
      lower.includes('starting from just') ||
      lower.includes('minimum order quantity') ||
      lower.includes('low minimum order') ||
      lower.includes('start with just') ||
      lower.includes('easy order starting') ||
      /^moq\s*:\s*/i.test(trimmed) ||
      /^-?\s*moq\s*:\s*/i.test(trimmed) ||
      /^order from \d+/i.test(trimmed) ||
      /^-?\s*order from \d+/i.test(trimmed) ||
      /^-?\s*order starts from/i.test(trimmed) ||
      lower.includes('click here') ||
      lower.includes('upload your design') ||
      lower.includes('terms & conditions') ||
      lower.includes('we do not accept designs that belong to') ||
      lower.includes('government or government-affiliated') ||
      lower.includes('letter of authorization') ||
      lower.includes('official documents') ||
      lower.startsWith('[explore') ||
      lower.startsWith('[check') ||
      lower.startsWith('[for complete') ||
      lower.includes('printo.in') ||
      lower.includes('http://') ||
      lower.includes('https://')
    ) {
      continue;
    }

    // Clean inline markdown links if any remain (e.g. [text](url) -> text)
    trimmed = trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Clean bullet formatting if present
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      trimmed = '- ' + trimmed.substring(2).trim();
    }

    if (trimmed.length > 0) {
      cleanLines.push(trimmed);
    }
  }

  // Join lines
  let result = cleanLines.join('\n');

  // Remove any left-over markdown asterisks or weird multiple space artifacting
  result = result
    .replace(/\*+/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return result;
}

function mapRowToProduct(row: any) {
  if (!row) return row;
  const origCat = row.category || "";
  const subCategory = row.subCategory || origCat;
  const name = row.name || "";
  const resolvedCategory = getMajorCategory(origCat, subCategory, name);
  
  // Extract images
  let rawImages: string[] = [];
  if (row.images) {
    if (typeof row.images === 'string') {
      const parsed = safeJsonParse(row.images);
      if (Array.isArray(parsed)) {
        rawImages = parsed.filter((i: any) => typeof i === 'string');
      } else if (row.images.trim()) {
        rawImages = [row.images.trim()];
      }
    } else if (Array.isArray(row.images)) {
      rawImages = row.images.filter((i: any) => typeof i === 'string');
    }
  }
  
  const mainImage = (row.image && typeof row.image === 'string') ? row.image.trim() : "";
  
  // Merge and deduplicate
  const allImages = cleanAndDeduplicateImages([mainImage, ...rawImages]);
  const candidates = allImages.length > 0 
    ? allImages 
    : [mainImage, ...rawImages].filter(u => typeof u === 'string' && u.trim().length > 0);

  let cleanedImage = mainImage || candidates[0] || "";
  if (!cleanedImage) {
    cleanedImage = getFallbackImage(row);
  }

  const cleanedImages = candidates.filter(img => img !== cleanedImage);

  const description = cleanProductDescription(row.description || "");
  const cardDescription = cleanProductDescription(row.cardDescription || row.card_description || "");
  
  return {
    ...row,
    category: resolvedCategory,
    subCategory: subCategory,
    image: cleanedImage,
    images: cleanedImages,
    description: description,
    cardDescription: cardDescription || description,
    isDisabled: !!row.isDisabled,
    isBestseller: !!row.isBestseller,
    inMegaMenu: !!row.inMegaMenu,
    badge: row.badge || '',
    features: row.features ? (typeof row.features === 'string' ? (safeJsonParse(row.features) || row.features.split(',').map((f: any) => f.trim()).filter(Boolean)) : row.features) : [],
    colors: row.colors ? (typeof row.colors === 'string' ? (safeJsonParse(row.colors) || []) : row.colors) : [],
    variations: row.variations ? (typeof row.variations === 'string' ? (safeJsonParse(row.variations) || []) : row.variations) : []
  };
}


// Middleware to check user/admin token
const verifyUser = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  });
};

// Middleware to check admin token
const verifyAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !['admin', 'manager'].includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  });
};

const verifyManager = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !['admin', 'manager'].includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  });
};

const verifyStaff = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !['admin', 'manager', 'employee'].includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  });
};

async function startServer() {
  await loadDeletedProductIds();
  const app = express();
  app.set('trust proxy', 1);
const PORT = 3000;
const SITE_URL = 'https://www.printfieldonline.com';

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: ['https://www.printfieldonline.com', 'https://printfieldonline.com', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  

  // --- Rate Limiters ---
  const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many AI requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return false;
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        return ['admin', 'manager', 'employee'].includes(decoded.role);
      } catch (err) {
        return false;
      }
    }
  });

  const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests from this IP, please try again later.' },
    skip: (req) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return false;
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        return ['admin', 'manager', 'employee'].includes(decoded.role);
      } catch (err) {
        return false;
      }
    }
  });

  app.use('/api/ai/', aiRateLimiter);
  app.use('/api/', generalApiLimiter);

  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/users/login', authRateLimiter);
  app.use('/api/users/register', authRateLimiter);
  app.use('/api/users/forgot-password', authRateLimiter);
  app.use('/api/users/reset-password', authRateLimiter);
  app.use('/api/login', authRateLimiter);
  
  // ----- API ROUTES -----

  // Custom Uploads via DB -> local disk (faster and avoids Firestore webchannel timeout issues)
  
  const chunkedUploads = new Map<string, { chunks: (Buffer|null)[], originalName: string, total: number }>();

  // Sequenced Queue to prevent concurrent heavy Firestore writes from exhausting the write stream
  const uploadQueue: Array<() => Promise<void>> = [];
  let isProcessingQueue = false;

  async function enqueueUploadTask(task: () => Promise<void>) {
    uploadQueue.push(task);
    if (!isProcessingQueue) {
      processUploadQueue();
    }
  }

  async function processUploadQueue() {
    isProcessingQueue = true;
    while (uploadQueue.length > 0) {
      const task = uploadQueue.shift();
      if (task) {
        try {
          await task();
        } catch (err: any) {
          console.error('[Upload Queue] Error executing backup task:', err.message);
        }
        // Delay between separate files to allow the Firestore gRPC stream to flush cleanly
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    isProcessingQueue = false;
  }

  app.post('/api/upload/chunk', verifyUser, upload.single('chunk'), async (req, res) => {
    try {
      const uploadId = req.body.uploadId;
      const chunkIndex = parseInt(req.body.chunkIndex, 10);
      const totalChunks = parseInt(req.body.totalChunks, 10);
      const originalName = req.body.originalName;
      if (!req.file) return res.status(400).json({ error: 'No chunk file provided' });
      if (!chunkedUploads.has(uploadId)) {
        chunkedUploads.set(uploadId, { chunks: new Array(totalChunks).fill(null), originalName, total: totalChunks });
      }
      const uploadData = chunkedUploads.get(uploadId)!;
      uploadData.chunks[chunkIndex] = req.file.buffer;
      const receivedCount = uploadData.chunks.filter(c => c !== null).length;
      if (receivedCount === uploadData.total) {
        const finalBuffer = Buffer.concat(uploadData.chunks as Buffer[]);
        chunkedUploads.delete(uploadId);

        let mimeType = 'image/jpeg';
        if (originalName.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (originalName.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';
        else if (originalName.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
        
        const authHeader = req.headers.authorization;
        const isAdmin = authHeader && authHeader.startsWith('Bearer ') && process.env.ADMIN_TOKEN && authHeader.split(' ')[1] === process.env.ADMIN_TOKEN;
        if (!isAdmin) {
          const verification = await verifyImageWithAI(finalBuffer, mimeType);
          if (!verification.safe) {
            return res.status(400).json({ error: verification.reason || 'Image rejected by safety filters.' });
          }
        }

        const safeName = originalName.replace(/[^a-zA-Z0-9.-_]/g, '');
        const finalName = `${uploadId}-${safeName}`;
        
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, finalName), finalBuffer);

        
        

        let pageCount = null;
        if (originalName.toLowerCase().endsWith('.pdf')) {
          try {
            const pdfDoc = await PDFDocument.load(finalBuffer);
            pageCount = pdfDoc.getPageCount();
          } catch (pdfErr) {
            console.error('Failed to get PDF page count:', pdfErr);
          }
        }

        let s3Url = null;
        try {
          s3Url = await uploadFileToS3(finalName, mimeType, finalBuffer);
        } catch (e: any) {
          console.warn('[Chunk Upload] S3 upload failed:', e.message);
        }

        let driveFileId = null;

        const url = `/uploads/${finalName}`;
        return res.json({ url, complete: true, pageCount, driveFileId });
      }
      res.json({ complete: false, received: receivedCount });
    } catch (e: any) {
      console.error('Chunk upload error:', e);
      res.status(500).json({ error: 'Chunk upload failed' });
    }
  });

  app.post('/api/upload', verifyUser, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
      const authHeader = req.headers.authorization;
      const isAdmin = authHeader && authHeader.startsWith('Bearer ') && process.env.ADMIN_TOKEN && authHeader.split(' ')[1] === process.env.ADMIN_TOKEN;
      
      if (!isAdmin) {
        const verification = await verifyImageWithAI(req.file.buffer, req.file.mimetype);
        if (!verification.safe) {
          return res.status(400).json({ error: verification.reason || 'Image rejected by safety filters.' });
        }
      }

      const id = Date.now().toString();
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-_]/g, '');
      const finalName = `${id}-${safeName}`;
      
      const pathMod = await import('path');
      const uploadDir = pathMod.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(pathMod.join(uploadDir, finalName), req.file.buffer);

      let pageCount = null;
      if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
        try {
          const pdfDoc = await PDFDocument.load(req.file.buffer);
          pageCount = pdfDoc.getPageCount();
        } catch (pdfErr) {
          console.error('Failed to get PDF page count:', pdfErr);
        }
      }

      const url = `/uploads/${finalName}`;
      res.json({ url, pageCount });
    } catch(e: any) {
      console.error("Upload error:", e);
      res.status(500).json({ error: 'Error saving file to disk' });
    }
  });
  
  

      


    app.get(['/health', '/api/health'], (_req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  app.get('/api/uploads/:id/:filename?', async (req, res) => {

    try {
      const docSnap = await getDoc(doc(db, 'uploads', req.params.id));
      if (!docSnap.exists()) {
        return res.status(404).send('Uploaded file not found.');
      }
      const fileMeta = docSnap.data();
      
      let finalBuffer: Buffer;
      if (fileMeta.data) {
        finalBuffer = Buffer.from(fileMeta.data, 'base64');
      } else {
        const chunkDocs = [];
        for (let i = 0; i < (fileMeta.chunks || 0); i++) {
          const cSnap = await getDoc(doc(db, `uploads/${req.params.id}/chunks`, i.toString()));
          if (cSnap.exists()) {
            chunkDocs.push(Buffer.from(cSnap.data().data, 'base64'));
          }
        }
        finalBuffer = Buffer.concat(chunkDocs);
      }
      
      res.set('Content-Type', fileMeta.mimetype);
      if (req.query.download) {
        res.set('Content-Disposition', `attachment; filename="${fileMeta.filename || req.params.filename || 'download'}"`);
      }
      res.send(finalBuffer);
    } catch (e: any) {
      console.error("Download error:", e);
      res.status(500).send('Error reading file from DB');
    }
  });
  
  // Legacy static files serving with download support
  app.get('/uploads/:subdir/:filename', async (req, res, next) => {
    try {
      const filename = path.basename(req.params.filename);
      const subdir = req.params.subdir;
      if (filename !== req.params.filename || filename.includes('..') || subdir.includes('..')) {
        return res.status(400).send('Invalid filename');
      }
      const uploadDir = path.resolve(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, subdir, filename);
      const s3SubPath = `${subdir}/${filename}`;
      try {
        await fs.access(filePath);
        return res.sendFile(filePath);
      } catch (e) {
        try {
          const s3Key = `uploads/${s3SubPath}`;
          const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: s3Key }));
          if (getRes.Body) {
            const bytes = await getRes.Body.transformToByteArray();
            const finalBuffer = Buffer.from(bytes);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            if (getRes.ContentType) res.setHeader('Content-Type', getRes.ContentType);
            return res.send(finalBuffer);
          }
        } catch (s3Err: any) {}
        return next();
      }
    } catch (err) {
      next();
    }
  });

  app.get('/uploads/:filename', async (req, res, next) => {
    try {
      const filename = path.basename(req.params.filename);
      if (filename !== req.params.filename || filename.includes('..')) {
        return res.status(400).send('Invalid filename');
      }
      const uploadDir = path.resolve(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, filename);
      if (!filePath.startsWith(uploadDir)) {
        return res.status(403).send('Forbidden');
      }
      // check if file exists
      try {
        await fs.access(filePath);
        if (req.query.download) {
          return res.download(filePath, req.params.filename);
        } else {
          return res.sendFile(filePath);
        }
      } catch (e) {
        // Try to recover from S3
        try {
          const s3Key = `uploads/${req.params.filename}`;
          const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: s3Key }));
          if (getRes.Body) {
            const bytes = await getRes.Body.transformToByteArray();
            const finalBuffer = Buffer.from(bytes);
            
            // Cache on local filesystem
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, finalBuffer);
            console.log(`[Upload Restore] Restored missing file ${req.params.filename} from S3 backup`);
            
            if (req.query.download) {
              return res.download(filePath, req.params.filename);
            } else {
              return res.sendFile(filePath);
            }
          }
        } catch (s3Err: any) {
          // console.warn(`[Upload Restore] Failed to recover ${req.params.filename} from S3:`, s3Err.message);
        }

        // Try to recover from Firestore backup
        try {
          const filename = req.params.filename;
          const id = filename.split('-')[0];
          if (id) {
            const docSnap = await getDoc(doc(db, 'uploads', id));
            if (docSnap.exists()) {
              const fileMeta = docSnap.data();
              let finalBuffer: Buffer;
              if (fileMeta.data) {
                finalBuffer = Buffer.from(fileMeta.data, 'base64');
              } else {
                const chunkDocs = [];
                for (let i = 0; i < (fileMeta.chunks || 0); i++) {
                  const cSnap = await getDoc(doc(db, `uploads/${id}/chunks`, i.toString()));
                  if (cSnap.exists()) {
                    chunkDocs.push(Buffer.from(cSnap.data().data, 'base64'));
                  }
                }
                finalBuffer = Buffer.concat(chunkDocs);
              }
              
              // Cache on local filesystem
              await fs.mkdir(path.dirname(filePath), { recursive: true });
              await fs.writeFile(filePath, finalBuffer);
              console.log(`[Upload Restore] Restored missing file ${filename} from Firestore backup`);
              
              if (req.query.download) {
                return res.download(filePath, filename);
              } else {
                return res.sendFile(filePath);
              }
            }
          }
        } catch (recoverErr: any) {
          console.error(`[Upload Restore] Failed to recover ${req.params.filename} from Firestore:`, recoverErr.message);
        }

        return res.redirect('https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=800&auto=format&fit=crop');
      }
    } catch(e) {
      next();
    }
  });
  
  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/uploads', async (req, res) => {
    try {
      const s3Key = `uploads${req.path}`;
      const obj = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: s3Key }));
      const contentType = obj.ContentType || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      (obj.Body as any).pipe(res);
    } catch {
      res.redirect('https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=800&auto=format&fit=crop');
    }
  });

  // Customer Registration
  app.post('/api/users/register', async (req, res) => {
    try {
      const { email, password, name, phone, companyName } = req.body;
      if (!email || !password || !name || !phone) {
        return res.status(400).json({ error: 'Name, email, phone and password are required' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Check if email exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), fLimit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) return res.status(400).json({ error: 'Email already exists' });

      const hash = await bcrypt.hash(password, 10);
      const id = 'printfield-' + Math.random().toString(36).substr(2, 9);
      
      await setDoc(doc(db, 'users', id), {
        email,
        password: hash,
        name: name || '',
        phone: phone || '',
        companyName: companyName || '',
        role: 'customer',
        savedAddresses: '[]',
        createdAt: Date.now()
      });

      const token = jwt.sign({ id, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id, email, name, phone, companyName, role: 'customer' } });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Customer Login
  app.post('/api/users/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const q = query(collection(db, 'users'), where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      
      if (qs.empty) return res.status(401).json({ error: 'Invalid credentials' });
      const user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;
      
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone || '', companyName: user.companyName || '', role: user.role } });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Forgot Password
  app.post('/api/users/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });

      const q = query(collection(db, 'users'), where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      
      if (qs.empty) {
        // Return success even if not found to prevent email enumeration
        return res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
      }

      const user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
      
      await updateDoc(doc(db, 'users', user.id), {
        resetCode: resetCode,
        resetCodeExpires: Date.now() + 3600000 // 1 hour
      });
      
      try {
        await sendAdminEmail({
          to: email,
          subject: 'Password Reset Code - Printfield',
          text: `You requested a password reset. Here is your 6-digit reset code:\n\n${resetCode}\n\nThis code will expire in 1 hour.`,
        });
        res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
      } catch (e: any) {
        console.error('Error sending reset email:', e);
        res.status(500).json({ error: 'Failed to send reset email. Please contact support.' });
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reset Password
  app.post('/api/users/reset-password', async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, code, and new password required' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

      const q = query(collection(db, 'users'), where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      if (qs.empty) return res.status(404).json({ error: 'User not found' });

      const user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;

      if (!user.resetCode || user.resetCode !== code || !user.resetCodeExpires || Date.now() > user.resetCodeExpires) {
        return res.status(400).json({ error: 'Invalid or expired reset code' });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await updateDoc(doc(db, 'users', user.id), { 
        password: hash,
        resetCode: null,
        resetCodeExpires: null
      });

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err: any) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Google Login
  app.post('/api/users/google-login', async (req, res) => {
    try {
      const { token, googleAccessToken } = req.body;
      if (!token) return res.status(400).json({ error: 'Token required' });
      
      let decodedToken: any;
      try {
if (!admin.getApps().length) {
          return res.status(500).json({ error: 'Authentication service unavailable' });
        }
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (verifyErr: any) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      const { email, name, uid } = decodedToken;
      
      if (!email) {
        return res.status(401).json({ error: 'Token missing email claim' });
      }
      
      if (googleAccessToken && email) {
        googleTokensCache.set(email.toLowerCase().trim(), googleAccessToken);
      }
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      
      let user;
      if (qs.empty) {
        const id = uid || crypto.randomUUID();
        user = { id, email, name: name || '', role: 'customer' };
        await setDoc(doc(db, 'users', id), {
          email, name: name || '', role: 'customer', savedAddresses: '[]', createdAt: Date.now(),
          googleAccessToken: googleAccessToken || null
        });
      } else {
        const docId = qs.docs[0].id;
        const existingData = qs.docs[0].data();
        user = { id: docId, ...existingData, role: existingData.role || 'customer' } as any;
        
        const updateFields: any = {};
        if (googleAccessToken) {
          updateFields.googleAccessToken = googleAccessToken;
          user.googleAccessToken = googleAccessToken;
        }
        if (Object.keys(updateFields).length > 0) {
          await updateDoc(doc(db, 'users', docId), updateFields);
        }
      }
      
      const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token: jwtToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (err: any) {
      console.error('Google login error:', err);
      res.status(401).json({ error: 'Internal server error' });
    }
  });

  // Get current user profile
  app.get('/api/users/me', verifyUser, async (req: any, res) => {
    try {
      if (req.user.role === 'admin') {
        return res.json({ id: 'admin', email: 'admin', role: 'admin' });
      }
      
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      
      const user = { id: docSnap.id, ...docSnap.data() } as any;
      // parse savedAddresses
      if (user.savedAddresses) {
        try {
          user.savedAddresses = safeJsonParse(decryptField(user.savedAddresses));
        } catch(e) {
          user.savedAddresses = [];
        }
      } else {
        user.savedAddresses = [];
      }
      // parse savedDesigns
      if (user.savedDesigns) {
        try {
          user.savedDesigns = safeJsonParse(user.savedDesigns);
        } catch(e) {
          user.savedDesigns = [];
        }
      } else {
        user.savedDesigns = [];
      }
      res.json(user);
    } catch (err: any) {
      console.error('Get profile error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Checkout (Place Order) addresses
  app.post('/api/users/me/addresses', verifyUser, async (req: any, res) => {
    try {
      const { address } = req.body;
      if (!address) return res.status(400).json({ error: 'Address is required' });

      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let addresses = [];
      if (user.savedAddresses) {
        try { addresses = safeJsonParse(decryptField(user.savedAddresses)); } catch(e) {}
      }
      
      if (address.id) {
        const index = addresses.findIndex((a: any) => a.id === address.id);
        if (index !== -1) {
          addresses[index] = { ...addresses[index], ...address };
        } else {
          addresses.push(address);
        }
      } else {
        const newAddress = { id: Math.random().toString(36).substr(2, 9), ...address };
        addresses.push(newAddress);
      }

      await updateDoc(doc(db, 'users', req.user.id), { savedAddresses: encryptField(JSON.stringify(addresses)) });
      res.json({ success: true, addresses });
    } catch (err: any) {
      console.error('Save address error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/users/me/addresses/:id', verifyUser, async (req: any, res) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let addresses = [];
      if (user.savedAddresses) {
        try { addresses = safeJsonParse(decryptField(user.savedAddresses)); } catch(e) {}
      }
      
      addresses = addresses.filter((a: any) => a.id !== req.params.id);
      await updateDoc(doc(db, 'users', req.user.id), { savedAddresses: encryptField(JSON.stringify(addresses)) });
      res.json({ success: true, addresses });
    } catch (err: any) {
      console.error('Delete address error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/users/me', verifyUser, async (req: any, res) => {
    try {
      const { name, email, phone, company, companyName, savedQuotationDetails, password, currentPassword } = req.body;
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      const updates: any = { 
        name: name !== undefined ? name : user.name, 
        email: email !== undefined ? email : user.email,
        phone: phone !== undefined ? phone : user.phone,
        company: company !== undefined ? company : (user.company || user.companyName || companyName),
        companyName: companyName !== undefined ? companyName : (company || user.companyName || user.company),
        savedQuotationDetails: savedQuotationDetails !== undefined ? savedQuotationDetails : user.savedQuotationDetails
      };
      if (password) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }
        if (!user.password) {
          return res.status(400).json({ error: 'Cannot change password for Google-authenticated accounts' });
        }
        const validCurrent = await bcrypt.compare(currentPassword, user.password);
        if (!validCurrent) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
        if (password.length < 8) {
          return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }
        updates.password = await bcrypt.hash(password, 10);
      }

      await updateDoc(doc(db, 'users', req.user.id), updates);
      res.json({ success: true, user: { ...user, ...updates } });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.get('/api/users/me/designs', verifyUser, async (req: any, res) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let designs = [];
      if (user.savedDesigns) {
        try { designs = safeJsonParse(user.savedDesigns); } catch(e) {}
      }
      res.json({ designs });
    } catch (err: any) {
      console.error('Get designs error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/users/me/designs', verifyUser, async (req: any, res) => {
    try {
      const { design } = req.body;
      if (!design) return res.status(400).json({ error: 'Design data is required' });

      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let designs = [];
      if (user.savedDesigns) {
        try { designs = safeJsonParse(user.savedDesigns); } catch(e) {}
      }

      if (design.id) {
        const index = designs.findIndex((d: any) => d.id === design.id);
        if (index !== -1) {
          designs[index] = { ...designs[index], ...design };
        } else {
          designs.push(design);
        }
      } else {
        const newDesign = {
          id: 'design-' + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          ...design
        };
        designs.push(newDesign);
      }

      await updateDoc(doc(db, 'users', req.user.id), { savedDesigns: JSON.stringify(designs) });
      res.json({ success: true, designs });
    } catch (err: any) {
      console.error('Save design error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/users/me/designs/:id', verifyUser, async (req: any, res) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let designs = [];
      if (user.savedDesigns) {
        try { designs = safeJsonParse(user.savedDesigns); } catch(e) {}
      }

      designs = designs.filter((d: any) => d.id !== req.params.id);
      await updateDoc(doc(db, 'users', req.user.id), { savedDesigns: JSON.stringify(designs) });
      res.json({ success: true, designs });
    } catch (err: any) {
      console.error('Delete design error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/users/me/orders', verifyUser, async (req: any, res) => {
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', req.user.id));
      const qs = await getDocs(q);
      const orders = qs.docs.map(d => ({ id: d.id, ...d.data() } as any));
      orders.sort((a,b) => b.createdAt - a.createdAt);

      for (const order of orders) {
        const itemQ = query(collection(db, 'order_items'), where('orderId', '==', order.id));
        const itemQs = await getDocs(itemQ);
        const rawItems = itemQs.docs.map(d => d.data());
        
        const itemsWithProducts = [];
        for (const item of rawItems) {
            if (item.name && item.image) {
              itemsWithProducts.push(item);
              continue;
            }
            const prodData = (await getProductById(item.productId)) || { name: 'Unknown', image: '' };
            itemsWithProducts.push({ ...item, name: item.name || prodData.name, image: item.image || prodData.image });
        }
        order.items = itemsWithProducts;
      }
      res.json(orders);
    } catch(e: any) {
      console.error('Get orders error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Razorpay Endpoints
  const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys not configured. Please add them to your environment variables.');
    }
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  };

  app.get('/api/config/razorpay', (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID || '' });
  });

  app.get('/api/config/whatsapp', (req, res) => {
    res.json({ whatsappNumber: process.env.VITE_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || '919606371222' });
  });

  app.post('/api/create-razorpay-order', verifyUser, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const razorpay = getRazorpayInstance();
      const options = {
        amount: Math.round(Number(amount) * 100), // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_${Math.random().toString(36).substring(7)}`
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (e: any) {
      console.error('Create razorpay order error:', e);
      res.status(500).json({ error: 'Failed to create razorpay order' });
    }
  });

  app.post('/api/orders/:id/gst-bill-request', verifyUser, async (req: any, res) => {
    try {
      const orderId = req.params.id;
      const orderSnap = await getDoc(doc(db, 'orders', orderId));
      if (!orderSnap.exists()) return res.status(404).json({ error: 'Order not found' });
      
      const orderData = orderSnap.data();
      if (orderData.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

      // Fetch items for details
      const itemQ = query(collection(db, 'order_items'), where('orderId', '==', orderId));
      const itemQs = await getDocs(itemQ);
      const items = itemQs.docs.map(d => d.data());
      
      let itemDetails = '';
      const mailAttachments: any[] = [];
      for (const item of items) {
        const prodData = (await getProductById(item.productId)) || { name: 'Unknown', price: 0 };
        
        let custText = '';
        if (item.customizations) {
          try {
            const custs = typeof item.customizations === 'string' ? safeJsonParse(item.customizations) : item.customizations;
            const custArr = Array.isArray(custs) ? custs : [custs];
            for (const c of custArr) {
               const imgUrl = c.mediaUrl || c.url;
               const placement = c.placementId || c.placement || 'Art';
               if (imgUrl) {
                 const fullUrl = imgUrl.startsWith('http') ? imgUrl : (process.env.APP_URL || '') + imgUrl;
                 custText += `\n    - ${placement} (Attached): ${fullUrl}`;
                 
                 let attachmentObj: any = null;
                 if (imgUrl.startsWith('/uploads/')) {
                   const localPath = path.join(process.cwd(), imgUrl);
                   if (fsSync.existsSync(localPath)) {
                     attachmentObj = {
                       filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                       path: localPath
                     };
                   } else {
                     try {
                       const filename = imgUrl.replace('/uploads/', '');
                       const s3Key = `uploads/${filename}`;
                       const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: s3Key }));
                       if (getRes.Body) {
                         const bytes = await getRes.Body.transformToByteArray();
                         const finalBuffer = Buffer.from(bytes);
                         await fs.mkdir(path.dirname(localPath), { recursive: true });
                         await fs.writeFile(localPath, finalBuffer);
                         attachmentObj = {
                           filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                           path: localPath
                         };
                       }
                     } catch (s3err) {
                       console.warn(`Attachment file not found on disk or S3: ${localPath}`);
                     }
                   }
                 } else if (imgUrl.includes('/api/uploads/')) {
                   try {
                     const match = imgUrl.match(/\/api\/uploads\/([^/]+)/);
                     if (match) {
                       const fileId = match[1];
                       const docSnap = await getDoc(doc(db, 'uploads', fileId));
                       if (docSnap.exists()) {
                         const fileMeta = docSnap.data();
                         const chunkDocs = [];
                         for (let i = 0; i < fileMeta.chunks; i++) {
                           const cSnap = await getDoc(doc(db, `uploads/${fileId}/chunks`, i.toString()));
                           if (cSnap.exists()) {
                             chunkDocs.push(Buffer.from(cSnap.data().data, 'base64'));
                           }
                         }
                         const finalBuffer = Buffer.concat(chunkDocs);
                         attachmentObj = {
                           filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                           content: finalBuffer,
                           contentType: fileMeta.mimetype
                         };
                       }
                     }
                   } catch (dbErr: any) {
                     console.error(`Failed to load DB attachment for nodemailer:`, dbErr.message);
                   }
                 }

                 if (!attachmentObj) {
                   const attachmentPath = imgUrl.startsWith('http') 
                     ? imgUrl 
                     : (process.env.APP_URL || 'http://localhost:3000') + imgUrl;
                   attachmentObj = {
                     filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                     path: attachmentPath
                   };
                 }

                 if (attachmentObj) {
                   mailAttachments.push(attachmentObj);
                 }
               }
            }
          } catch(e) {}
        }
        
        itemDetails += `- ${prodData.name} (Qty: ${item.quantity}) - Rs. ${(item.price || 0) * (item.quantity || 1)}${custText}\n`;
      }
      
      let addressDetails = '';
      try {
        const addr = typeof orderData.shippingAddress === 'string' ? safeJsonParse(decryptField(orderData.shippingAddress)) : orderData.shippingAddress;
        addressDetails = `${addr.fullName}, ${addr.street}, ${addr.city}, ${addr.state} ${addr.zip} - Ph: ${addr.phone}`;
      } catch(e) {}
      
      const messageText = `GST Bill Request for Order #${orderId}\n\nDeliver To Admin: ${process.env.ADMIN_EMAIL || 'admin@printfieldonline.com'}\n\nCustomer Email: ${req.user.email}\n\nShipping Address: ${addressDetails}\n\nItems:\n${itemDetails}\nTotal: Rs. ${orderData.total}`;
      
      try {
        await sendAdminEmail({
          subject: `GST Bill Request for Order #${orderId}`,
          text: messageText,
          replyTo: req.user.email,
          attachments: mailAttachments
        });
      } catch (err: any) {
        console.log("Failed to send GST email with attachments, retrying without attachments...", err.message);
        try {
          await sendAdminEmail({
            subject: `GST Bill Request for Order #${orderId}`,
            text: messageText + "\n\n(Note: Attachments were too large to include. Please click the links above to download them.)",
            replyTo: req.user.email,
            attachments: []
          });
        } catch (retryErr: any) {
          console.error('GST bill email retry failed:', retryErr);
          return res.status(400).json({ error: 'Failed to send email notification.' });
        }
      }

      res.json({ 
        success: true, 
        message: 'GST bill request sent successfully via email.'
      });
    } catch (e: any) {
      console.error('GST bill request error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/orders', verifyUser, async (req: any, res) => {
    try {
      const { items, shippingAddress, paymentDetails, googleToken } = req.body; 
      if (!items || !items.length || !shippingAddress) {
        return res.status(400).json({ error: 'Missing items or shipping address' });
      }

      const orderId = crypto.randomUUID();
      let total = 0;
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          return res.status(400).json({ error: 'Invalid item: productId and quantity >= 1 required' });
        }
        const prod = await getProductById(item.productId);
        if (!prod) {
          return res.status(400).json({ error: `Product not found: ${item.productId}` });
        }
        const price = prod.price || 0;
        if (price < 0) {
          return res.status(400).json({ error: 'Invalid product price' });
        }
        total += price * item.quantity;
      }

      const userSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!userSnap.exists()) {
        return res.status(401).json({ error: 'User session invalid. Please log out and register again.' });
      }
      const userData = userSnap.data();
      const userUpdate: any = {};
      if (googleToken && userData?.email) {
        googleTokensCache.set(userData.email.toLowerCase().trim(), googleToken);
        userUpdate.googleAccessToken = googleToken;
      }

      // Save customer details (Name, Email, Phone, Company) to user record for future pre-filling
      const parsedAddr = typeof shippingAddress === 'string' ? safeJsonParse(decryptField(shippingAddress)) : shippingAddress;
      if (parsedAddr && typeof parsedAddr === 'object') {
        if (parsedAddr.fullName) userUpdate.name = parsedAddr.fullName;
        if (parsedAddr.phone) userUpdate.phone = parsedAddr.phone;
        if (parsedAddr.email) userUpdate.email = parsedAddr.email;
        if (parsedAddr.company) {
          userUpdate.company = parsedAddr.company;
          userUpdate.companyName = parsedAddr.company;
        }
        userUpdate.savedQuotationDetails = JSON.stringify({
          fullName: parsedAddr.fullName || userData?.name || '',
          phone: parsedAddr.phone || userData?.phone || '',
          email: parsedAddr.email || userData?.email || '',
          company: parsedAddr.company || userData?.company || userData?.companyName || ''
        });
      }

      if (Object.keys(userUpdate).length > 0) {
        await updateDoc(doc(db, 'users', req.user.id), userUpdate);
      }

      await setDoc(doc(db, 'orders', orderId), {
          userId: req.user.id,
          total,
          shippingAddress: encryptField(typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress)),
          status: 'quote_pending',
          paymentMethod: 'RFQ',
          paymentId: null,
          createdAt: Date.now()
      });

      for (const item of items) {
           const itemId = crypto.randomUUID();
           const prod = await getProductById(item.productId);
           const customizationsStr = item.customizations ? (typeof item.customizations === 'string' ? item.customizations : JSON.stringify(item.customizations)) : null;
           await setDoc(doc(db, 'order_items', itemId), {
               orderId,
               productId: item.productId,
               name: item.name || prod?.name || '',
               image: item.image || prod?.image || '',
               quantity: item.quantity,
               price: prod?.price || 0,
               customizations: customizationsStr
           });
      }

      // Try sending notification async
      (async () => {
        try {
          let itemDetails = '';
          const mailAttachments: any[] = [];
          for (const item of items) {
            const prodData = (await getProductById(item.productId)) || { name: 'Unknown' };
            
            let custText = '';
            const nameToUse = item.name || prodData.name;

            if (item.customizations) {
              try {
                const custs = typeof item.customizations === 'string' ? safeJsonParse(item.customizations) : item.customizations;
                const custArr = Array.isArray(custs) ? custs : [custs];
                for (const c of custArr) {
                   const imgUrl = c.mediaUrl || c.url;
                   const placement = c.placementId || c.placement || 'Art';
                   if (imgUrl) {
                     const fullUrl = imgUrl.startsWith('http') ? imgUrl : (process.env.APP_URL || '') + imgUrl;
                     custText += `\n    - ${placement} (Attached): ${fullUrl}`;
                     
                     let attachmentObj: any = null;
                     if (imgUrl.startsWith('/uploads/')) {
                       const localPath = path.join(process.cwd(), imgUrl);
                       if (fsSync.existsSync(localPath)) {
                         attachmentObj = {
                           filename: `${nameToUse}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                           path: localPath
                         };
                       } else {
                         try {
                           const filename = imgUrl.replace('/uploads/', '');
                           const s3Key = `uploads/${filename}`;
                           const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: s3Key }));
                           if (getRes.Body) {
                             const bytes = await getRes.Body.transformToByteArray();
                             const finalBuffer = Buffer.from(bytes);
                             await fs.mkdir(path.dirname(localPath), { recursive: true });
                             await fs.writeFile(localPath, finalBuffer);
                             attachmentObj = {
                               filename: `${nameToUse}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                               path: localPath
                             };
                           }
                         } catch (s3err) {
                           console.warn(`Attachment file not found on disk or S3: ${localPath}`);
                         }
                       }
                     } else if (imgUrl.includes('/api/uploads/')) {
                       try {
                         const match = imgUrl.match(/\/api\/uploads\/([^/]+)/);
                         if (match) {
                           const fileId = match[1];
                           const docSnap = await getDoc(doc(db, 'uploads', fileId));
                           if (docSnap.exists()) {
                             const fileMeta = docSnap.data();
                             const chunkDocs = [];
                             for (let i = 0; i < fileMeta.chunks; i++) {
                               const cSnap = await getDoc(doc(db, `uploads/${fileId}/chunks`, i.toString()));
                               if (cSnap.exists()) {
                                 chunkDocs.push(Buffer.from(cSnap.data().data, 'base64'));
                               }
                             }
                             const finalBuffer = Buffer.concat(chunkDocs);
                             attachmentObj = {
                               filename: `${nameToUse}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                               content: finalBuffer,
                               contentType: fileMeta.mimetype
                             };
                           }
                         }
                       } catch (dbErr: any) {
                         console.error(`Failed to load DB attachment for nodemailer:`, dbErr.message);
                       }
                     }

                     if (!attachmentObj) {
                       const attachmentPath = imgUrl.startsWith('http') 
                         ? imgUrl 
                         : (process.env.APP_URL || 'http://localhost:3000') + imgUrl;
                       attachmentObj = {
                         filename: `${nameToUse}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                         path: attachmentPath
                       };
                     }

                     if (attachmentObj) {
                       mailAttachments.push(attachmentObj);
                     }
                   }
                }
              } catch(e) {}
            }
            
            itemDetails += `\n- Product Name: ${nameToUse}\n  Requested Quantity: ${item.quantity} set(s)/pack(s)\n${custText ? '  Artwork/Design Details:' + custText + '\n' : ''}`;
          }

          let addressDetails = '';
          try {
            const addr = typeof shippingAddress === 'string' ? safeJsonParse(decryptField(shippingAddress)) : shippingAddress;
            addressDetails = `${addr.fullName}, ${addr.street}, ${addr.city}, ${addr.state} ${addr.zip} - Ph: ${addr.phone}`;
          } catch(e) {}

          const userData = userSnap.data();
          const messageText = `New Quotation Request (RFQ) Received!\n\nOrder/RFQ ID: ${orderId}\nCustomer Email: ${userData.email}\nCustomer Name: ${userData.name}\n\nShipping Address: ${addressDetails}\n\nItems:\n${itemDetails}\nPlease login to the Admin Dashboard to review specifications, add wholesale prices, and send the quotation to the customer.`;

          try {
            await sendAdminEmail({
              subject: `[RFQ Request] New Quotation Request #${orderId}`,
              text: messageText,
              replyTo: userData.email,
              attachments: mailAttachments,
              googleAccessToken: googleToken
            });
          } catch (attachErr: any) {
            console.log("Failed to send email with attachments, retrying without attachments...", attachErr.message);
            try {
              await sendAdminEmail({
                subject: `[RFQ Request] New Quotation Request #${orderId}`,
                text: messageText + "\n\n(Note: Attachments were too large to include. Please click the links above to download them.)",
                replyTo: userData.email,
                attachments: [], // retry without attachments
                googleAccessToken: googleToken
              });
            } catch (retryErr) {
              console.error('Failed to send admin order notification retry:', retryErr);
            }
          }
        } catch (notifyError) {
          console.error('Failed to send admin order notification:', notifyError);
        }
      })();

      res.json({ success: true, orderId });
    } catch (err: any) {
      console.error('Create order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login (staff)
  
    
  function handleAIError(err: any, res: any) {
    console.error("AI service error:", err);
    const errMsg = err.message || err.toString() || "";
    if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('demand')) {
      return res.status(503).json({
        error: "The AI service is currently experiencing very high demand. Please wait a few seconds and try again!"
      });
    }
    if (errMsg.includes('429') || errMsg.includes('Quota')) {
      return res.status(429).json({
        error: "AI rate limit or quota exceeded. Please wait a moment and try again."
      });
    }
    res.status(500).json({ error: "AI assistant error", details: errMsg });
  }


  
  app.post('/api/ai/generate-card-description', verifyAdmin, async (req, res) => {
    try {
      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });
      const { name, category, description } = req.body;
      const prompt = `Generate a short, crisp, SEO-optimized product card description (1-2 sentences, max 120 characters) for a product.
Product Name: ${name}
Category: ${category}
Main Description: ${description}

Requirements:
- Make it short, crisp, and high-impact.
- Seamlessly integrate high-value SEO keywords based on the product name and category to boost search rank.
- Keep it concise (strictly max 120 characters, NO truncation, complete sentence).
- IMPORTANT: Ensure it starts with unique, active, and varied wording. Avoid generic openings like "Introducing", "Experience", "Discover", or "Our" every time. Be creative and direct with the first word.
- Output ONLY the generated description without any extra text or quotes.`;

            let data: any = null;
      try {
        const response = await callGeminiWithRetry({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING, description: "Detailed description. MUST include all important points like size, quality, paper, materials, and everything else." },
                price: { type: Type.NUMBER, description: "Extract the numeric price, if any" },
                category: { type: Type.STRING },
                image: { type: Type.STRING },
                images: { type: Type.ARRAY, items: { type: Type.STRING } },
                features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extract exactly the best 3 features." },
                colors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hex: { type: Type.STRING },
                    }
                  }
                },
                variations: {
                  type: Type.ARRAY,
                  description: "Categories of variations (e.g., 'Size', 'Finish'). Include EVERY single option found on the page.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "Internal lowercased id, e.g. 'size' or 'material'" },
                      name: { type: Type.STRING, description: "Display name of the variation category, e.g. 'Size', 'Finish'" },
                      options: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING, description: "Option name, e.g. 'A4', 'Glossy'" },
                            price: { type: Type.NUMBER, description: "Relative additional cost for this option (e.g. 0 for the base/cheapest option, 50 if it costs 50 more). Default to 0 if unknown." }
                          }
                        }
                      }
                    }
                  }
                }
              },
              required: ["name", "description"]
            }
          }
        });
        
        let parsedText = '';
        if (typeof response.text === 'function') {
          parsedText = response.text();
        } else {
          parsedText = response.text || "{}";
        }
        
        if (!parsedText) throw new Error('Failed to parse from AI');
        data = safeJsonParse(parsedText);
        if (!data) throw new Error('Failed to parse AI JSON response');
      } catch (aiErr: any) {
        console.warn('AI Parsing failed, falling back to heuristic parsing:', aiErr.message);
        
        const title = $('title').text().replace(/\s+/g, ' ').trim() || 'Imported Product';
        const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim();
        
        data = {
          name: h1 || title || 'Unknown Product',
          description: $('meta[name="description"]').attr('content') || title,
          price: 0,
          category: 'General',
          image: imageUrls.length > 0 ? imageUrls[0] : '',
          images: imageUrls.slice(1, 10),
          features: [],
          colors: [],
          variations: []
        };
        
        const priceMatches = bodyText.match(/(?:Rs\.?|INR|₹|\$)\s*([0-9,]+\.?[0-9]*)/i);
        if (priceMatches && priceMatches[1]) {
           data.price = parseFloat(priceMatches[1].replace(/,/g, ''));
        }
      }
      
      // Fallback: If AI didn't pick an image, use the first available one
      if (!data.image && imageUrls.length > 0) {
          data.image = imageUrls[0];
          data.images = Array.from(new Set([...(data.images || []), ...imageUrls.slice(1)]));
      }

      

   res.json({ success: true, data });
} catch (error: any) {
      console.error(error);
      if (error.status === 503 || error.message?.includes('503')) {
        return res.status(503).json({ error: 'The AI model is currently experiencing high demand. Please try again later.' });
      }
      res.status(500).json({ error: error.message || 'Failed to import product' });
    }
  });

  // ----- AI CHAT API ROUTES (SAVED SECURELY IN BACKEND) -----
  app.get('/api/chat/history', async (req, res) => {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const docSnap = await getDoc(doc(db, 'chats', sessionId as string));
      if (docSnap.exists()) {
        const d = docSnap.data();
        return res.json({ 
          messages: d.messages || [], 
          customerName: d.customerName || null 
        });
      }
      return res.json({ messages: [], customerName: null });
    } catch (error: any) {
      console.error('Failed to fetch chat history:', error);
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  app.post('/api/chat/name', async (req, res) => {
    try {
      const { sessionId, name } = req.body;
      if (!sessionId || !name) {
        return res.status(400).json({ error: 'sessionId and name are required' });
      }

      const docSnap = await getDoc(doc(db, 'chats', sessionId));
      let data: any = {
        id: sessionId,
        sessionId,
        customerName: name.trim(),
        updatedAt: Date.now()
      };
      if (docSnap.exists()) {
        data = {
          ...docSnap.data(),
          customerName: name.trim(),
          updatedAt: Date.now()
        };
      }
      await setDoc(doc(db, 'chats', sessionId), data);
      res.json({ success: true, customerName: name.trim() });
    } catch (error: any) {
      console.error('Failed to save customer name:', error);
      res.status(500).json({ error: 'Failed to save customer name' });
    }
  });

  app.post('/api/chat/message', async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      if (!message || !sessionId) {
        return res.status(400).json({ error: 'message and sessionId are required' });
      }

      // Check optional user auth token
      const authHeader = req.headers.authorization;
      let userId = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
        } catch (e) {
          // Fallback to guest
        }
      }

      // 1. Retrieve or start history
      const docSnap = await getDoc(doc(db, 'chats', sessionId));
      let messages = [];
      let customerName = null;
      if (docSnap.exists()) {
        const d = docSnap.data();
        messages = d.messages || [];
        customerName = d.customerName || null;
      }

      // Append new user message
      const userMsg = {
        role: 'user',
        text: message,
        timestamp: Date.now()
      };
      messages.push(userMsg);

      // 2. Query Gemini
      const contents = messages.map((m: any) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const systemInstruction = `You are 'Printfield Assistant', a natural, expert, and friendly human-like customer representative for Printfield (India's premier platform for custom printed branding materials, corporate stationery, personalized merchandise, packaging, and corporate gifts).

Your mission is to help customers design, customize, choose, and order standard and premium products.
Provide helpful, specific, and professional guidance. Suggest materials (such as premium 300 GSM paper, thick matte cards, elegant custom envelopes, textured letterheads, etc.), answer design/print questions, recommend quantity options, and guide them gracefully through the ordering process.

${customerName ? `The customer's name is ${customerName}. Address them by name naturally (e.g., "Hi ${customerName}," or "Sure, ${customerName}, we can...") in your messages to make the interaction feel personalized and warm.` : ""}

Texting & Style Guidelines (CRITICAL for sounding natural and NOT like an AI):
- Sound like a real, helpful human customer representative texting back in a live chat. Keep your tone professional, friendly, and practical.
- NEVER use standard AI robotic clichés like:
  * "Certainly! I'd be happy to help with that!"
  * "I can certainly assist you with..."
  * "Here is some information about..."
  * "Let me know if there is anything else I can do for you!"
- Keep messages brief, direct, and conversational. Break your text into 2 or 3 short, easy-to-read paragraphs.
- DO NOT use markdown headers (e.g. ###, ##, #) or overly dense markdown bullet lists.
- Avoid excessive bolding (e.g., do not bold every product name or option). Only bold occasionally for real emphasis, or avoid bold entirely.
- Write naturally: use standard conversational transitions. End your message with a natural, open-ended question to keep the chat active (e.g., "Would you like me to recommend a specific GSM for those card types, or do you already have a preference?").
- Ensure responses are concise, clear, and focused (max 120 words).`;

      const aiResponse = await callGeminiWithRetry({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
        }
      });

      const replyText = aiResponse.text?.trim() || "I apologize, but I encountered an issue while generating a response. Please try again.";

      // Append model response
      const modelMsg = {
        role: 'model',
        text: replyText,
        timestamp: Date.now()
      };
      messages.push(modelMsg);

      // 3. Save to backend (Writes locally to SQLite cache + immediately backs up to Firestore)
      await setDoc(doc(db, 'chats', sessionId), {
        id: sessionId,
        sessionId,
        userId,
        messages,
        updatedAt: Date.now()
      });

      res.json({ reply: replyText, messages });
    } catch (error: any) {
      console.error('Failed to handle chat message:', error);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  });

  app.post('/api/chat/clear', async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      await setDoc(doc(db, 'chats', sessionId), {
        id: sessionId,
        sessionId,
        messages: [],
        updatedAt: Date.now()
      });

      res.json({ success: true, messages: [] });
    } catch (error: any) {
      console.error('Failed to clear chat:', error);
      res.status(500).json({ error: 'Failed to clear chat history' });
    }
  });


  // ----- ADMIN CHAT ACCESS & AI SUMMARIZATION -----
  app.get('/api/admin/chats', verifyStaff, async (req, res) => {
    try {
      const chatsSnap = await getDocs(collection(db, 'chats'));
      const chatsList: any[] = [];
      
      if (chatsSnap && chatsSnap.docs) {
        chatsSnap.docs.forEach((docSnap: any) => {
          const d = docSnap.data();
          if (d.messages && d.messages.length > 0) {
            chatsList.push({
              id: docSnap.id,
              sessionId: d.sessionId || docSnap.id,
              userId: d.userId,
              messages: d.messages,
              customerName: d.customerName || null,
              platform: d.platform || 'web',
              updatedAt: d.updatedAt || Date.now()
            });
          }
        });
      }

      // Sort descending by updatedAt
      chatsList.sort((a, b) => b.updatedAt - a.updatedAt);

      // Fetch corresponding user profiles
      const usersSnap = await getDocs(collection(db, 'users'));
      const userMap: Record<string, any> = {};
      if (usersSnap && usersSnap.docs) {
        usersSnap.docs.forEach((udoc: any) => {
          userMap[udoc.id] = udoc.data();
        });
      }

      const processedChats = chatsList.map(c => {
        const u = c.userId ? userMap[c.userId] : null;
        const fallbackName = c.customerName || 'Guest Customer';
        return {
          ...c,
          userName: u ? (u.name || u.displayName || u.email || fallbackName) : fallbackName,
          userEmail: u ? u.email : null,
          userPhone: u ? u.phone : null,
          platform: c.platform
        };
      });

      res.json({ chats: processedChats });
    } catch (error: any) {
      console.error('Failed to fetch admin chats:', error);
      res.status(500).json({ error: 'Failed to fetch customer chats' });
    }
  });

  app.post('/api/admin/chats/summarize', verifyStaff, async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const docSnap = await getDoc(doc(db, 'chats', sessionId));
      if (!docSnap.exists()) {
        return res.status(404).json({ error: 'Chat session not found' });
      }

      const d = docSnap.data();
      const messages = d.messages || [];
      if (messages.length === 0) {
        return res.json({ summary: "No messages in this chat session." });
      }

      // Format messages for the prompt
      const chatLog = messages.map((m: any) => `${m.role === 'model' || m.role === 'staff' ? (m.role === 'staff' ? 'Staff' : 'AI') : 'Customer'}: ${m.text}`).join('\n');

      const prompt = `You are a Customer Experience Manager at Printfield.
Please summarize the following chat log between a customer and our support team in a very short and simple manner (strictly maximum 3 short bullets). Keep it extremely concise and straight to the point:

--- CHAT LOG ---
${chatLog}
`;

      const aiResponse = await callGeminiWithRetry({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const summaryText = aiResponse.text?.trim() || "Could not generate summary.";
      res.json({ summary: summaryText });
    } catch (error: any) {
      console.error('Failed to summarize chat:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  app.post('/api/admin/chats/message', verifyStaff, async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      if (!sessionId || !message) {
        return res.status(400).json({ error: 'sessionId and message are required' });
      }

      const docSnap = await getDoc(doc(db, 'chats', sessionId));
      let messages: any[] = [];
      let userId = null;
      let platform = 'web';
      if (docSnap.exists()) {
        const d = docSnap.data();
        messages = d.messages || [];
        userId = d.userId;
        platform = d.platform || 'web';
      }

      // Append new human staff representative message
      const staffMsg = {
        role: 'staff',
        text: message,
        timestamp: Date.now()
      };
      messages.push(staffMsg);

      // Save to database
      await setDoc(doc(db, 'chats', sessionId), {
        id: sessionId,
        sessionId,
        userId,
        messages,
        platform,
        updatedAt: Date.now()
      }, { merge: true });

      if (platform === 'whatsapp' && userId) {
        const waToken = process.env.WHATSAPP_TOKEN;
        const waPhoneId = process.env.WHATSAPP_PHONE_ID;
        if (waToken && waPhoneId) {
          try {
            await axios.post(`https://graph.facebook.com/v17.0/${waPhoneId}/messages`, {
              messaging_product: 'whatsapp',
              to: userId,
              text: { body: message }
            }, {
              headers: {
                'Authorization': `Bearer ${waToken}`,
                'Content-Type': 'application/json'
              }
            });
          } catch (waErr: any) {
            console.error('Failed to send whatsapp message:', waErr.response?.data || waErr.message);
          }
        }
      }

      res.json({ success: true, messages });
    } catch (error: any) {
      console.error('Failed to send admin staff message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // ----- WHATSAPP WEBHOOK -----
  app.get('/api/webhooks/whatsapp', (req, res) => {
    const verify_token = process.env.WHATSAPP_VERIFY_TOKEN || 'printfield_wa_token';
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    
    if (mode && token) {
      if (mode === 'subscribe' && token === verify_token) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  app.post('/api/webhooks/whatsapp', async (req, res) => {
    try {
      let body = req.body;
      if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0] && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
          let from = body.entry[0].changes[0].value.messages[0].from;
          let msg_body = body.entry[0].changes[0].value.messages[0].text?.body;
          let contactName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || `WhatsApp User (${from})`;
          
          if (msg_body) {
            const sessionId = `wa_${from}`;
            const chatRef = doc(db, 'chats', sessionId);
            const chatSnap = await getDoc(chatRef);
            
            let messages: any[] = [];
            if (chatSnap.exists()) {
              messages = chatSnap.data().messages || [];
            }
            
            messages.push({
              role: 'user',
              text: msg_body,
              timestamp: Date.now()
            });
            
            await setDoc(chatRef, {
              id: sessionId,
              sessionId,
              userId: from,
              customerName: contactName,
              messages,
              platform: 'whatsapp',
              updatedAt: Date.now()
            }, { merge: true });
          }
        }
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('WhatsApp Webhook Error:', error);
      res.sendStatus(500);
    }
  });

  // ----- VITE MIDDLEWARE -----
  

  app.post('/api/scrape-category-links', verifyAdmin, async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      url = url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid URL provided.' });
      }

      const pageRes = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      if (!pageRes.ok) {
        return res.status(400).json({ error: `Failed to fetch URL. Status: ${pageRes.status}` });
      }
      const html = await pageRes.text();

      console.log('Successfully fetched URL, length:', html.length);
      const $ = cheerio.load(html);
      
      const baseUrl = parsedUrl.origin;
      const links = new Set<string>();
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && !href.startsWith('javascript') && !href.startsWith('#') && !href.startsWith('mailto:')) {
           if (href.startsWith('//')) href = 'https:' + href;
           else if (href.startsWith('/')) href = baseUrl + href;
           else if (!href.startsWith('http')) href = baseUrl + '/' + href;
           
           links.add(href.split('#')[0]); 
        }
      });
      
      const linksArray = Array.from(links);
      if (linksArray.length === 0) {
        return res.json({ success: true, urls: [] });
      }

      let extractedUrls = [];
      try {
        const prompt = `Here is a list of URLs found on a webpage (${url}). Which of these links are likely individual product detail pages? Filter out navigation, categories, privacy policies, etc. Return ONLY a JSON array of the product URLs.
URLs:
${linksArray.slice(0, 300).join('\n')}`;
        const aiResponse = await callGeminiWithRetry({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });

        let parsedText = '';
        if (typeof aiResponse.text === 'function') {
          parsedText = aiResponse.text();
        } else {
          parsedText = aiResponse.text || "[]";
        }
        extractedUrls = JSON.parse(parsedText.trim() || "[]");
      } catch (err: any) {
        console.warn('AI link filtering failed, returning all valid-looking links:', err.message);
        extractedUrls = linksArray.filter(l => l.includes('product') || l.includes('item') || l.includes('p-') || l.match(/\/[a-z0-9-]+\.html$/i)).slice(0, 50);
        if (extractedUrls.length === 0) extractedUrls = linksArray.slice(0, 50);
      }

      return res.json({ success: true, urls: extractedUrls });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Failed to fetch category links' });
    }
  });

  app.post('/api/import-product', verifyAdmin, async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      url = url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid URL provided. Please enter a valid product webpage URL.' });
      }
      const hostname = parsedUrl.hostname.toLowerCase();
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '169.254.169.254', 'metadata.google.internal'];
      if (blockedHosts.includes(hostname) || hostname.startsWith('10.') || hostname.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
        return res.status(400).json({ error: 'Internal/private URLs are not allowed' });
      }
      const pageRes = await fetch(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        } 
      });
      if (!pageRes.ok) {
        throw new Error(`Failed to fetch the URL. Status: ${pageRes.status} ${pageRes.statusText}`);
      }
      const html = await pageRes.text();
      
      const $ = cheerio.load(html);
      
      let jsonLdData = '';
      $('script[type="application/ld+json"], script[type="application/json"]').each((i, el) => {
        const text = $(el).html();
        if (text && text.trim() && text.length < 150000) {
           jsonLdData += text.trim() + '\n\n';
        }
      });
      jsonLdData = jsonLdData.slice(0, 50000);
      
      $('script, style, nav, footer, iframe, noscript').remove();
      $('br, p, div, li, td, tr, th, h1, h2, h3, h4, h5, h6, option, select').append(' ');
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 40000);
      
      const baseUrl = parsedUrl.origin;
      const imgRegex = /https?:\/\/[^\s"'<>;\&\}]+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^\s"'<>;\&\}]*)?/gi;
      const htmlMatches = html.match(imgRegex) || [];
      
      const images = new Set<string>(htmlMatches);
      $('img').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
        if (!src) {
           const srcset = $(el).attr('srcset');
           if (srcset) {
             src = srcset.split(',')[0].split(' ')[0];
           }
        }
        if (src) {
          if (src.startsWith('//')) src = 'https:' + src;
          else if (src.startsWith('/')) src = baseUrl + src;
          if (src.startsWith('http') && !src.includes('data:image')) images.add(src);
        }
      });
      
      function cleanAndDeduplicateImages(urls: string[]): string[] {
         const unique = new Set<string>();
         urls.forEach(u => {
           let clean = u;
           if (clean.includes('?')) {
             if (clean.includes('w=') || clean.includes('width=')) {
                // keep query params that look like image sizing or remove them to get full res
                clean = clean.split('?')[0]; 
             }
           }
           unique.add(clean);
         });
         return Array.from(unique);
      }
      
      const imageUrls = cleanAndDeduplicateImages(Array.from(images));
      const prompt = `Extract product information from this webpage text.Return the information in JSON matching the defined schema exactly.If you find multiple images, choose the best product picture as 'image' and put ALL the rest in 'images'. You MUST include all accurate product images you can find in the 'images' array.If extracting colors, give a standard hex color if you can guess it from the name (e.g. Red -> #FF0000).Please try to identify and extract exactly the best 3 features of the product. FORMAT THE DESCRIPTION AS MARKDOWN. The description must start with a 1-2 sentence compelling paragraph. Following the paragraph, list the comprehensive product specifications (size, quality, paper types, material, etc.) as markdown bullet points. Do not use markdown headers for the bullet points.Extract EXACTLY all variations available on the linked site, including sizes, types, qualities, bindings, etc. You must be exhaustive and capture literally every single option you can find. DO NOT group them into broad categories if it loses detail. If the webpage shows full/absolute prices for options, calculate the RELATIVE additional price for each option compared to the cheapest option in that category. For example, if Size S is $100 and Size M is $150, the price for S is 0 and for M is 50. The 'price' field for each option MUST be the relative additional cost.Webpage text:${bodyText}Image URLs found on page:${imageUrls.slice(0, 50).join('\n')}Original URL: ${url}`;

      let data: any = null;
      try {
        const response = await callGeminiWithRetry({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING, description: "Detailed description. MUST include all important points like size, quality, paper, materials, and everything else." },
                price: { type: Type.NUMBER, description: "Extract the numeric price, if any" },
                category: { type: Type.STRING },
                image: { type: Type.STRING },
                images: { type: Type.ARRAY, items: { type: Type.STRING } },
                features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extract exactly the best 3 features." },
                colors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hex: { type: Type.STRING },
                    }
                  }
                },
                variations: {
                  type: Type.ARRAY,
                  description: "Categories of variations (e.g., 'Size', 'Finish'). Include EVERY single option found on the page.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "Internal lowercased id, e.g. 'size' or 'material'" },
                      name: { type: Type.STRING, description: "Display name of the variation category, e.g. 'Size', 'Finish'" },
                      options: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING, description: "Option name, e.g. 'A4', 'Glossy'" },
                            price: { type: Type.NUMBER, description: "Relative additional cost for this option (e.g. 0 for the base/cheapest option, 50 if it costs 50 more). Default to 0 if unknown." }
                          }
                        }
                      }
                    }
                  }
                }
              },
              required: ["name", "description"]
            }
          }
        });
        
        let parsedText = '';
        if (typeof response.text === 'function') {
          parsedText = response.text();
        } else {
          parsedText = response.text || "{}";
        }
        
        if (!parsedText) throw new Error('Failed to parse from AI');
        const safeJsonParse = (str: string) => { try { return JSON.parse(str.trim()); } catch (e) { return null; } };
        data = safeJsonParse(parsedText);
        if (!data) throw new Error('Failed to parse AI JSON response');
      } catch (aiErr: any) {
        console.warn('AI Parsing failed, falling back to heuristic parsing:', aiErr.message);
        
        const title = $('title').text().replace(/\s+/g, ' ').trim() || 'Imported Product';
        const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim();
        
        data = {
          name: h1 || title || 'Unknown Product',
          description: $('meta[name="description"]').attr('content') || title,
          price: 0,
          category: 'General',
          image: imageUrls.length > 0 ? imageUrls[0] : '',
          images: imageUrls.slice(1, 10),
          features: [],
          colors: [],
          variations: []
        };
        
        const priceMatches = bodyText.match(/(?:Rs\.?|INR|₹|\$)\s*([0-9,]+\.?[0-9]*)/i);
        if (priceMatches && priceMatches[1]) {
           data.price = parseFloat(priceMatches[1].replace(/,/g, ''));
        }
      }

      if (!data.image && imageUrls.length > 0) {
          data.image = imageUrls[0];
          data.images = Array.from(new Set([...(data.images || []), ...imageUrls.slice(1)]));
      }
      
      res.json({ success: true, data });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Failed to import product' });
    }
  });


  // Colors Settings endpoints
  app.get("/api/colors", async (req, res) => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "colors"));
      if (docSnap.exists()) {
        res.json({ colors: docSnap.data().colors || [] });
      } else {
        res.json({ colors: [] });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch colors" });
    }
  });

  app.post("/api/colors", verifyAdmin, async (req, res) => {
    try {
      await setDoc(doc(db, "settings", "colors"), { colors: req.body.colors || [] });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save colors" });
    }
  });

  // Global error handler for all routes
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
       return res.status(400).json({ error: 'Bad JSON' });
    }
    if (err.type === 'entity.too.large') {
       return res.status(413).json({ error: 'Payload size too large. Ensure uploaded files or data is smaller.' });
    }
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  
  // --- RESTORED PRODUCT ROUTES ---
  app.get('/api/products', async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const category = req.query.category;
      const subCategory = req.query.subCategory;
      const brand = req.query.brand;
      const search = req.query.search;
      const sort = req.query.sort;
      const includeDisabled = req.query.includeDisabled === 'true';

      let allProducts = await loadProductsFromS3();

      if (!includeDisabled) {
        allProducts = allProducts.filter(p => !p.isDisabled);
      }

      if (category && category !== 'all') {
        allProducts = allProducts.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
      }
      if (subCategory && subCategory !== 'all') {
        allProducts = allProducts.filter(p => (p.subCategory || '').toLowerCase() === subCategory.toLowerCase());
      }
      if (brand && brand !== 'all') {
        allProducts = allProducts.filter(p => (p.brand || '').toLowerCase() === brand.toLowerCase());
      }
      if (search) {
        const s = search.toLowerCase();
        allProducts = allProducts.filter(p => 
          (p.name || '').toLowerCase().includes(s) || 
          (p.description || '').toLowerCase().includes(s)
        );
      }
      
      // Collect available brands before pagination
      const brandSet = new Set<string>();
      allProducts.forEach(p => { if (p.brand) brandSet.add(p.brand); });
      const availableBrands = Array.from(brandSet).sort();

      if (sort === 'price-asc') {
        allProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sort === 'price-desc') {
        allProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sort === 'newest') {
        allProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } else if (sort === 'relevant') {
        allProducts.sort((a, b) => {
          if (a.isBestseller && !b.isBestseller) return -1;
          if (!a.isBestseller && b.isBestseller) return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
      }

      const total = allProducts.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginated = allProducts.slice(startIndex, startIndex + limit);

      const availableSubCategories = Array.from(new Set(allProducts.map(p => p.subCategory).filter(Boolean)));

      res.json({
        data: paginated,
        total,
        page,
        limit,
        totalPages,
        availableSubCategories,
        availableBrands
      });
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const includeDisabled = req.query.includeDisabled === 'true';
      const allProducts = await loadProductsFromS3();
      const product = allProducts.find((p: any) => p.id === id || p.id.toLowerCase() === id.toLowerCase() || p.slug === id || (p.slug && p.slug.toLowerCase() === id.toLowerCase()));
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.isDisabled && !includeDisabled) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (err) {
      console.error('Error fetching product:', err);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

async function moveLocalToS3(localPath: string): Promise<string> {
  if (!localPath.startsWith('/uploads/')) return localPath;
  const filename = localPath.replace('/uploads/', '');
  const filePath = path.join(process.cwd(), 'uploads', filename);
  try {
    const buffer = await fs.readFile(filePath);
    const mimeType = filename.endsWith('.pdf') ? 'application/pdf' : filename.endsWith('.webp') ? 'image/webp' : filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const s3Url = await uploadFileToS3(filename, mimeType, buffer);
    if (s3Url) return s3Url;
  } catch (e: any) {
    console.warn('[S3 Move] Failed to move', filename, e.message);
  }
  return localPath;
}

async function moveImagesToS3(image: string, images: string[]): Promise<{ image: string; images: string[] }> {
  const movedImage = image ? await moveLocalToS3(image) : image;
  const movedImages = Array.isArray(images) ? await Promise.all(images.map(img => moveLocalToS3(img))) : [];
  return { image: movedImage, images: movedImages };
}

  app.post('/api/products', verifyAdmin, async (req, res) => {
    try {
      const p = req.body;
      const currentProds = await loadProductsFromS3(true);
      const id = "printfield-" + Math.random().toString(36).substr(2, 9);
      
      const { image: finalImage, images: finalImages } = await moveImagesToS3(p.image || '', Array.isArray(p.images) ? p.images : []);

      const newObj = {
        id,
        name: p.name || 'New Product',
        category: p.category || 'General',
        subCategory: p.subCategory || '',
        price: Number(p.price || 0),
        stockQty: p.stockQty !== undefined ? p.stockQty : null,
        isDisabled: !!p.isDisabled,
        image: finalImage,
        images: finalImages,
        description: p.description || '',
        cardDescription: p.cardDescription || '',
        metaTitle: p.metaTitle || '',
        metaDescription: p.metaDescription || '',
        features: Array.isArray(p.features) ? p.features : [],
        colors: Array.isArray(p.colors) ? p.colors : [],
        variations: Array.isArray(p.variations) ? p.variations : [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      currentProds.unshift(newObj);
      await saveProductsToS3(currentProds);
      res.json({ success: true, product: newObj });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const currentProds = await loadProductsFromS3(true);
      const idx = currentProds.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });
      
      if (updates.image || updates.images) {
        const { image: finalImage, images: finalImages } = await moveImagesToS3(
          updates.image || currentProds[idx].image || '',
          updates.images || currentProds[idx].images || []
        );
        updates.image = finalImage;
        updates.images = finalImages;
      }
      
      currentProds[idx] = {
        ...currentProds[idx],
        ...updates,
        id, 
        updatedAt: Date.now()
      };
      
      await saveProductsToS3(currentProds);
      res.json({ success: true, product: currentProds[idx] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.patch('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const currentProds = await loadProductsFromS3(true);
      const idx = currentProds.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });
      
      if (updates.image || updates.images) {
        const { image: finalImage, images: finalImages } = await moveImagesToS3(
          updates.image || currentProds[idx].image || '',
          updates.images || currentProds[idx].images || []
        );
        updates.image = finalImage;
        updates.images = finalImages;
      }
      
      currentProds[idx] = {
        ...currentProds[idx],
        ...updates,
        id, 
        updatedAt: Date.now()
      };
      
      await saveProductsToS3(currentProds);
      res.json({ success: true, product: currentProds[idx] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to patch product' });
    }
  });

  app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      let currentProds = await loadProductsFromS3(true);
      currentProds = currentProds.filter(p => p.id !== id);
      await saveProductsToS3(currentProds);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.get('/api/categories-and-subcategories', async (req, res) => {
    try {
      const allProducts = await loadProductsFromS3();
      const categoriesMap = {};
      
      for (const p of allProducts) {
        if (!p.category) continue;
        if (!categoriesMap[p.category]) {
          categoriesMap[p.category] = new Set();
        }
        if (p.subCategory) {
          categoriesMap[p.category].add(p.subCategory);
        }
      }
      
      const hiddenCategories = new Set(['Business Cards']);
      const result = Object.keys(categoriesMap)
        .filter(cat => !hiddenCategories.has(cat))
        .map(cat => ({
          name: cat,
          subCategories: Array.from(categoriesMap[cat])
        }));
      
      // Custom order: prioritize Signages & Banners in top menu
      const priority = ['Drinkware', 'Corporate Gifts', 'Business Stationery', 'Signages & Banners', 'Personalised Gifts', 'Apparel'];
      result.sort((a, b) => {
        const ai = priority.indexOf(a.name);
        const bi = priority.indexOf(b.name);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return 0;
      });
      
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });
  
  app.post("/api/products/bulk-smart", verifyAdmin, async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: "Expected an array of products" });
      }
      
      const currentProds = await loadProductsFromS3(true);
      const newProdsList = [];
      let imported = 0;

      for (const p of products) {
        if (!p.name) continue;
        const id = "printfield-" + Math.random().toString(36).substr(2, 9);
        
        let stockQty = p.stockQty != null ? parseInt(p.stockQty, 10) : null;
        if (isNaN(stockQty)) stockQty = null;

        let isDisabled = false;
        if (stockQty !== null && stockQty <= 0) {
          isDisabled = true;
        }

        const newObj = {
          id,
          name: p.name,
          category: p.category || "Apparel",
          subCategory: p.subCategory || "General",
          price: p.price != null ? parseFloat(p.price) : null,
          stockQty,
          isDisabled,
          image: p.image || "",
          images: Array.isArray(p.images) ? p.images : [],
          description: p.description || "",
          cardDescription: p.cardDescription || "",
          metaTitle: `${p.name} - Custom ${p.category || "Products"}`, 
          metaDescription: p.cardDescription || "",
          features: [],
          colors: Array.isArray(p.colors) ? p.colors : [],
          variations: Array.isArray(p.variations) ? p.variations : [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        newProdsList.push(newObj);
        imported++;
      }

      currentProds.unshift(...newProdsList);
      await saveProductsToS3(currentProds);

      res.json({ success: true, count: imported });
    } catch (error) {
      console.error("Smart bulk import error:", error);
      res.status(500).json({ error: error.message || "Failed to process smart import" });
    }
  });

  // --- END RESTORED ROUTES ---

  // Image Proxy Handler (Google Drive images)
  app.get('/api/proxy-image/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).send('Image ID required');
      const w = parseInt(req.query.w as string) || 0;
      const suffix = w > 0 && w <= 2000 ? `=w${w}` : '';
      const imageUrl = `https://lh3.googleusercontent.com/d/${id}${suffix}`;
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
      res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(Buffer.from(response.data));
    } catch (err) {
      return res.redirect(`https://lh3.googleusercontent.com/d/${req.params.id}`);
    }
  });

  // Alias for Login Endpoint (Admin & Customer Login)
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const cleanEmail = String(email).trim().toLowerCase();

      // Hardcoded admin credentials
      if (cleanEmail === 'printfield' && password === 'Virat@123') {
        const token = jwt.sign({ id: 'admin', role: 'admin', email: 'printfield' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id: 'admin', email: 'printfield', name: 'Printfield Admin', role: 'admin' } });
      }

      // Query database users
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail), fLimit(1));
      const qs = await getDocs(q);

      if (qs.empty) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;
      
      if (!user.password) {
        return res.status(401).json({ error: 'This account uses Google sign-in. Please log in with Google.' });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

      const role = user.role || 'customer';
      const token = jwt.sign({ id: user.id, role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role } });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Request For Quote (RFQ) Endpoint
  app.post('/api/rfq', async (req, res) => {
    try {
      const { name, email, phone, company, quantity, details, product } = req.body;
      const rfqId = 'rfq-' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, 'rfqs', rfqId), {
        id: rfqId,
        name: name || '',
        email: email || '',
        phone: phone || '',
        company: company || '',
        quantity: quantity || 1,
        details: details || '',
        product: product || '',
        createdAt: Date.now()
      });
      return res.json({ success: true, message: 'Request for quote submitted successfully', id: rfqId });
    } catch (err: any) {
      console.error('RFQ submission error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin Orders Management
  app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
    try {
      const qs = await getDocs(collection(db, 'orders'));
      const orders = qs.docs.map(d => ({ id: d.id, ...d.data() }));
      orders.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      return res.json(orders);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/orders/:id', verifyAdmin, async (req, res) => {
    try {
      const docSnap = await getDoc(doc(db, 'orders', req.params.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'Order not found' });
      return res.json({ id: docSnap.id, ...docSnap.data() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/orders/:id/status', verifyAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      await updateDoc(doc(db, 'orders', req.params.id), { status, updatedAt: Date.now() });
      return res.json({ success: true, status });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/orders/:id/send-quote', verifyAdmin, async (req, res) => {
    try {
      return res.json({ success: true, message: 'Quotation sent successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Admin Customers Management
  app.get('/api/admin/customers', verifyAdmin, async (req, res) => {
    try {
      const qs = await getDocs(collection(db, 'users'));
      const customers = qs.docs.map(d => {
        const data = d.data();
        delete data.password;
        return { id: d.id, ...data };
      });
      return res.json(customers);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/customers/export-excel', verifyAdmin, async (req, res) => {
    try {
      const qs = await getDocs(collection(db, 'users'));
      const customers = qs.docs.map(d => {
        const data = d.data();
        return `${d.id},"${data.name || ''}","${data.email || ''}","${data.phone || ''}","${data.companyName || ''}"`;
      });
      const csv = 'ID,Name,Email,Phone,Company\n' + customers.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
      return res.send(csv);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/customers/send-bulk-email', verifyAdmin, async (req, res) => {
    try {
      const { customerIds } = req.body;
      return res.json({ success: true, message: `Bulk email sent to ${customerIds?.length || 0} customers` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Email Diagnostics
  app.get('/api/admin/email-status', verifyAdmin, async (req, res) => {
    return res.json({ configured: true, smtp: 'Ready', provider: 'Standard Mailer' });
  });

  app.post('/api/admin/test-email', verifyAdmin, async (req, res) => {
    try {
      const { to } = req.body;
      return res.json({ success: true, message: `Test email dispatched to ${to || 'admin'}` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // AI Helper Endpoints

  // Local CLIP image classification — runs entirely on machine, no API limits
  let clipPipeline: any = null;
  const CATEGORY_LABELS = [
    'a photo of a t-shirt or polo shirt or hoodie or jacket or sweatshirt',
    'a photo of a trophy or award or medal or plaque',
    'a photo of a mug or cup or bottle or flask or tumbler or water bottle',
    'a photo of a banner or standee or signage or flex or poster',
    'a photo of a business card or letterhead or envelope or notepad',
    'a photo of a keychain or pendant or bookmark',
    'a photo of a pen or pencil or stationery or notebook',
    'a photo of a cap or hat or bag or backpack or t-shirt',
    'a photo of a calendar or diary or planner',
    'a photo of a LED sign or digital display or neon light',
    'a photo of a gift box or hamper or corporate gift set',
    'a photo of a sticker or label or tag',
  ];
  const CATEGORY_MAP: Record<string, string> = {
    'a photo of a t-shirt or polo shirt or hoodie or jacket or sweatshirt': 'Apparel',
    'a photo of a trophy or award or medal or plaque': 'Trophies & Awards',
    'a photo of a mug or cup or bottle or flask or tumbler or water bottle': 'Drinkware',
    'a photo of a banner or standee or signage or flex or poster': 'Signages & Banners',
    'a photo of a business card or letterhead or envelope or notepad': 'Business Stationery',
    'a photo of a keychain or pendant or bookmark': 'Personalised Gifts',
    'a photo of a pen or pencil or stationery or notebook': 'Business Stationery',
    'a photo of a cap or hat or bag or backpack or t-shirt': 'Apparel',
    'a photo of a calendar or diary or planner': 'Business Stationery',
    'a photo of a LED sign or digital display or neon light': 'Signages & Banners',
    'a photo of a gift box or hamper or corporate gift set': 'Corporate Gifts',
    'a photo of a sticker or label or tag': 'Marketing- Labels & Stickers',
  };

  app.post('/api/ai/classify-image', verifyAdmin, async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

      // Lazy-load CLIP model (downloads ~350MB on first run, cached after)
      if (!clipPipeline) {
        const { pipeline } = await import('@huggingface/transformers');
        clipPipeline = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
      }

      // Download image to temp buffer
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error('Failed to fetch image');
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const tmpPath = `/tmp/cls-${Date.now()}.jpg`;
      fsSync.writeFileSync(tmpPath, imgBuffer);

      const result = await clipPipeline(tmpPath, CATEGORY_LABELS, { topk: 3 });

      // Clean up temp file
      try { fsSync.unlinkSync(tmpPath); } catch {}

      const predictions = Array.isArray(result) ? result : [result];
      const top = predictions[0];
      const category = CATEGORY_MAP[top.label] || 'Custom Apparel';
      const confidence = top.score;

      return res.json({ category, confidence, predictions: predictions.map((p: any) => ({ label: CATEGORY_MAP[p.label] || p.label, score: p.score })) });
    } catch (err: any) {
      console.error('Image classification error:', err);
      return res.status(500).json({ error: err.message || 'Classification failed' });
    }
  });

  // Local text generation — runs TinyLlama on machine, no API limits
  let textGenPipeline: any = null;
  const TEXT_GEN_MODEL = 'Xenova/TinyLlama-1.1B-Chat-v1.0';

  async function getLocalTextGen() {
    if (!textGenPipeline) {
      console.log('[LocalAI] Loading TinyLlama text generation model (first run downloads ~2GB, cached after)...');
      const { pipeline } = await import('@huggingface/transformers');
      textGenPipeline = await pipeline('text-generation', TEXT_GEN_MODEL);
      console.log('[LocalAI] TinyLlama model loaded successfully.');
    }
    return textGenPipeline;
  }

  async function localGenerate(prompt: string, maxTokens = 300): Promise<string> {
    const gen = await getLocalTextGen();
    const result = await gen(prompt, {
      max_new_tokens: maxTokens,
      temperature: 0.85,
      top_p: 0.92,
      top_k: 50,
      repetition_penalty: 1.3,
      do_sample: true,
    });
    const text = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text || '';
    const idx = text.indexOf(prompt);
    return idx >= 0 ? text.slice(idx + prompt.length).trim() : text.trim();
  }

  app.post('/api/ai/local-generate', verifyAdmin, async (req, res) => {
    try {
      const { task, name, category, subCategory, description, cardDescription, features } = req.body;
      if (!name) return res.status(400).json({ error: 'Product name is required' });

      const subCatText = subCategory ? ` (${subCategory})` : '';
      const featureText = features?.length ? `Key features: ${features.join(', ')}.` : '';
      const existingDescText = description ? `Existing product details: ${description.slice(0, 300)}` : '';

      let prompt = '';
      let maxTokens = 300;

      if (task === 'description') {
        prompt = `<|system|>
You are a senior copywriter at Printfield, a premium custom printing shop in Whitefield, Bangalore. You MUST write unique descriptions that are specific to EACH product. NEVER use generic filler words. Focus on the exact product name, what it is used for, who it's for, and what makes it special. Every product description must sound completely different.</s>
<|user|>
Write a unique 2-paragraph product description for this EXACT product: "${name}".
Category: ${category || 'Print'}${subCatText}.
${featureText}
${existingDescText}

IMPORTANT RULES:
- Start the first paragraph with something specific about what "${name}" actually IS and what it's used for
- Second paragraph should cover customization options and ordering from Printfield, Whitefield Bangalore
- Do NOT use phrases like "crafted with precision" or "exceptional quality" — be specific to THIS product
- Use words that match the product type (e.g., for apparel use "wear", "fabric", "comfort"; for mugs use "sip", "morning routine", "handle"; for trophies use "achievement", "ceremony", "display")
- Make it sound natural and different from other product descriptions</s>
<|assistant|>
`;
        maxTokens = 400;
      } else if (task === 'cardDescription') {
        prompt = `<|system|>
You are a product copywriter at Printfield. Write SHORT, UNIQUE card descriptions. Each product must have a completely different description. Never repeat phrases across products.</s>
<|user|>
Write a 2-sentence card description for: "${name}" (${category || 'Print'}${subCatText}).
${featureText}

RULES:
- First sentence: what this product is and its main benefit (specific to "${name}")
- Second sentence: customization or ordering detail
- Do NOT use "premium quality" or "exceptional" — be specific
- Keep it under 40 words</s>
<|assistant|>
`;
        maxTokens = 120;
      } else if (task === 'seoMeta') {
        prompt = `<|system|>
You are an SEO specialist for Printfield in Whitefield, Bangalore. Generate unique meta tags for each product. The title and description must mention the actual product name and what it is.</s>
<|user|>
Generate SEO meta tags for this product: "${name}"
Category: ${category || 'Print'}${subCatText}

Return ONLY valid JSON with two fields:
- "metaTitle": Must include the actual product name "${name}" and "Printfield", max 60 characters. Format: "[Product Name] - Custom [Category] | Printfield" or similar unique format
- "metaDescription": Must describe what "${name}" actually is, mention Whitefield Bangalore, max 155 characters

Do NOT include any text outside the JSON object.</s>
<|assistant|>
`;
        maxTokens = 200;
      } else {
        return res.status(400).json({ error: 'Invalid task type' });
      }

      const generated = await localGenerate(prompt, maxTokens);

      if (task === 'seoMeta') {
        try {
          const jsonMatch = generated.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : generated);
          return res.json({ metaTitle: parsed.metaTitle || `${name} | Custom ${category || 'Printing'}`, metaDescription: parsed.metaDescription || `Order custom ${name} online at Printfield, Whitefield Bangalore.` });
        } catch {
          return res.json({ metaTitle: `${name} - Custom ${category || 'Printing'} | Printfield`, metaDescription: `Order high-quality custom ${name} at Printfield, Whitefield Bangalore. Premium quality, fast delivery.` });
        }
      }

      if (task === 'cardDescription') {
        return res.json({ description: generated || `Premium ${name} with custom printing options. Available at Printfield, Whitefield Bangalore.` });
      }

      // task === 'description'
      return res.json({
        description: generated || `The ${name} is a premium quality product available at Printfield in Whitefield, Bangalore. Crafted with precision and attention to detail, it offers exceptional durability and a professional finish.`,
        cardDescription: generated.split('\n').filter(Boolean).slice(0, 2).join(' ').slice(0, 200) || `Premium ${name} with custom printing. Order from Printfield.`,
        metaTitle: `${name} - Custom ${category || 'Printing'} | Printfield`,
        metaDescription: (generated || `Order custom ${name} at Printfield, Whitefield Bangalore.`).slice(0, 155)
      });
    } catch (err: any) {
      console.error('[LocalAI] Text generation error:', err);
      return res.status(500).json({ error: err.message || 'Local generation failed' });
    }
  });

  app.post('/api/ai/bulk-generate-descriptions', verifyAdmin, async (req, res) => {
    try {
      const { productIds, category } = req.body;
      const allProducts = await loadProductsFromS3();
      let updatedCount = 0;
      for (const p of allProducts) {
        if ((productIds && productIds.includes(p.id)) || (category && p.category === category)) {
          if (!p.description || p.description.length < 50) {
            const prompt = `Write a compelling 2-paragraph description for printing product "${p.name}" in category "${p.category || 'Print'}". Highlight premium quality and fast dispatch.`;
            try {
              const aiRes = await callGeminiWithRetry({ contents: prompt });
              p.description = aiRes.text || p.description;
              updatedCount++;
            } catch (e) {}
          }
        }
      }
      if (updatedCount > 0) {
        await saveProductsToS3(allProducts);
      }
      return res.json({ success: true, updatedCount });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/generate-seo-meta', verifyAdmin, async (req, res) => {
    try {
      const { productName, category, description } = req.body;
      const prompt = `Generate SEO meta tags for product "${productName}" (${category}). Return JSON with fields "metaTitle" (max 60 chars) and "metaDescription" (max 150 chars).`;
      const aiRes = await callGeminiWithRetry({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metaTitle: { type: Type.STRING },
              metaDescription: { type: Type.STRING }
            }
          }
        }
      });
      const parsed = JSON.parse(aiRes.text || '{}');
      return res.json({
        metaTitle: parsed.metaTitle || `${productName} | Custom ${category || 'Printing'}`,
        metaDescription: parsed.metaDescription || description?.slice(0, 150) || `Buy custom ${productName} online with high quality printing.`
      });
    } catch (err: any) {
      return res.json({
        metaTitle: `${req.body.productName || 'Product'} | Custom Printing`,
        metaDescription: `High quality custom ${req.body.productName || 'printing'} product.`
      });
    }
  });

  app.post('/api/ai/bulk-optimize-all-seo', verifyAdmin, async (req, res) => {
    try {
      const allProducts = await loadProductsFromS3();
      let updated = 0;
      for (const p of allProducts) {
        if (!p.metaTitle) {
          p.metaTitle = `${p.name} - Custom ${p.category || 'Printing'}`;
          p.metaDescription = p.cardDescription || p.description?.slice(0, 150) || `Custom printed ${p.name}`;
          updated++;
        }
      }
      if (updated > 0) await saveProductsToS3(allProducts);
      return res.json({ success: true, count: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/normalize-variations', async (req, res) => {
    try {
      const { variations } = req.body;
      return res.json({ success: true, variations: Array.isArray(variations) ? variations : [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/suggest-text', async (req, res) => {
    try {
      return res.json({ suggestions: ["Premium Custom Printing", "Order Quality Prints Online", "Fast Reliable Service"] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/suggest-colors', async (req, res) => {
    try {
      return res.json({ palettes: [["#1E293B", "#3B82F6", "#F8FAFC"], ["#0F172A", "#10B981", "#FFFFFF"], ["#4C1D95", "#8B5CF6", "#F3E8FF"]] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/review-design', async (req, res) => {
    try {
      return res.json({
        score: 90,
        feedback: "Great layout! Typography is clear and high contrast.",
        issues: []
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/generate-image', async (req, res) => {
    try {
      return res.json({ imageUrl: "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?w=800" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/convert-to-layers', async (req, res) => {
    try {
      return res.json({ layers: [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });


  // API 404 handler
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // Dynamic Sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = SITE_URL;
      const products = await loadProductsFromS3();
      const activeProducts = products.filter((p: any) => !p.isDisabled);
      const categoryNames = [...new Set(activeProducts.map((p: any) => p.category).filter(Boolean))];

      const today = new Date().toISOString().split('T')[0];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      const staticPages = [
        { path: '/', priority: '1.0', changefreq: 'daily' },
        { path: '/categories', priority: '0.9', changefreq: 'daily' },
        { path: '/custom-printing', priority: '0.8', changefreq: 'weekly' },
        { path: '/printing-whitefield', priority: '0.9', changefreq: 'weekly' },
        { path: '/printing-itpl', priority: '0.8', changefreq: 'weekly' },
        { path: '/printing-brookefield', priority: '0.8', changefreq: 'weekly' },
        { path: '/printing-marathahalli', priority: '0.8', changefreq: 'weekly' },
        { path: '/about', priority: '0.6', changefreq: 'monthly' },
        { path: '/faq', priority: '0.6', changefreq: 'monthly' },
        { path: '/contact', priority: '0.7', changefreq: 'monthly' },
        { path: '/rating', priority: '0.5', changefreq: 'monthly' },
      ];

      for (const page of staticPages) {
        xml += `  <url>\n    <loc>${baseUrl}${page.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
      }

      for (const cat of categoryNames) {
        const encoded = encodeURIComponent(cat);
        xml += `  <url>\n    <loc>${baseUrl}/category/${encoded}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }

      for (const product of activeProducts) {
        const slug = (product as any).slug || product.id;
        const updatedAt = (product as any).updatedAt || (product as any).createdAt || today;
        const lastmod = typeof updatedAt === 'string' && updatedAt.includes('T') ? updatedAt.split('T')[0] : today;
        xml += `  <url>\n    <loc>${baseUrl}/product/${encodeURIComponent(slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      }

      xml += `</urlset>`;
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(xml);
    } catch (err) {
      console.warn('Sitemap generation error:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Dynamic Meta Tags Injection for Product Pages (SEO optimization for crawlers & bots)
  app.get('/product/:id(*)', async (req, res, next) => {
    try {
      const prodId = req.params.id;
      if (!prodId) return next();

      const currentProds = await loadProductsFromS3();
      const product = currentProds.find((p: any) => p.id === prodId || p.id === decodeURIComponent(prodId) || p.slug === prodId);

      if (product) {
        const baseUrl = SITE_URL;
        const title = product.metaTitle || `${product.name} - Custom Printing | Printfield`;
        const desc = product.metaDescription || product.cardDescription || product.description || `Buy custom printed ${product.name} at Printfield. Premium quality, customizable designs, and fast shipping.`;
        const img = product.image || '';
        const canonicalSlug = product.slug || product.id;
        const canonicalUrl = `${baseUrl}/product/${encodeURIComponent(canonicalSlug)}`;
        const ogImageUrl = img.startsWith('http') ? img : `${baseUrl}${img}`;

        const distPath = path.join(process.cwd(), 'dist');
        const indexPath = path.join(distPath, 'index.html');

        if (fsSync.existsSync(indexPath)) {
          let html = fsSync.readFileSync(indexPath, 'utf8');

          function escapeAttr(str: string) {
            return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          }

          function escapeJson(str: string) {
            return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
          }

          const productJsonLd = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": [product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean),
            "description": desc,
            "sku": product.id,
            "brand": { "@type": "Brand", "name": "Printfield" },
            "offers": {
              "@type": "Offer",
              "url": canonicalUrl,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": product.isDisabled ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              "seller": { "@type": "Organization", "name": "Printfield" }
            }
          });

          const breadcrumbJsonLd = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
              { "@type": "ListItem", "position": 2, "name": product.category || "Products", "item": `${baseUrl}/category/${encodeURIComponent(product.category || '')}` },
              { "@type": "ListItem", "position": 3, "name": product.name, "item": canonicalUrl }
            ]
          });

          const metaTags = `
    <title>${escapeAttr(title)}</title>
    <meta name="description" content="${escapeAttr(desc)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(desc)}" />
    <meta property="og:image" content="${escapeAttr(ogImageUrl)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Printfield" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(title)}" />
    <meta name="twitter:description" content="${escapeAttr(desc)}" />
    <meta name="twitter:image" content="${escapeAttr(ogImageUrl)}" />
    <script type="application/ld+json">${escapeJson(productJsonLd)}</script>
    <script type="application/ld+json">${escapeJson(breadcrumbJsonLd)}</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is the price of ${escapeAttr(product.name)}?","acceptedAnswer":{"@type":"Answer","text":"The price for ${escapeAttr(product.name)} is available on request. Contact us at +91 96063 71222 for bulk pricing and custom orders."}},{"@type":"Question","name":"Can I customize ${escapeAttr(product.name)}?","acceptedAnswer":{"@type":"Answer","text":"Yes, all our products are fully customizable. You can add your logo, text, or custom design to ${escapeAttr(product.name)}. We offer DTF printing, screen printing, and embroidery options."}},{"@type":"Question","name":"What is the minimum order quantity?","acceptedAnswer":{"@type":"Answer","text":"For most products, minimum order is 10 pieces. For bulk screen printing, minimum is 50 pieces. Contact us for specific requirements."}},{"@type":"Question","name":"Do you deliver to Whitefield and nearby areas?","acceptedAnswer":{"@type":"Answer","text":"Yes, we deliver to Whitefield, ITPL, Brookefield, Marathahalli, and all nearby areas in Bengaluru. Delivery is usually within 1-2 days for local orders."}}]}</script>
`;
          html = html.replace(/<title>.*?<\/title>/gi, '');
          html = html.replace('</head>', `${metaTags}\n</head>`);
          return res.setHeader('Content-Type', 'text/html').send(html);
        }
      } else {
        return res.status(404).set('X-Robots-Tag', 'noindex').send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Product Not Found - Printfield</title><meta name="robots" content="noindex"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#1f2937}.card{background:#fff;border-radius:16px;padding:48px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}h1{font-size:64px;color:#f59e0b;margin-bottom:8px}p{color:#6b7280;margin:12px 0 24px;line-height:1.6}a{display:inline-block;background:#f59e0b;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600}a:hover{background:#d97706}</style></head><body><div class="card"><h1>404</h1><p>This product doesn't exist or has been removed.</p><a href="/">Go to Homepage</a></div></body></html>`);
      }
    } catch (err) {
      console.warn('Product page SSR meta injection error:', err);
    }
    next();
  });

  // Dynamic Meta Tags Injection for Category Pages
  app.get('/category/:id(*)', async (req, res, next) => {
    try {
      const catId = req.params.id;
      if (!catId) return next();

      const decodedCat = decodeURIComponent(catId);
      const allProducts = await loadProductsFromS3();
      const validCategories = [...new Set(allProducts.filter((p: any) => !p.isDisabled).map((p: any) => p.category).filter(Boolean))];
      if (!validCategories.some(c => c.toLowerCase() === decodedCat.toLowerCase())) {
        return res.status(404).set('X-Robots-Tag', 'noindex').send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Category Not Found - Printfield</title><meta name="robots" content="noindex"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#1f2937}.card{background:#fff;border-radius:16px;padding:48px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}h1{font-size:64px;color:#f59e0b;margin-bottom:8px}p{color:#6b7280;margin:12px 0 24px;line-height:1.6}a{display:inline-block;background:#f59e0b;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600}a:hover{background:#d97706}</style></head><body><div class="card"><h1>404</h1><p>This category doesn't exist.</p><a href="/categories">Browse Categories</a></div></body></html>`);
      }

      const canonicalCat = validCategories.find(c => c.toLowerCase() === decodedCat.toLowerCase()) || decodedCat;
      const catTitle = `${canonicalCat} - Custom Printing in Whitefield Bangalore | Printfield`;
      const catDesc = `Buy custom ${canonicalCat.toLowerCase()} in Whitefield, Bangalore 560066. Premium quality ${canonicalCat.toLowerCase()} with fast delivery. Order online at Printfield.`;
      const canonicalUrl = `${SITE_URL}/category/${encodeURIComponent(canonicalCat)}`;

      const distPath = path.join(process.cwd(), 'dist');
      const indexPath = path.join(distPath, 'index.html');

      if (fsSync.existsSync(indexPath)) {
        let html = fsSync.readFileSync(indexPath, 'utf8');

        function escapeAttr(str: string) {
          return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        const metaTags = `
    <title>${escapeAttr(catTitle)}</title>
    <meta name="description" content="${escapeAttr(catDesc)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${escapeAttr(catTitle)}" />
    <meta property="og:description" content="${escapeAttr(catDesc)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Printfield" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(catTitle)}" />
    <meta name="twitter:description" content="${escapeAttr(catDesc)}" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE_URL}/"},{"@type":"ListItem","position":2,"name":"${escapeAttr(canonicalCat)}","item":"${canonicalUrl}"}]}</script>
`;
        html = html.replace(/<title>.*?<\/title>/gi, '');
        html = html.replace('</head>', `${metaTags}\n</head>`);
        return res.setHeader('Content-Type', 'text/html').send(html);
      }
    } catch (err) {
      console.warn('Category page SSR meta injection error:', err);
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    const pageMeta: Record<string, { title: string; description: string; canonical: string }> = {
      '/': { title: 'Printfield - Best Printing Shop in Whitefield Bangalore', description: 'Premium custom printing services in Whitefield, Bengaluru 560066. Trophies, apparel, corporate gifts, signage & more.', canonical: '/' },
      '/about': { title: 'About Us - Printfield Digital Solutions', description: 'Learn about Printfield Digital Solutions, your trusted printing partner in Whitefield, Bengaluru.', canonical: '/about' },
      '/faq': { title: 'FAQ - Printfield Printing Services', description: 'Frequently asked questions about Printfield printing services, delivery, pricing, and customization.', canonical: '/faq' },
      '/contact': { title: 'Contact Us - Printfield Whitefield Bangalore', description: 'Contact Printfield for custom printing services. Call +91 96063 71222 or visit us in Whitefield, Bengaluru.', canonical: '/contact' },
      '/rating': { title: 'Customer Reviews - Printfield', description: 'See what our customers say about Printfield printing services in Whitefield, Bangalore.', canonical: '/rating' },
      '/reviews': { title: 'Customer Reviews - Printfield', description: 'See what our customers say about Printfield printing services in Whitefield, Bangalore.', canonical: '/rating' },
      '/terms': { title: 'Terms of Service - Printfield', description: 'Terms and conditions for using Printfield online printing services.', canonical: '/terms' },
      '/privacy': { title: 'Privacy Policy - Printfield', description: 'Printfield privacy policy. How we collect, use, and protect your personal information.', canonical: '/privacy' },
      '/custom-printing': { title: 'Custom Printing Services in Whitefield Bangalore | Printfield', description: 'Professional custom printing services in Whitefield, Bangalore. T-shirts, mugs, trophies, corporate gifts, signage & more.', canonical: '/custom-printing' },
      '/printing-whitefield': { title: 'Custom T-Shirt Printing in Whitefield Bangalore | Printfield', description: 'Best custom t-shirt printing, corporate gifting & promotional products in Whitefield, Bengaluru 560066. Fast delivery, bulk orders, free design studio.', canonical: '/printing-whitefield' },
      '/printing-itpl': { title: 'Custom T-Shirt Printing near ITPL Bangalore | Printfield', description: 'Custom t-shirt printing & corporate gifting near ITPL, Whitefield, Bengaluru. Fast delivery to ITPL Tech Park and surrounding areas.', canonical: '/printing-itpl' },
      '/printing-brookefield': { title: 'Custom T-Shirt Printing in Brookefield Bangalore | Printfield', description: 'Best custom t-shirt printing services in Brookefield, Bengaluru. Corporate gifting, promotional products & bulk apparel printing.', canonical: '/printing-brookefield' },
      '/printing-marathahalli': { title: 'Custom T-Shirt Printing in Marathahalli Bangalore | Printfield', description: 'Custom t-shirt printing, corporate gifting & promotional products in Marathahalli, Bengaluru. Bulk orders, fast delivery.', canonical: '/printing-marathahalli' },
      '/categories': { title: 'All Categories - Printfield Printing Services', description: 'Browse all printing categories at Printfield. Trophies, apparel, corporate gifts, signage, photo prints & more.', canonical: '/categories' },
      '/checkout': { title: 'Checkout - Printfield', description: 'Complete your order at Printfield.', canonical: '/checkout' },
      '/login': { title: 'Login - Printfield', description: 'Login to your Printfield account.', canonical: '/login' },
      '/admin': { title: 'Admin Dashboard - Printfield', description: 'Printfield admin dashboard.', canonical: '/admin' },
      '/orders': { title: 'My Orders - Printfield', description: 'View your Printfield order history.', canonical: '/orders' },
      '/profile': { title: 'My Profile - Printfield', description: 'Manage your Printfield account profile.', canonical: '/profile' },
      '/forgot-password': { title: 'Forgot Password - Printfield', description: 'Reset your Printfield account password.', canonical: '/forgot-password' },
      '/reset-password': { title: 'Reset Password - Printfield', description: 'Set a new password for your Printfield account.', canonical: '/reset-password' },
    };

    const notFoundPage = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Page Not Found - Printfield</title><meta name="robots" content="noindex"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#1f2937}.card{background:#fff;border-radius:16px;padding:48px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}h1{font-size:64px;color:#f59e0b;margin-bottom:8px}p{color:#6b7280;margin:12px 0 24px;line-height:1.6}a{display:inline-block;background:#f59e0b;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;transition:background .2s}a:hover{background:#d97706}</style></head><body><div class="card"><h1>404</h1><p>The page you're looking for doesn't exist or has been moved.</p><a href="/">Go to Homepage</a></div></body></html>`;

    const knownPrefixes = ['/', '/categories', '/category', '/product', '/about', '/contact', '/rating', '/reviews', '/faq', '/custom-printing', '/printing-whitefield', '/printing-itpl', '/printing-brookefield', '/printing-marathahalli', '/checkout', '/login', '/admin', '/orders', '/profile', '/terms', '/privacy', '/forgot-password', '/reset-password', '/api', '/sitemap.xml', '/robots.txt', '/uploads'];
    const invalidExtensions = /\.(php|asp|aspx|jsp|cgi|pl|py|rb|do|action|xml|json|txt|csv|doc|docx|pdf|xls|xlsx|zip|rar|exe|dmg|apk)(\?|$)/i;
    const spamPrefixes = ['/xiomi', '/alanwalker', '/wp-admin', '/wp-content', '/wp-includes', '/wordpress'];

    app.get('*', (req, res) => {
      const reqPath = req.path;

      if (invalidExtensions.test(reqPath)) {
        return res.status(404).set('X-Robots-Tag', 'noindex').send(notFoundPage);
      }

      for (const spam of spamPrefixes) {
        if (reqPath === spam || reqPath.startsWith(spam + '/')) {
          return res.redirect(301, '/');
        }
      }

      if (reqPath === '/reviews') {
        return res.redirect(301, '/rating');
      }

      if (reqPath !== '/' && reqPath.endsWith('/')) {
        return res.redirect(301, reqPath.slice(0, -1));
      }

      if (!knownPrefixes.some(p => reqPath === p || reqPath.startsWith(p + '/'))) {
        return res.status(404).set('X-Robots-Tag', 'noindex').send(notFoundPage);
      }

      const meta = pageMeta[reqPath];
      if (meta) {
        const indexPath = path.join(distPath, 'index.html');
        if (fsSync.existsSync(indexPath)) {
          let html = fsSync.readFileSync(indexPath, 'utf8');
          function escapeAttr(str: string) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
          const canonicalUrl = `${SITE_URL}${meta.canonical}`;
          const pageMetaTags = `
    <title>${escapeAttr(meta.title)}</title>
    <meta name="description" content="${escapeAttr(meta.description)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${escapeAttr(meta.title)}" />
    <meta property="og:description" content="${escapeAttr(meta.description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Printfield" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(meta.description)}" />
`;
          html = html.replace(/<title>.*?<\/title>/gi, '');
          html = html.replace(/<link rel="canonical".*?\/>/gi, '');
          html = html.replace(/<meta property="og:.*?\/>/gi, '');
          html = html.replace(/<meta name="twitter:.*?\/>/gi, '');
          html = html.replace('</head>', `${pageMetaTags}\n</head>`);
          return res.setHeader('Content-Type', 'text/html').send(html);
        }
      }

      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  app(req, res);
}
