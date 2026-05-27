export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
};

export const AVAILABLE_MODELS: ChatModel[] = [
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air (Fast)',
    provider: 'Zhipu',
    isFree: true,
  },
  {
    id: 'tencent/hy3-preview:free',
    name: 'Hunyuan 3 Preview',
    provider: 'Tencent',
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
    name: 'Nemotron 3 Super 120B',
    provider: 'NVIDIA',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'Nemotron 3 Nano 30B',
    provider: 'NVIDIA',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nemotron Nano 12B VL',
    provider: 'NVIDIA',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-nano-9b-v2:free',
    name: 'Nemotron Nano 9B',
    provider: 'NVIDIA',
    isFree: true,
  },
];
