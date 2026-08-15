import { describe, it, expect } from 'vitest';
import { isCodeDump, MAX_CODE_LINES } from './replyFilter';

const fenced = (lines: number) =>
  ['```ts', ...Array.from({ length: lines }, (_, i) => `const a${i} = ${i};`), '```'].join('\n');

describe('isCodeDump', () => {
  describe('when the assistant answers about the portfolio', () => {
    it('passes plain prose', () => {
      expect(isCodeDump('I worked on a CTRM platform at Graintrack for a year.')).toBe(false);
    });

    it('passes an inline mention of a technology', () => {
      expect(isCodeDump('I used `RxJS` pipelines instead of component state.')).toBe(false);
    });

    it('passes a short snippet that illustrates a point', () => {
      expect(
        isCodeDump(
          `Here is the shape of that pipeline:\n${fenced(4)}\nIt kept logic out of components.`
        )
      ).toBe(false);
    });

    it('passes a snippet sitting exactly at the limit', () => {
      expect(isCodeDump(fenced(MAX_CODE_LINES))).toBe(false);
    });
  });

  describe('when the assistant slips into writing code for the visitor', () => {
    it('flags a snippet one line past the limit', () => {
      expect(isCodeDump(fenced(MAX_CODE_LINES + 1))).toBe(true);
    });

    it('flags a full tutorial', () => {
      expect(isCodeDump(`Here are the common options:\n${fenced(30)}`)).toBe(true);
    });

    it('counts code split across several blocks', () => {
      const half = Math.ceil((MAX_CODE_LINES + 2) / 2);
      expect(isCodeDump(`First:\n${fenced(half)}\nSecond:\n${fenced(half)}`)).toBe(true);
    });

    it('flags a block the model never closed', () => {
      const unclosed = ['```ts', ...Array.from({ length: 40 }, (_, i) => `line ${i}`)].join('\n');
      expect(isCodeDump(unclosed)).toBe(true);
    });
  });

  describe('when the reply is empty', () => {
    it('reports no code dump', () => {
      expect(isCodeDump('')).toBe(false);
    });
  });
});
