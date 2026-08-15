import axios from 'axios';
import { config } from '../../config/env';
import { llmConfig } from '../../config/llm';
import { CHAT_COMPLETIONS_URL, buildHeaders, ChatCompletionResponse } from './openrouterApi';

const GATE_TIMEOUT_MS = 8_000;
const GATE_MAX_TOKENS = 20;
const MAX_CACHED_VERDICTS = 500;

/**
 * Deliberately lenient: it only has to catch visitors using the portfolio as a
 * general assistant. Anything it cannot judge goes through to the main model,
 * which still has its own scope rules and the reply filter behind it.
 */
const FILTER_PROMPT = `You decide whether a message belongs in a chat about Artur Sorokolit, a software engineer, on his personal portfolio site.

Reply with exactly one word: ALLOW or BLOCK.

ALLOW anything about Artur or the site: his experience, skills, projects, education, contacts, availability, salary, relocation, working with him, plus greetings and small talk.

BLOCK only when the message clearly wants something unrelated to Artur, such as writing or debugging the visitor's own code, programming tutorials, homework, or general knowledge questions.

When in doubt, answer ALLOW.`;

export interface ScopeGate {
  isInScope(question: string): Promise<boolean>;
}

export class OpenRouterScopeGate implements ScopeGate {
  private readonly verdicts = new Map<string, boolean>();

  constructor(private readonly apiKey = config.openrouterApiKey) {}

  async isInScope(question: string): Promise<boolean> {
    if (!this.apiKey) {
      return true;
    }

    const key = question.trim().toLowerCase();
    const cached = this.verdicts.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const verdict = await this.askFilter(question, this.apiKey);
    if (verdict === null) {
      return true;
    }

    this.remember(key, verdict);
    return verdict;
  }

  private remember(key: string, verdict: boolean): void {
    if (this.verdicts.size >= MAX_CACHED_VERDICTS) {
      const oldest = this.verdicts.keys().next().value;
      if (oldest !== undefined) {
        this.verdicts.delete(oldest);
      }
    }
    this.verdicts.set(key, verdict);
  }

  /** null means "no usable verdict", which the caller treats as allowed. */
  private async askFilter(question: string, apiKey: string): Promise<boolean | null> {
    try {
      const response = await axios.post<ChatCompletionResponse>(
        CHAT_COMPLETIONS_URL,
        {
          model: llmConfig.scopeGateModel,
          messages: [
            { role: 'system', content: FILTER_PROMPT },
            { role: 'user', content: question },
          ],
          temperature: 0,
          max_tokens: GATE_MAX_TOKENS,
          // Without this the model spends the whole budget thinking and returns
          // no content, which the parser reads as "no verdict" and lets everything past.
          reasoning: { enabled: false },
        },
        { headers: buildHeaders(apiKey), timeout: GATE_TIMEOUT_MS }
      );

      const verdict = response.data.choices?.[0]?.message?.content?.trim().toUpperCase();
      if (verdict?.startsWith('BLOCK')) {
        return false;
      }
      return verdict?.startsWith('ALLOW') ? true : null;
    } catch (error: unknown) {
      console.warn(
        `⚠️ Scope gate unavailable, letting the question through: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }
}

export const scopeGate = new OpenRouterScopeGate();
