import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// ─── Data Source Configuration ─────────────────────────────────────────────
//
// DATA_SOURCE=csv      → reads /data/sales_data.csv  (default)
// DATA_SOURCE=supabase → queries your Supabase project
//
const DATA_SOURCE = (process.env.DATA_SOURCE || 'csv').toLowerCase();

// Only initialise Supabase client when it's needed
let supabase = null;
if (DATA_SOURCE === 'supabase') {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
        console.error('❌  DATA_SOURCE=supabase but SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env');
        process.exit(1);
    }
    supabase = createClient(url, key);
}

app.use(cors());
app.use(express.json());

// ─── GET /api/sales ────────────────────────────────────────────────────────
app.get('/api/sales', async (req, res) => {

    // ── Supabase path ───────────────────────────────────────────────────────
    if (DATA_SOURCE === 'supabase') {
        try {
            const { data, error } = await supabase
                .from('sales_data')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            return res.json(data);
        } catch (err) {
            console.error('Supabase error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch data from Supabase.' });
        }
    }

    // ── CSV path (default) ──────────────────────────────────────────────────
    const csvPath = join(__dirname, 'data', 'sales_data.csv');
    const records = [];

    const parser = parse({
        columns: true,
        skip_empty_lines: true,
        cast: true,
        trim: true,
    });

    parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) records.push(record);
    });

    parser.on('error', (err) => {
        console.error('CSV parse error:', err);
        res.status(500).json({ error: 'Failed to parse sales data.' });
    });

    parser.on('end', () => res.json(records));

    createReadStream(csvPath).pipe(parser);
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    const source = DATA_SOURCE === 'supabase'
        ? `☁️  Supabase (${process.env.SUPABASE_URL})`
        : '📂  Local CSV (data/sales_data.csv)';
    console.log(`✅  API server running at http://localhost:${PORT}`);
    console.log(`📊  Data source: ${source}`);
});
