import { describe, expect, it, vi } from 'vitest'
import { useAsyncTask } from '../src/composables/core/useAsyncTask.js'

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

describe('async task concurrency', () => {
  it('keeps parallel tasks busy until all requests finish', async () => {
    const task = useAsyncTask()
    const a = deferred(), b = deferred()
    const first = task.run(() => a.promise)
    const second = task.run(() => b.promise)
    b.resolve('new')
    await second
    expect(task.loading.value).toBe(true)
    a.resolve('old')
    await first
    expect(task.loading.value).toBe(false)
  })

  it('only publishes the latest result when latest mode is selected', async () => {
    const onSuccess = vi.fn()
    const task = useAsyncTask({ concurrency: 'latest', onSuccess })
    const a = deferred(), b = deferred()
    const first = task.run(() => a.promise)
    const second = task.run(() => b.promise)
    b.resolve('new')
    await second
    expect(task.loading.value).toBe(false)
    a.resolve('old')
    expect(await first).toBeNull()
    expect(onSuccess.mock.calls).toEqual([['new']])
  })

  it('does not publish stale errors or finalizers in latest mode', async () => {
    const onError = vi.fn(), onFinally = vi.fn()
    const task = useAsyncTask({ concurrency: 'latest', onError, onFinally })
    const a = deferred()
    const first = task.run(() => a.promise)
    await task.run(async () => 'new')
    a.reject(new Error('old failure'))
    await first
    expect(task.error.value).toBeNull()
    expect(onError).not.toHaveBeenCalled()
    expect(onFinally).toHaveBeenCalledTimes(1)
  })

  it('rejects reentry without executing the second task in drop mode', async () => {
    const task = useAsyncTask({ concurrency: 'drop' })
    const a = deferred(), duplicate = vi.fn()
    const first = task.run(() => a.promise)
    expect(await task.run(duplicate)).toBeNull()
    expect(duplicate).not.toHaveBeenCalled()
    a.resolve('ok')
    await first
  })

  it('reset invalidates pending callbacks without clearing a subsequent task', async () => {
    const onSuccess = vi.fn()
    const task = useAsyncTask({ onSuccess })
    const a = deferred(), b = deferred()
    const first = task.run(() => a.promise)
    task.reset()
    const second = task.run(() => b.promise)
    a.resolve('old')
    await first
    expect(task.loading.value).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()
    b.resolve('new')
    await second
    expect(onSuccess.mock.calls).toEqual([['new']])
  })
})
