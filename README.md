# CampusNews

Multi-tenant campus news platform. **Version 1** ships the authentication and
user-management layer: Firebase Authentication (Email + Password only) as the
identity source of truth, Firestore `/users/{uid}` profiles for role/scope/status,
layered authorization, a polished login experience, and a Society Admin console.

## Stack

- **Next.js (App Router) + TypeScript** — server components + route handlers
- **Tailwind CSS + shadcn/ui**
- **Firebase Authentication** (Email/Password) + **Firestore** + **Admin SDK**
- Session-cookie auth model (httpOnly, server-verified — no tokens in localStorage)

## Architecture

```
Client sign-in (Firebase client SDK)
  → POST /api/auth/session  (Admin SDK mints httpOnly session cookie; status gate)
  → middleware.ts checks cookie presence on /(protected)/*
  → protected layouts verify cookie + role + scope server-side (requireRole)
```

Authentication answers *"who are you?"*; authorization answers *"what may you
do?"*. Both are enforced independently — frontend guards are UX only; the
authoritative layers are **Firestore security rules** and **Admin SDK route
handlers**.

Key modules:

| Area | File |
|------|------|
| Roles / permissions / landing routes | `src/lib/auth/roles.ts` |
| Authorization core (`can` / `authorize`) | `src/lib/auth/authorize.ts` |
| Server session helpers (`requireRole`, …) | `src/lib/auth/session.ts` |
| API guards | `src/lib/auth/api-guard.ts` |
| Client auth context (`useAuth`) | `src/components/auth/AuthProvider.tsx` |
| Firebase client / admin init | `src/lib/firebase/{client,admin}.ts` |
| Friendly auth errors | `src/lib/firebase/errors.ts` |
| Zod schemas (role-conditional scope) | `src/lib/validation/user.ts` |
| Security rules | `firestore.rules`, `storage.rules` |

## Setup

### 1. Create a Firebase project

1. [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Get started → Sign-in method** → enable
   **Email/Password** (leave everything else disabled).
3. **Build → Firestore Database → Create database** (production mode).
4. **Project settings → General → Your apps → Web app** → register an app and
   copy the SDK config into `.env.local` (`NEXT_PUBLIC_FIREBASE_*`).
5. **Project settings → Service accounts → Generate new private key**. Provide it
   either as a file (`FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.local.json`,
   gitignored) or base64 (`FIREBASE_SERVICE_ACCOUNT_B64`, preferred for hosted
   deploys):
   ```bash
   base64 -i serviceAccount.json | tr -d '\n'
   ```

### 2. Configure env

```bash
cp .env.local.example .env.local   # then fill in the values
npm install
```

### 3. Deploy security rules

```bash
npx firebase deploy --only firestore:rules,storage
```

### 4. Seed the first Society Admin

There is no public registration for internal roles, so bootstrap the first admin:

```bash
npm run seed:admin -- --email admin@example.com --password "Passw0rd!" --name "Rishi"
```

### 5. Run

```bash
npm run dev        # http://localhost:3000
```

## Local development with emulators (no live project needed)

Uncomment the emulator vars in `.env.local`, then:

```bash
npm run emulators        # Auth :9099, Firestore :8080, UI :4000
# in another shell, seed against the emulator:
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 FIRESTORE_EMULATOR_HOST=localhost:8080 \
  npm run seed:admin -- --email admin@example.com --password "Passw0rd!" --name "Rishi"
npm run dev
```

## Roles

| Role | Landing route | Scope requirement |
|------|---------------|-------------------|
| `society_admin` | `/admin` | none |
| `location_news_head` | `/news-head/dashboard` | `locationId` |
| `college_head` | `/college-head/dashboard` | `locationId` + `collegeId` |
| `reporter` | `/reporter/dashboard` | `locationId` |
| `student` | `/student/dashboard` | `locationId` |

## Scripts

- `npm run dev` / `build` / `start`
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint`
- `npm run seed:admin` — create the first Society Admin
- `npm run emulators` — Firebase Local Emulator Suite

> V1 uses Firebase Email/Password only. The auth layer is modular so Google /
> Microsoft / SSO can be added later without rewriting the app.
