import { NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';

// ─── Data Source Configuration ─────────────────────────────────────────────
//
// DATA_SOURCE=csv      → reads /data/sales_data.csv  (default)
// DATA_SOURCE=supabase → queries your Supabase project
//
const DATA_SOURCE = (process.env.DATA_SOURCE || 'csv').toLowerCase();

export async function GET() {
    // ── Supabase path ─────────────────────────────────────────────────────────
    if (DATA_SOURCE === 'supabase') {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_ANON_KEY;

        if (!url || !key) {
            return NextResponse.json(
                { error: 'SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables.' },
                { status: 500 }
            );
        }

        const supabase = createClient(url, key);
        const { data, error } = await supabase
            .from('sales_data')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Supabase error:', error.message);
            return NextResponse.json(
                { error: 'Failed to fetch data from Supabase.' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    }

    // ── CSV path (default) ────────────────────────────────────────────────────
    try {
        const csvPath = join(process.cwd(), 'data', 'sales_data.csv');
        const records: Record<string, unknown>[] = [];

        await new Promise<void>((resolve, reject) => {
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

            parser.on('error', reject);
            parser.on('end', resolve);

            createReadStream(csvPath).pipe(parser);
        });

        return NextResponse.json(records);
    } catch (err) {
        console.error('CSV read error:', err);
        return NextResponse.json(
            { error: 'Failed to read sales data.' },
            { status: 500 }
        );
    }
}
