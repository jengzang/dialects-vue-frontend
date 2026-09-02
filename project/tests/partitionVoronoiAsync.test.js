import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  calculatePartitionVoronoi: vi.fn(),
}))

vi.mock('@/main/utils/drawMap/partitionVoronoi.js', () => ({
  calculatePartitionVoronoi: mocks.calculatePartitionVoronoi,
}))

async function importAsyncModule() {
  vi.resetModules()
  return import('../src/main/utils/drawMap/partitionVoronoiAsync.js')
}

describe('partitionVoronoiAsync', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    mocks.calculatePartitionVoronoi.mockReset()
  })

  it('falls back to the sync calculator when Worker construction fails', async () => {
    vi.stubGlobal('Worker', class {
      constructor() {
        throw new Error('worker unavailable')
      }
    })
    mocks.calculatePartitionVoronoi.mockReturnValue({ merged: { features: ['fallback'] } })

    const { calculatePartitionVoronoiAsync } = await importAsyncModule()
    const result = await calculatePartitionVoronoiAsync([{ name: 'A' }], 1, { A: {} }, 50)

    expect(result).toEqual({ merged: { features: ['fallback'] } })
    expect(mocks.calculatePartitionVoronoi).toHaveBeenCalledWith([{ name: 'A' }], 1, { A: {} }, 50)
  })

  it('falls back to the sync calculator when posting to the worker fails', async () => {
    vi.stubGlobal('Worker', class {
      postMessage() {
        throw new Error('post failed')
      }
    })
    mocks.calculatePartitionVoronoi.mockReturnValue({ merged: { features: ['posted-fallback'] } })

    const { calculatePartitionVoronoiAsync } = await importAsyncModule()
    const result = await calculatePartitionVoronoiAsync([{ name: 'B' }], 2, { B: {} }, -1)

    expect(result).toEqual({ merged: { features: ['posted-fallback'] } })
    expect(mocks.calculatePartitionVoronoi).toHaveBeenCalledWith([{ name: 'B' }], 2, { B: {} }, -1)
  })

  it('falls back to the sync calculator for pending requests when the worker errors', async () => {
    let workerInstance
    vi.stubGlobal('Worker', class {
      constructor() {
        workerInstance = this
      }

      postMessage() {}

      terminate() {}
    })
    mocks.calculatePartitionVoronoi.mockReturnValue({ merged: { features: ['error-fallback'] } })

    const { calculatePartitionVoronoiAsync } = await importAsyncModule()
    const resultPromise = calculatePartitionVoronoiAsync([{ name: 'C' }], 3, { C: {} }, 25)
    workerInstance.onerror({ message: 'worker crashed' })
    const result = await resultPromise

    expect(result).toEqual({ merged: { features: ['error-fallback'] } })
    expect(mocks.calculatePartitionVoronoi).toHaveBeenCalledWith([{ name: 'C' }], 3, { C: {} }, 25)
  })
})
