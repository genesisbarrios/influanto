-- ============================================================
-- Run this in your Supabase SQL Editor before migrating data.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  email_verified TIMESTAMPTZ,
  display_email BOOLEAN DEFAULT false,
  image TEXT,
  location TEXT,
  bio TEXT,
  website TEXT,
  etsy TEXT,
  instagram TEXT,
  twitter TEXT,
  discord TEXT,
  telegram TEXT,
  facebook TEXT,
  linkedin TEXT,
  youtube TEXT,
  tiktok TEXT,
  github TEXT,
  spotify TEXT,
  apple_music TEXT,
  tidal TEXT,
  amazon_music TEXT,
  soundcloud TEXT,
  deezer TEXT,
  pandora TEXT,
  bandcamp TEXT,
  youtube_music TEXT,
  patreon TEXT,
  substack TEXT,
  customer_id TEXT,
  price_id TEXT,
  has_access BOOLEAN DEFAULT false,
  printify_shop_id TEXT,
  printify_connected BOOLEAN DEFAULT false,
  printify_store_url TEXT,
  printify_store_name TEXT,
  printify_access_token TEXT,
  printify_shop_url TEXT,
  welcome_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NextAuth OAuth accounts
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- NextAuth database sessions (unused with JWT strategy but needed by adapter)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL
);

-- NextAuth email magic-link tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS release_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  image TEXT,
  description TEXT,
  video TEXT,
  links JSONB DEFAULT '[]',
  bg_color TEXT,
  text_color TEXT,
  links_color TEXT,
  font TEXT,
  selected_products TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_in_bio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bg_color TEXT,
  text_color TEXT,
  links_color TEXT,
  card_bg_color TEXT,
  font TEXT DEFAULT 'Inter, sans-serif',
  bg_image TEXT,
  bg_mode TEXT DEFAULT 'color' CHECK (bg_mode IN ('color', 'preset', 'upload', 'pattern')),
  bg_image_custom TEXT,
  pattern_id TEXT DEFAULT 'topography',
  pattern_fg TEXT DEFAULT '#000000',
  pattern_bg TEXT DEFAULT '#ffffff',
  pattern_opacity DECIMAL DEFAULT 0.5 CHECK (pattern_opacity >= 0.05 AND pattern_opacity <= 1),
  selected_products TEXT[] DEFAULT '{}',
  links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_in_bio_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country TEXT DEFAULT 'Unknown',
  country_code TEXT DEFAULT '',
  city TEXT DEFAULT '',
  device TEXT DEFAULT 'unknown' CHECK (device IN ('mobile', 'tablet', 'desktop', 'unknown')),
  browser TEXT DEFAULT 'Other',
  os TEXT DEFAULT 'Other',
  referrer TEXT DEFAULT 'Direct',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS link_in_bio_visits_user_id_idx ON link_in_bio_visits(user_id);
CREATE INDEX IF NOT EXISTS link_in_bio_visits_created_at_idx ON link_in_bio_visits(created_at);

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  codes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_release_pages_updated_at BEFORE UPDATE ON release_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_link_in_bio_updated_at BEFORE UPDATE ON link_in_bio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
