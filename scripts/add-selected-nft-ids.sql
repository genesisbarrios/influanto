-- Add selected_nft_ids column to both tables.
-- Run this in your Supabase SQL Editor.

ALTER TABLE release_pages
  ADD COLUMN IF NOT EXISTS selected_nft_ids TEXT[] DEFAULT '{}';

ALTER TABLE link_in_bio
  ADD COLUMN IF NOT EXISTS selected_nft_ids TEXT[] DEFAULT '{}';
