import { Request, Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { emailService } from '../services/email.service';

export const submitContactForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await contactService.saveMessage({ name, email, message });

    emailService.sendContactNotification({ name, email, message }).catch((err) => {
      console.error('Failed to send contact email notification:', err);
    });

    res.status(201).json({ message: 'Form submitted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contacts = await contactService.getAllMessages();
    res.json(contacts);
  } catch (error) {
    next(error);
  }
};
