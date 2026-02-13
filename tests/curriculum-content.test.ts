import { describe, expect, it } from 'vitest';
import { listCurriculum } from '../src/data.js';

describe('curriculum content depth', () => {
  it('meets MVP target ranges for lesson and item volume', () => {
    const curriculum = listCurriculum(true);
    const itemCount = curriculum.reduce((sum, lesson) => sum + lesson.items.length, 0);

    expect(curriculum.length).toBeGreaterThanOrEqual(60);
    expect(curriculum.length).toBeLessThanOrEqual(100);
    expect(itemCount).toBeGreaterThanOrEqual(400);
    expect(itemCount).toBeLessThanOrEqual(700);
  });

  it('covers all finance levels with both free and premium pathways', () => {
    const curriculum = listCurriculum(true);
    const levels = new Set(curriculum.map((lesson) => lesson.level));

    expect(levels).toEqual(new Set(['F1', 'F2', 'F3', 'F4', 'F5', 'F6']));
    expect(curriculum.some((lesson) => lesson.premium)).toBe(true);
    expect(curriculum.some((lesson) => !lesson.premium)).toBe(true);
  });
});
