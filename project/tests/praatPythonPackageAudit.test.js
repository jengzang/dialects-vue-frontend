import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(testsDir, '../..')
const packageRoot = resolve(repoRoot, 'native/praat-python/praat_mobile')

function readPackageFile(relativePath) {
  return readFileSync(resolve(packageRoot, relativePath), 'utf8')
}

describe('mobile Praat Python package audit', () => {
  it('contains a copied local runner package for native builds', () => {
    expect(existsSync(resolve(packageRoot, '__init__.py'))).toBe(true)
    expect(existsSync(resolve(packageRoot, 'run_analysis.py'))).toBe(true)
    expect(existsSync(resolve(packageRoot, 'modules/pitch.py'))).toBe(true)
    expect(existsSync(resolve(packageRoot, 'modules/formant.py'))).toBe(true)
  })

  it('keeps backend server runtime concerns out of the mobile package', () => {
    const filesToAudit = [
      '__init__.py',
      'run_analysis.py',
      'modules/__init__.py',
      'modules/basic.py',
      'modules/pitch.py',
      'modules/intensity.py',
      'modules/formant.py',
      'modules/voice_quality.py',
      'modules/segments.py',
      'modules/spectrogram.py',
      'tone_features.py',
      'result_builder.py',
    ]
    const combinedSource = filesToAudit.map(readPackageFile).join('\n')

    expect(combinedSource).not.toContain('fastapi')
    expect(combinedSource).not.toContain('task_manager')
    expect(combinedSource).not.toContain('file_manager')
    expect(combinedSource).not.toContain('ProgressHeartbeat')
    expect(combinedSource).not.toContain('CLEANUP_POLICY')
    expect(combinedSource).not.toContain('HTTPException')
  })

  it('documents that local input and normalized audio are temporary while results are retained', () => {
    const runner = readPackageFile('run_analysis.py')

    expect(runner).toContain('TEMPORARY_AUDIO_POLICY')
    expect(runner).toContain('"original_input": "delete-after-analysis"')
    expect(runner).toContain('"normalized_audio": "delete-after-analysis"')
    expect(runner).toContain('"result_json": "retain"')
    expect(runner).toContain('"run_metadata": "retain"')
  })
})
