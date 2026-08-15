import { describe, it, expect } from 'vitest';
import { chatMessageSchema, createSessionSchema, sessionIdSchema } from './chat.schema';

const VALID_SESSION_ID = '3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const VALID_MODEL = 'nvidia/nemotron-nano-9b-v2:free';

describe('chat request validation', () => {
  describe('when a visitor sends a message', () => {
    it('accepts a well formed request', () => {
      const result = chatMessageSchema.safeParse({
        message: 'What is your experience?',
        sessionId: VALID_SESSION_ID,
        model: VALID_MODEL,
      });

      expect(result.success).toBe(true);
    });

    it('trims surrounding whitespace from the message', () => {
      const result = chatMessageSchema.parse({
        message: '  hello  ',
        sessionId: VALID_SESSION_ID,
        model: VALID_MODEL,
      });

      expect(result.message).toBe('hello');
    });

    it('rejects a message that is only whitespace', () => {
      const result = chatMessageSchema.safeParse({
        message: '   ',
        sessionId: VALID_SESSION_ID,
        model: VALID_MODEL,
      });

      expect(result.success).toBe(false);
    });

    it('rejects a message longer than the allowed limit', () => {
      const result = chatMessageSchema.safeParse({
        message: 'a'.repeat(4001),
        sessionId: VALID_SESSION_ID,
        model: VALID_MODEL,
      });

      expect(result.success).toBe(false);
    });

    it('accepts a message at the allowed limit', () => {
      const result = chatMessageSchema.safeParse({
        message: 'a'.repeat(4000),
        sessionId: VALID_SESSION_ID,
        model: VALID_MODEL,
      });

      expect(result.success).toBe(true);
    });

    it('rejects a session id that is not a uuid', () => {
      const result = chatMessageSchema.safeParse({
        message: 'hello',
        sessionId: 'not-a-uuid',
        model: VALID_MODEL,
      });

      expect(result.success).toBe(false);
    });

    it('rejects a non string message', () => {
      const result = chatMessageSchema.safeParse({
        message: { injected: true },
        sessionId: VALID_SESSION_ID,
        model: VALID_MODEL,
      });

      expect(result.success).toBe(false);
    });

    it('rejects a missing model', () => {
      const result = chatMessageSchema.safeParse({
        message: 'hello',
        sessionId: VALID_SESSION_ID,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('when a visitor opens a new session', () => {
    it('defaults the title when none is given', () => {
      const result = createSessionSchema.parse({ model: VALID_MODEL });

      expect(result.title).toBe('New Chat');
    });

    it('truncates an overlong title instead of rejecting it', () => {
      const result = createSessionSchema.parse({ model: VALID_MODEL, title: 'a'.repeat(200) });

      expect(result.title).toHaveLength(120);
    });

    it('rejects a session without a model', () => {
      const result = createSessionSchema.safeParse({ title: 'New Chat' });

      expect(result.success).toBe(false);
    });
  });

  describe('when a visitor requests a session by id', () => {
    it('rejects an id that is not a uuid', () => {
      const result = sessionIdSchema.safeParse({ id: '../../etc/passwd' });

      expect(result.success).toBe(false);
    });

    it('accepts a uuid', () => {
      const result = sessionIdSchema.safeParse({ id: VALID_SESSION_ID });

      expect(result.success).toBe(true);
    });
  });
});
