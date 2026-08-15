import { describe, it, expect } from 'vitest';
import { estimateTokens, fitHistoryToBudget } from './contextWindow';
import type { ChatMessage } from '../../types';

const turn = (index: number, size = 40): ChatMessage[] => [
  { role: 'user', content: `q${index}`.padEnd(size, 'x') },
  { role: 'assistant', content: `a${index}`.padEnd(size, 'y') },
];

const conversation = (turns: number, size = 40): ChatMessage[] =>
  Array.from({ length: turns }, (_, i) => turn(i, size)).flat();

describe('estimateTokens', () => {
  it('counts latin text at the usual character density', () => {
    expect(estimateTokens('a'.repeat(100))).toBe(40);
  });

  it('counts cyrillic text more pessimistically than latin', () => {
    const cyrillic = estimateTokens('я'.repeat(100));
    const latin = estimateTokens('a'.repeat(100));

    expect(cyrillic).toBeGreaterThan(latin);
  });

  it('counts an empty string as nothing', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('fitHistoryToBudget', () => {
  describe('when the history already fits', () => {
    it('returns every message untouched', () => {
      const history = conversation(2);

      expect(fitHistoryToBudget(history, 10000)).toEqual(history);
    });
  });

  describe('when the history exceeds the budget', () => {
    it('keeps the most recent exchanges', () => {
      const history = conversation(10);

      const fitted = fitHistoryToBudget(history, 100);

      expect(fitted.at(-1)).toEqual(history.at(-1));
      expect(fitted.length).toBeLessThan(history.length);
    });

    it('drops whole exchanges so the history still starts with a user turn', () => {
      const history = conversation(10);

      const fitted = fitHistoryToBudget(history, 100);

      expect(fitted[0]?.role).toBe('user');
    });

    it('keeps the alternating user and assistant order intact', () => {
      const history = conversation(10);

      const fitted = fitHistoryToBudget(history, 100);
      const roles = fitted.map((m) => m.role);

      expect(roles).toEqual(roles.map((_, i) => (i % 2 === 0 ? 'user' : 'assistant')));
    });

    it('returns nothing when not even one exchange fits', () => {
      const history = conversation(4, 4000);

      expect(fitHistoryToBudget(history, 10)).toEqual([]);
    });
  });

  describe('when the budget is gone entirely', () => {
    it('returns nothing rather than a partial exchange', () => {
      expect(fitHistoryToBudget(conversation(3), 0)).toEqual([]);
    });

    it('treats a negative budget as no room at all', () => {
      expect(fitHistoryToBudget(conversation(3), -500)).toEqual([]);
    });
  });

  describe('when the stored history is malformed', () => {
    it('discards a trailing user turn left behind by a failed write', () => {
      const history: ChatMessage[] = [...conversation(1), { role: 'user', content: 'orphaned' }];

      const fitted = fitHistoryToBudget(history, 10000);

      expect(fitted).toEqual(conversation(1));
    });

    it('discards a leading assistant turn with no question before it', () => {
      const history: ChatMessage[] = [
        { role: 'assistant', content: 'dangling' },
        ...conversation(1),
      ];

      const fitted = fitHistoryToBudget(history, 10000);

      expect(fitted).toEqual(conversation(1));
    });
  });
});
