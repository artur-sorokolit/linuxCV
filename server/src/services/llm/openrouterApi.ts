export const CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const buildHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://artur-sorokolit.uk',
  'X-Title': 'linuxCV',
});

export interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}
