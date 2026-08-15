const CYRILLIC = /[Ѐ-ӿ]/;

const UK =
  'Я асистент портфоліо Артура, тому відповідаю лише на питання про нього. Спитайте про його досвід, проєкти, технічний стек, освіту чи контакти.';

const EN =
  "I'm Artur's portfolio assistant, so I only answer questions about him. Ask about his experience, projects, tech stack, education or contacts.";

export const buildRefusal = (question: string): string => (CYRILLIC.test(question) ? UK : EN);
