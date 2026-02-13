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

  it('includes editorial review metadata and rich item formats', () => {
    const curriculum = listCurriculum(true);

    for (const lesson of curriculum) {
      expect(lesson.editorial).toBeDefined();
      expect(lesson.editorial?.reviewer.length).toBeGreaterThan(0);
      expect(lesson.items.length).toBeGreaterThanOrEqual(2);
      expect(lesson.items.some((item) => item.explanation)).toBe(true);
      expect(lesson.items.some((item) => item.format === 'mcq' || item.format === 'scenario' || item.format === 'numeric')).toBe(true);
    }

    const mixedFormatLessons = curriculum.filter((lesson) => {
      const formats = new Set(lesson.items.map((item) => item.format));
      return formats.size >= 2;
    });

    expect(mixedFormatLessons.length).toBeGreaterThanOrEqual(30);
  });
});
