import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Dashboard app tests
  './apps/dashboard/vitest.config.ts',
  
  // Package tests
  {
    test: {
      name: 'storage-fs',
      root: './packages/storage-fs',
      environment: 'node',
    }
  },
  {
    test: {
      name: 'storage-supabase', 
      root: './packages/storage-supabase',
      environment: 'node',
    }
  },
  {
    test: {
      name: 'workflow',
      root: './packages/workflow',
      environment: 'node',
    }
  }
])