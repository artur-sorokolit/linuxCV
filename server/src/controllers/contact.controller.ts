import { Request, Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { emailService } from '../services/email.service';

export const submitContactForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, message } = req.body;

    console.log(`📬 Received new contact form submission from: ${name} (${email})`);

    if (!name || !email || !message) {
      console.warn('⚠️ Validation failed: Name, email, and message are required.');
      return res.status(400).json({ error: 'All fields are required' });
    }

    console.log('💾 Saving message to database...');
    await contactService.saveMessage({ name, email, message });
    console.log('✅ Message successfully saved to database.');

    // Send email notification (non-blocking)
    emailService.sendContactNotification({ name, email, message })
      .then(() => {
        console.log('✨ Email notification process completed.');
      })
      .catch((err) => {
        console.error('❌ Failed to send contact email notification:', err);
      });

    res.status(201).json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.error('❌ Critical error in contact form handler:', error);
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
