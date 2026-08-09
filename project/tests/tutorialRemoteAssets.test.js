import { describe, expect, it } from 'vitest'

import {
  resolveTutorialAssetUrl,
  resolveTutorialDocument,
} from '../src/main/components/tutorial/tutorialMarkdown.js'

describe('tutorial remote assets', () => {
  it('keeps bundled tutorial image paths for web builds', () => {
    expect(resolveTutorialAssetUrl('/tutorial/menu-query-char/01-输入页面.webp', {
      isNativeBuild: false,
      webBase: 'https://dialects.yzup.top',
    })).toBe('/tutorial/menu-query-char/01-输入页面.webp')
  })

  it('points native tutorial image paths at the remote web base', () => {
    expect(resolveTutorialAssetUrl('/tutorial/menu-query-char/01-输入页面.webp', {
      isNativeBuild: true,
      webBase: 'https://dialects.yzup.top/',
    })).toBe('https://dialects.yzup.top/tutorial/menu-query-char/01-输入页面.webp')
  })

  it('rewrites tutorial image HTML in native builds without changing non-tutorial images', () => {
    const document = resolveTutorialDocument('menu-query-char', 'zh-CN', {
      isNativeBuild: true,
      webBase: 'https://dialects.yzup.top',
    })

    expect(document.html).toContain('src="https://dialects.yzup.top/tutorial/menu-query-char/01-%E8%BE%93%E5%85%A5%E9%A1%B5%E9%9D%A2.webp"')
    expect(resolveTutorialAssetUrl('/assets/logo.webp', {
      isNativeBuild: true,
      webBase: 'https://dialects.yzup.top',
    })).toBe('/assets/logo.webp')
  })
})
