-- Run this in your Supabase SQL Editor if your users table already exists.
-- Safe to run multiple times (IF NOT EXISTS / DO NOTHING guards).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS wallet_addresses TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ens_name TEXT,
  ADD COLUMN IF NOT EXISTS privy_user_id TEXT;
