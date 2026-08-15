/** A snippet illustrating Artur's own work is welcome; a tutorial is not. */
export const MAX_CODE_LINES = 12;

const FENCE = /^\s*```/;

const countFencedLines = (reply: string): number =>
  reply.split('\n').reduce<{ inside: boolean; lines: number }>(
    (acc, line) => {
      if (FENCE.test(line)) {
        return { inside: !acc.inside, lines: acc.lines };
      }
      return { inside: acc.inside, lines: acc.inside ? acc.lines + 1 : acc.lines };
    },
    { inside: false, lines: 0 }
  ).lines;

export const isCodeDump = (reply: string): boolean => countFencedLines(reply) > MAX_CODE_LINES;
