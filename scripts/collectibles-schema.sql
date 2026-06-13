-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  artist TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'album')),

  -- On-chain
  token_id TEXT,
  contract_address TEXT,
  network TEXT NOT NULL DEFAULT 'polygon',
  tx_hash TEXT,
  block_number BIGINT,

  -- Walrus storage
  storage_provider TEXT DEFAULT 'walrus' CHECK (storage_provider IN ('walrus', 'ipfs')),
  metadata_uri TEXT NOT NULL,
  metadata_hash TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  audio_blob_id TEXT,
  image_url TEXT,
  image_blob_id TEXT,

  -- Metadata
  genres TEXT[] DEFAULT '{}',
  bpm INTEGER,
  lyrics TEXT,
  release_date DATE,

  -- Commercial
  price_usd NUMERIC(10, 4) DEFAULT 0,
  edition_size INTEGER NOT NULL DEFAULT 1,

  -- Status
  status TEXT NOT NULL DEFAULT 'minted' CHECK (status IN ('uploaded', 'minted', 'listed', 'sold')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS collectibles_user_id_idx ON collectibles(user_id);
CREATE INDEX IF NOT EXISTS collectibles_token_id_idx ON collectibles(token_id);
CREATE INDEX IF NOT EXISTS collectibles_network_idx ON collectibles(network);
CREATE UNIQUE INDEX IF NOT EXISTS collectibles_token_network_uidx ON collectibles(token_id, network) WHERE token_id IS NOT NULL;

CREATE TRIGGER update_collectibles_updated_at
  BEFORE UPDATE ON collectibles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
