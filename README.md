# Kubera - Inventory Tracker

A visual inventory management app with folders, QR/barcode scanning, low stock alerts, CSV import/export, reports, and a dark/light theme. Built with React, Vite, and Supabase.

## Features

- **Visual Item Cards** — Grid and list views with images, tags, status badges
- **Folders** — Organize items into color-coded folders
- **QR Code & Barcode Scanner** — Scan to look up or add items, with manual entry fallback
- **Low Stock Alerts** — Dashboard highlights items below minimum quantity
- **CSV Import/Export** — Bulk add items or download your inventory as a spreadsheet
- **Image Uploads** — Upload photos directly via Supabase Storage
- **Reports & Charts** — Inventory value, quantity, and status breakdowns with Recharts
- **Dark/Light Theme** — Toggle between themes, persisted in localStorage
- **Activity Log** — Track all changes (adds, edits, deletes, moves)
- **Multi-User Auth** — Supabase email/password authentication with Row Level Security
- **PWA** — Installable on mobile and desktop, offline-capable with service worker
- **Responsive** — Collapsible sidebar on mobile, adaptive grid layouts

## Tech Stack

- **Frontend:** React 19, React Router 7, Vite 8
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Charts:** Recharts
- **Scanner:** html5-qrcode
- **QR Generation:** qrcode.react

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/shettyshishir007/kubera-inventory.git
cd kubera-inventory
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. (For image uploads) Go to **Storage**, create a bucket named `images`, and set it to **public**

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project URL and anon key (found in Settings > API).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) and create an account.

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com), import the repository
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite and configures the build

## Project Structure

```
src/
  components/     # Sidebar, ItemModal, FolderModal, Scanner, InstallPrompt
  lib/            # supabase.js, auth.jsx, database.js, storage.js, csv.js, theme.jsx
  pages/          # Dashboard, Items, ItemDetail, FolderView, Activity, Reports, Login
  App.jsx         # Routes and layout
  index.css       # All styles (dark/light themes, responsive)
public/
  manifest.json   # PWA manifest
  sw.js           # Service worker
  icons/          # App icons
```

## License

MIT
