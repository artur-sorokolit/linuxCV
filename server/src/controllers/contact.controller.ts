import { Request, Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { emailService } from '../services/email.service';
import type { ContactFormRequest } from '../validation/contact.schema';

export const submitContactForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const form = req.body as ContactFormRequest;

    await contactService.saveMessage(form);

    emailService
      .sendContactNotification(form)
      .catch((err) => console.error('❌ Failed to send contact email notification:', err));

    res.status(201).json({ message: 'Form submitted successfully' });
  } catch (error) {
    next(error);
  }
};
