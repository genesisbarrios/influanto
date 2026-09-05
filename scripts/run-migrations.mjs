import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:influanti2121!@db.dayeptxjepptzhmjhvjg.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const migrations = [
  // tracks whether the day-1/2 onboarding welcome email has gone out
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ`,

  // tracks whether the user has dismissed the first-run dashboard onboarding popup
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_seen BOOLEAN DEFAULT FALSE`,

  // one-time backfill: accounts that already existed before this feature shipped
  // are not "new signups" and should never see the welcome popup. Scoped to a
  // fixed cutoff so it stays a no-op for every account created afterward, safe
  // to leave here permanently.
  `UPDATE users SET onboarding_seen = TRUE WHERE onboarding_seen = FALSE AND created_at < '2026-08-20T00:00:00Z'`,

  // brand logo for link-in-bio
  `ALTER TABLE link_in_bio ADD COLUMN IF NOT EXISTS brand_logo_url TEXT`,

  // split sheet signers (in case not yet run)
  `CREATE TABLE IF NOT EXISTS split_sheet_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    split_sheet_id UUID NOT NULL REFERENCES split_sheets(id) ON DELETE CASCADE,
    token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    contributor_name TEXT NOT NULL DEFAULT '',
    contributor_email TEXT NOT NULL DEFAULT '',
    signed_at TIMESTAMPTZ,
    signature_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(split_sheet_id, contributor_email)
  )`,

  // meta pixel for users (in case not yet run)
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT`,

  // release page visits (in case not yet run)
  `CREATE TABLE IF NOT EXISTS release_page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_page_id UUID NOT NULL REFERENCES release_pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country TEXT DEFAULT 'Unknown',
    country_code TEXT DEFAULT '',
    city TEXT DEFAULT '',
    device TEXT DEFAULT 'unknown',
    browser TEXT DEFAULT 'Other',
    os TEXT DEFAULT 'Other',
    referrer TEXT DEFAULT 'Direct',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // split sheets (in case not yet run)
  `CREATE TABLE IF NOT EXISTS split_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    date TEXT DEFAULT '',
    artists TEXT DEFAULT '',
    state_country TEXT DEFAULT '',
    contributors JSONB DEFAULT '[]',
    publishing JSONB DEFAULT '[]',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // newsletter-signup toggle for outreach campaigns, mirroring release pages —
  // links out to the artist's existing hosted signup page (its fields are
  // configured on Link in Bio, not per-campaign, so no fields column here)
  `ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN DEFAULT FALSE`,

  // collaborator contacts (in case not yet run)
  `CREATE TABLE IF NOT EXISTS collaborator_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // digital business card settings (display name, background color, avatar override)
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS business_card JSONB DEFAULT '{}'::jsonb`,

  // custom merch links — lets users list their own merch (e.g. a store not on Printify)
  // as simple {name, url} entries, alongside or instead of connected Printify products
  `ALTER TABLE release_pages ADD COLUMN IF NOT EXISTS custom_merch_links JSONB DEFAULT '[]'::jsonb`,
  `ALTER TABLE link_in_bio ADD COLUMN IF NOT EXISTS custom_merch_links JSONB DEFAULT '[]'::jsonb`,

  // profile category tags — the dashboard Profile editor and /api/user route have
  // sent this on every save since the category-tags feature shipped, but the
  // column was never actually created, so every profile save (not just avatar
  // updates) has been failing with a 500 since then.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS category TEXT[] DEFAULT '{}'`,
];

async function run() {
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL\n');

  for (const sql of migrations) {
    const preview = sql.trim().split('\n')[0].slice(0, 80);
    try {
      await client.query(sql);
      console.log(`  ✅ ${preview}`);
    } catch (e) {
      console.error(`  ✗  ${preview}\n     ${e.message}`);
    }
  }

  await client.end();
  console.log('\n🎉 Migrations complete');
}

run().catch(e => { console.error(e); process.exit(1); });
