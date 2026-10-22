import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(import.meta.dirname, '..')
const fixturePath = resolve(projectRoot, 'tests/fixtures/praat-smoke.wav')

function readAscii(buffer, start, length) {
  return buffer.subarray(start, start + length).toString('ascii')
}

function parseWavHeader(buffer) {
  return {
    riff: readAscii(buffer, 0, 4),
    wave: readAscii(buffer, 8, 4),
    format: readAscii(buffer, 12, 4),
    audioFormat: buffer.readUInt16LE(20),
    channels: buffer.readUInt16LE(22),
    sampleRate: buffer.readUInt32LE(24),
    bitsPerSample: buffer.readUInt16LE(34),
    dataMarker: readAscii(buffer, 36, 4),
    dataSize: buffer.readUInt32LE(40),
  }
}

describe('Praat smoke audio fixture', () => {
  it('provides a tiny valid PCM WAV sample for three-platform Praat checks', () => {
    const buffer = readFileSync(fixturePath)
    const header = parseWavHeader(buffer)
    const bytesPerSample = header.bitsPerSample / 8
    const durationSeconds = header.dataSize / (header.sampleRate * header.channels * bytesPerSample)

    expect(header).toMatchObject({
      riff: 'RIFF',
      wave: 'WAVE',
      format: 'fmt ',
      audioFormat: 1,
      channels: 1,
      sampleRate: 16000,
      bitsPerSample: 16,
      dataMarker: 'data',
    })
    expect(buffer.byteLength).toBeLessThan(20 * 1024)
    expect(durationSeconds).toBeGreaterThan(0.45)
    expect(durationSeconds).toBeLessThan(0.55)
  })
})
