import { z } from 'zod';

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_CONTACT_MESSAGE_LENGTH = 5000;

export const contactFormSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  email: z.email().max(MAX_EMAIL_LENGTH),
  message: z.string().trim().min(1).max(MAX_CONTACT_MESSAGE_LENGTH),
});

export type ContactFormRequest = z.infer<typeof contactFormSchema>;
