# SalesDash — Intelligence Hub (Next.js Version)

A high-performance business intelligence dashboard migrated to **Next.js App Router**, optimized for deployment on **Vercel**.

---

## 🚀 Deployment (Vercel)

This project is ready to be deployed on Vercel with one click:

1. Connect your GitHub repository to [Vercel](https://vercel.com/new).
2. Add the following **Environment Variables** in the Vercel dashboard:
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Your Google Gemini key.
   - `DATA_SOURCE`: Set to `csv` (default) or `supabase`.
   - `SUPABASE_URL`: (Optional) Your Supabase URL.
   - `SUPABASE_ANON_KEY`: (Optional) Your Supabase key.
3. Click **Deploy**.

---

## 💻 Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your environment
Copy the example file and fill in your keys:
```bash
cp .env.example .env
```

### 3. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 📊 Data Sources

### Option A: Local CSV (Default)
The dashboard reads from `data/sales_data.csv`. In production, Next.js bundles this file with your serverless functions.

```env
DATA_SOURCE=csv
```

### Option B: Supabase
To connect to a live cloud database, follow the "Supabase Setup" instructions in your project history or dashboard settings.

```env
DATA_SOURCE=supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxxxxxx...
```

---

## 📁 New Project Structure

```
vc-dashboard/
├── app/
│   ├── api/sales/
│   │   └── route.ts        ← Serverless API (CSV + Supabase)
│   ├── layout.tsx          ← Root layout & Fonts
│   ├── page.tsx            ← Dashboard (Client Component)
│   └── globals.css         ← Tailwind styles
├── data/
│   └── sales_data.csv      ← Source data (for CSV mode)
├── public/                 ← Static assets
├── next.config.mjs         ← Next.js configuration
├── tailwind.config.js      ← Style configuration
└── package.json            ← Next.js 15+ & React 19
```

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Yes | Gemini key (Browser-accessible) |
| `DATA_SOURCE` | No | `csv` or `supabase` |
| `SUPABASE_URL` | If supabase | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | If supabase | Your Supabase anon key |
