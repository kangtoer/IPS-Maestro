# IPS-Maestro Setup Guide 🎓

Panduan lengkap untuk mengkonfigurasi dan menjalankan **IPS Maestro** secara lokal hingga 100% berhasil.

---

## 📋 Table of Contents
1. [Prasyarat (Prerequisites)](#prerequisites)
2. [Dapatkan API Keys](#api-keys)
3. [Setup Lokal](#setup-lokal)
4. [Verifikasi Setup](#verifikasi)
5. [Build untuk Production](#production)
6. [Deployment Options](#deployment)
7. [Troubleshooting](#troubleshooting)
8. [Checklist 100%](#checklist)

---

## Prerequisites

Pastikan Anda memiliki:
- ✅ **Git** (https://git-scm.com)
- ✅ **Node.js 18+** (https://nodejs.org) - Cek: `node --version`
- ✅ **npm atau yarn** - Cek: `npm --version`
- ✅ **Text Editor** (VSCode, Sublime, dll)
- ✅ **Google Account** (untuk Gemini API & OAuth)

---

## API Keys Setup

### 1️⃣ Gemini API Key

```bash
1. Kunjungi: https://aistudio.google.com/app/apikey
2. Login dengan Google Account Anda
3. Klik "Create API Key"
4. Pilih atau buat Project baru
5. Copy API Key
6. Paste ke file .env:
   GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

### 2️⃣ Google OAuth Setup

```bash
1. Kunjungi: https://console.cloud.google.com/
2. Login dengan Google Account
3. Buat Project Baru:
   - Click "Select a Project" → "New Project"
   - Masukkan nama: "IPS-Maestro"
   - Click "Create"

4. Enable APIs:
   - Go ke "APIs & Services" → "Library"
   - Cari dan enable:
     ✅ Google Drive API
     ✅ Google Blogger API
     ✅ Google OAuth 2.0

5. Buat OAuth 2.0 Credential:
   - Go ke "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web Application"
   - Masukkan nama: "IPS-Maestro Web"
   
6. Set Authorized Redirect URIs:
   - Tambahkan: http://localhost:3000/api/auth/callback
   - Untuk production, tambahkan juga URL production Anda
   
7. Download JSON credentials
8. Copy ke .env:
   GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"
   GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
   GOOGLE_PROJECT_ID="YOUR_PROJECT_ID"
```

### 3️⃣ Generate SESSION_SECRET

```bash
# Jalankan command ini di terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output ke .env:
SESSION_SECRET="output-dari-command-di-atas"
```

---

## Setup Lokal - Step by Step

### Step 1: Clone Repository
```bash
git clone https://github.com/kangtoer/IPS-Maestro.git
cd IPS-Maestro
```

### Step 2: Install Dependencies
```bash
npm install
# atau jika menggunakan yarn:
yarn install
```

### Step 3: Configure Environment
```bash
# File .env sudah dibuat, sekarang edit:
# Buka .env dan isi semua nilai yang dibutuhkan
nano .env
# atau buka dengan VSCode/editor favorit Anda
```

### Step 4: Verify Configuration
```bash
npm run lint
```

Pastikan tidak ada error TypeScript.

### Step 5: Run Development Server
```bash
npm run dev
```

Output yang diharapkan:
```
> ips-maestro@1.0.0 dev
> tsx server.ts

✅ Server running at http://localhost:3000
✅ API available at http://localhost:3000/api
```

### Step 6: Access Application
```
Buka browser: http://localhost:3000
```

---

## Verifikasi Setup ✅

Pastikan semua checklist ini terpenuhi:

- [ ] Node.js version 18+ terinstall
- [ ] npm install berhasil tanpa error
- [ ] Semua environment variables terisi di `.env`
- [ ] GEMINI_API_KEY valid dan aktif
- [ ] Google OAuth credentials tersimpan
- [ ] SESSION_SECRET sudah di-generate
- [ ] `npm run dev` berjalan tanpa error
- [ ] Browser bisa akses http://localhost:3000
- [ ] Tidak ada error di DevTools Console (F12)
- [ ] Aplikasi UI tampil dengan benar

---

## Build untuk Production

### Build Process
```bash
# Clean build directory
npm run clean

# Build untuk production
npm run build
```

Output yang diharapkan:
```
dist/
├── index.html
├── assets/
└── server.cjs
```

### Test Production Build
```bash
npm start
```

Kemudian akses: http://localhost:3000

---

## Deployment Options

### Option 1️⃣: Vercel (Recommended - Easiest)

```bash
1. Install Vercel CLI:
   npm install -g vercel

2. Deploy:
   vercel

3. Follow prompts:
   - Link existing project? → No
   - Project name → ips-maestro
   - Framework → Other (default)
   - Root directory → ./
   
4. Set Environment Variables di Vercel Dashboard:
   - Go to Settings → Environment Variables
   - Add:
     GEMINI_API_KEY = your-key
     GOOGLE_CLIENT_ID = your-id
     GOOGLE_CLIENT_SECRET = your-secret
     SESSION_SECRET = your-secret

5. Add Production OAuth Redirect URI:
   - Go to Google Cloud Console
   - Update OAuth redirect:
     https://your-vercel-app.vercel.app/api/auth/callback
```

### Option 2️⃣: Netlify

```bash
1. Connect Repository:
   - Go to https://netlify.com
   - Click "New site from Git"
   - Select GitHub → authorize → select IPS-Maestro

2. Build Settings:
   - Build command: npm run build
   - Publish directory: dist

3. Environment Variables:
   - Add GEMINI_API_KEY, etc (same as Vercel)

4. Deploy!
```

### Option 3️⃣: Docker + Cloud Run

```bash
1. Create Dockerfile (sudah ada di repo)

2. Build Docker Image:
   docker build -t ips-maestro:latest .

3. Test locally:
   docker run -p 3000:3000 \
     -e GEMINI_API_KEY=your-key \
     -e GOOGLE_CLIENT_ID=your-id \
     ips-maestro:latest

4. Deploy ke Google Cloud Run:
   gcloud run deploy ips-maestro \
     --image ips-maestro:latest \
     --set-env-vars GEMINI_API_KEY=your-key,... \
     --region us-central1 \
     --allow-unauthenticated
```

---

## Troubleshooting 🔧

### Error: "Cannot find module '@google/genai'"
```bash
# Solution:
rm -rf node_modules package-lock.json
npm install
```

### Error: "GEMINI_API_KEY is not defined"
```bash
# Check:
1. File .env ada di root directory
2. Anda telah restart server setelah edit .env
3. API key valid dan tidak expired
```

### Error: "Port 3000 already in use"
```bash
# Solution 1: Kill process
lsof -ti:3000 | xargs kill -9

# Solution 2: Use different port
PORT=3001 npm run dev
```

### Error: "OAuth callback URL not registered"
```bash
# Go to Google Cloud Console
# Update Authorized redirect URIs:
# - Development: http://localhost:3000/api/auth/callback
# - Production: https://your-domain.com/api/auth/callback
```

### Build Error: "esbuild not found"
```bash
npm install --save-dev esbuild
npm run build
```

---

## Checklist Konfigurasi 100%

### ✅ Setup Phase
- [ ] Repository di-clone
- [ ] npm install berhasil
- [ ] .env file dibuat dengan semua keys
- [ ] Semua API keys valid

### ✅ Development Phase
- [ ] npm run dev berjalan tanpa error
- [ ] Aplikasi accessible di localhost:3000
- [ ] Login Google OAuth berfungsi
- [ ] Gemini AI API berfungsi (test di UI)
- [ ] Google Drive integration berfungsi
- [ ] Export PDF/DOCX berfungsi

### ✅ Build Phase
- [ ] npm run lint berhasil
- [ ] npm run build berhasil
- [ ] npm start berfungsi
- [ ] Production build bisa diakses

### ✅ Deployment Phase (Pilih satu)
- [ ] Vercel: Deploy berhasil, environment vars set
- [ ] Netlify: Deploy berhasil, environment vars set
- [ ] Docker: Image built, container runs
- [ ] URL production accessible
- [ ] Semua fitur berfungsi di production

### ✅ Security Phase
- [ ] .env file di .gitignore
- [ ] API keys tidak di-commit ke repo
- [ ] SESSION_SECRET berbeda untuk setiap environment
- [ ] HTTPS enabled di production
- [ ] OAuth redirect URL di-update untuk production

---

## Sumber Bantuan

- **Dokumentasi Gemini API**: https://ai.google.dev/docs
- **Google Cloud Console**: https://console.cloud.google.com/
- **Express.js Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/

---

**Salam Guru Maestro, Belajar Tanpa Batas!** 🇮🇩

*Setup guide ini telah dioptimalkan untuk production-ready configuration.*
