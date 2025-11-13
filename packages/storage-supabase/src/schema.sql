-- Standup Dashboard - Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create standups table
CREATE TABLE IF NOT EXISTS standups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_key TEXT NOT NULL,
  username TEXT NOT NULL,
  hours INTEGER NOT NULL,
  claude_model TEXT,
  raw_bullets JSONB NOT NULL DEFAULT '[]',
  summary_bullets JSONB NOT NULL DEFAULT '[]',
  activity JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique constraint on date_key + username combination
  CONSTRAINT unique_standup_per_user_per_day UNIQUE (date_key, username)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_standups_date_key ON standups(date_key);
CREATE INDEX IF NOT EXISTS idx_standups_username ON standups(username);
CREATE INDEX IF NOT EXISTS idx_standups_created_at ON standups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_standups_user_date ON standups(username, date_key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_standups_updated_at ON standups;
CREATE TRIGGER update_standups_updated_at
  BEFORE UPDATE ON standups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE standups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own standups (if auth is enabled)
-- Comment out or modify these policies based on your authentication setup
-- CREATE POLICY "Users can view own standups" ON standups
--   FOR SELECT USING (auth.uid()::text = username);

-- CREATE POLICY "Users can insert own standups" ON standups
--   FOR INSERT WITH CHECK (auth.uid()::text = username);

-- CREATE POLICY "Users can update own standups" ON standups
--   FOR UPDATE USING (auth.uid()::text = username);

-- CREATE POLICY "Users can delete own standups" ON standups
--   FOR DELETE USING (auth.uid()::text = username);

-- For development/testing: Allow all operations (remove in production)
CREATE POLICY "Allow all operations for development" ON standups
  FOR ALL USING (true);