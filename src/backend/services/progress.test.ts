import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  setStatus: vi.fn(),
  clearStatus: vi.fn(),
  insertCompleted: vi.fn(),
  recordActivity: vi.fn(),
  listStatuses: vi.fn(),
  listActivity: vi.fn(),
}))
vi.mock('../repositories/progress.ts', () => repository)

const { clearStatus, markLessonsRead, setStatus } = await import('./progress.ts')

beforeEach(() => { Object.values(repository).forEach((mock) => mock.mockReset()) })

describe('progress service activity log', () => {
  it('records an event after saving a status', async () => {
    await setStatus('u1', 'aws-saa-c03', 'aws-saa-c03:item-0001', 'in_progress')
    expect(repository.setStatus).toHaveBeenCalledWith('u1', 'aws-saa-c03', 'aws-saa-c03:item-0001', 'in_progress')
    expect(repository.recordActivity).toHaveBeenCalledWith('u1', 'aws-saa-c03', 'aws-saa-c03:item-0001', 'in_progress')
  })

  it('records a clear as not_started', async () => {
    await clearStatus('u1', 'MCP', 'MCP:item-0001')
    expect(repository.recordActivity).toHaveBeenCalledWith('u1', 'MCP', 'MCP:item-0001', 'not_started')
  })

  it('still succeeds when the event cannot be stored', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    repository.recordActivity.mockRejectedValue(new Error('atlas down'))
    await expect(setStatus('u1', 'aws-saa-c03', 'aws-saa-c03:item-0001', 'completed')).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })

  it('does not record when the status write fails', async () => {
    repository.setStatus.mockRejectedValue(new Error('write failed'))
    await expect(setStatus('u1', 'aws-saa-c03', 'aws-saa-c03:item-0001', 'completed')).rejects.toThrow('write failed')
    expect(repository.recordActivity).not.toHaveBeenCalled()
  })
})

describe('markLessonsRead', () => {
  it('saves each lesson once and logs only the lessons that were not read yet', async () => {
    repository.insertCompleted.mockResolvedValue(['MCP:lesson-0008'])
    await markLessonsRead('u1', 'MCP', ['MCP:lesson-0007', 'MCP:lesson-0008', 'MCP:lesson-0007'])
    expect(repository.insertCompleted).toHaveBeenCalledWith('u1', 'MCP', ['MCP:lesson-0007', 'MCP:lesson-0008'])
    expect(repository.recordActivity).toHaveBeenCalledTimes(1)
    expect(repository.recordActivity).toHaveBeenCalledWith('u1', 'MCP', 'MCP:lesson-0008', 'completed')
    expect(repository.setStatus).not.toHaveBeenCalled()
  })

  it('logs nothing when the save fails', async () => {
    repository.insertCompleted.mockRejectedValue(new Error('write failed'))
    await expect(markLessonsRead('u1', 'MCP', ['MCP:lesson-0007'])).rejects.toThrow('write failed')
    expect(repository.recordActivity).not.toHaveBeenCalled()
  })
})
