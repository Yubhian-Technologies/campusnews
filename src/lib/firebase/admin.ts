/**
 * Firebase Admin SDK initialization (server ONLY).
 *
 * The service-account key never reaches the browser (spec §11). This module is
 * imported only from route handlers, server components, middleware helpers, and
 * scripts. `import "server-only"` makes an accidental client import a build error.
 */
import "server-only";

import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  type App,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

/**
 * Load the service account from either:
 *   - FIREBASE_SERVICE_ACCOUNT_B64  (base64 of the JSON), or
 *   - FIREBASE_SERVICE_ACCOUNT_PATH (path to the JSON file, resolved from cwd).
 * The B64 form is preferred for hosted deploys; the path form is convenient
 * for local development.
 */
function loadServiceAccount(): ServiceAccount {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    return JSON.parse(
      Buffer.from(b64, "base64").toString("utf8"),
    ) as ServiceAccount;
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath) {
    const resolved = isAbsolute(filePath)
      ? filePath
      : join(process.cwd(), filePath);
    return JSON.parse(readFileSync(resolved, "utf8")) as ServiceAccount;
  }

  throw new Error(
    "Set FIREBASE_SERVICE_ACCOUNT_B64 or FIREBASE_SERVICE_ACCOUNT_PATH. See .env.local.example.",
  );
}

let cachedApp: App | null = null;

/**
 * Create the default Firebase app, tolerating a concurrent initializer.
 * Serverless platforms (Vercel) can dispatch a burst of parallel requests
 * (e.g. Next.js RSC prefetch firing /api/me + several other routes at once)
 * into the same cold instance; two of them can both pass the `getApps()`
 * check above before either finishes, and the second `initializeApp()` call
 * throws "the default Firebase app already exists" — reuse the winner's app
 * instead of surfacing that as a 500.
 */
function initializeAdminApp(options: Parameters<typeof initializeApp>[0]): App {
  try {
    return initializeApp(options);
  } catch (error) {
    if (getApps().length) return getApps()[0];
    throw error;
  }
}

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0];
    return cachedApp;
  }

  // When running against emulators the SDK reads FIRESTORE_EMULATOR_HOST /
  // FIREBASE_AUTH_EMULATOR_HOST from the environment automatically; a project
  // id is still required.
  const useEmulator =
    !!process.env.FIRESTORE_EMULATOR_HOST ||
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

  const hasCreds =
    !!process.env.FIREBASE_SERVICE_ACCOUNT_B64 ||
    !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (useEmulator && !hasCreds) {
    cachedApp = initializeAdminApp({
      projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "campusnews-dev",
    });
    return cachedApp;
  }

  const sa = loadServiceAccount();
  cachedApp = initializeAdminApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key.replace(/\\n/g, "\n"),
    }),
  });
  return cachedApp;
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

let cachedDb: Firestore | null = null;

export function adminDb(): Firestore {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getAdminApp());
  // Partial updates pass undefined for absent fields; ignore them instead of
  // throwing. settings() may only be called once per underlying Firestore
  // instance — but getFirestore() returns the SDK's own cross-module
  // singleton, while `cachedDb` is scoped to whichever module graph this file
  // was loaded into (Next.js can bundle admin.ts separately per route, in dev
  // and in per-route production bundles alike). So a route hit for the first
  // time can have a fresh `cachedDb` while the underlying Firestore object was
  // already configured by an earlier request through a different route —
  // settings() then throws even though the config is already in effect.
  try {
    cachedDb.settings({ ignoreUndefinedProperties: true });
  } catch (error) {
    const already =
      error instanceof Error && error.message.includes("already been initialized");
    if (!already) throw error;
  }
  return cachedDb;
}
