import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createSupabaseStorage, type StandupRecord } from './index'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

const mockRecord: StandupRecord = {
  generatedAt: '2025-11-11T10:00:00.000Z',
  dateKey: '2025-11-11',
  username: 'test-user',
  hours: 8,
  claudeModel: 'claude-3-haiku-20240307',
  rawBullets: ['- Added new feature', '- Fixed bug'],
  summaryBullets: ['Added feature', 'Fixed issue'],
  activity: [
    {
      title: 'feat: add new component',
      repository: 'test/repo',
      url: 'https://github.com/test/repo/pull/1',
      state: 'merged',
      mergedAt: '2025-11-11T09:00:00Z',
      updatedAt: '2025-11-11T09:30:00Z'
    }
  ]
}

describe('SupabaseStorage', () => {
  let storage: ReturnType<typeof createSupabaseStorage>

  beforeEach(() => {
    vi.clearAllMocks()
    
    storage = createSupabaseStorage({
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
      tableName: 'test_standups'
    })
  })

  describe('save', () => {
    it('should upsert record successfully', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null })
      
      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert
      })

      await storage.save(mockRecord)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_standups')
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          dateKey: '2025-11-11',
          username: 'test-user',
          hours: 8,
          claudeModel: 'claude-3-haiku-20240307',
          rawBullets: ['- Added new feature', '- Fixed bug'],
          summaryBullets: ['Added feature', 'Fixed issue'],
          activity: expect.any(Array),
          created_at: '2025-11-11T10:00:00.000Z'
        }),
        { onConflict: 'date_key,username' }
      )
    })

    it('should throw error when upsert fails', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ 
        error: { message: 'Database error' } 
      })
      
      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert
      })

      await expect(storage.save(mockRecord)).rejects.toThrow('Failed to save standup record: Database error')
    })
  })

  describe('readLatest', () => {
    it('should return latest record', async () => {
      const mockSelect = vi.fn()
      const mockOrder = vi.fn()
      const mockLimit = vi.fn()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: {
          id: '123',
          dateKey: '2025-11-11',
          username: 'test-user',
          hours: 8,
          claudeModel: 'claude-3-haiku-20240307',
          rawBullets: ['- Added new feature'],
          summaryBullets: ['Added feature'],
          activity: [],
          created_at: '2025-11-11T10:00:00.000Z'
        },
        error: null 
      })
      
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit.mockReturnValue({
              single: mockSingle
            })
          })
        })
      })

      const result = await storage.readLatest()

      expect(result).toEqual({
        generatedAt: '2025-11-11T10:00:00.000Z',
        dateKey: '2025-11-11',
        username: 'test-user',
        hours: 8,
        claudeModel: 'claude-3-haiku-20240307',
        rawBullets: ['- Added new feature'],
        summaryBullets: ['Added feature'],
        activity: []
      })
    })

    it('should return null when no records found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null,
        error: { code: 'PGRST116' }
      })
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: mockSingle
            })
          })
        })
      })

      const result = await storage.readLatest()
      expect(result).toBe(null)
    })

    it('should throw error for other database errors', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null,
        error: { message: 'Connection failed' }
      })
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: mockSingle
            })
          })
        })
      })

      await expect(storage.readLatest()).rejects.toThrow('Failed to read latest standup: Connection failed')
    })
  })

  describe('list', () => {
    it('should return list of records', async () => {
      const mockSelect = vi.fn()
      const mockOrder = vi.fn()
      const mockLimit = vi.fn().mockResolvedValue({
        data: [
          {
            dateKey: '2025-11-11',
            username: 'test-user',
            hours: 8,
            claudeModel: 'claude-3-haiku-20240307',
            rawBullets: ['- Added feature'],
            summaryBullets: ['Added feature'],
            activity: [],
            created_at: '2025-11-11T10:00:00.000Z'
          }
        ],
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit
          })
        })
      })

      const result = await storage.list(5)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_standups')
      expect(mockLimit).toHaveBeenCalledWith(5)
      expect(result).toHaveLength(1)
      expect(result[0].dateKey).toBe('2025-11-11')
    })

    it('should handle empty results', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: mockLimit
          })
        })
      })

      const result = await storage.list()
      expect(result).toEqual([])
    })
  })

  describe('readByDateKey', () => {
    it('should read record by date key and username', async () => {
      const mockEq = vi.fn()
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          dateKey: '2025-11-11',
          username: 'test-user',
          hours: 8,
          rawBullets: [],
          summaryBullets: [],
          activity: [],
          created_at: '2025-11-11T10:00:00.000Z'
        },
        error: null
      })
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingle
            })
          })
        })
      })

      const result = await storage.readByDateKey('2025-11-11', 'test-user')
      
      expect(result).toBeDefined()
      expect(result?.dateKey).toBe('2025-11-11')
      expect(result?.username).toBe('test-user')
    })
  })

  describe('createSupabaseStorage', () => {
    it('should create SupabaseStorage instance with default table name', () => {
      const storage = createSupabaseStorage({
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      })
      
      expect(storage).toBeDefined()
      expect(typeof storage.save).toBe('function')
      expect(typeof storage.readLatest).toBe('function')
      expect(typeof storage.list).toBe('function')
    })
  })
})