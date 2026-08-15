import { Router } from 'express';
import { submitContactForm } from '../controllers/contact.controller';
import { validate } from '../middleware/validate';
import { contactLimiter } from '../middleware/rateLimiters';
import { contactFormSchema } from '../validation/contact.schema';

const router = Router();

router.post('/', contactLimiter, validate(contactFormSchema), submitContactForm);

export default router;
