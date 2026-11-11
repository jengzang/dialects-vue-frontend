import { describe, expect, it } from 'vitest';

import {
  buildEvolutionMobileDetail,
  isSameEvolutionMobileDetail,
} from '../src/utils/EchartHover/evolutionDetail.js';

describe('buildEvolutionMobileDetail', () => {
  it('builds level2 detail data and truncates nested character lists to 10 items', () => {
    const detail = buildEvolutionMobileDetail({
      pie: {
        value: '開口',
        level1: [
          {
            label: '幫',
            count: 12,
            percent: '40.0',
            level2: [
              {
                label: '一等',
                count: 8,
                percent: '66.7',
                chars: ['天', '地', '玄', '黃', '宇', '宙', '洪', '荒', '日', '月', '盈'],
              },
            ],
          },
        ],
      },
      pieIndex: 2,
      itemIndex: 0,
    });

    expect(detail).toEqual({
      key: '2:0',
      pieIndex: 2,
      itemIndex: 0,
      pieTitle: '開口',
      title: '幫',
      count: 12,
      percent: '40.0',
      level2Items: [
        {
          label: '一等',
          count: 8,
          percent: '66.7',
          displayChars: ['天', '地', '玄', '黃', '宇', '宙', '洪', '荒', '日', '月'],
          remainingChars: 1,
        },
      ],
      displayChars: [],
      remainingChars: 0,
    });
  });

  it('builds top-level character previews and truncates them to 15 items', () => {
    const detail = buildEvolutionMobileDetail({
      pie: {
        level1_value: '幫母',
        phonetic_values: [
          {
            value: 'p',
            count: 18,
            percent: '90.0',
            chars: ['天', '地', '玄', '黃', '宇', '宙', '洪', '荒', '日', '月', '盈', '昃', '辰', '宿', '列', '張'],
          },
        ],
      },
      pieIndex: 0,
      itemIndex: 0,
    });

    expect(detail).toEqual({
      key: '0:0',
      pieIndex: 0,
      itemIndex: 0,
      pieTitle: '幫母',
      title: 'p',
      count: 18,
      percent: '90.0',
      level2Items: [],
      displayChars: ['天', '地', '玄', '黃', '宇', '宙', '洪', '荒', '日', '月', '盈', '昃', '辰', '宿', '列'],
      remainingChars: 1,
    });
  });
});

describe('isSameEvolutionMobileDetail', () => {
  it('matches details by pie and item indices', () => {
    expect(
      isSameEvolutionMobileDetail(
        { pieIndex: 1, itemIndex: 2 },
        { pieIndex: 1, itemIndex: 2 },
      ),
    ).toBe(true);

    expect(
      isSameEvolutionMobileDetail(
        { pieIndex: 1, itemIndex: 2 },
        { pieIndex: 1, itemIndex: 3 },
      ),
    ).toBe(false);
  });
});
