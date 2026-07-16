import { Router } from 'express';
import {
  handleChat,
  createSession,
  getSessions,
  getSessionHistory,
  getModels,
} from '../controllers/chat.controller';

const router = Router();

router.get('/models', getModels);
router.post('/', handleChat);
router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id/history', getSessionHistory);

export default router;
