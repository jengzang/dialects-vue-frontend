import { describe, expect, it } from 'vitest';

import { limitEffectiveChars } from '../src/main/utils/query/queryLimits.js';

describe('limitEffectiveChars', () => {
  it('keeps unique CJK characters within the limit', () => {
    expect(limitEffectiveChars('漢字 測試', 10)).toEqual({
      value: '漢字測試',
      effectiveCount: 4,
      hasExtraEffectiveChars: false,
      wasTrimmedAfterLimit: false,
    });
  });

  it('truncates after ten unique CJK characters and removes whitespace', () => {
    expect(limitEffectiveChars('天地 玄黃\n宇宙 洪荒 日月盈昃', 10)).toEqual({
      value: '天地玄黃宇宙洪荒日月',
      effectiveCount: 10,
      hasExtraEffectiveChars: true,
      wasTrimmedAfterLimit: true,
    });
  });

  it('drops trailing whitespace without reporting character truncation', () => {
    expect(limitEffectiveChars('天地玄黃宇宙洪荒日月  \n', 10)).toEqual({
      value: '天地玄黃宇宙洪荒日月',
      effectiveCount: 10,
      hasExtraEffectiveChars: false,
      wasTrimmedAfterLimit: false,
    });
  });
});
