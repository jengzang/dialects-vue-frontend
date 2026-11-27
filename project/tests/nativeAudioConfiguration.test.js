import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

describe('native incoming audio configuration', () => {
  it('registers Android audio sharing and document opening', () => {
    const manifest = read('android/app/src/main/AndroidManifest.xml')
    expect(manifest).toContain('android.intent.action.SEND')
    expect(manifest).toContain('android.intent.action.VIEW')
    expect(manifest).toContain('android:mimeType="audio/*"')
    expect(read('android/app/src/main/java/top/yzup/dialects/MainActivity.java')).toContain('registerPlugin(DialectsNativePlugin.class)')
  })
  it('embeds the iOS share extension and shares the same App Group', () => {
    const project = read('ios/App/App.xcodeproj/project.pbxproj')
    expect(project).toContain('com.apple.product-type.app-extension')
    expect(project).toContain('Embed App Extensions')
    for (const path of ['ios/App/App/App.entitlements', 'ios/App/AudioShare/AudioShare.entitlements']) {
      expect(read(path)).toContain('group.top.yzup.dialects')
    }
    expect(read('ios/App/App/Info.plist')).toContain('public.audio')
    expect(read('ios/App/AudioShare/Info.plist')).toContain('com.apple.share-services')
  })
})
