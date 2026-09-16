# The Vault

A personal collection tracker for comics, trading cards, video games, and Legos. Next.js (App Router) + Firebase Auth/Firestore/Storage, deployed on Vercel.

## Stack

- Next.js 16 + TypeScript, App Router, Tailwind CSS
- Firebase Auth (email/password) for sign-in
- Firestore for item data
- Firebase Storage for item photos
- Deployed on Vercel

Every page except `/login` is protected by `src/proxy.ts`, which checks a signed session cookie against Firebase Admin. There's no public sign-up flow — you create your own account directly in the Firebase console (see below), since this is a single-owner app you don't want randoms signing up for on a public URL.

## One-time setup

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a project.
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Authentication** → Users → add yourself as a user (this is the only account you'll use).
4. **Firestore Database** → create a database (production mode is fine — rules are provided below).
5. **Storage** → set up default storage bucket.
6. **Project settings** → General → add a Web app → copy the config values into `.env.local` (see `.env.example`).
7. **Project settings** → Service accounts → Generate new private key → paste the full JSON as a single-line value for `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`.

### 2. Deploy security rules

The Firestore and Storage rules in this repo (`firestore.rules`, `storage.rules`) scope every read/write to the signed-in user's own data. Deploy them with the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,storage:rules
```

### 3. Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values from step 1
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with the account you created in step 1.3.

## Deploying to Vercel

1. Push this repo to GitHub (it's already wired to a remote — see `git remote -v`).
2. Import the repo in [Vercel](https://vercel.com/new).
3. Add all the variables from `.env.example` as Environment Variables in the Vercel project settings (Production, and Preview if you want preview deploys to work). For `FIREBASE_SERVICE_ACCOUNT_KEY`, paste the same single-line JSON.
4. Deploy.

## Data model

Every item lives in a single `items` Firestore collection, scoped by `ownerId`. Shared fields (name, photos, value, notes, tags) live at the top level; category-specific fields (issue number, card grade, platform, set number, etc.) live in a `details` object shaped by `category`. See `src/types/index.ts` for the full shape.

## Project structure

```
src/
  app/
    login/                  Sign-in page (public)
    (vault)/                Everything else — protected by proxy.ts
      page.tsx              Dashboard
      items/                List, filter, add, view, edit items
    api/auth/session/       Sets/clears the session cookie after Firebase sign-in
  components/
    AuthProvider.tsx        Client-side auth context, redirects to /login if signed out
    VaultSidebar.tsx        Category nav
    items/                  ItemForm, ItemCard, PhotoUploader
  lib/
    firebase.ts             Client SDK (Auth, Firestore, Storage)
    firebase-admin.ts       Admin SDK (session verification only)
    items.ts, photos.ts     Firestore/Storage CRUD
  types/index.ts            Item + per-category details types
  proxy.ts                  Route protection (Next.js 16 renamed middleware → proxy)
```
