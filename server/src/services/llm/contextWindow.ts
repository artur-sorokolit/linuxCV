import { ChatMessage } from '../../types';

// Byte-pair encoders split latin prose at roughly 2.5 characters per token and
// cyrillic far more finely, so the two are weighted apart. The estimate is
// deliberately pessimistic: overshooting the budget costs a rejected request.
const LATIN_CHARS_PER_TOKEN = 2.5;
const WIDE_CHARS_PER_TOKEN = 1.6;

type Exchange = readonly [ChatMessage, ChatMessage];

export const estimateTokens = (text: string): number => {
  const wide = (text.match(/[^\x20-\x7e]/g) || []).length;
  const latin = text.length - wide;
  return Math.ceil(latin / LATIN_CHARS_PER_TOKEN + wide / WIDE_CHARS_PER_TOKEN);
};

const exchangeCost = ([question, answer]: Exchange): number =>
  estimateTokens(question.content) + estimateTokens(answer.content);

const toExchanges = (history: ChatMessage[]): Exchange[] =>
  history.reduce<{ pending: ChatMessage | null; exchanges: Exchange[] }>(
    (acc, message) => {
      if (message.role === 'user') {
        return { ...acc, pending: message };
      }
      if (message.role === 'assistant' && acc.pending) {
        return { pending: null, exchanges: [...acc.exchanges, [acc.pending, message]] };
      }
      return acc;
    },
    { pending: null, exchanges: [] }
  ).exchanges;

/** Newest complete exchanges that fit the budget, oldest first, never split mid-exchange. */
export const fitHistoryToBudget = (history: ChatMessage[], budgetTokens: number): ChatMessage[] => {
  if (budgetTokens <= 0) {
    return [];
  }

  return toExchanges(history)
    .reduceRight<{ used: number; exhausted: boolean; kept: Exchange[] }>(
      (acc, exchange) => {
        const cost = exchangeCost(exchange);
        if (acc.exhausted || acc.used + cost > budgetTokens) {
          return { ...acc, exhausted: true };
        }
        return { used: acc.used + cost, exhausted: false, kept: [exchange, ...acc.kept] };
      },
      { used: 0, exhausted: false, kept: [] }
    )
    .kept.flat();
};
