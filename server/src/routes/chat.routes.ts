import { Router } from 'express';
import {
  handleChat,
  createSession,
  getSessions,
  getSessionHistory,
  getModels,
} from '../controllers/chat.controller';
import { validate } from '../middleware/validate';
import { chatLimiter } from '../middleware/rateLimiters';
import { chatMessageSchema, createSessionSchema, sessionIdSchema } from '../validation/chat.schema';

const router = Router();

router.get('/models', getModels);
router.post('/', chatLimiter, validate(chatMessageSchema), handleChat);
router.post('/sessions', chatLimiter, validate(createSessionSchema), createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id/history', validate(sessionIdSchema, 'params'), getSessionHistory);

export default router;
