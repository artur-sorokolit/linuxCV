import { getDb } from '../db';
import { ContactMessage } from '../types';

export class ContactService {
  async saveMessage(data: ContactMessage) {
    const db = await getDb();
    await db.run('INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)', [
      data.name,
      data.email,
      data.message,
    ]);
  }
}

export const contactService = new ContactService();
