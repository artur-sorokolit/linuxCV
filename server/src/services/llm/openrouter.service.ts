import axios from 'axios';
import { LLMProvider, ChatMessage } from '../../types';
import { config } from '../../config/env';
import { llmConfig } from '../../config/llm';

export class OpenRouterService implements LLMProvider {
  private readonly apiKey = config.openrouterApiKey;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  async chat(message: string, history: ChatMessage[], model?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      const messages = [
        { role: 'system', content: llmConfig.systemPrompt },
        ...history,
        { role: 'user', content: message },
      ];
      console.log('Sending messages to OpenRouter:', JSON.stringify(messages, null, 2));

      const response = await axios.post(
        this.apiUrl,
        {
          model: model || llmConfig.model,
          messages,
          temperature: llmConfig.temperature,
          max_tokens: llmConfig.maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://linuxcv.dev',
            'X-Title': 'linuxCV',
          },
        }
      );

      return response.data.choices?.[0]?.message?.content || 'No response from AI.';
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 429) {
          const limitErr = new Error(
            'Rate limit reached for this model. Please try another model or wait a moment.'
          );
          Object.assign(limitErr, { code: 'RATE_LIMIT_EXCEEDED', status: 429 });
          throw limitErr;
        }
        if (status === 401) {
          const authErr = new Error('Invalid API Key. Please check your OpenRouter configuration.');
          Object.assign(authErr, { code: 'AUTH_ERROR', status: 401 });
          throw authErr;
        }
        if (data?.error?.message) {
          throw new Error(`OpenRouter Error: ${data.error.message}`);
        }
      }
      throw error;
    }
  }
}
