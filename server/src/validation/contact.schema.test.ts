import { describe, it, expect } from 'vitest';
import { contactFormSchema } from './contact.schema';

const VALID_FORM = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to discuss a role.',
};

describe('contact form validation', () => {
  it('accepts a well formed submission', () => {
    const result = contactFormSchema.safeParse(VALID_FORM);

    expect(result.success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = contactFormSchema.safeParse({ ...VALID_FORM, email: 'ada@@example' });

    expect(result.success).toBe(false);
  });

  it('rejects an email carrying a header injection newline', () => {
    const result = contactFormSchema.safeParse({
      ...VALID_FORM,
      email: 'ada@example.com\nBcc: victim@example.com',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = contactFormSchema.safeParse({ ...VALID_FORM, name: '   ' });

    expect(result.success).toBe(false);
  });

  it('rejects a message longer than the allowed limit', () => {
    const result = contactFormSchema.safeParse({ ...VALID_FORM, message: 'a'.repeat(5001) });

    expect(result.success).toBe(false);
  });

  it('accepts a message at the allowed limit', () => {
    const result = contactFormSchema.safeParse({ ...VALID_FORM, message: 'a'.repeat(5000) });

    expect(result.success).toBe(true);
  });
});
