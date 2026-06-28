# Ledger — Trading Journal

A private trading journal with three pages — **Calendar** (daily P&L heatmap + journal), **Performance** (equity curve, drawdown, win-rate / profit-factor / R-multiple, best & worst trades, breakdowns by symbol and setup), and **Screenshots** (chart gallery + per-trade detail with entry/target/stop annotations).

Access is **invite-only**: you grant access by email address, and **no one else can read or write the data** — that rule is enforced inside Firebase, not just hidden in the UI.

---

## How access control works

1. A visitor signs in with Google.
2. The app checks the **`allowlist`** node in the Realtime Database for their email (stored as the email with dots replaced by commas, value `true`).
3. If the email isn't there, they see "Access restricted" and **every database read/write is denied by the security rules** (`database.rules.json`).
4. Approved users get the app, and their journal entries are saved under `users/{their-uid}` — readable only by them.

Because the block is in the Realtime Database rules, even someone who pokes at the API directly cannot get the data. The Firebase web keys in `firebase-config.js` are **not secrets** (they only identify the project); your protection is Auth + rules.

---

## File map

```
.
├── public/                  ← what Vercel serves (the website)
│   ├── index.html           ← login gate (Firebase auth + allowlist check)
│   ├── app.html             ← the trading-journal app
│   └── firebase-config.js   ← your Firebase web config (incl. databaseURL)
├── database.rules.json      ← the access rules (the real security)
├── firebase.json
├── .firebaserc              ← points at project "trading-journal-c8bd6"
├── vercel.json              ← static-site config for Vercel
├── package.json
├── scripts/allow.mjs        ← grant/revoke access by email from the terminal
└── .gitignore
```

---

## One-time Firebase setup

Console: <https://console.firebase.google.com/project/trading-journal-c8bd6>

### 1. Enable Google sign-in
Authentication → **Get started** → Sign-in method → **Google** → Enable → Save.

### 2. Create the Realtime Database
Realtime Database → **Create database** → pick a location → Start in **locked mode** → Enable.

> Note the instance URL shown at the top of the **Data** tab — it must match `databaseURL` in `public/firebase-config.js` (regional databases end in `.firebasedatabase.app`).

### 3. Publish the security rules
Either paste the contents of `database.rules.json` into Realtime Database → **Rules** → **Publish**, **or** use the CLI:

```bash
npm install                    # installs firebase-tools locally
npx firebase login
npm run deploy:rules           # deploys database.rules.json
```

### 4. Grant yourself (and others) access
**Option A — console (quickest):** Realtime Database → **Data** tab → hover the root → **+** → add a child named `allowlist`, then under it add a child whose **key is the person's lowercase email with every `.` replaced by `,`** (e.g. `you@gmail,com`) and whose **value is the boolean `true`** (no quotes). Repeat per person.

**Option B — terminal:** download a service-account key (Project settings → Service accounts → *Generate new private key*), save it as `serviceAccount.json` in this folder, then:

```bash
npm run allow you@gmail.com        # grant
npm run allow teammate@gmail.com   # grant another
npm run deny  teammate@gmail.com   # revoke
npm run list-access                # see everyone with access
```

> Always use **lowercase** emails, and replace dots with commas in the key. The value must be the boolean `true`, not the string `"true"`. To revoke someone later, delete their child from `allowlist` (or `npm run deny`).

---

## Deploy

### Push to GitHub
```bash
cd <this folder>
git init
git add .
git commit -m "Ledger trading journal"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### Deploy on Vercel
1. <https://vercel.com/new> → **Import** your GitHub repo.
2. Framework Preset: **Other** (it's a static site — `vercel.json` handles it; no build needed).
3. **Deploy.** You'll get a URL like `https://your-app.vercel.app`.

### ⚠️ Final step — authorize the Vercel domain (required, or Google sign-in fails)
Firebase console → Authentication → **Settings** → **Authorized domains** → **Add domain** → paste your Vercel domain (e.g. `your-app.vercel.app`). Add any custom domain too.

That's it — open the Vercel URL, sign in with an allow-listed Google account, and you're in.

---

## Notes & limits

- **Journal entries** (your notes + mood per day) persist to the Realtime Database per user. The sample **trades** shown are demo data generated in the app — wire your broker/import next if you want real trades stored too.
- Want **email + password** instead of Google? Enable it under Authentication → Sign-in method; the allowlist logic is identical (it keys off the email).
- The web app loads the Firebase SDK from Google's CDN, so no build/bundler is required.
