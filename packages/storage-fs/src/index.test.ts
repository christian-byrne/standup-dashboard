import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createFileStorage, type StandupRecord } from './index'

const TEST_ROOT = path.join(process.cwd(), 'test-temp')

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

describe('FileStorage', () => {
  let storage: ReturnType<typeof createFileStorage>

  beforeEach(async () => {
    storage = createFileStorage({ rootDir: TEST_ROOT })
    // Clean up any existing test files
    try {
      await fs.rm(TEST_ROOT, { recursive: true, force: true })
    } catch {
      // Directory doesn't exist, that's fine
    }
  })

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(TEST_ROOT, { recursive: true, force: true })
    } catch {
      // Directory doesn't exist, that's fine
    }
  })

  describe('save', () => {
    it('should create directory if it does not exist', async () => {
      await storage.save(mockRecord)
      
      const stats = await fs.stat(TEST_ROOT)
      expect(stats.isDirectory()).toBe(true)
    })

    it('should save record to dated file', async () => {
      await storage.save(mockRecord)
      
      const datedFile = path.join(TEST_ROOT, '2025-11-11.json')
      const content = await fs.readFile(datedFile, 'utf8')
      const parsed = JSON.parse(content)
      
      expect(parsed).toEqual(mockRecord)
    })

    it('should save record to latest file', async () => {
      await storage.save(mockRecord)
      
      const latestFile = path.join(TEST_ROOT, 'latest.json')
      const content = await fs.readFile(latestFile, 'utf8')
      const parsed = JSON.parse(content)
      
      expect(parsed).toEqual(mockRecord)
    })
  })

  describe('readLatest', () => {
    it('should return null when no latest file exists', async () => {
      const result = await storage.readLatest()
      expect(result).toBe(null)
    })

    it('should return latest record when file exists', async () => {
      await storage.save(mockRecord)
      
      const result = await storage.readLatest()
      expect(result).toEqual(mockRecord)
    })

    it('should throw error for non-ENOENT errors', async () => {
      // Create a directory with the same name as latest.json to cause a read error
      await fs.mkdir(TEST_ROOT, { recursive: true })
      await fs.mkdir(path.join(TEST_ROOT, 'latest.json'))
      
      await expect(storage.readLatest()).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should return empty array when directory does not exist', async () => {
      const result = await storage.list()
      expect(result).toEqual([])
    })

    it('should return empty array when no dated files exist', async () => {
      await fs.mkdir(TEST_ROOT, { recursive: true })
      
      const result = await storage.list()
      expect(result).toEqual([])
    })

    it('should return list of records sorted by date descending', async () => {
      const record1 = { ...mockRecord, dateKey: '2025-11-10' }
      const record2 = { ...mockRecord, dateKey: '2025-11-11' }
      const record3 = { ...mockRecord, dateKey: '2025-11-12' }
      
      await storage.save(record1)
      await storage.save(record2)
      await storage.save(record3)
      
      const result = await storage.list()
      
      expect(result).toHaveLength(3)
      expect(result[0].dateKey).toBe('2025-11-12')
      expect(result[1].dateKey).toBe('2025-11-11')
      expect(result[2].dateKey).toBe('2025-11-10')
    })

    it('should respect limit parameter', async () => {
      const record1 = { ...mockRecord, dateKey: '2025-11-10' }
      const record2 = { ...mockRecord, dateKey: '2025-11-11' }
      const record3 = { ...mockRecord, dateKey: '2025-11-12' }
      
      await storage.save(record1)
      await storage.save(record2)
      await storage.save(record3)
      
      const result = await storage.list(2)
      
      expect(result).toHaveLength(2)
      expect(result[0].dateKey).toBe('2025-11-12')
      expect(result[1].dateKey).toBe('2025-11-11')
    })

    it('should ignore latest.json file', async () => {
      await storage.save(mockRecord)
      
      const result = await storage.list()
      
      expect(result).toHaveLength(1)
      expect(result[0].dateKey).toBe(mockRecord.dateKey)
    })

    it('should throw error for non-ENOENT errors', async () => {
      // Create a file with the same name as the directory to cause a readdir error
      await fs.mkdir(path.dirname(TEST_ROOT), { recursive: true })
      await fs.writeFile(TEST_ROOT, 'not a directory')
      
      await expect(storage.list()).rejects.toThrow()
    })
  })

  describe('createFileStorage', () => {
    it('should create FileStorage instance', () => {
      const storage = createFileStorage({ rootDir: '/test' })
      expect(storage).toBeDefined()
      expect(typeof storage.save).toBe('function')
      expect(typeof storage.readLatest).toBe('function')
      expect(typeof storage.list).toBe('function')
    })
  })
})