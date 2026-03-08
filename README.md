# SalesDash — VC Dashboard

A modern sales intelligence dashboard built with React + Vite, backed by an Express API.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your environment
Copy the example file and fill in your keys:
```bash
cp .env.example .env
```

At minimum, add your Gemini API key for the AI advisor:
```
VITE_GEMINI_API_KEY=your_key_here
```

> Get a free Gemini key at https://aistudio.google.com/app/apikey

### 3. Start both servers
```bash
npm run dev:all
```

This starts:
- **API server** on http://localhost:3001 (reads your data)
- **Frontend** on http://localhost:5173 (the dashboard)

Or run them separately in two terminals:
```bash
npm run server   # terminal 1
npm run dev      # terminal 2
```

---

## � Data Sources

The backend API supports **two data sources**. Switch between them by editing one line in `.env`.

### Option A: Local CSV (Default — works instantly, no setup needed)

The dashboard reads from `data/sales_data.csv` out of the box.

```env
DATA_SOURCE=csv
```

That's it — no extra credentials needed.

---

### Option B: Supabase (Connect to a live cloud database)

Follow these steps to connect to Supabase:

#### Step 1 — Create a Supabase project

1. Go to **https://supabase.com** and sign in (free account is fine).
2. Click **"New Project"**, give it a name (e.g. `vc-dashboard`), and wait for it to spin up (~1 minute).

#### Step 2 — Create the `sales_data` table

1. In your project, click **SQL Editor** in the left sidebar.
2. Paste and run this SQL:

```sql
CREATE TABLE sales_data (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date      DATE           NOT NULL,
  product   TEXT           NOT NULL,
  channel   TEXT           NOT NULL,
  orders    INTEGER        NOT NULL DEFAULT 0,
  revenue   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  visitors  INTEGER        NOT NULL DEFAULT 0,
  customers INTEGER        NOT NULL DEFAULT 0
);
```

3. Click **Run**. You should see "Success. No rows returned."

#### Step 3 — Import your CSV data

1. In the left sidebar, click **Table Editor**.
2. Click the `sales_data` table.
3. Click **Import data** (top right) → **Import from CSV**.
4. Upload the file at `data/sales_data.csv` in this project.
5. Click **Import**. Your 39 rows of data will appear.

#### Step 4 — Get your API credentials

1. In the left sidebar, click **Project Settings** → **API**.
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **Anon / Public Key** (a long string starting with `eyJ...`)

#### Step 5 — Update your `.env` file

Open `.env` in this project and update it:

```env
DATA_SOURCE=supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxxxxxx...
```

#### Step 6 — Restart the API server

Stop the server (Ctrl+C) and start it again:
```bash
npm run server
```

You should see:
```
✅  API server running at http://localhost:3001
📊  Data source: ☁️  Supabase (https://xxxxxxxxxxxx.supabase.co)
```

The dashboard will now pull live data from your Supabase database!

---

## 📁 Project Structure

```
vc-dashboard/
├── data/
│   └── sales_data.csv      ← source data (used in CSV mode)
├── src/
│   └── App.jsx             ← React frontend
├── server.js               ← Express API (handles CSV + Supabase)
├── vite.config.js          ← Vite config (proxies /api → port 3001)
├── .env                    ← your local config (gitignored)
└── .env.example            ← template — copy this to .env
```

---

## 🔑 All Environment Variables

| Variable             | Required | Default | Description                            |
|----------------------|----------|---------|----------------------------------------|
| `VITE_GEMINI_API_KEY`| Yes (AI) | —       | Google Gemini key for AI insights      |
| `DATA_SOURCE`        | No       | `csv`   | `csv` or `supabase`                    |
| `SUPABASE_URL`       | If supabase | —    | Your Supabase project URL              |
| `SUPABASE_ANON_KEY`  | If supabase | —    | Your Supabase anon/public key          |

---

## � Available Scripts

| Command          | What it does                                |
|------------------|---------------------------------------------|
| `npm run dev`    | Start the Vite frontend only                |
| `npm run server` | Start the Express API only                  |
| `npm run dev:all`| Start both frontend + API at once           |
| `npm run build`  | Build the frontend for production           |
