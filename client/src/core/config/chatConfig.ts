export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
};

export const AVAILABLE_MODELS: ChatModel[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    isFree: true,
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Gemma 4 31B',
    provider: 'Google',
    isFree: true,
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen 3 Coder',
    provider: 'Qwen',
    isFree: true,
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 405B',
    provider: 'Nous',
    isFree: true,
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT-OSS 120B',
    provider: 'OpenAI (OSS)',
    isFree: true,
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'GPT-OSS 20B',
    provider: 'OpenAI (OSS)',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'Nemotron 3 Super',
    provider: 'NVIDIA',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    provider: 'Meta',
    isFree: true,
  },
];
