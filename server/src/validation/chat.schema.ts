import { z } from 'zod';

export const MAX_MESSAGE_LENGTH = 4000;
const MAX_TITLE_LENGTH = 120;
const MAX_MODEL_ID_LENGTH = 120;

const modelId = z.string().trim().min(1).max(MAX_MODEL_ID_LENGTH);

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  sessionId: z.uuid(),
  model: modelId,
});

export const createSessionSchema = z.object({
  model: modelId,
  title: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.slice(0, MAX_TITLE_LENGTH))
    .default('New Chat'),
});

export const sessionIdSchema = z.object({
  id: z.uuid(),
});

export type ChatMessageRequest = z.infer<typeof chatMessageSchema>;
export type CreateSessionRequest = z.infer<typeof createSessionSchema>;
