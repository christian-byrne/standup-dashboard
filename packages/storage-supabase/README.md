# @standup-dashboard/storage-supabase

Supabase storage adapter for the standup dashboard, providing cloud-based persistence with PostgreSQL and real-time capabilities.

## Installation

```bash
npm install @standup-dashboard/storage-supabase @supabase/supabase-js
```

## Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `src/schema.sql` in your Supabase SQL Editor
3. Get your project URL and anon key from Settings > API

## Usage

```typescript
import { createSupabaseStorage } from '@standup-dashboard/storage-supabase';

const storage = createSupabaseStorage({
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key',
  tableName: 'standups' // optional, defaults to 'standups'
});

// Save a standup record
await storage.save(standupRecord);

// Read the latest standup
const latest = await storage.readLatest();

// List recent standups
const recent = await storage.list(10);

// Read by specific date and user
const specific = await storage.readByDateKey('2025-11-11', 'username');

// Delete a standup
await storage.delete('2025-11-11', 'username');
```

## Environment Variables

Add these to your `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Features

- **Cloud Storage**: PostgreSQL-backed storage with automatic backups
- **Real-time**: Subscribe to changes with Supabase real-time features
- **Scalable**: Handles multiple users and high-volume data
- **Secure**: Row Level Security policies for multi-tenant applications
- **Compatible**: Drop-in replacement for FileStorage with extended features

## Database Schema

The storage uses a `standups` table with the following structure:

- `id`: UUID primary key
- `date_key`: Date string (e.g., '2025-11-11')
- `username`: User identifier
- `hours`: Hours covered in the standup
- `claude_model`: AI model used for summarization
- `raw_bullets`: Original activity bullets (JSONB)
- `summary_bullets`: AI-summarized bullets (JSONB)
- `activity`: Detailed activity data (JSONB)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

## Security

The default schema includes Row Level Security (RLS) policies. For development, all operations are allowed. For production:

1. Set up Supabase Auth
2. Enable appropriate RLS policies
3. Remove the development policy

## Migration from FileStorage

The Supabase adapter is API-compatible with FileStorage. Simply replace:

```typescript
// Before
import { createFileStorage } from '@standup-dashboard/storage-fs';
const storage = createFileStorage({ rootDir: './data' });

// After  
import { createSupabaseStorage } from '@standup-dashboard/storage-supabase';
const storage = createSupabaseStorage({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY
});
```