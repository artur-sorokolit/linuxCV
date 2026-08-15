import { describe, it, expect } from 'vitest';
import { buildRefusal } from './refusal';

describe('buildRefusal', () => {
  it('answers a cyrillic question in ukrainian', () => {
    expect(buildRefusal('як написати функцію сортування')).toMatch(/Артур/);
  });

  it('answers a latin question in english', () => {
    expect(buildRefusal('how do I write a sorting function')).toMatch(/Artur/);
  });

  it('treats a mixed question with cyrillic as ukrainian', () => {
    expect(buildRefusal('напиши мені quick sort на TypeScript')).toMatch(/Артур/);
  });

  it('points the visitor at something it can actually answer', () => {
    expect(buildRefusal('what is the capital of France')).toMatch(/experience|projects|stack/i);
  });

  it('never leaves the visitor without a next step in ukrainian', () => {
    expect(buildRefusal('столиця Франції')).toMatch(/досвід|проєкт|стек/i);
  });
});
